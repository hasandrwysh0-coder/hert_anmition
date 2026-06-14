 
window.requestAnimationFrame =
window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();
window.isDevice = 
(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent 
    || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
if (loaded) return;
loaded = true;
var mobile = window.isDevice;
// scale canvas for high-DPI (retina) displays to avoid blurriness on mobile
var DPR = window.devicePixelRatio || 1;
var canvas = document.getElementById('heart');
var ctx = canvas.getContext('2d');
var cssWidth = innerWidth;
var cssHeight = innerHeight;
canvas.style.width = cssWidth + 'px';
canvas.style.height = cssHeight + 'px';
canvas.width = Math.floor(cssWidth * DPR);
canvas.height = Math.floor(cssHeight * DPR);
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
var width = cssWidth;
var height = cssHeight;
var rand = Math.random;
ctx.fillStyle = "rgba(0,0,0,1)";
ctx.fillRect(0, 0, width, height);

var heartPosition = function (rad) {
    //return [Math.sin(rad), Math.cos(rad)];
    return [Math.pow(Math.sin(rad), 3), 
        -(15 * Math.cos(rad) - 5 * 
        Math.cos(2 * rad) - 2 * 
        Math.cos(3 * rad) - Math.cos(4 * rad))];
};
var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
};

window.addEventListener('resize', function () {
    cssWidth = innerWidth;
    cssHeight = innerHeight;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = Math.floor(cssWidth * DPR);
    canvas.height = Math.floor(cssHeight * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    width = cssWidth;
    height = cssHeight;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
    buildHeartPoints();
    pulse(1, 1);
});

// heart detail and density
var traceCount = mobile ? 6 : 18;
var pointsOrigin = [];
var i;
var pointStep = mobile ? 0.14 : 0.08;
var heartScale = mobile ? 0.24 : 0.42;
var heartHeightFactor = mobile ? 0.12 : 0.115;

function buildHeartPoints() {
    pointsOrigin = [];
    var heartWidth = Math.min(width, height) * heartScale;
    var heartHeight = heartWidth * heartHeightFactor;
    for (i = 0; i < Math.PI * 2; i += pointStep)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), heartWidth, heartHeight, 0, 0));
    for (i = 0; i < Math.PI * 2; i += pointStep)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), heartWidth * 0.72, heartHeight * 0.72, 0, 0));
    for (i = 0; i < Math.PI * 2; i += pointStep)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), heartWidth * 0.44, heartHeight * 0.44, 0, 0));
}

buildHeartPoints();
var heartPointsCount = pointsOrigin.length;

var targetPoints = [];
var pulse = function (kx, ky) {
    for (i = 0; i < pointsOrigin.length; i++) {
        targetPoints[i] = [];
        targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
        targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
    }
};

var e = [];
for (i = 0; i < heartPointsCount; i++) {
    var x = rand() * width;
    var y = rand() * height;
    var hue = 8 + ~~(rand() * 8); // richer red family
    e[i] = {
        vx: 0,
        vy: 0,
        // particle visual radius (in CSS pixels)
        R: mobile ? (1.2 + Math.min(1, DPR - 1)) : 1.5,
        speed: rand() * 1.2 + 3.8,
        q: ~~(rand() * heartPointsCount),
        D: 2 * (i % 2) - 1,
        force: 0.7 + rand() * 0.12,
        f: "hsla(" + hue + ", 88%, " + (36 + ~~(rand() * 10)) + "%, .32)",
        trace: []
    };
    for (var k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
}

var config = {
    traceK: mobile ? 0.24 : 0.32,
    timeDelta: mobile ? 0.0072 : 0.01
};

var time = 0;
var loop = function () {
    var n = -Math.cos(time);
    pulse((1 + n) * .5, (1 + n) * .5);
    time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .35 : 1) * config.timeDelta;
    ctx.fillStyle = "rgba(0,0,0,.16)";
    ctx.fillRect(0, 0, width, height);
    var glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, height * 0.45);
    glow.addColorStop(0, 'rgba(147, 14, 21, 0)');
    glow.addColorStop(0.55, 'rgba(178, 21, 21, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    for (i = e.length; i--;) {
        var u = e[i];
        var q = targetPoints[u.q];
        var dx = u.trace[0].x - q[0];
        var dy = u.trace[0].y - q[1];
        var length = Math.sqrt(dx * dx + dy * dy);
        if (10 > length) {
            if (0.95 < rand()) {
                u.q = ~~(rand() * heartPointsCount);
            }
            else {
                if (0.99 < rand()) {
                    u.D *= -1;
                }
                u.q += u.D;
                u.q %= heartPointsCount;
                if (0 > u.q) {
                    u.q += heartPointsCount;
                }
            }
        }
        if (length > 0.25) {
            u.vx += -dx / length * u.speed * 0.46;
            u.vy += -dy / length * u.speed * 0.46;
        }
        u.trace[0].x += u.vx;
        u.trace[0].y += u.vy;
        u.vx *= u.force;
        u.vy *= u.force;
        for (k = 0; k < u.trace.length - 1;) {
            var T = u.trace[k];
            var N = u.trace[++k];
            N.x -= config.traceK * (N.x - T.x);
            N.y -= config.traceK * (N.y - T.y);
        }
        ctx.fillStyle = u.f;
        for (k = 0; k < u.trace.length; k++) {
            var px = u.trace[k].x;
            var py = u.trace[k].y;
            var size = Math.max(1.6, Math.round(u.R * (1 + (u.trace.length - k) * 0.05)));
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    //ctx.fillStyle = "rgba(255,255,255,1)";
    //for (i = u.trace.length; i--;) ctx.fillRect(targetPoints[i][0], targetPoints[i][1], 2, 2);

    window.requestAnimationFrame(loop, canvas);
};
loop();
};

