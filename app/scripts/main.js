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
        {x: 270, y: 0, r: 25},
        {x: 185, y: 30, r: 36},
        {x: 82, y: 93, r: 47},
        {x: 195, y: 121, r: 25},
        {x: 0, y: 182, r: 60},
        {x: 135, y: 192, r: 45},
        {x: 212, y: 276, r: 58},
        {x: 44, y: 304, r: 80},
        {x: 190, y: 415, r: 72},
        {x: 340, y: 300, r: 90}
    ],
    largestDrop: 0,
    scaledLogoDots: [],
    logoScale: 1,
    runningDrops: [],
    levels: [],
    currentLevel: 0
};

atg.redrawLogo = function () {
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

atg.drawLogo = function (x, y) {
    atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
    atg.ctxMove.drawImage(atg.logo, x, y);
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
        atg.logoOffsetX = Math.min(atg.logoW + atg.w,
            Math.max(-atg.logoW, Math.floor(dx * atg.touchSpeed) + atg.logoOffsetX));
        atg.logoOffsetY = Math.min(atg.logoH + atg.h,
            Math.max(-atg.logoH, Math.floor(dy * atg.touchSpeed) + atg.logoOffsetY));
        atg.drawLogo(atg.logoOffsetX, atg.logoOffsetY);
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

atg.win = function () {
    $('section').hide();
    $('.win').show();
    $('button.pause').hide();
    $('nav').show();
    atg.levels[atg.currentLevel].reset();
};

atg.play = function () {
    $('nav').hide();
    $('button.pause').show();
    var level = atg.levels[atg.currentLevel];
    level.init(atg.canDrop, atg.ctxDrop);
    level.play();
};

atg.pause = function () {
    $('section').hide();
    $('.menu').show();
    $('button.pause').hide();
    $('nav').show();
    atg.levels[atg.currentLevel].pause();
};

atg.resume = function () {
    $('nav').hide();
    $('button.pause').show();
    atg.levels[atg.currentLevel].play();
};

// TODO: create base class for all levels
var level1 = {
    runningDrops: [],
    can: null,
    ctx: null,
    loop: null,
    score: 0,
    lastDotCreation: 0,
    even: true
};

level1.init = function (can, ctx) {
    level1.can = can;
    level1.ctx = ctx;
    var logoDotIndex,
        logoDot,
        colors = ['#003366', '#3366FF', '#33CCCC', '#99CC00', '#004300',
            '#008000', '#FFCC00', '#FF9900', '#FF6600', '#993300'];
    // Colorize dots
    for (logoDotIndex = 0; logoDotIndex < atg.scaledLogoDots.length; logoDotIndex++) {
        logoDot = atg.scaledLogoDots[logoDotIndex];
        logoDot.c = colors[logoDotIndex];
        logoDot.h = false;
    }

    // Draw logo at screen center
    atg.redrawLogo();
    atg.logoOffsetX = Math.floor(atg.w / 2.0) - Math.floor(atg.logo.width / 2.0);
    atg.logoOffsetY = Math.floor(atg.h / 2.0) - Math.floor(atg.logo.height / 2.0);
    atg.drawLogo(atg.logoOffsetX, atg.logoOffsetY);

    level1.reset();
};

level1.run = function (canvas, ctx) {
    var runningDropIndex,
        runningDrop,
        scaledDropIndex,
        scaledDrop,
        scaledDropX,
        scaledDropY,
        step,
        steps,
        stepSize,
        xVar,
        currentTime = (new Date()).getTime();

    // Remove old dots
    runningDropIndex = level1.runningDrops.length;
    while (runningDropIndex--) {
        runningDrop = level1.runningDrops[runningDropIndex];
        if (runningDrop.y > atg.h) {
            level1.runningDrops.splice(runningDropIndex, 1);
        }
    }

    // Check for collision
    runningDropIndex = level1.runningDrops.length;
    while (runningDropIndex--) {
        runningDrop = level1.runningDrops[runningDropIndex];
        for (scaledDropIndex = 0; scaledDropIndex < atg.scaledLogoDots.length; scaledDropIndex++) {
            scaledDrop = atg.scaledLogoDots[scaledDropIndex];
            scaledDropX = scaledDrop.x + atg.logoOffsetX + scaledDrop.r;
            scaledDropY = scaledDrop.y + atg.logoOffsetY + scaledDrop.r;
            if (atg.collision(runningDrop.x, runningDrop.y, runningDrop.r, scaledDropX, scaledDropY, scaledDrop.r)) {
                // check if color matches
                if (scaledDrop.c === runningDrop.c) {
                    level1.runningDrops.splice(runningDropIndex, 1);
                    if (!scaledDrop.h) {
                        scaledDrop.h = true;
                        atg.redrawLogo();
                        atg.drawLogo(atg.logoOffsetX, atg.logoOffsetY);
                        level1.score += 1;
                    }
                    if (level1.score === 10) {
                        atg.win();
                        return;
                    }
                } else if (scaledDrop.h) {
                    scaledDrop.h = false;
                    atg.redrawLogo();
                    atg.drawLogo(atg.logoOffsetX, atg.logoOffsetY);
                    level1.runningDrops.splice(runningDropIndex, 1);
                    level1.score -= 1;
                }
            }
        }
    }

    // TODO: only clear dots
    ctx.clearRect(0, 0, atg.w, atg.h);

    // Move dots
    for (runningDropIndex = 0; runningDropIndex < level1.runningDrops.length; runningDropIndex++) {
        runningDrop = level1.runningDrops[runningDropIndex];
        runningDrop.y += runningDrop.s;
        ctx.fillStyle = runningDrop.c;
        ctx.beginPath();
        ctx.arc(runningDrop.x, Math.floor(runningDrop.y), Math.floor(runningDrop.r * atg.logoScale), 0, 2 * Math.PI, false);
        ctx.fill();
    }

    // Create new dots based on time (3-6s) and game width
    if (currentTime - level1.lastDotCreation > 6000) {
        level1.lastDotCreation = currentTime - Math.floor(Math.random() * 3000);
        stepSize = Math.max(48, atg.largestDrop * 2);
        steps = Math.floor((atg.w - atg.largestDrop * 2) / stepSize);
        for (step = 0; step < steps; step++) {
            if (step % 2) {
                if (level1.even) {
                    continue;
                }
            } else {
                if (!level1.even) {
                    continue;
                }
            }
            xVar = 0;
            if (step > 0 && step < steps - 1) {
                xVar = Math.floor(Math.random() * atg.largestDrop * 2) - atg.largestDrop;
            }
            if (Math.random() * 23 < 2) {
                scaledDrop = atg.scaledLogoDots[Math.floor(Math.random() * atg.scaledLogoDots.length)];
                level1.runningDrops.push({
                    x: Math.floor(step * stepSize + atg.largestDrop) + xVar,
                    y: Math.floor(Math.random() * -20) - 20,
                    r: scaledDrop.r,
                    c: scaledDrop.c,
                    s: Math.random() * 0.5 + 0.3
                });
            }
        }
        level1.even = !level1.even;
    }


    if (Math.floor(Math.random() * (220 - atg.w * 0.08)) <= 0) {
        scaledDrop = atg.scaledLogoDots[Math.floor(Math.random() * atg.scaledLogoDots.length)];
        scaledDropX = scaledDrop.r + 5 + Math.random() * (atg.w - 10 - scaledDrop.r * 2);
        level1.runningDrops.push({
            x: Math.floor(scaledDropX),
            y: -20,
            r: scaledDrop.r,
            c: scaledDrop.c,
            s: Math.random() * 0.5 + 0.4
        });
    }
    level1.loop = window.requestAnimationFrame(function () {
        level1.run(canvas, ctx);
    });
};

level1.play = function () {
    if (!level1.loop) {
        level1.run(level1.can, level1.ctx);
    }
};

level1.pause = function () {
    if (level1.loop) {
        window.cancelAnimationFrame(level1.loop);
        level1.loop = null;
    }
};

level1.reset = function () {
    if (level1.loop) {
        window.cancelAnimationFrame(level1.loop);
        level1.loop = null;
    }
    level1.runningDrops = [];
    level1.score = 0;
};

atg.levels.push(level1);

$(document).ready(function () {
    atg.canMove = $('#move');
    atg.ctxMove = atg.canMove.get(0).getContext('2d');
    atg.canDrop = $('#drop');
    atg.ctxDrop = atg.canDrop.get(0).getContext('2d');

    function initGame() {
        var gamestate, dotScale, logoDotIndex, logoDot, dotRadius;

        // TODO: Check and load existing game state
        gamestate = $.fn.cookie('atgst');
        if (gamestate) {
            // Load level
            atg.currentLevel = 0;
        }

        atg.score = 0;
        atg.w = $(window).width();
        atg.h = $(window).height();

        atg.canMove.attr('width', atg.w).attr('height', atg.h);
        atg.canDrop.attr('width', atg.w).attr('height', atg.h);

        // Scale logo dots
        dotScale = atg.h * 0.33 / 560;
        atg.scaledLogoDots = [];
        for (logoDotIndex = 0; logoDotIndex < atg.logoDots.length; logoDotIndex++) {
            logoDot = atg.logoDots[logoDotIndex];
            dotRadius = Math.floor(logoDot.r * dotScale);
            atg.scaledLogoDots.push({
                x: Math.floor(logoDot.x * dotScale),
                y: Math.floor(logoDot.y * dotScale),
                r: dotRadius
            });
            if (atg.largestDrop < dotRadius) {
                atg.largestDrop = dotRadius;
            }
        }

        atg.logoW = Math.floor(520 * dotScale) + atg.dotBorder;
        atg.logoH = Math.floor(560 * dotScale) + atg.dotBorder;
    }

    $(window).resize(initGame);

    initGame();

    // Bind events
    var c = $('body').get(0);
    c.addEventListener('PointerDown', atg.startMove, false);
    c.addEventListener('PointerMove', atg.moveLogo, false);
    c.addEventListener('PointerUp', atg.endMove, false);
    c.addEventListener('PointerOut', atg.endMove, false);

    $('.play').on('click', atg.play);
    $('.pause').on('click', atg.pause);
    $('.resume').on('click', atg.resume);
});