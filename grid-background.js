(function () {
  "use strict";

  var container = document.getElementById("hero-scene");
  if (!container) return;

  var staticMode = /[?&]static/.test(location.search);

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  container.appendChild(canvas);

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0;
  var height = 0;
  var horizon = 0.38;

  var COLORS = {
    purple: [124, 92, 255],
    pink: [255, 92, 138],
    cyan: [64, 224, 255]
  };

  var mouse = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };

  var particles = [];
  var raf = null;
  var lastTime = 0;

  function rgb(c, alpha) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
  }

  function setSize() {
    width = container.clientWidth;
    height = container.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticles(count) {
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.35 + 0.1),
        phase: Math.random() * Math.PI * 2,
        hue: Math.random()
      });
    }
  }

  function drawHorizon() {
    var hy = height * horizon;
    var cx = width / 2 + mouse.x * 30;

    var glow = ctx.createRadialGradient(cx, hy, 0, cx, hy, width * 0.7);
    glow.addColorStop(0, rgb(COLORS.purple, 0.22));
    glow.addColorStop(0.5, rgb(COLORS.purple, 0.05));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    var sweep = ctx.createLinearGradient(0, hy - 10, 0, hy);
    sweep.addColorStop(0, rgb(COLORS.pink, 0.16));
    sweep.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, width, hy);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawVerticalLines(time) {
    var hy = height * horizon;
    var cx = width / 2 + mouse.x * 30;
    var spacing = width / 22;
    var count = Math.ceil(width / spacing) + 2;

    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i <= count; i++) {
      var bx = cx + (i - count / 2) * spacing;

      var grad = ctx.createLinearGradient(0, hy, 0, height);
      grad.addColorStop(0, rgb(COLORS.purple, 0.02));
      grad.addColorStop(0.35, rgb(COLORS.purple, 0.5));
      grad.addColorStop(1, rgb(COLORS.purple, 0.85));

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, hy);
      ctx.lineTo(bx, height);
      ctx.stroke();

      if (i % 3 === 0) {
        ctx.strokeStyle = rgb(COLORS.pink, 0.22 + Math.sin(time * 0.8 + i) * 0.06);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, hy);
        ctx.lineTo(bx, height * 0.62);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawHorizontalLines(time) {
    var hy = height * horizon;
    var rows = 30;
    var speed = prefersReducedMotion ? 0 : 0.045;

    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i <= rows; i++) {
      var d = (i / rows + time * speed) % 1;
      var y = hy + (height - hy) * Math.pow(d, 2.4);
      var alpha = Math.pow(d, 2.2);

      ctx.strokeStyle = rgb(
        d > 0.85 ? COLORS.pink : COLORS.cyan,
        alpha * 0.75
      );
      ctx.lineWidth = d > 0.85 ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      if (d > 0.55 && i % 4 === 0) {
        ctx.fillStyle = rgb(COLORS.pink, alpha * 0.5);
        ctx.fillRect(0, y - 1, width, 2);
      }
    }

    drawGridNodes(time, hy);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawGridNodes(time, hy) {
    var cx = width / 2 + mouse.x * 30;
    var spacing = width / 22;
    var count = Math.ceil(width / spacing) + 2;
    var rows = 30;

    for (var i = 0; i <= rows; i++) {
      var d = (i / rows + time * 0.045) % 1;
      if (d < 0.72) continue;
      var y = hy + (height - hy) * Math.pow(d, 2.4);
      var alpha = Math.pow(d, 3);

      for (var k = 0; k <= count; k++) {
        var x = cx + (k - count / 2) * spacing * 0.5;
        if (x < -20 || x > width + 20) continue;

        var twinkle = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7 + k * 2.3);
        var r = 1 + twinkle * 1.4;

        ctx.fillStyle = rgb(
          k % 3 === 0 ? COLORS.pink : COLORS.purple,
          alpha * (0.4 + twinkle * 0.5)
        );
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawParticles(time) {
    if (prefersReducedMotion) return;
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      var twinkle = 0.5 + 0.5 * Math.sin(time * 1.6 + p.phase);
      var col = p.hue > 0.5 ? COLORS.pink : COLORS.purple;
      ctx.fillStyle = rgb(col, twinkle * 0.6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    drawHorizon();
    drawVerticalLines(time);
    drawHorizontalLines(time);
    drawParticles(time);
  }

  function render(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var elapsed = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    mouse.x += (target.x - mouse.x) * 0.045;
    mouse.y += (target.y - mouse.y) * 0.045;

    var time = prefersReducedMotion ? 0 : (timestamp / 1000);
    draw(time);
    raf = window.requestAnimationFrame(render);
  }

  function stop() {
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  }

  function start() {
    if (raf) return;
    if (prefersReducedMotion || staticMode) {
      draw(0);
      return;
    }
    raf = window.requestAnimationFrame(render);
  }

  document.addEventListener("mousemove", function (event) {
    target.x = (event.clientX / window.innerWidth) * 2 - 1;
    target.y = -((event.clientY / window.innerHeight) * 2 - 1);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      lastTime = 0;
      start();
    } else {
      stop();
    }
  });

  window.addEventListener("resize", function () {
    setSize();
    spawnParticles(40);
  });

  setSize();
  spawnParticles(40);
  start();
})();
