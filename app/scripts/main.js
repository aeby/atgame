'use strict';

window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

/*
var stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);
*/

var atg = {
    w: 0,
    h: 0,
    canMove: null,
    ctxMove: null,
    canDrop: null,
    ctxDrop: null,
    touchStart: false,
    logo: null
};

atg.updateLogo = function () {
    var scale = atg.h * 0.33 / 560,
        borderWidth = 2,
        borderOff = borderWidth / 2,
        canv = document.createElement('canvas'),
        p1 = {x: 270, y: 0, r: 25, c: '#003366', h: false},
        p2 = {x: 185, y: 30, r: 36, c: '#3366FF', h: false},
        p3 = {x: 82, y: 93, r: 47, c: '#33CCCC', h: false},
        p4 = {x: 195, y: 121, r: 25, c: '#004300', h: false},
        p5 = {x: 0, y: 182, r: 60, c: '#99CC00', h: false},
        p6 = {x: 135, y: 192, r: 45, c: '#008000', h: false},
        p7 = {x: 212, y: 276, r: 58, c: '#FFCC00', h: false},
        p8 = {x: 44, y: 304, r: 80, c: '#FF9900', h: false},
        p9 = {x: 190, y: 415, r: 72, c: '#FF6600', h: false},
        p10 = {x: 340, y: 300, r: 90, c: '#993300', h: false};

    canv.width = ~~(520 * scale) + borderWidth;
    canv.height = ~~(560 * scale) + borderWidth;
    var ctx = canv.getContext('2d');

    atg.logoY = atg.h - canv.height - 48;

    var points = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

    ctx.lineWidth = borderWidth;

    for (var i = 0; i < points.length; i++) {
        var point = points[i],
            px = ~~(point.x * scale),
            py = ~~(point.y * scale),
            pr = ~~(point.r * scale);
        if(point.h){
            ctx.fillStyle = point.c;
        }else{
            ctx.strokeStyle = point.c;
        }
        ctx.beginPath();
        ctx.arc(px + pr + borderOff, py + pr + borderOff, pr, 0, 2 * Math.PI, false);
        if(point.h){
            ctx.fill();
        }else{
            ctx.stroke();
        }
    }

    atg.logo = canv;
};


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
        atg.ctxMove.drawImage(atg.logo, ~~(e.clientX * atg.moveFactor) - atg.logo.width - 48, atg.logoY);
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

function animate(canvas, context, startTime) {
    stats.begin();

    context.beginPath();
    context.rect(0, 0, 200, 200);
    context.fillStyle = '#0000FF';
    context.fill();

    stats.end();

    // request new frame
    requestAnimFrame(function () {
        animate(canvas, context, startTime);
    });
}


$(document).ready(function () {
    atg.canMove = $('#move');
    atg.ctxMove = atg.canMove.get(0).getContext('2d');
    atg.canDrop = $('#drop');
    atg.ctxDrop = atg.canDrop.get(0).getContext('2d');

    function respondCanvas() {
        atg.w = $(window).width();
        atg.h = $(window).height();
        atg.updateLogo();
        atg.moveFactor = (atg.w + atg.logo.width + 48) / atg.w;
        atg.canMove.attr('width', atg.w).attr('height', atg.h);
        atg.canDrop.attr('width', atg.w).attr('height', atg.h);
        atg.ctxMove.clearRect(0, 0, atg.w, atg.h);
        atg.ctxMove.drawImage(atg.logo, ~~(atg.w / 2.0) - ~~(atg.logo.width / 2.0), atg.logoY);
    }

    $(window).resize(respondCanvas);

    respondCanvas();

    var c = $("body").get(0);
    c.addEventListener('PointerDown', atg.startMove, false);
    c.addEventListener('PointerMove', atg.moveLogo, false);
    c.addEventListener('PointerUp', atg.endMove, false);
    c.addEventListener('PointerOut', atg.endMove, false);
});