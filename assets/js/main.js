/* Espaces Verts 64 — dessin des plans et apparitions au défilement */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Générateur pseudo-aléatoire à graine : le dessin est identique à chaque visite */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function Pen(svg, seed) {
    this.svg = svg;
    this.r = rng(seed);
    this.n = 0;
  }

  Pen.prototype.add = function (tag, attrs, cls) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (tag !== 'text') {
      el.setAttribute('pathLength', '1');
      el.style.setProperty('--i', this.n++);
    }
    el.setAttribute('class', (tag !== 'text' ? 's ' : '') + (cls || ''));
    this.svg.appendChild(el);
    return el;
  };

  Pen.prototype.line = function (x1, y1, x2, y2, cls) {
    return this.add('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 }, cls);
  };

  Pen.prototype.rect = function (x, y, w, h, cls) {
    return this.add('path', { d: 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + -w + 'z' }, cls);
  };

  Pen.prototype.circle = function (cx, cy, r, cls) {
    return this.add('circle', { cx: cx, cy: cy, r: r }, cls);
  };

  /* Contour irrégulier : la couronne d'un arbre vue du ciel */
  Pen.prototype.blob = function (cx, cy, r, wobble, cls) {
    var R = this.r, pts = [], n = 28;
    var a1 = 3 + Math.floor(R() * 3), a2 = 7 + Math.floor(R() * 4);
    var p1 = R() * 6.28, p2 = R() * 6.28;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var rr = r * (1 + wobble * Math.sin(a1 * t + p1) + wobble * 0.6 * Math.sin(a2 * t + p2));
      pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
    }
    var d = '';
    for (var j = 0; j < n; j++) {
      var a = pts[j], b = pts[(j + 1) % n];
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      d += (j === 0 ? 'M' + mx.toFixed(1) + ' ' + my.toFixed(1) : '');
      var c = pts[(j + 1) % n], e = pts[(j + 2) % n];
      d += 'Q' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ' ' +
        ((c[0] + e[0]) / 2).toFixed(1) + ' ' + ((c[1] + e[1]) / 2).toFixed(1);
    }
    return this.add('path', { d: d + 'z' }, cls);
  };

  Pen.prototype.tree = function (cx, cy, r) {
    var R = this.r;
    this.blob(cx, cy, r, 0.05, 'k');
    this.blob(cx, cy, r * 0.62, 0.09, 'f');
    var rays = 5 + Math.floor(R() * 4), off = R() * 6.28;
    for (var i = 0; i < rays; i++) {
      var t = off + (i / rays) * 6.28 + (R() - 0.5) * 0.4;
      var l = r * (0.35 + R() * 0.5);
      this.line(cx, cy, (cx + l * Math.cos(t)).toFixed(1), (cy + l * Math.sin(t)).toFixed(1), 'f');
    }
    this.add('circle', { cx: cx, cy: cy, r: 1.6 }, 'dot');
  };

  /* Courbe de niveau traversant la planche */
  Pen.prototype.contour = function (y0, amp, w, cls) {
    var R = this.r, d = 'M-40 ' + y0, x = -40, y = y0;
    while (x < w + 40) {
      var dx = 140 + R() * 120, ny = y0 + (R() - 0.5) * amp;
      d += 'S' + (x + dx * 0.5).toFixed(0) + ' ' + (ny + (R() - 0.5) * amp * 0.6).toFixed(0) +
        ' ' + (x + dx).toFixed(0) + ' ' + ny.toFixed(0);
      x += dx; y = ny;
    }
    return this.add('path', { d: d }, cls || 'f');
  };

  Pen.prototype.hatch = function (x, y, w, h, step) {
    for (var i = step; i < w + h; i += step) {
      var x1 = x + Math.min(i, w), y1 = y + Math.max(0, i - w);
      var x2 = x + Math.max(0, i - h), y2 = y + Math.min(i, h);
      this.line(x1, y1, x2, y2, 'f');
    }
  };

  Pen.prototype.label = function (x, y, txt, anchor) {
    var t = this.add('text', { x: x, y: y, 'text-anchor': anchor || 'start' });
    t.textContent = txt;
    return t;
  };

  /* ── Plan d'ouverture : une propriété, vue du ciel ── */
  function heroPlan(svg) {
    var p = new Pen(svg, 2008);

    // axes de composition
    p.line(560, -20, 560, 1020, 'axis');
    p.line(-20, 520, 1020, 520, 'axis');

    // relief
    p.contour(120, 90, 1000);
    p.contour(190, 110, 1000);
    p.contour(860, 100, 1000);
    p.contour(930, 80, 1000);

    // la maison
    p.add('path', { d: 'M440 300h240v130h-90v70h-150z' }, 'k2');
    p.hatch(440, 300, 240, 130, 16);

    // terrasse dallée
    p.rect(440, 520, 240, 90, 'k');
    for (var i = 1; i < 6; i++) p.line(440 + i * 40, 520, 440 + i * 40, 610, 'f');
    p.line(440, 565, 680, 565, 'f');

    // miroir d'eau dans l'axe
    p.rect(535, 650, 50, 230, 'k');
    p.rect(542, 657, 36, 216, 'f');

    // parterres bordés
    p.rect(440, 650, 70, 230, 'k');
    p.rect(610, 650, 70, 230, 'k');
    p.hatch(440, 650, 70, 230, 22);
    p.hatch(610, 650, 70, 230, 22);

    // rond-point et allée courbe
    p.circle(560, 930, 34, 'k');
    p.circle(560, 930, 22, 'f');
    p.add('path', { d: 'M440 400C330 400 250 470 240 590S300 860 526 930' }, 'k');
    p.add('path', { d: 'M440 418C344 420 268 480 258 592S316 846 528 912' }, 'f');

    // verger en quinconce
    for (var r = 0; r < 3; r++)
      for (var c = 0; c < 3; c++)
        p.tree(770 + c * 74 + (r % 2) * 37, 330 + r * 70, 24);

    // grands sujets
    p.tree(300, 250, 68);
    p.tree(170, 430, 46);
    p.tree(840, 700, 78);
    p.tree(360, 760, 40);
    p.tree(150, 720, 58);
    p.tree(730, 180, 42);
    p.tree(900, 520, 30);

    // haie périphérique
    p.rect(90, 90, 860, 880, 'k');
    p.rect(104, 104, 832, 852, 'f');

    // cote
    p.line(440, 268, 680, 268, 'f');
    p.line(440, 260, 440, 276, 'f');
    p.line(680, 260, 680, 276, 'f');
    p.label(560, 258, '24,00', 'middle');

    // nord
    p.circle(900, 150, 20, 'f');
    p.add('path', { d: 'M900 172V122M892 136l8-14 8 14' }, 'k');
    p.label(900, 112, 'N', 'middle');

    // échelle
    p.line(120, 940, 280, 940, 'k');
    p.line(120, 934, 120, 946, 'k');
    p.line(200, 934, 200, 946, 'k');
    p.line(280, 934, 280, 946, 'k');
    p.label(120, 926, '0');
    p.label(280, 926, '20 m', 'end');
  }

  /* ── Planches : trois compositions ── */
  var plates = {
    allee: function (svg) {
      var p = new Pen(svg, 64);
      p.contour(150, 80, 800); p.contour(880, 70, 800);
      p.line(400, -20, 400, 1020, 'axis');
      p.rect(360, 220, 80, 560, 'k'); p.rect(370, 230, 60, 540, 'f');
      for (var i = 0; i < 6; i++) {
        p.tree(250, 250 + i * 100, 38);
        p.tree(550, 250 + i * 100, 38);
      }
      p.circle(400, 140, 44, 'k'); p.circle(400, 140, 30, 'f');
      p.rect(130, 190, 60, 620, 'k'); p.hatch(130, 190, 60, 620, 20);
      p.rect(610, 190, 60, 620, 'k'); p.hatch(610, 190, 60, 620, 20);
    },
    cercle: function (svg) {
      var p = new Pen(svg, 1987);
      p.contour(110, 70, 1000); p.contour(700, 90, 1000);
      p.line(-20, 400, 1020, 400, 'axis'); p.line(500, -20, 500, 820, 'axis');
      [250, 190, 130, 60, 44].forEach(function (r, i) { p.circle(500, 400, r, i % 2 ? 'f' : 'k'); });
      for (var a = 0; a < 8; a++) {
        var t = a * Math.PI / 4 + Math.PI / 8;
        p.line((500 + 60 * Math.cos(t)).toFixed(1), (400 + 60 * Math.sin(t)).toFixed(1),
          (500 + 250 * Math.cos(t)).toFixed(1), (400 + 250 * Math.sin(t)).toFixed(1), 'f');
        var t2 = a * Math.PI / 4;
        p.tree(500 + 160 * Math.cos(t2), 400 + 160 * Math.sin(t2), 22);
      }
      p.tree(130, 180, 60); p.tree(880, 620, 70); p.tree(860, 150, 40); p.tree(120, 640, 46);
    },
    patio: function (svg) {
      var p = new Pen(svg, 31);
      p.rect(120, 120, 560, 560, 'k2');
      for (var i = 1; i < 8; i++) {
        p.line(120 + i * 70, 120, 120 + i * 70, 680, 'f');
        p.line(120, 120 + i * 70, 680, 120 + i * 70, 'f');
      }
      p.rect(330, 330, 140, 140, 'k'); p.rect(342, 342, 116, 116, 'f');
      p.tree(225, 225, 62); p.tree(575, 225, 62); p.tree(225, 575, 62); p.tree(575, 575, 62);
      p.line(400, -20, 400, 820, 'axis'); p.line(-20, 400, 820, 400, 'axis');
    }
  };

  var hero = document.getElementById('plan');
  if (hero) heroPlan(hero);
  document.querySelectorAll('svg[data-plate]').forEach(function (svg) {
    var fn = plates[svg.getAttribute('data-plate')];
    if (fn) fn(svg);
  });

  /* ── Apparitions ── */
  var targets = document.querySelectorAll('[data-reveal], svg[data-plate]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    if (hero) hero.classList.add('is-in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () {
      document.documentElement.classList.add('is-ready');
      if (hero) hero.classList.add('is-in');
    });

    /* le plan glisse très légèrement au défilement */
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking || !hero) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        hero.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0) rotate(' + (-8 + y * 0.004).toFixed(2) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }
  if (reduce) document.documentElement.classList.add('is-ready');
})();
