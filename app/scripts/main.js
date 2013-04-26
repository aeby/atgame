'use strict';

(function () {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        x;
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime(),
                timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

var atg = {
    w: 0,
    h: 0,
    canMove: null,
    ctxMove: null,
    canDrop: null,
    ctxDrop: null,
    touchStart: false,
    touchSpeed: 1.2,
    logo: null,
    logoW: 0,
    logoH: 0,
    logoOffsetX: 0,
    logoOffsetY: 0,
    dotBorder: 2,
    logoDots: [
        {x: 270, y: 0, r: 25, c: '#003366'},
        {x: 185, y: 30, r: 36, c: '#3366FF'},
        {x: 82, y: 93, r: 47, c: '#33CCCC'},
        {x: 195, y: 121, r: 25, c: '#99CC00'},
        {x: 0, y: 182, r: 60, c: '#004300'},
        {x: 135, y: 192, r: 45, c: '#008000'},
        {x: 212, y: 276, r: 58, c: '#FFCC00'},
        {x: 44, y: 304, r: 80, c: '#FF9900'},
        {x: 190, y: 415, r: 72, c: '#FF6600'},
        {x: 340, y: 300, r: 90, c: '#993300'}
    ],
    scaledLogoDots: [],
    runningDrops: [],
    logoScale: 1,
    loop: null,
    score: 0
};

atg.updateLogo = function () {
    var borderOff = atg.dotBorder / 2,
        canv = document.createElement('canvas'),
        ctx,
        sdi,
        point;

    canv.width = atg.logoW;
    canv.height = atg.logoH;
    ctx = canv.getContext('2d');

    ctx.lineWidth = atg.dotBorder;

    for (sdi = 0; sdi < atg.scaledLogoDots.length; sdi += 1) {
        point = atg.scaledLogoDots[sdi];
        if (point.h) {
            ctx.fillStyle = point.c;
        } else {
            ctx.strokeStyle = point.c;
        }
        ctx.beginPath();
        ctx.arc(point.x + point.r + borderOff, point.y + point.r + borderOff, point.r, 0, 2 * Math.PI, false);
        if (point.h) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    atg.logo = canv;
};

atg.drawUpdateLogo = function () {
    atg.updateLogo();
    atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
    atg.ctxMove.drawImage(atg.logo, atg.logoOffsetX, atg.logoOffsetY);
};

atg.startMove = function (e) {
    atg.touchStart = true;
    atg.clientX = e.clientX;
    atg.clientY = e.clientY;
};

atg.endMove = function () {
    atg.touchStart = false;
};

atg.moveLogo = function (e) {
    e.preventDefault();
    if (atg.touchStart) {
        var dx = e.clientX - atg.clientX,
            dy = e.clientY - atg.clientY;
        atg.ctxMove.clearRect(atg.logoOffsetX, atg.logoOffsetY, atg.logoW, atg.logoH);
        atg.logoOffsetX = Math.min(atg.logoW + atg.w,
            Math.max(-atg.logoW, Math.floor(dx * atg.touchSpeed) + atg.logoOffsetX));
        atg.logoOffsetY = Math.min(atg.logoH + atg.h,
            Math.max(-atg.logoH, Math.floor(dy * atg.touchSpeed) + atg.logoOffsetY));
        atg.ctxMove.drawImage(atg.logo, atg.logoOffsetX, atg.logoOffsetY);
        atg.clientX = e.clientX;
        atg.clientY = e.clientY;
    }
};

atg.collision = function (p1x, p1y, r1, p2x, p2y, r2) {
    var a, x, y;
    a = r1 + r2;
    x = p1x - p2x;
    y = p1y - p2y;

    if (a * a > (x * x) + (y * y)) {
        return true;
    }
    return false;
};

atg.run = function (canvas, ctx) {
    var runningDropIndex,
        runningDrop,
        scaledDropIndex,
        scaledDrop,
        scaledDropX,
        scaledDropY;

    // remove old dots
    runningDropIndex = atg.runningDrops.length;
    while (runningDropIndex--) {
        runningDrop = atg.runningDrops[runningDropIndex];
        if (runningDrop.y > atg.h) {
            atg.runningDrops.splice(runningDropIndex, 1);
        }
    }

    // check for collision
    runningDropIndex = atg.runningDrops.length;
    while (runningDropIndex--) {
        runningDrop = atg.runningDrops[runningDropIndex];
        for (scaledDropIndex = 0; scaledDropIndex < atg.scaledLogoDots.length; scaledDropIndex++) {
            scaledDrop = atg.scaledLogoDots[scaledDropIndex];
            scaledDropX = scaledDrop.x + atg.logoOffsetX + scaledDrop.r;
            scaledDropY = scaledDrop.y + atg.logoOffsetY + scaledDrop.r;
            if (atg.collision(runningDrop.x, runningDrop.y, runningDrop.r, scaledDropX, scaledDropY, scaledDrop.r)) {
                // check if color matches
                if (scaledDrop.c === runningDrop.c) {
                    atg.runningDrops.splice(runningDropIndex, 1);
                    if (!scaledDrop.h) {
                        scaledDrop.h = true;
                        atg.drawUpdateLogo();
                        atg.score += 1;
                    }
                    if (atg.score === 10) {
                        $('#info').text("Excellent!");
                        $('#info').show();
                    }
                } else if (scaledDrop.h) {
                    scaledDrop.h = false;
                    atg.drawUpdateLogo();
                    atg.runningDrops.splice(runningDropIndex, 1);
                    atg.score -= 1;
                }

            }
        }
    }

    // TODO: only clear dots
    ctx.clearRect(0, 0, atg.w, atg.h);

    // move dots
    for (runningDropIndex = 0; runningDropIndex < atg.runningDrops.length; runningDropIndex++) {
        runningDrop = atg.runningDrops[runningDropIndex];
        runningDrop.y += runningDrop.s;
        ctx.fillStyle = runningDrop.c;
        ctx.beginPath();
        ctx.arc(runningDrop.x, Math.floor(runningDrop.y), Math.floor(runningDrop.r * atg.logoScale), 0, 2 * Math.PI, false);
        ctx.fill();
    }

    if (Math.floor(Math.random() * (220 - atg.w * 0.08)) <= 0) {
        scaledDrop = atg.scaledLogoDots[Math.floor(Math.random() * atg.scaledLogoDots.length)];
        scaledDropX = scaledDrop.r + 5 + Math.random() * (atg.w - 10 - scaledDrop.r * 2);
        atg.runningDrops.push({
            x: Math.floor(scaledDropX),
            y: -20,
            r: scaledDrop.r,
            c: scaledDrop.c,
            s: Math.random() * 0.5 + 0.4
        });
    }

    atg.loop = window.requestAnimationFrame(function () {
        atg.run(canvas, ctx);
    });
};

$(document).ready(function () {
    atg.canMove = $('#move');
    atg.ctxMove = atg.canMove.get(0).getContext('2d');
    atg.canDrop = $('#drop');
    atg.ctxDrop = atg.canDrop.get(0).getContext('2d');

    function initGame() {
        if (atg.loop) {
            window.cancelAnimationFrame(atg.loop);
        }
        atg.score = 0;
        atg.w = $(window).width();
        atg.h = $(window).height();
        var dotScale = atg.h * 0.33 / 560,
            logoDotIndex,
            logoDot;
        atg.scaledLogoDots = [];
        // scale logo dots
        for (logoDotIndex = 0; logoDotIndex < atg.logoDots.length; logoDotIndex++) {
            logoDot = atg.logoDots[logoDotIndex];
            atg.scaledLogoDots.push({
                x: Math.floor(logoDot.x * dotScale),
                y: Math.floor(logoDot.y * dotScale),
                r: Math.floor(logoDot.r * dotScale),
                c: logoDot.c,
                h: false
            });
        }

        atg.logoW = Math.floor(520 * dotScale) + atg.dotBorder;
        atg.logoH = Math.floor(560 * dotScale) + atg.dotBorder;

        atg.updateLogo();
        atg.canMove.attr('width', atg.w).attr('height', atg.h);
        atg.canDrop.attr('width', atg.w).attr('height', atg.h);
        atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
        atg.logoOffsetX = Math.floor(atg.w / 2.0) - Math.floor(atg.logo.width / 2.0);
        atg.logoOffsetY = Math.floor(atg.h / 2.0) - Math.floor(atg.logo.height / 2.0);
        atg.drawUpdateLogo();
        atg.runningDrops = [];
        atg.run(atg.canDrop, atg.ctxDrop);
    }

    $(window).resize(initGame);

    initGame();

    var c = $('body').get(0);
    c.addEventListener('PointerDown', atg.startMove, false);
    c.addEventListener('PointerMove', atg.moveLogo, false);
    c.addEventListener('PointerUp', atg.endMove, false);
    c.addEventListener('PointerOut', atg.endMove, false);
});