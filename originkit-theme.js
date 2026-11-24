/**
 * ============================================================================
 * ORIGINKIT COMPONENT ENGINE (Vanillajs Port of Official Originkit Components)
 * Components included:
 * 1. Vector Wordmark: WebGL text atlas + multi-channel blur + lattice handle rig
 * 2. Glimmer Vale: WebGL2 Catmull-Rom terrain heightfield + iridescent glitter + bloom
 * 3. Holo Flip Badge: 3D interactive swinging lanyard card with rainbow foil glare
 * ============================================================================
 */

(function () {
  "use strict";

  var isGlimmerActive = function () {
    return document.documentElement.getAttribute("data-style") === "glimmer";
  };

  /* ==========================================================================
     1. ORIGINKIT VECTOR WORDMARK (Exact WebGL Implementation)
     Source: components/originkit/vector-wordmark.tsx
     ========================================================================== */
  var WordmarkEngine = (function () {
    var MAX_DPR = 2;
    var REF_WIDTH = 1200;
    var MAX_TEX = 4096;
    var HANDLES = 3;
    var CELL_ASPECT = 0.6;
    var DRIFT_X = 0.08;
    var DRIFT_Y = 0.04;
    var DRIFT_RATE = 1.3;
    var DRIFT_RATE_Y = 1.3 * 1.3;
    var SWEEP_RATE = 0.5;
    var SWEEP_BAND = 0.28;
    var RESNAP = 0.2;
    var DAMP_REF = 20;
    var SPEED_REF = 50;
    var LABEL_MAX = 0.75;
    var DOT_DIAMETER = 4 / 440;
    var DOT_PITCH = 12 / 440;

    var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
    var fract = function (x) { return x - Math.floor(x); };

    var VERT = [
      "attribute vec2 aPos;",
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = aPos * 0.5 + 0.5;",
      "  gl_Position = vec4(aPos, 0.0, 1.0);",
      "}"
    ].join("\n");

    var FRAG = [
      "precision highp float;",
      "uniform sampler2D uMap;",
      "uniform vec2 uRes;",
      "uniform vec2 uAtlas;",
      "uniform vec2 uPtr;",
      "uniform float uReach;",
      "uniform vec3 uText;",
      "uniform vec3 uShade;",
      "uniform vec4 uAccent;",
      "uniform vec2 uV0;",
      "uniform vec2 uV1;",
      "uniform vec2 uV2;",
      "uniform float uHalf;",
      "varying vec2 vUv;",
      "",
      "float hash(vec2 p) {",
      "  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);",
      "}",
      "",
      "vec2 blurRG(vec2 uv, float e) {",
      "  vec4 sum = vec4(0.0);",
      "  for (int i = 0; i < 6; i++) {",
      "    float fi = float(i);",
      "    float th = radians(fi / 6.0 * 360.0);",
      "    vec2 dir = vec2(cos(th), sin(th));",
      "    vec2 off = dir * (hash(vec2(fi, uv.x + uv.y)) + e);",
      "    sum += texture2D(uMap, uv + off * e);",
      "  }",
      "  return (sum / 6.0).rg;",
      "}",
      "",
      "vec2 segment(vec2 p, vec2 a, vec2 b) {",
      "  vec2 ab = b - a;",
      "  vec2 ap = p - a;",
      "  float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);",
      "  return vec2(length(ap - ab * t), t);",
      "}",
      "",
      "float stroke(float d, float lw, float px) {",
      "  return 1.0 - smoothstep(lw, lw + px, d);",
      "}",
      "",
      "float dashedLine(vec2 p, vec2 a, vec2 b, float lw, float px) {",
      "  vec2 s = segment(p, a, b);",
      "  float dash = step(0.5, fract(s.y * length(b - a) * 100.0));",
      "  return stroke(s.x, lw, px) * dash;",
      "}",
      "",
      "float boxEdge(vec2 p, vec2 c, float h, float lw, float px) {",
      "  vec2 q = abs(p - c) - vec2(h);",
      "  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);",
      "  return stroke(abs(d), lw, px);",
      "}",
      "",
      "void main() {",
      "  float aspect = uRes.x / uRes.y;",
      "  vec2 E = (vUv * uRes - (uRes - uAtlas) * 0.5) / uAtlas;",
      "  float inside = step(0.0, E.x) * step(E.x, 1.0) * step(0.0, E.y) * step(E.y, 1.0);",
      "  vec2 safeUv = clamp(E, 0.0, 1.0);",
      "  float b = clamp(1.0 - E.y * 3.5, 0.0, 1.0) * 0.008;",
      "  vec2 soft = blurRG(safeUv, b);",
      "  vec2 sharp = blurRG(safeUv, b * 0.1);",
      "  float d = length((vUv - uPtr) / vec2(1.0, aspect));",
      "  float k = 1.0 - pow(smoothstep(0.0, max(uReach, 1e-4), d), 3.0);",
      "  float mask = mix(soft.r, sharp.g, k) * inside;",
      "  vec3 fill = mix(uShade, uText, smoothstep(0.0, 1.0, E.y));",
      "  vec2 P = vec2(vUv.x * aspect, vUv.y);",
      "  float px = 1.0 / uRes.y;",
      "  float lw = px * 0.25;",
      "  float lines = max(max(dashedLine(P, uV0, uV1, lw, px), dashedLine(P, uV1, uV2, lw, px)), dashedLine(P, uV2, uV0, lw, px));",
      "  float boxes = max(max(boxEdge(P, uV0, uHalf, lw, px), boxEdge(P, uV1, uHalf, lw, px)), boxEdge(P, uV2, uHalf, lw, px));",
      "  float A = max(lines, boxes) * uAccent.a * (1.0 - vUv.y);",
      "  vec4 card = vec4(fill * mask, mask);",
      "  vec4 comp = vec4(uAccent.rgb * A, A) + card * (1.0 - A);",
      "  gl_FragColor = comp * pow(clamp(E.y, 0.0, 1.0), 0.7);",
      "}"
    ].join("\n");

    function compile(gl, vs, fs) {
      function make(type, src) {
        var sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.error("VectorWordmark shader error:", gl.getShaderInfoLog(sh));
        }
        return sh;
      }
      var p = gl.createProgram();
      gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "aPos");
      gl.linkProgram(p);
      return p;
    }

    function buildAtlas(text, fpx) {
      var probe = document.createElement("canvas").getContext("2d");
      if (!probe) return null;
      var fontStr = "800 " + fpx + "px 'Archivo', 'Inter', system-ui, sans-serif";
      probe.font = fontStr;
      var m = probe.measureText(text);
      var asc = m.actualBoundingBoxAscent || fpx * 0.8;
      var desc = m.actualBoundingBoxDescent || fpx * 0.22;
      var pad = fpx * 0.12;

      var w = Math.max(1, Math.ceil(m.width + pad * 2));
      var h = Math.max(1, Math.ceil(asc + desc + pad * 2));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontStr;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.globalCompositeOperation = "lighter";

      // R channel = solid text fill
      ctx.fillStyle = "#ff0000";
      ctx.fillText(text, pad, pad + asc);

      // G channel = vector dotted path outline
      var block = asc + desc;
      ctx.strokeStyle = "#00ff00";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1.2, block * DOT_DIAMETER);
      ctx.setLineDash([0, Math.max(2.5, block * DOT_PITCH)]);
      ctx.strokeText(text, pad, pad + asc);

      return { canvas: canvas, cssW: w, cssH: h };
    }

    function init() {
      var wrap = document.querySelector(".vector-wordmark-wrap");
      var canvas = document.getElementById("wordmark-canvas");
      if (!wrap || !canvas) return;

      var labels = Array.prototype.slice.call(wrap.querySelectorAll(".wordmark-handle-label"));

      var attrs = {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance"
      };

      var gl = canvas.getContext("webgl2", attrs) || canvas.getContext("webgl", attrs);
      if (!gl) return;
      var isGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

      var prog = compile(gl, VERT, FRAG);
      var U = {
        map: gl.getUniformLocation(prog, "uMap"),
        res: gl.getUniformLocation(prog, "uRes"),
        atlas: gl.getUniformLocation(prog, "uAtlas"),
        ptr: gl.getUniformLocation(prog, "uPtr"),
        reach: gl.getUniformLocation(prog, "uReach"),
        text: gl.getUniformLocation(prog, "uText"),
        shade: gl.getUniformLocation(prog, "uShade"),
        accent: gl.getUniformLocation(prog, "uAccent"),
        v0: gl.getUniformLocation(prog, "uV0"),
        v1: gl.getUniformLocation(prog, "uV1"),
        v2: gl.getUniformLocation(prog, "uV2"),
        half: gl.getUniformLocation(prog, "uHalf")
      };

      var quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);

      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var boxW = 1, boxH = 1, bufW = 0, bufH = 0, dpr = 1;
      var atlasRatioW = 1, atlasRatioH = 1, atlasKey = "";
      var textContent = "DEVID PARMAR";

      var target = { x: -0.5, y: 0.5 };
      var eased = { x: -0.5, y: 0.5 };
      var cells = [];
      var verts = [];
      for (var i = 0; i < HANDLES; i++) {
        cells.push({ x: -0.5, y: 0.5 });
        verts.push({ x: -0.5, y: 0.5 });
      }
      var hasPointer = false;
      var sweepClock = 0;
      var driftT = 0;

      function snap(x, y, cw, ch) {
        var cx = Math.floor(x / cw);
        var cy = Math.floor(y / ch);
        var found = [];
        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var px = (cx + i + 0.5) * cw;
            var py = (cy + j + 0.5) * ch;
            found.push({ x: px, y: py, d: Math.hypot(px - x, py - y) });
          }
        }
        found.sort(function (a, b) { return a.d - b.d; });
        for (var k = 0; k < HANDLES; k++) {
          cells[k].x = found[k + 1].x;
          cells[k].y = found[k + 1].y;
        }
      }

      function resize() {
        boxW = Math.max(1, wrap.offsetWidth);
        boxH = Math.max(1, wrap.offsetHeight);
        dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
        var w = Math.max(1, Math.round(boxW * dpr));
        var h = Math.max(1, Math.round(boxH * dpr));
        if (w === bufW && h === bufH) return;
        bufW = w;
        bufH = h;
        canvas.width = w;
        canvas.height = h;
      }

      function rebuildAtlas() {
        var fpx = Math.max(32, Math.round(180 * (boxW / REF_WIDTH) * dpr));
        var atlas = buildAtlas(textContent, fpx);
        if (!atlas) return;
        atlasRatioW = atlas.cssW / fpx;
        atlasRatioH = atlas.cssH / fpx;

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        var cw = atlas.canvas.width;
        var ch = atlas.canvas.height;
        var pot = (cw & (cw - 1)) === 0 && (ch & (ch - 1)) === 0;
        if (isGL2 || pot) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
      }

      wrap.addEventListener("pointermove", function (e) {
        hasPointer = true;
        var r = wrap.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        target.x = (e.clientX - r.left) / r.width;
        target.y = 1 - (e.clientY - r.top) / r.height;
      });

      wrap.addEventListener("pointerleave", function () {
        hasPointer = false;
      });

      var raf = 0, last = 0;

      function step(dt) {
        var rate = 1.0;
        var cw = 0.27;
        var ch = cw * CELL_ASPECT;
        var aspect = boxW / boxH;

        if (!hasPointer) {
          var band = (atlasRatioH * Math.max(16, 180 * (boxW / REF_WIDTH))) / boxH;
          target.x += dt * SWEEP_RATE * rate;
          target.y = (1 - band) / 2 + SWEEP_BAND * band;
          if (target.x > 1.5) {
            target.x = -0.5;
            eased.x = -0.5;
          }
          sweepClock += dt;
          if (sweepClock >= RESNAP) {
            sweepClock = 0;
            snap(target.x * aspect, target.y, cw, ch);
          }
        } else {
          snap(target.x * aspect, target.y, cw, ch);
        }

        var damp = clamp(0.6 * DAMP_REF * dt, 0, 1);
        eased.x += (target.x - eased.x) * damp;
        eased.y += (target.y - eased.y) * damp;

        driftT += dt * rate;
        for (var i = 0; i < HANDLES; i++) {
          var c = cells[i];
          var sx = Math.round(c.x / cw - 0.5);
          var sy = Math.round(c.y / ch - 0.5);
          var h1 = fract(Math.sin(sx * 127.1 + sy * 311.7) * 43758.5453);
          var h2 = fract(Math.sin(sx * 269.5 + sy * 183.3) * 43758.5453);
          verts[i].x = c.x + DRIFT_X * cw * Math.sin(driftT * DRIFT_RATE + h1 * Math.PI * 2);
          verts[i].y = c.y + DRIFT_Y * ch * Math.sin(driftT * DRIFT_RATE_Y + h2 * Math.PI * 2);
        }
      }

      function writeLabels() {
        var aspect = boxW / boxH;
        var half = 54;
        for (var i = 0; i < HANDLES; i++) {
          var el = labels[i];
          if (!el) continue;
          var bx = verts[i].x / aspect;
          var by = verts[i].y;
          var gx = Math.round(clamp(bx * 100, 0, 100));
          var gy = Math.round(clamp(by * 100, 0, 100));
          el.style.transform = "translate(" + (bx * boxW - half) + "px, " + ((1 - by) * boxH - half) + "px)";
          el.style.opacity = String(LABEL_MAX);
          el.textContent = "[" + gx + ", " + gy + "]";
        }
      }

      function draw() {
        gl.viewport(0, 0, bufW, bufH);
        gl.useProgram(prog);
        gl.uniform1i(U.map, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform2f(U.res, boxW, boxH);
        var fpx = Math.max(16, 180 * (boxW / REF_WIDTH));
        gl.uniform2f(U.atlas, atlasRatioW * fpx, atlasRatioH * fpx);
        gl.uniform2f(U.ptr, eased.x, eased.y);
        gl.uniform1f(U.reach, 290 / boxW);
        gl.uniform3f(U.text, 0.96, 0.97, 1.0);
        gl.uniform3f(U.shade, 0.65, 0.55, 0.98);
        gl.uniform4f(U.accent, 1.0, 0.49, 0.37, 0.7);
        gl.uniform2f(U.v0, verts[0].x, verts[0].y);
        gl.uniform2f(U.v1, verts[1].x, verts[1].y);
        gl.uniform2f(U.v2, verts[2].x, verts[2].y);
        gl.uniform1f(U.half, 54 / boxH);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      function frame(now) {
        if (!isGlimmerActive() || document.hidden) {
          raf = 0;
          return;
        }
        var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
        last = now;
        resize();
        var key = textContent + "|" + dpr + "|" + Math.ceil(boxW / 100);
        if (key !== atlasKey) {
          atlasKey = key;
          rebuildAtlas();
        }
        step(dt);
        writeLabels();
        draw();
        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (!raf) {
          last = 0;
          resize();
          rebuildAtlas();
          raf = requestAnimationFrame(frame);
        }
      }

      function stop() {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }

      window.addEventListener("resize", resize, { passive: true });
      return { start: start, stop: stop };
    }

    return { init: init };
  })();

  /* ==========================================================================
     2. ORIGINKIT GLIMMER VALE (Exact WebGL2 Terrain Heightfield & Glitter)
     Source: components/originkit/glimmer-vale.tsx
     ========================================================================== */
  var GlimmerValeEngine = (function () {
    var CAM_H = 2.2;
    var PITCH = 0.25;
    var TAN_V = 0.33;
    var TAN_H = 0.5;
    var NEAR = 0.3;
    var FAR = 220;
    var D0 = 1.6;
    var D1 = 90;
    var RIDGE_PTS = 36000;
    var FIELD_PTS = 24000;
    var MAX_PTS = RIDGE_PTS + FIELD_PTS;
    var ROW_DT = 0.05;
    var ROWS_FRONT = 34;
    var ROWS_BACK = 6;
    var MAX_HF = 6000;
    var PT_D0 = 3.0;
    var PT_D1 = 24;
    var MESH_C = 160;
    var MESH_R = 120;
    var MESH_S = 1.3;
    var BLOOM_LEVELS = 5;
    var MAX_SPRITES = 2400;
    var SPR_STRIDE = 13;
    var TAU = Math.PI * 2;

    var BIG_DAISIES = [
      [0.04, 0.6, 0.08, 0, 0.95], [0.155, 0.585, 0.06, 0, 1], [0.21, 0.625, 0.075, 0, 0.9],
      [0.05, 0.77, 0.09, 0, 0.6], [0.24, 0.78, 0.15, 0, 1], [0.36, 0.835, 0.11, 0, 0.9],
      [0.49, 0.905, 0.13, 0, 0.85], [0.645, 0.94, 0.14, 0, 0.5], [0.45, 0.735, 0.05, 0, 0.8],
      [0.66, 0.755, 0.06, 0, 0.8], [0.8, 0.69, 0.07, 0, 0.8], [0.915, 0.595, 0.09, 1, 1],
      [0.96, 0.84, 0.1, 0, 0.5], [0.975, 0.965, 0.1, 0, 0.45]
    ];
    var BOKEH_COLORS = [[1, 0.23, 0.23], [0.29, 1, 0.54], [0.42, 0.91, 1], [1, 0.82, 0.38], [1, 0.48, 0.23]];
    var SPECK_WARM = [[1, 0.76, 0.35], [1, 0.54, 0.23], [1, 0.69, 0.5], [1, 0.85, 0.56]];
    var SPECK_COOL = [[0.56, 0.94, 1], [0.61, 1, 0.72]];
    var GLINT_COLORS = [[0.49, 1, 0.69], [0.5, 0.91, 1], [1, 1, 1], [1, 0.35, 0.35], [1, 0.75, 0.38], [0.79, 0.66, 1]];
    var GRASS_A = [15 / 255, 42 / 255, 20 / 255];
    var GRASS_B = [58 / 255, 124 / 255, 62 / 255];
    var CORNERS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];

    var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    var smooth = function (a, b, x) {
      var t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };

    function mulberry32(a) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    var RN = 32;
    var RU0 = -0.35;
    var RU1 = 1.35;
    var RIDGE_A = [
      [-0.35, 0.272, 7], [0, 0.339, 7], [0.0625, 0.361, 7], [0.125, 0.387, 7], [0.1875, 0.417, 7],
      [0.25, 0.444, 7], [0.3125, 0.462, 7], [0.375, 0.476, 6.8], [0.44, 0.49, 6.6], [0.5, 0.497, 6.5],
      [0.56, 0.49, 6.6], [0.62, 0.468, 7], [0.68, 0.432, 7.6], [0.75, 0.39, 8.2], [0.8125, 0.368, 8.5],
      [0.875, 0.364, 8.5], [0.9375, 0.371, 8.5], [1.0, 0.38, 8.5], [1.35, 0.4, 8.5]
    ];
    var RIDGE_B = [
      [-0.35, 0.5, 10.5], [0, 0.492, 10.5], [0.2, 0.482, 11], [0.3, 0.466, 12], [0.375, 0.452, 13],
      [0.4375, 0.437, 13.6], [0.5, 0.416, 14], [0.5625, 0.401, 14], [0.625, 0.398, 13.8],
      [0.6875, 0.394, 13.4], [0.75, 0.4, 13], [0.85, 0.41, 12.5], [1.0, 0.42, 12], [1.35, 0.44, 12]
    ];
    var FALL_A = [6.5, 3.0];
    var FALL_B = [6.5, 3.0];
    var FLOOR = -1.6;
    var SHOULDER = [1.1, 1.2];
    var SHOULDER_SWELL = 0.6;

    function catmull(pts, col, u) {
      var n = pts.length;
      var x = clamp(u, pts[0][0], pts[n - 1][0]);
      var i = 0;
      while (i < n - 2 && x > pts[i + 1][0]) i++;
      var p0 = pts[Math.max(i - 1, 0)][col], p1 = pts[i][col], p2 = pts[i + 1][col], p3 = pts[Math.min(i + 2, n - 1)][col];
      var t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    }

    function buildRidges() {
      var c = Math.cos(PITCH), s = Math.sin(PITCH);
      var out = new Float32Array(RN * 4);
      for (var i = 0; i < RN; i++) {
        var u = RU0 + ((RU1 - RU0) * i) / (RN - 1);
        var ridges = [RIDGE_A, RIDGE_B];
        for (var j = 0; j < 2; j++) {
          var r = ridges[j];
          var y = catmull(r, 1, u);
          var z = catmull(r, 2, u);
          var k = (1 - 2 * y) * TAN_V;
          out[i * 4 + j * 2] = CAM_H + (z * (k * c - s)) / (c + k * s);
          out[i * 4 + j * 2 + 1] = z;
        }
      }
      return out;
    }
    var RIDGES = buildRidges();

    var TERRAIN_GLSL = [
      "uniform vec4 u_cam;",
      "uniform vec4 u_proj;",
      "uniform vec4 u_wave;",
      "uniform vec4 u_r[" + RN + "];",
      "vec4 cr(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t){",
      "  return 0.5 * (2.0 * p1 + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);",
      "}",
      "vec4 ridgeAt(float u){",
      "  float f = clamp((u - " + RU0.toFixed(3) + ") / " + (RU1 - RU0).toFixed(3) + ", 0.0, 1.0) * " + (RN - 1).toFixed(1) + ";",
      "  int i = int(min(floor(f), " + (RN - 2).toFixed(1) + "));",
      "  float t = f - float(i);",
      "  return cr(u_r[max(i - 1, 0)], u_r[i], u_r[i + 1], u_r[min(i + 2, " + (RN - 1) + ")], t);",
      "}",
      "float dome(float t, float wf, float wb){",
      "  if (t < 0.0) { float f = clamp(-t / wf, 0.0, 1.0); float g = 1.0 - f * f; return g * g; }",
      "  float f = clamp(t / wb, 0.0, 1.0);",
      "  return 1.0 - f * f * (3.0 - 2.0 * f);",
      "}",
      "float smax(float a, float b, float k){",
      "  float h = max(k - abs(a - b), 0.0) / k;",
      "  return max(a, b) + h * h * k * 0.25;",
      "}",
      "float shoulderA(float u){",
      "  float k = (u - 0.47) / 0.17;",
      "  return " + SHOULDER[0].toFixed(2) + " + " + SHOULDER_SWELL.toFixed(2) + " * (exp(-k * k) + smoothstep(0.65, 0.85, u));",
      "}",
      "float ridgeLit(vec4 r, float which){",
      "  return which < 0.5 ? smoothstep(1.35, 2.05, r.x - " + FLOOR.toFixed(2) + ") : smoothstep(0.4, 1.2, r.z - " + FLOOR.toFixed(2) + ");",
      "}",
      "float baseH(float x, float d, out float crest, out float owner){",
      "  float u = 0.5 + (x / (" + TAN_H.toFixed(3) + " * max(d, 0.5))) * 0.5;",
      "  vec4 r = ridgeAt(0.5 + (u - 0.5) * u_wave.x);",
      "  float ca = dome(d - r.y, " + FALL_A[0].toFixed(2) + ", " + FALL_A[1].toFixed(2) + ");",
      "  float cb = dome(d - r.w, " + FALL_B[0].toFixed(2) + ", " + FALL_B[1].toFixed(2) + ");",
      "  float a = (r.x - " + FLOOR.toFixed(2) + ") * ca;",
      "  float b = (r.z - " + FLOOR.toFixed(2) + ") * cb;",
      "  float ta = d - r.y, tb = d - r.w;",
      "  float sa = 1.0 - smoothstep(0.0, ta < 0.0 ? shoulderA(0.5 + (u - 0.5) * u_wave.x) : " + FALL_A[1].toFixed(2) + ", abs(ta));",
      "  float sb = 1.0 - smoothstep(0.0, tb < 0.0 ? " + SHOULDER[1].toFixed(2) + " : " + FALL_B[1].toFixed(2) + ", abs(tb));",
      "  owner = a > b ? 0.0 : 1.0;",
      "  crest = a > b ? sa * ridgeLit(r, 0.0) : sb * ridgeLit(r, 1.0);",
      "  float cliff = smoothstep(r.w + " + FALL_B[1].toFixed(2) + ", r.w + " + (FALL_B[1] + 4).toFixed(2) + ", d);",
      "  return " + FLOOR.toFixed(2) + " + smax(a, b, 0.35) - cliff * 40.0;",
      "}",
      "float sheetEnd(float x, float d){",
      "  float u = 0.5 + (x / (" + TAN_H.toFixed(3) + " * max(d, 0.5))) * 0.5;",
      "  vec4 r = ridgeAt(0.5 + (u - 0.5) * u_wave.x);",
      "  return step(r.w + " + FALL_B[1].toFixed(2) + ", d);",
      "}",
      "float terrH(float x, float d, out float crest, out float owner){",
      "  float e = smoothstep(3.0, 8.0, d);",
      "  float a = u_wave.z * (x + 0.35 * d);",
      "  float w = sin(a - u_wave.w) - sin(a) + 0.6 * (sin(1.86 * a + 2.0 * u_wave.w + 1.3) - sin(1.86 * a + 1.3));",
      "  return baseH(x, d, crest, owner) + u_wave.y * e * w;",
      "}",
      "float terrH(float x, float d){ float c, o; return terrH(x, d, c, o); }",
      "vec3 viewOf(vec3 P){",
      "  vec3 r = P - vec3(u_cam.x, u_cam.y, 0.0);",
      "  float depth = -r.y * u_cam.w - r.z * u_cam.z;",
      "  float yv = r.y * u_cam.z - r.z * u_cam.w;",
      "  return vec3(r.x, yv, depth);",
      "}",
      "vec4 clipOf(vec3 v){",
      "  return vec4(v.x / u_proj.x, v.y / u_proj.y, u_proj.z * v.z + u_proj.w, v.z);",
      "}",
      "vec3 normalAt(float x, float d){",
      "  float e = 0.05;",
      "  float hx = (terrH(x + e, d) - terrH(x - e, d)) / (2.0 * e);",
      "  float hd = (terrH(x, d + e) - terrH(x, d - e)) / (2.0 * e);",
      "  return normalize(vec3(-hx, 1.0, hd));",
      "}"
    ].join("\n");

    var FS_VS = "#version 300 es\nin vec2 a_p;\nout vec2 v_uv;\nvoid main(){ v_uv = a_p * 0.5 + 0.5; gl_Position = vec4(a_p, 0.0, 1.0); }";

    var SKY_FS = [
      "#version 300 es",
      "precision highp float;",
      "uniform vec2 u_res;",
      "uniform vec3 u_top, u_mid, u_hor, u_gc;",
      "uniform vec4 u_g;",
      "out vec4 o;",
      "void main(){",
      "  vec2 f = gl_FragCoord.xy / max(u_res, vec2(1.0));",
      "  float y = 1.0 - f.y;",
      "  vec3 c = mix(u_top, u_mid, smoothstep(0.0, 0.22, y));",
      "  c = mix(c, u_hor, smoothstep(0.14, 0.36, y));",
      "  float side = clamp(0.65 + (f.x - u_g.x), 0.0, 1.3) * (1.0 - 0.4 * smoothstep(0.1, 0.36, y));",
      "  c *= mix(vec3(1.0), vec3(1.55, 1.6, 1.22), side);",
      "  vec2 d = vec2((f.x - u_g.x) * u_g.w, (y - u_g.y) * 1.8);",
      "  c += u_gc * u_g.z * exp(-dot(d, d) / 0.05) * 0.35;",
      "  o = vec4(c, 1.0);",
      "}"
    ].join("\n");

    var TERRAIN_VS = [
      "#version 300 es",
      "precision highp float;",
      "in vec2 a_m;",
      TERRAIN_GLSL,
      "uniform vec4 u_fog;",
      "uniform vec3 u_shadow, u_ground, u_rim, u_sky, u_sheen;",
      "out vec3 v_col;",
      "void main(){",
      "  float d = a_m.y;",
      "  float x = u_cam.x + a_m.x * " + MESH_S.toFixed(2) + " * d * u_proj.x;",
      "  float crest, owner;",
      "  float H = terrH(x, d, crest, owner);",
      "  vec3 P = vec3(x, H, -d);",
      "  vec3 v = viewOf(P);",
      "  gl_Position = clipOf(v);",
      "  vec3 N = normalAt(x, d);",
      "  vec3 V = normalize(vec3(u_cam.x, u_cam.y, 0.0) - P);",
      "  float facing = clamp(dot(N, V), 0.0, 1.0);",
      "  vec3 c = mix(u_shadow * 1.15 + u_rim * 0.06, u_shadow * 0.72, smoothstep(0.02, 0.3, facing));",
      "  c = mix(u_ground, c, smoothstep(3.0, 6.5, d));",
      "  c += u_sheen * pow(crest, 1.6);",
      "  float sy = 0.5 - 0.5 * gl_Position.y / gl_Position.w;",
      "  c = mix(c, u_ground, smoothstep(0.58, 0.8, sy) * 0.92);",
      "  float fog = 1.0 - exp(-max(d - 8.0, 0.0) / u_fog.w);",
      "  c = mix(c, u_fog.rgb, fog);",
      "  v_col = mix(c, u_sky, smoothstep(18.0, 40.0, d));",
      "}"
    ].join("\n");

    var TERRAIN_FS = "#version 300 es\nprecision highp float;\nin vec3 v_col;\nout vec4 o;\nvoid main(){ o = vec4(v_col, 1.0); }";

    var GLITTER_VS = [
      "#version 300 es",
      "precision highp float;",
      "in vec4 a_d;",
      TERRAIN_GLSL,
      "uniform vec4 u_px;",
      "uniform vec4 u_light;",
      "uniform vec4 u_tw;",
      "uniform vec4 u_hot;",
      "uniform vec4 u_sun;",
      "uniform vec4 u_fog;",
      "uniform vec3 u_crest, u_slope, u_deep;",
      "out vec3 v_col;",
      "out float v_kind;",
      "out float v_soft;",
      "float h(float n){ return fract(sin(n) * 43758.5453123); }",
      "vec3 film(float t){ return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }",
      "void main(){",
      "  float x = a_d.x, d = a_d.y, s = a_d.z;",
      "  bool row = a_d.w < 1.5;",
      "  float prof = 0.0;",
      "  float sh = a_d.w < 0.5 ? shoulderA(a_d.x) : " + SHOULDER[1].toFixed(2) + ";",
      "  if (row) {",
      "    vec4 r = ridgeAt(a_d.x);",
      "    d = (a_d.w < 0.5 ? r.y : r.w) + a_d.y;",
      "    x = (a_d.x - 0.5) / u_wave.x * 2.0 * " + TAN_H.toFixed(3) + " * d;",
      "    float t = a_d.y;",
      "    prof = t < 0.0 ? exp(-pow(-t / sh, 4.0)) : 0.55 * exp(-pow(t / 0.35, 2.0));",
      "    prof *= 0.55 + 0.45 * h(floor(t / " + ROW_DT.toFixed(3) + " + 0.5) * 7.31 + a_d.w * 3.7);",
      "    prof *= clamp(d / 7.0, 1.0, 1.45) * ridgeLit(r, a_d.w);",
      "  }",
      "  float crest, owner;",
      "  float H = terrH(x, d, crest, owner);",
      "  vec3 P = vec3(x, H + 0.03, -d);",
      "  vec3 v = viewOf(P);",
      "  gl_Position = clipOf(v);",
      "  vec3 N = normalAt(x, d);",
      "  vec3 V = normalize(vec3(u_cam.x, u_cam.y, 0.0) - P);",
      "  float facing = dot(N, V);",
      "  float rim = smoothstep(0.42, 0.03, facing);",
      "  float back = clamp(dot(N, u_sun.xyz) * 0.5 + 0.6, 0.0, 1.0);",
      "  float hills = smoothstep(2.5, 7.0, d);",
      "  float top = row ? prof * prof * prof * 8.0 * (0.3 + 2.4 * h(s * 47.3 + 7.1) * h(s * 47.3 + 7.1) * h(s * 47.3 + 7.1)) : crest * crest * 0.2;",
      "  float I = u_light.x * (top + 0.06 * rim * rim) * back * (0.3 + 0.7 * hills) + u_light.y * (0.01 + 0.07 * pow(h(s * 47.3 + 7.1), 4.0)) * (0.35 + 0.65 * hills);",
      "  rim = max(rim, top);",
      "  vec2 ndc = gl_Position.xy / gl_Position.w;",
      "  vec2 dh = (ndc - u_hot.xy) * vec2(3.4, 8.0);",
      "  I *= 1.0 + u_hot.z * 1.6 * exp(-dot(dh, dh)) * (0.3 + rim);",
      "  float ph = 6.2831853 * (u_tw.w / u_tw.x + h(s * 29.3 + 9.9));",
      "  float fl = pow(0.5 + 0.5 * sin(ph), u_light.w);",
      "  I *= 0.6 + u_light.z * fl;",
      "  float bpos = row ? clamp(-a_d.y / sh, -0.4, 1.6) : 1.0 + h(s * 13.9 + 3.7);",
      "  float hue = 0.8 + bpos * 0.2 + (h(s * 91.7 + 1.3) - 0.5) * 0.22 + (h(s * 29.3 + 9.9) < 0.22 ? 0.48 : 0.0);",
      "  vec3 iri = mix(film(hue + 0.03 * sin(ph)), vec3(1.0), 0.16);",
      "  vec3 col = mix(u_crest, mix(u_slope, u_deep, h(s * 13.9 + 3.7)), smoothstep(0.25, 0.0, rim) * 0.85);",
      "  col = h(s * 71.1 + 5.3) < u_tw.y ? iri : mix(col, iri, 0.55);",
      "  if (h(s * 71.1 + 5.3) < u_tw.y) I = min(I, 1.6);",
      "  float fog = 1.0 - exp(-max(d - 8.0, 0.0) / u_fog.w);",
      "  col = mix(col, u_fog.rgb * 1.6, fog * 0.5);",
      "  I *= 1.0 - 0.35 * fog;",
      "  float px = u_px.y * u_px.x / (max(v.z, 0.1) * u_proj.y) * (0.7 + 0.6 * h(s * 91.7 + 1.3));",
      "  float blur = smoothstep(4.5, 2.0, d);",
      "  px *= 1.0 + 1.5 * blur;",
      "  v_soft = blur;",
      "  float sz = clamp(px, u_px.w, u_px.z);",
      "  I *= min(1.0, (px * px) / (sz * sz)) / (1.0 + 3.0 * blur);",
      "  I *= 1.0 - smoothstep(0.6, 0.8, 0.5 - 0.5 * ndc.y);",
      "  v_kind = 0.0;",
      "  if (h(s * 53.7 + 2.2) < u_tw.z) {",
      "    float cyc = fract(u_tw.w / u_sun.w + h(s * 13.9 + 3.7));",
      "    float a = pow(sin(3.14159265 * cyc), 3.0);",
      "    float lit = smoothstep(0.25, 0.6, rim) * (1.0 - fog);",
      "    v_kind = 1.0;",
      "    I = a * lit * 2.2;",
      "    sz = clamp(u_px.x * 0.05 * u_hot.w * (0.6 + 0.4 * h(s * 47.3 + 7.1)) * a, 0.0, u_px.z);",
      "    if (lit * a < 0.02) sz = 0.0;",
      "    col = mix(u_crest, vec3(1.0), 0.5);",
      "  }",
      "  v_col = col * I;",
      "  bool hide = sheetEnd(x, d) > 0.5 || d < 1.0 || (row && abs(owner - a_d.w) > 0.5);",
      "  gl_PointSize = hide ? 0.0 : sz;",
      "}"
    ].join("\n");

    var GLITTER_FS = [
      "#version 300 es",
      "precision highp float;",
      "in vec3 v_col;",
      "in float v_kind;",
      "in float v_soft;",
      "out vec4 o;",
      "void main(){",
      "  vec2 q = gl_PointCoord * 2.0 - 1.0;",
      "  float d = dot(q, q);",
      "  if (v_kind > 0.5) {",
      "    float r = sqrt(d);",
      "    float rays = exp(-abs(q.y) * 28.0) * max(1.0 - abs(q.x), 0.0) + exp(-abs(q.x) * 28.0) * max(1.0 - abs(q.y), 0.0);",
      "    float core = exp(-d * 30.0);",
      "    o = vec4(v_col * (core * 1.5 + rays * 0.8 + exp(-r * 6.0) * 0.15), 0.0);",
      "    return;",
      "  }",
      "  if (d > 1.0) discard;",
      "  float core = exp(-d * 6.0);",
      "  float disc = 1.0 - smoothstep(0.55, 1.0, d);",
      "  float rimB = smoothstep(0.35, 0.9, d) * disc;",
      "  float val = mix(core * 0.9 + disc * 0.3, disc * 0.55 + rimB * 0.45, v_soft);",
      "  o = vec4(v_col * val, 0.0);",
      "}"
    ].join("\n");

    var DOWN_FS = [
      "#version 300 es",
      "precision highp float;",
      "in vec2 v_uv;",
      "uniform sampler2D u_src;",
      "uniform vec2 u_texel;",
      "uniform float u_pre;",
      "out vec4 o;",
      "vec3 pre(vec3 c){",
      "  float b = max(c.r, max(c.g, c.b));",
      "  float k = clamp(b - 0.45, 0.0, 0.8);",
      "  float w = max(k * k / (4.0 * 0.8 + 0.0001), b - 1.25) / max(b, 0.0001);",
      "  return c * max(w, 0.0);",
      "}",
      "void main(){",
      "  vec2 h = u_texel * 0.5;",
      "  vec3 s = texture(u_src, v_uv).rgb * 4.0;",
      "  s += texture(u_src, v_uv - h).rgb;",
      "  s += texture(u_src, v_uv + h).rgb;",
      "  s += texture(u_src, v_uv + vec2(h.x, -h.y)).rgb;",
      "  s += texture(u_src, v_uv - vec2(h.x, -h.y)).rgb;",
      "  s /= 8.0;",
      "  o = vec4(u_pre > 0.5 ? pre(min(s, vec3(6.0))) : s, 1.0);",
      "}"
    ].join("\n");

    var UP_FS = [
      "#version 300 es",
      "precision highp float;",
      "in vec2 v_uv;",
      "uniform sampler2D u_src;",
      "uniform vec2 u_texel;",
      "out vec4 o;",
      "void main(){",
      "  vec2 h = u_texel * 0.5;",
      "  vec3 s = texture(u_src, v_uv + vec2(-h.x * 2.0, 0.0)).rgb;",
      "  s += texture(u_src, v_uv + vec2(-h.x, h.y)).rgb * 2.0;",
      "  s += texture(u_src, v_uv + vec2(0.0, h.y * 2.0)).rgb;",
      "  s += texture(u_src, v_uv + vec2(h.x, h.y)).rgb * 2.0;",
      "  s += texture(u_src, v_uv + vec2(h.x * 2.0, 0.0)).rgb;",
      "  s += texture(u_src, v_uv + vec2(h.x, -h.y)).rgb * 2.0;",
      "  s += texture(u_src, v_uv + vec2(0.0, -h.y * 2.0)).rgb;",
      "  s += texture(u_src, v_uv + vec2(-h.x, -h.y)).rgb * 2.0;",
      "  o = vec4(s / 12.0, 1.0);",
      "}"
    ].join("\n");

    var COMPOSITE_FS = [
      "#version 300 es",
      "precision highp float;",
      "in vec2 v_uv;",
      "uniform sampler2D u_scene, u_bloom;",
      "uniform vec3 u_tint;",
      "uniform vec2 u_bl;",
      "out vec4 o;",
      "vec3 shoulder(vec3 c){",
      "  float m = max(c.r, max(c.g, c.b));",
      "  if (m <= 0.75) return c;",
      "  float t = 0.75 + 0.25 * (1.0 - exp(-(m - 0.75) / 0.25));",
      "  vec3 h = c * (t / m);",
      "  return mix(h, vec3(t), clamp((m - 1.1) / 2.2, 0.0, 0.7));",
      "}",
      "void main(){",
      "  vec2 d = v_uv - 0.5;",
      "  vec2 ca = d * dot(d, d) * 0.009 * u_bl.y;",
      "  vec3 c;",
      "  c.r = texture(u_scene, v_uv - ca).r;",
      "  c.g = texture(u_scene, v_uv).g;",
      "  c.b = texture(u_scene, v_uv + ca).b;",
      "  vec3 b;",
      "  b.r = texture(u_bloom, v_uv - ca * 2.0).r;",
      "  b.g = texture(u_bloom, v_uv).g;",
      "  b.b = texture(u_bloom, v_uv + ca * 2.0).b;",
      "  c += b * u_bl.x * u_tint;",
      "  o = vec4(shoulder(c), 1.0);",
      "}"
    ].join("\n");

    function makeProgram(gl, vs, fs, names) {
      function sh(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("GlimmerVale compile failed:", gl.getShaderInfoLog(s));
        }
        return s;
      }
      var p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      var u = {};
      for (var i = 0; i < names.length; i++) u[names[i]] = gl.getUniformLocation(p, names[i]);
      return { prog: p, u: u };
    }

    function vaoFor(gl, prog, buf, layout) {
      var vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      var stride = 0;
      for (var k = 0; k < layout.length; k++) stride += layout[k][1] * 4;
      var off = 0;
      for (var j = 0; j < layout.length; j++) {
        var loc = gl.getAttribLocation(prog, layout[j][0]);
        if (loc >= 0) {
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, layout[j][1], gl.FLOAT, false, stride, off * 4);
        }
        off += layout[j][1];
      }
      gl.bindVertexArray(null);
      return vao;
    }

    function makeTarget(gl, w, h, hdr, withDepth) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      var depth = null;
      if (withDepth) {
        depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex: tex, fb: fb, depth: depth, w: w, h: h };
    }

    function freeTarget(gl, t) {
      if (!t) return;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
      if (t.depth) gl.deleteRenderbuffer(t.depth);
    }

    function buildPoints(seed) {
      var rnd = mulberry32(seed * 9973 + 1);
      var d = new Float32Array(MAX_PTS * 4);
      var i = 0;
      function put(a, b, c, e) {
        var o = i++ * 4;
        d[o] = a; d[o + 1] = b; d[o + 2] = c; d[o + 3] = e;
      }
      var rows = ROWS_FRONT + ROWS_BACK + 1;
      var share = [0.4, 0.6];
      for (var ridge = 0; ridge < 2; ridge++) {
        var per = Math.floor((RIDGE_PTS * share[ridge]) / rows);
        for (var k = -ROWS_FRONT; k <= ROWS_BACK; k++) {
          var off = rnd();
          for (var n = 0; n < per; n++) {
            put(-0.32 + (1.64 * (n + off + (rnd() - 0.5) * 0.5)) / per, (k + (rnd() - 0.5) * 0.22) * ROW_DT, rnd(), ridge);
          }
        }
      }
      while (i < MAX_PTS) {
        var z = PT_D0 + (PT_D1 - PT_D0) * Math.sqrt(rnd());
        put((rnd() * 2 - 1) * z * TAN_H * 1.25, z, rnd(), 2);
      }
      return d;
    }

    function buildMesh() {
      var v = new Float32Array((MESH_C + 1) * (MESH_R + 1) * 2);
      var o = 0;
      for (var j = 0; j <= MESH_R; j++) {
        var d = D0 * Math.pow(D1 / D0, j / MESH_R);
        for (var i = 0; i <= MESH_C; i++) {
          v[o++] = (i / MESH_C) * 2 - 1;
          v[o++] = d;
        }
      }
      var idx = new Uint32Array(MESH_C * MESH_R * 6);
      o = 0;
      for (var r = 0; r < MESH_R; r++) {
        for (var c = 0; c < MESH_C; c++) {
          var a = r * (MESH_C + 1) + c;
          var b = a + 1;
          var c1 = a + MESH_C + 1;
          var e = c1 + 1;
          idx[o++] = a; idx[o++] = c1; idx[o++] = b;
          idx[o++] = b; idx[o++] = c1; idx[o++] = e;
        }
      }
      return { v: v, idx: idx };
    }

    function init() {
      var canvas = document.getElementById("glimmer-vale-canvas");
      if (!canvas) return null;
      var container = canvas.parentElement;
      if (!container) return null;

      var gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false
      });

      if (!gl) {
        console.warn("GlimmerVale: WebGL2 not supported, canvas inactive");
        return null;
      }

      var quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      function fsProg(fs, names) {
        var p = makeProgram(gl, FS_VS, fs, names);
        return { prog: p.prog, u: p.u, vao: vaoFor(gl, p.prog, quad, [["a_p", 2]]) };
      }

      var WORLD_U = ["u_cam", "u_proj", "u_wave", "u_r[0]"];
      var sky = fsProg(SKY_FS, ["u_res", "u_top", "u_mid", "u_hor", "u_gc", "u_g"]);
      var down = fsProg(DOWN_FS, ["u_src", "u_texel", "u_pre"]);
      var up = fsProg(UP_FS, ["u_src", "u_texel"]);
      var comp = fsProg(COMPOSITE_FS, ["u_scene", "u_bloom", "u_tint", "u_bl"]);

      var terrain = makeProgram(gl, TERRAIN_VS, TERRAIN_FS, WORLD_U.concat(["u_fog", "u_shadow", "u_ground", "u_rim", "u_sky", "u_sheen"]));
      var mesh = buildMesh();
      var meshBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.v, gl.STATIC_DRAW);
      var meshVao = vaoFor(gl, terrain.prog, meshBuf, [["a_m", 2]]);
      gl.bindVertexArray(meshVao);
      var idxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);

      var glitter = makeProgram(gl, GLITTER_VS, GLITTER_FS, WORLD_U.concat([
        "u_px", "u_light", "u_tw", "u_hot", "u_sun", "u_fog", "u_crest", "u_slope", "u_deep"
      ]));
      var ptBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
      gl.bufferData(gl.ARRAY_BUFFER, buildPoints(7), gl.STATIC_DRAW);
      var ptVao = vaoFor(gl, glitter.prog, ptBuf, [["a_d", 4]]);

      var range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      var maxPt = range && range[1] ? range[1] : 64;

      var scene = null;
      var bloom = [];
      var W = 1200, H = 800;
      var pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
      var tw = 0, last = 0, raf = 0;

      function allocate(cw, ch) {
        if (scene) freeTarget(gl, scene);
        for (var i = 0; i < bloom.length; i++) freeTarget(gl, bloom[i]);
        scene = makeTarget(gl, cw, ch, false, true);
        bloom = [];
        var w = cw, h = ch;
        for (var k = 0; k < BLOOM_LEVELS; k++) {
          w = Math.max(1, w >> 1);
          h = Math.max(1, h >> 1);
          bloom.push(makeTarget(gl, w, h, false, false));
        }
      }

      function resize() {
        W = container.offsetWidth || window.innerWidth;
        H = container.offsetHeight || window.innerHeight;
        var dpr = Math.min(1.5, window.devicePixelRatio || 1);
        var cw = Math.round(W * dpr);
        var ch = Math.round(H * dpr);
        if (canvas.width !== cw || canvas.height !== ch || !scene || scene.w !== cw || scene.h !== ch) {
          canvas.width = cw;
          canvas.height = ch;
          allocate(cw, ch);
        }
      }

      window.addEventListener("pointermove", function (e) {
        var cx = window.innerWidth / 2;
        var cy = window.innerHeight / 2;
        pointer.targetX = clamp((e.clientX - cx) / cx, -1, 1);
        pointer.targetY = clamp((e.clientY - cy) / cy, -1, 1);
      }, { passive: true });

      function frame(now) {
        if (!isGlimmerActive() || document.hidden) {
          raf = 0;
          return;
        }
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        tw = (tw + dt) % 8;

        resize();
        var cw = canvas.width;
        var ch = canvas.height;

        pointer.x += (pointer.targetX - pointer.x) * 0.05;
        pointer.y += (pointer.targetY - pointer.y) * 0.05;

        var camX = pointer.x * 0.35;
        var camY = CAM_H - pointer.y * 0.06;
        var pitch = PITCH + pointer.y * 0.008;
        var cosP = Math.cos(pitch), sinP = Math.sin(pitch);

        var waveK = TAU / (0.7 * (2 * TAN_H * 12));
        var wavePh = (TAU * tw) / 8;

        // 1. Scene Pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb);
        gl.viewport(0, 0, cw, ch);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.clearColor(0.03, 0.035, 0.08, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Sky
        gl.useProgram(sky.prog);
        gl.uniform2f(sky.u.u_res, cw, ch);
        gl.uniform3f(sky.u.u_top, 0.14, 0.15, 0.35);
        gl.uniform3f(sky.u.u_mid, 0.29, 0.32, 0.56);
        gl.uniform3f(sky.u.u_hor, 0.61, 0.61, 0.78);
        gl.uniform3f(sky.u.u_gc, 0.96, 0.91, 0.89);
        gl.uniform4f(sky.u.u_g, 0.65, 0.5, 0.3, W / H);
        gl.bindVertexArray(sky.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        var A = (FAR + NEAR) / (FAR - NEAR), B = (-2 * FAR * NEAR) / (FAR - NEAR);
        function setWorld(u) {
          gl.uniform4f(u.u_cam, camX, camY, cosP, sinP);
          gl.uniform4f(u.u_proj, TAN_H, TAN_V, A, B);
          gl.uniform4f(u.u_wave, 1.0, 0.075, waveK, wavePh);
          gl.uniform4f(u.u_fog, 0.45, 0.45, 0.65, 22);
          gl.uniform4fv(u["u_r[0]"], RIDGES);
        }

        // Terrain Mesh
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.useProgram(terrain.prog);
        setWorld(terrain.u);
        gl.uniform3f(terrain.u.u_shadow, 0.16, 0.13, 0.22);
        gl.uniform3f(terrain.u.u_ground, 0.03, 0.035, 0.08);
        gl.uniform3f(terrain.u.u_rim, 0.55, 0.52, 0.78);
        gl.uniform3f(terrain.u.u_sky, 0.61, 0.61, 0.78);
        gl.uniform3f(terrain.u.u_sheen, 0.25, 0.22, 0.38);
        gl.bindVertexArray(meshVao);
        gl.drawElements(gl.TRIANGLES, mesh.idx.length, gl.UNSIGNED_INT, 0);

        // Glitter Sheet
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(glitter.prog);
        setWorld(glitter.u);
        gl.uniform4f(glitter.u.u_px, ch / 2, 0.017, maxPt, 1.0);
        gl.uniform4f(glitter.u.u_light, 1.0, 1.0, 0.45, 8.0);
        gl.uniform4f(glitter.u.u_tw, 1.6, 0.6, 0.003, tw);
        gl.uniform4f(glitter.u.u_hot, 0.3, 0.0, 0.7, 1.0);
        gl.uniform4f(glitter.u.u_sun, 0.15, 0.18, -0.9, 0.8);
        gl.uniform3f(glitter.u.u_crest, 0.96, 0.94, 1.0);
        gl.uniform3f(glitter.u.u_slope, 0.55, 0.52, 0.78);
        gl.uniform3f(glitter.u.u_deep, 0.35, 0.32, 0.56);
        gl.bindVertexArray(ptVao);
        gl.drawArrays(gl.POINTS, 0, Math.floor(MAX_PTS * 0.75));

        // 2. Dual-filter Kawase Bloom
        gl.disable(gl.BLEND);
        gl.useProgram(down.prog);
        gl.bindVertexArray(down.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(down.u.u_src, 0);

        var src = scene;
        for (var b = 0; b < bloom.length; b++) {
          var dst = bloom[b];
          gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
          gl.viewport(0, 0, dst.w, dst.h);
          gl.bindTexture(gl.TEXTURE_2D, src.tex);
          gl.uniform2f(down.u.u_texel, 1 / src.w, 1 / src.h);
          gl.uniform1f(down.u.u_pre, b === 0 ? 1 : 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          src = dst;
        }

        gl.useProgram(up.prog);
        gl.bindVertexArray(up.vao);
        gl.uniform1i(up.u.u_src, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        for (var u = bloom.length - 1; u > 0; u--) {
          var fromT = bloom[u], toT = bloom[u - 1];
          gl.bindFramebuffer(gl.FRAMEBUFFER, toT.fb);
          gl.viewport(0, 0, toT.w, toT.h);
          gl.bindTexture(gl.TEXTURE_2D, fromT.tex);
          gl.uniform2f(up.u.u_texel, 1 / fromT.w, 1 / fromT.h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        gl.disable(gl.BLEND);

        // 3. Composite to Screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, cw, ch);
        gl.useProgram(comp.prog);
        gl.bindVertexArray(comp.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, scene.tex);
        gl.uniform1i(comp.u.u_scene, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bloom[0].tex);
        gl.uniform1i(comp.u.u_bloom, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform3f(comp.u.u_tint, 0.95, 0.93, 1.0);
        gl.uniform2f(comp.u.u_bl, 0.5, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);

        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (!raf) {
          last = 0;
          resize();
          raf = requestAnimationFrame(frame);
        }
      }

      function stop() {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }

      window.addEventListener("resize", resize, { passive: true });
      return { start: start, stop: stop };
    }

    return { init: init };
  })();

  /* ==========================================================================
     3. ORIGINKIT HOLO FLIP BADGE (3D Physics & Holographic Interaction)
     Source: components/originkit/holo-flip-badge.tsx
     ========================================================================== */
  var HoloBadgeEngine = (function () {
    function init() {
      var wrap = document.querySelector(".holo-badge-wrap");
      var cardInner = document.querySelector(".holo-card-inner");
      if (!wrap || !cardInner) return null;

      var sheen = wrap.querySelector(".holo-sheen");
      var glares = wrap.querySelectorAll(".holo-glare");
      var isFlipped = false;
      var flipAngle = 0;
      var targetFlip = 0;

      var st = {
        tx: 0,
        ty: 0,
        targetTx: 0,
        targetTy: 0,
        sw: 0,
        targetSw: 0,
        over: 0,
        t: 0
      };

      var raf = 0, last = 0;

      // Click to flip
      wrap.addEventListener("click", function (e) {
        if (e.target.tagName === "A") return;
        isFlipped = !isFlipped;
        targetFlip = isFlipped ? 180 : 0;
      });

      // Pointer movement for spring tilt and holographic glare
      wrap.addEventListener("pointermove", function (e) {
        var rect = wrap.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        st.targetTy = x * 20; // rotateY
        st.targetTx = -y * 18; // rotateX
        st.targetSw = x * 8; // slight pendulum swing
        st.over = 1;
      });

      wrap.addEventListener("pointerleave", function () {
        st.targetTx = 0;
        st.targetTy = 0;
        st.targetSw = 0;
        st.over = 0;
      });

      function updatePhysics(now) {
        if (!isGlimmerActive() || document.hidden) {
          raf = 0;
          return;
        }

        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
        last = now;
        st.t += dt;

        // Spring easing
        st.tx += (st.targetTx - st.tx) * 0.12;
        st.ty += (st.targetTy - st.ty) * 0.12;
        st.sw += (st.targetSw - st.sw) * 0.08;
        flipAngle += (targetFlip - flipAngle) * 0.14;

        // Gentle ambient sway when resting
        var idleSway = Math.sin(st.t * 1.8) * 1.2;
        var tiltX = st.tx;
        var tiltY = flipAngle + st.ty + idleSway;

        cardInner.style.transform = "rotateX(" + tiltX.toFixed(3) + "deg) rotateY(" + tiltY.toFixed(3) + "deg)";

        // Holo sheen and glare foil physics from Originkit
        var nu = st.ty / 14;
        var nv = st.tx / 14;
        var fs = Math.sin((flipAngle * Math.PI) / 180);
        var drift = 10 * Math.sin(st.t * 0.9) + 6 * Math.sin(st.t * 0.53 + 1.1);
        var pos = Math.max(0, Math.min(100, 50 + nu * 35 + fs * 30 + drift));
        var posY = Math.max(0, Math.min(100, 50 - nv * 25 + drift * 0.5));
        var gpos = Math.max(0, Math.min(100, 50 + nu * 45 + fs * 40));

        if (sheen) {
          sheen.style.opacity = String(0.25 + 0.35 * st.over);
          sheen.style.backgroundPosition = pos.toFixed(1) + "% " + posY.toFixed(1) + "%";
        }

        for (var i = 0; i < glares.length; i++) {
          glares[i].style.opacity = String(0.18 + 0.45 * st.over);
          glares[i].style.backgroundPosition = gpos.toFixed(1) + "% " + posY.toFixed(1) + "%";
        }

        raf = requestAnimationFrame(updatePhysics);
      }

      function start() {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(updatePhysics);
        }
      }

      function stop() {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }

      return { start: start, stop: stop };
    }

    return { init: init };
  })();

  /* ==========================================================================
     GLOBAL THEME CONTROLLER & LIFECYCLE
     ========================================================================== */
  var wm = null;
  var gv = null;
  var hb = null;

  function boot() {
    wm = WordmarkEngine.init();
    gv = GlimmerValeEngine.init();
    hb = HoloBadgeEngine.init();

    function update() {
      if (isGlimmerActive()) {
        if (wm && wm.start) wm.start();
        if (gv && gv.start) gv.start();
        if (hb && hb.start) hb.start();
      } else {
        if (wm && wm.stop) wm.stop();
        if (gv && gv.stop) gv.stop();
        if (hb && hb.stop) hb.stop();
      }
    }

    var styleSelect = document.getElementById("style-select");
    if (styleSelect) {
      styleSelect.addEventListener("change", function () {
        setTimeout(update, 50);
      });
    }

    var observer = new MutationObserver(function () {
      update();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-style"] });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (wm && wm.stop) wm.stop();
        if (gv && gv.stop) gv.stop();
        if (hb && hb.stop) hb.stop();
      } else {
        update();
      }
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