// --- interactive text pulse and small particles ---
(function(){
    var loveEl = document.querySelector('.love');
    if(!loveEl) return;
    var popping = false;
    loveEl.style.transition = 'transform .28s ease, filter .28s ease';

    function createFallingHeart(x, y, index) {
        var h = document.createElement('div');
        h.textContent = '❤';
        h.style.position = 'absolute';
        h.style.left = x + 'px';
        h.style.top = y + 'px';
        h.style.pointerEvents = 'none';
        h.style.zIndex = 4;
        h.style.fontSize = (18 + Math.random() * 10) + 'px';
        h.style.lineHeight = '1';
        h.style.opacity = '0.96';
        h.style.color = index % 2 ? '#ff8db7' : '#ffc57a';
        h.style.textShadow = '0 10px 22px rgba(0,0,0,0.22)';
        h.style.transform = 'translate(-50%, -50%) scale(0.95)';
        document.body.appendChild(h);

        var dx = (Math.random() - 0.5) * 40;
        var dy = 120 + Math.random() * 90;
        var rotate = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 18);
        var duration = 900 + Math.random() * 350;

        h.animate([
            { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.7) rotate(' + rotate + 'deg)', opacity: 0 }
        ], { duration: duration, easing: 'cubic-bezier(.22,.78,.38,1)' });

        setTimeout(function(){ h.remove(); }, duration + 80);
    }

    loveEl.addEventListener('click', function(e){
        if(popping) return;
        popping = true;
        loveEl.style.transform = 'translate(-50%, -50%) scale(1.16)';
        loveEl.style.filter = 'brightness(1.17)';
        setTimeout(function(){ loveEl.style.transform = 'translate(-50%, -50%) scale(1)'; loveEl.style.filter = ''; popping = false; }, 280);

        // small colored dots burst
        var burst = 16;
        for(var i=0;i<burst;i++){
            (function(){
                var d = document.createElement('div');
                d.style.position = 'absolute';
                d.style.width = d.style.height = (4 + Math.random()*6) + 'px';
                d.style.borderRadius = '50%';
                var hue = 330 + ~~(Math.random()*60);
                d.style.background = 'hsl(' + hue + ' 88% 64%)';
                d.style.left = (e.clientX - 6) + 'px';
                d.style.top = (e.clientY - 6) + 'px';
                d.style.pointerEvents = 'none';
                d.style.zIndex = 3;
                d.style.opacity = 1;
                document.body.appendChild(d);
                var dx = (Math.random() - 0.5) * 220;
                var dy = (Math.random() - 0.7) * 180 - 20;
                d.animate([
                    { transform: 'translate(0,0) scale(1)', opacity: 1 },
                    { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.6)', opacity: 0 }
                ], { duration: 900 + Math.random()*400, easing: 'cubic-bezier(.2,.8,.2,1)' });
                setTimeout(function(){ d.remove(); }, 1500);
            })();
        }

        // falling hearts effect
        var hearts = 3 + ~~(Math.random() * 2);
        for(var j = 0; j < hearts; j++) {
            createFallingHeart(e.clientX, e.clientY, j);
        }
    });
})();

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

