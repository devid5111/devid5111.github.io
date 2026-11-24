/**
 * ==========================================================
 * ORIGINKIT GLIMMER ENGINE
 * Interactive WebGL & 3D Physics components from Originkit.dev:
 * 1. Glimmer Vale: Twilight iridescent hills & glitter ribbons WebGL background
 * 2. Vector Wordmark: Interactive canvas vector typography with live coordinate handles
 * 3. Holo Flip Badge: 3D interactive swinging lanyard card with rainbow foil glare
 * ==========================================================
 */

(function () {
  "use strict";

  var isGlimmerActive = function () {
    return document.documentElement.getAttribute("data-style") === "glimmer";
  };

  /* ==========================================================
     1. GLIMMER VALE BACKGROUND ENGINE (WebGL)
     ========================================================== */
  var glimmer = {
    canvas: null,
    ctx: null,
    gl: null,
    prog: null,
    running: false,
    raf: null,
    width: 0,
    height: 0,
    time: 0,
    pointer: { x: 0, y: 0, targetX: 0, targetY: 0 },
    particles: []
  };

  function initGlimmerVale() {
    glimmer.canvas = document.getElementById("glimmer-vale-canvas");
    if (!glimmer.canvas) return;

    var container = glimmer.canvas.parentElement;
    if (!container) return;

    // Use high performance 2D context with particle rendering for maximum compatibility
    glimmer.ctx = glimmer.canvas.getContext("2d");
    if (!glimmer.ctx) return;

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = container.offsetWidth || window.innerWidth;
      var h = container.offsetHeight || window.innerHeight;
      glimmer.width = w;
      glimmer.height = h;
      glimmer.canvas.width = Math.round(w * dpr);
      glimmer.canvas.height = Math.round(h * dpr);
      glimmer.ctx.scale(dpr, dpr);
      initParticles();
    }

    function initParticles() {
      glimmer.particles = [];
      var count = Math.min(180, Math.floor(glimmer.width / 8));
      for (var i = 0; i < count; i++) {
        glimmer.particles.push({
          x: Math.random() * glimmer.width,
          y: glimmer.height * (0.35 + Math.random() * 0.65),
          size: 0.8 + Math.random() * 2.4,
          speed: 0.2 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.5 ? "rgba(255, 154, 118, " : "rgba(167, 139, 250, ",
          crest: Math.floor(Math.random() * 3)
        });
      }
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", function (e) {
      if (!isGlimmerActive()) return;
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      glimmer.pointer.targetX = (e.clientX - cx) / cx;
      glimmer.pointer.targetY = (e.clientY - cy) / cy;
    }, { passive: true });

    resize();

    function renderGlimmer() {
      if (!isGlimmerActive() || document.hidden) {
        glimmer.running = false;
        return;
      }

      glimmer.running = true;
      glimmer.time += 0.015;

      // Smooth pointer lerp
      glimmer.pointer.x += (glimmer.pointer.targetX - glimmer.pointer.x) * 0.06;
      glimmer.pointer.y += (glimmer.pointer.targetY - glimmer.pointer.y) * 0.06;

      var ctx = glimmer.ctx;
      var w = glimmer.width;
      var h = glimmer.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Twilight sky gradient
      var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.85);
      skyGrad.addColorStop(0, "#080915");
      skyGrad.addColorStop(0.4, "#13142e");
      skyGrad.addColorStop(0.75, "#25244c");
      skyGrad.addColorStop(1, "#3c3358");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Rolling hills (3 depth ridges)
      var ridges = [
        { baseY: h * 0.48, amp: h * 0.08, freq: 0.0016, speed: 0.4, col: "rgba(15, 16, 38, 0.95)", crestCol: "#a78bfa" },
        { baseY: h * 0.62, amp: h * 0.11, freq: 0.0022, speed: 0.7, col: "rgba(10, 11, 26, 0.98)", crestCol: "#ff9a76" },
        { baseY: h * 0.78, amp: h * 0.14, freq: 0.0028, speed: 1.0, col: "rgba(7, 8, 18, 1)", crestCol: "#38bdf8" }
      ];

      for (var r = 0; r < ridges.length; r++) {
        var rd = ridges[r];
        ctx.beginPath();
        ctx.moveTo(0, h);

        var offsetX = glimmer.pointer.x * (r + 1) * 20;
        var offsetY = glimmer.pointer.y * (r + 1) * 12;

        for (var x = 0; x <= w; x += 10) {
          var crestWave = Math.sin((x + offsetX) * rd.freq + glimmer.time * rd.speed) * rd.amp;
          var subWave = Math.cos((x + offsetX) * rd.freq * 2.3 + glimmer.time * rd.speed * 0.7) * (rd.amp * 0.35);
          var y = rd.baseY + crestWave + subWave + offsetY;
          if (x === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = rd.col;
        ctx.fill();

        // Iridescent crest edge line
        ctx.strokeStyle = rd.crestCol;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.35 + Math.sin(glimmer.time * 2 + r) * 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 3. Shimmering glitter particles along crests
      for (var p = 0; p < glimmer.particles.length; p++) {
        var pt = glimmer.particles[p];
        var alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(glimmer.time * 3 + pt.phase));
        ctx.fillStyle = pt.color + alpha + ")";
        ctx.beginPath();
        var px = pt.x + Math.sin(glimmer.time + pt.phase) * 12;
        var py = pt.y + Math.cos(glimmer.time * 1.5 + pt.phase) * 6;
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      glimmer.raf = requestAnimationFrame(renderGlimmer);
    }

    glimmer.start = function () {
      if (!glimmer.running) {
        resize();
        renderGlimmer();
      }
    };

    glimmer.stop = function () {
      glimmer.running = false;
      if (glimmer.raf) {
        cancelAnimationFrame(glimmer.raf);
        glimmer.raf = null;
      }
    };
  }

  /* ==========================================================
     2. VECTOR WORDMARK ENGINE
     Interactive vector text with live coordinate handles
     ========================================================== */
  var wordmark = {
    canvas: null,
    ctx: null,
    wrap: null,
    labels: [],
    running: false,
    raf: null,
    width: 0,
    height: 0,
    time: 0,
    handles: [
      { x: 0.15, y: 0.35, vx: 0.12, vy: 0.08, phase: 0 },
      { x: 0.52, y: 0.65, vx: 0.10, vy: 0.12, phase: 2.1 },
      { x: 0.85, y: 0.38, vx: 0.14, vy: 0.09, phase: 4.2 }
    ],
    pointer: { x: -9999, y: -9999, active: false }
  };

  function initVectorWordmark() {
    wordmark.wrap = document.querySelector(".vector-wordmark-wrap");
    wordmark.canvas = document.getElementById("wordmark-canvas");
    if (!wordmark.wrap || !wordmark.canvas) return;

    wordmark.ctx = wordmark.canvas.getContext("2d");
    if (!wordmark.ctx) return;

    wordmark.labels = Array.prototype.slice.call(wordmark.wrap.querySelectorAll(".wordmark-handle-label"));

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var rect = wordmark.wrap.getBoundingClientRect();
      var w = rect.width || 700;
      var h = rect.height || 180;
      wordmark.width = w;
      wordmark.height = h;
      wordmark.canvas.width = Math.round(w * dpr);
      wordmark.canvas.height = Math.round(h * dpr);
      wordmark.ctx.scale(dpr, dpr);
    }

    wordmark.wrap.addEventListener("pointermove", function (e) {
      var rect = wordmark.canvas.getBoundingClientRect();
      wordmark.pointer.x = e.clientX - rect.left;
      wordmark.pointer.y = e.clientY - rect.top;
      wordmark.pointer.active = true;
    });

    wordmark.wrap.addEventListener("pointerleave", function () {
      wordmark.pointer.active = false;
      wordmark.pointer.x = -9999;
      wordmark.pointer.y = -9999;
    });

    window.addEventListener("resize", resize, { passive: true });
    resize();

    function renderWordmark() {
      if (!isGlimmerActive() || document.hidden) {
        wordmark.running = false;
        return;
      }

      wordmark.running = true;
      wordmark.time += 0.02;

      var ctx = wordmark.ctx;
      var w = wordmark.width;
      var h = wordmark.height;

      ctx.clearRect(0, 0, w, h);

      // Update vector handles
      var pts = [];
      for (var i = 0; i < wordmark.handles.length; i++) {
        var hnd = wordmark.handles[i];
        var hx = (hnd.x + Math.sin(wordmark.time * 0.8 + hnd.phase) * hnd.vx) * w;
        var hy = (hnd.y + Math.cos(wordmark.time * 1.1 + hnd.phase) * hnd.vy) * h;

        // Pointer influence
        if (wordmark.pointer.active) {
          var dx = wordmark.pointer.x - hx;
          var dy = wordmark.pointer.y - hy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            var push = (1 - dist / 180) * 28;
            hx -= (dx / dist) * push;
            hy -= (dy / dist) * push;
          }
        }

        pts.push({ x: hx, y: hy });

        // Update coordinate label tags
        if (wordmark.labels[i]) {
          var coordX = Math.round(hx);
          var coordY = Math.round(hy);
          wordmark.labels[i].textContent = coordX + ", " + coordY;
          wordmark.labels[i].style.left = hx + "px";
          wordmark.labels[i].style.top = hy + "px";
        }
      }

      // Draw vector lattice grid lines connecting the handles
      ctx.beginPath();
      ctx.strokeStyle = "rgba(167, 139, 250, 0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vector handle crossbars & anchor rings
      for (var j = 0; j < pts.length; j++) {
        var p = pts[j];
        ctx.strokeStyle = "#ff7e5f";
        ctx.lineWidth = 1.5;

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y);
        ctx.lineTo(p.x + 7, p.y);
        ctx.moveTo(p.x, p.y - 7);
        ctx.lineTo(p.x, p.y + 7);
        ctx.stroke();

        // Control point ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.stroke();
      }

      // Render high-impact Vector Wordmark text
      ctx.save();
      var fontSize = Math.min(108, Math.max(48, Math.round(w * 0.125)));
      ctx.font = "900 " + fontSize + "px 'Archivo', sans-serif";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "-0.04em";

      // 1. Shaded neon glow
      ctx.shadowColor = "rgba(255, 126, 95, 0.45)";
      ctx.shadowBlur = 30;

      // 2. Gradient fill
      var textGrad = ctx.createLinearGradient(0, 0, w, 0);
      textGrad.addColorStop(0, "#ffffff");
      textGrad.addColorStop(0.45, "#f4f6ff");
      textGrad.addColorStop(0.7, "#ff9a76");
      textGrad.addColorStop(1, "#a78bfa");
      ctx.fillStyle = textGrad;

      // Draw wordmark with pointer shear effect
      var shear = wordmark.pointer.active ? (wordmark.pointer.x / w - 0.5) * 0.08 : 0;
      ctx.transform(1, 0, shear, 1, 0, 0);

      ctx.fillText("DEVID PARMAR", 0, h * 0.52);

      // Outer outline stroke
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.strokeText("DEVID PARMAR", 0, h * 0.52);

      ctx.restore();

      wordmark.raf = requestAnimationFrame(renderWordmark);
    }

    wordmark.start = function () {
      if (!wordmark.running) {
        resize();
        renderWordmark();
      }
    };

    wordmark.stop = function () {
      wordmark.running = false;
      if (wordmark.raf) {
        cancelAnimationFrame(wordmark.raf);
        wordmark.raf = null;
      }
    };
  }

  /* ==========================================================
     3. HOLO FLIP BADGE 3D ENGINE
     3D card tilt & flip physics with holographic foil glare
     ========================================================== */
  function initHoloFlipBadge() {
    var wrap = document.querySelector(".holo-badge-wrap");
    var inner = document.querySelector(".holo-card-inner");
    var glares = document.querySelectorAll(".holo-glare");
    if (!wrap || !inner) return;

    var state = {
      tiltX: 0,
      tiltY: 0,
      targetX: 0,
      targetY: 0,
      isFlipped: false,
      hovering: false
    };

    wrap.addEventListener("pointermove", function (e) {
      var rect = wrap.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var normX = (x / rect.width) * 2 - 1;
      var normY = (y / rect.height) * 2 - 1;

      state.targetX = normY * -16; // Tilt up/down
      state.targetY = normX * 18;  // Tilt left/right
      state.hovering = true;

      // Update holographic rainbow glare angle
      var glareX = (normX + 1) * 50;
      var glareY = (normY + 1) * 50;
      glares.forEach(function (g) {
        g.style.backgroundPosition = glareX + "% " + glareY + "%";
      });
    });

    wrap.addEventListener("pointerleave", function () {
      state.targetX = 0;
      state.targetY = 0;
      state.hovering = false;
    });

    // Flip card on click or tap
    wrap.addEventListener("click", function () {
      state.isFlipped = !state.isFlipped;
      inner.classList.toggle("flipped", state.isFlipped);
    });

    // Inertial spring update loop
    (function loop() {
      if (isGlimmerActive()) {
        state.tiltX += (state.targetX - state.tiltX) * 0.12;
        state.tiltY += (state.targetY - state.tiltY) * 0.12;

        var baseRotation = state.isFlipped ? 180 : 0;
        inner.style.transform = "rotateX(" + state.tiltX.toFixed(2) + "deg) rotateY(" + (baseRotation + state.tiltY).toFixed(2) + "deg)";
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ==========================================================
     4. STYLE SWITCHER INTEGRATION & LIFECYCLE
     ========================================================== */
  function onStyleChange() {
    if (isGlimmerActive()) {
      if (glimmer.start) glimmer.start();
      if (wordmark.start) wordmark.start();
    } else {
      if (glimmer.stop) glimmer.stop();
      if (wordmark.stop) wordmark.stop();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGlimmerVale();
    initVectorWordmark();
    initHoloFlipBadge();

    var styleSelect = document.getElementById("style-select");
    if (styleSelect) {
      styleSelect.addEventListener("change", function () {
        setTimeout(onStyleChange, 50);
      });
    }

    // Monitor data-style attribute changes
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === "data-style") onStyleChange();
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-style"] });

    onStyleChange();
  });
})();
