'use strict';

(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                                           callback(currTime + timeToCall);
                                       },
                                       timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

var atg = {
    w: 0,
    h: 0,
    canMove: null,
    ctxMove: null,
    canDrop: null,
    ctxDrop: null,
    touchStart: false,
    logo: null,
    logoW: 0,
    logoH: 0,
    logoOffsetX: 0,
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
    loop: null
};

atg.updateLogo = function () {
    var borderOff = atg.dotBorder / 2,
        canv = document.createElement('canvas');

    canv.width = atg.logoW;
    canv.height = atg.logoH;
    var ctx = canv.getContext('2d');

    atg.logoOffsetY = atg.h - canv.height - 48;

    ctx.lineWidth = atg.dotBorder;

    for (var i = 0; i < atg.scaledLogoDots.length; i++) {
        var point = atg.scaledLogoDots[i];
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
}


atg.startMove = function () {
    atg.touchStart = true;
};

atg.endMove = function () {
    atg.touchStart = false;
};

atg.moveLogo = function (e) {
    e.preventDefault();
    if (atg.touchStart) {
        // todo: clear only last region
        atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
        atg.logoOffsetX = ~~(e.clientX * atg.moveFactor) - atg.logo.width - 48;
        atg.ctxMove.drawImage(atg.logo, atg.logoOffsetX, atg.logoOffsetY);
    }
};

atg.collision = function (p1x, p1y, r1, p2x, p2y, r2) {
    var a, x, y;
    a = r1 + r2;
    x = p1x - p2x;
    y = p1y - p2y;

    if (a * a > (x * x) + (y * y)) {
        return true;
    } else {
        return false;
    }
}

atg.run = function (canvas, ctx) {

    // remove old dots
    var len = atg.runningDrops.length;
    while (len--) {
        var dd = atg.runningDrops[len];
        if (dd.y > atg.h) {
            atg.runningDrops.splice(len, 1)
        }
    }

    // check for collision
    var runningDropIndex = atg.runningDrops.length;
    while (runningDropIndex--) {
        var runningDrop = atg.runningDrops[runningDropIndex];
        for (var scaledDropIndex = 0; scaledDropIndex < atg.scaledLogoDots.length; scaledDropIndex++) {
            var scaledDrop = atg.scaledLogoDots[scaledDropIndex],
                sdx = scaledDrop.x + atg.logoOffsetX + scaledDrop.r,
                sdy = scaledDrop.y + atg.logoOffsetY + scaledDrop.r;
            if (atg.collision(runningDrop.x, runningDrop.y, runningDrop.r, sdx, sdy, scaledDrop.r)) {
                // check if color matches
                if (scaledDrop.c === runningDrop.c) {
                    scaledDrop.h = true;
                    atg.drawUpdateLogo();
                    atg.runningDrops.splice(runningDropIndex, 1);
                } else if (scaledDrop.h) {
                    scaledDrop.h = false;
                    atg.drawUpdateLogo();
                    atg.runningDrops.splice(runningDropIndex, 1);
                }

            }
        }
    }

    // clear previous dots
    ctx.clearRect(0, 0, atg.w, atg.h);
    //for(var cd=0; cd < atg.runningDrops.length; cd++){
    //    //ctx.clearRect(0, 0, atg.w, atg.h);
    //}

    // move dots
    for (var rd = 0; rd < atg.runningDrops.length; rd++) {
        var dot = atg.runningDrops[rd];
        dot.y += 0.8;
        ctx.fillStyle = dot.c;
        ctx.beginPath();
        ctx.arc(dot.x, ~~dot.y, ~~(dot.r * atg.logoScale), 0, 2 * Math.PI, false);
        ctx.fill();
    }

    if (~~(Math.random() * (200 - atg.w * 0.08)) <= 0) {
        var ds = atg.scaledLogoDots[~~(Math.random() * atg.scaledLogoDots.length)],
            x = ds.r + 5 + Math.random() * (atg.w - 10 - ds.r * 2);
        atg.runningDrops.push({x: ~~x, y: -20, r: ds.r, c: ds.c});
    }

    atg.loop = requestAnimationFrame(function () {
        atg.run(canvas, ctx);
    });
}


$(document).ready(function () {
    atg.canMove = $('#move');
    atg.ctxMove = atg.canMove.get(0).getContext('2d');
    atg.canDrop = $('#drop');
    atg.ctxDrop = atg.canDrop.get(0).getContext('2d');

    function initGame() {
        if (atg.loop) {
            window.cancelAnimationFrame(atg.loop);
        }
        atg.w = $(window).width();
        atg.h = $(window).height();
        var dotScale = atg.h * 0.33 / 560;
        atg.scaledLogoDots = [];
        // scale logo dots
        for (var ld = 0; ld < atg.logoDots.length; ld++) {
            var lDot = atg.logoDots[ld];
            atg.scaledLogoDots.push({x: ~~(lDot.x * dotScale), y: ~~(lDot.y * dotScale), r: ~~(lDot.r * dotScale), c: lDot.c, h: false});
        }

        atg.logoW = ~~(520 * dotScale) + atg.dotBorder;
        atg.logoH = ~~(560 * dotScale) + atg.dotBorder;

        atg.updateLogo();
        atg.moveFactor = (atg.w + atg.logo.width + 48) / atg.w;
        atg.canMove.attr('width', atg.w).attr('height', atg.h);
        atg.canDrop.attr('width', atg.w).attr('height', atg.h);
        atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
        atg.logoOffsetX = ~~(atg.w / 2.0) - ~~(atg.logo.width / 2.0);
        atg.drawUpdateLogo();
        atg.runningDrops = [];
        atg.run(atg.canDrop, atg.ctxDrop);
    }

    $(window).resize(initGame);

    initGame();

    var c = $("body").get(0);
    c.addEventListener('PointerDown', atg.startMove, false);
    c.addEventListener('PointerMove', atg.moveLogo, false);
    c.addEventListener('PointerUp', atg.endMove, false);
    c.addEventListener('PointerOut', atg.endMove, false);
});