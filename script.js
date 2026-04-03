/* ============================================================
   MARTY – script.js
   Particle background · Typewriter · Scroll reveal
   Counter animation · Testimonials slider · Nav effects
   ============================================================ */

'use strict';

/* ============================================================
   1. PARTICLE BACKGROUND
   ============================================================ */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H, particles = [], glitters = [], animId;
  let mouseX = -9999, mouseY = -9999;

  /* ---- palette ---- */
  const COLORS = [
    [255, 105, 180],   // hot pink
    [255, 150, 210],   // soft pink
    [200, 100, 255],   // lilac
    [230, 180, 255],   // pale lilac
    [255, 80,  171],   // magenta pink
    [255, 200, 230],   // blush
    [255, 220, 120],   // gold shimmer
    [180, 230, 255],   // ice blue accent
  ];

  const SHAPES = ['circle', 'star', 'diamond', 'heart', 'circle', 'circle']; // circles more common

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rnd(a, b)   { return a + Math.random() * (b - a); }
  function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
  function rndColor()  { return COLORS[rndInt(0, COLORS.length - 1)]; }

  /* ---- regular drifting particles ---- */
  function makeParticle(fromTop = false) {
    const [r, g, b] = rndColor();
    const size = rnd(2.5, 9);
    return {
      x:       rnd(0, W),
      y:       fromTop ? rnd(-40, -5) : rnd(-H, H),
      r:       size,
      baseR:   size,
      vx:      rnd(-0.6, 0.6),
      vy:      rnd(0.4, 1.6),
      rgb:     [r, g, b],
      alpha:   rnd(0.35, 1.0),
      fadeRate: rnd(0.0006, 0.0022),
      shape:   SHAPES[rndInt(0, SHAPES.length - 1)],
      spin:    rnd(-0.05, 0.05),
      angle:   rnd(0, Math.PI * 2),
      // twinkle
      twinkleSpeed: rnd(0.02, 0.07),
      twinklePhase: rnd(0, Math.PI * 2),
      // mouse repel state
      vxBoost: 0,
      vyBoost: 0,
    };
  }

  /* ---- glitter sparks: tiny bright flashes ---- */
  function makeGlitter() {
    const [r, g, b] = rndColor();
    return {
      x:     rnd(0, W),
      y:     rnd(0, H),
      r:     rnd(1, 3.5),
      alpha: 0,
      peak:  rnd(0.6, 1.0),
      speed: rnd(0.025, 0.06),
      phase: 0,  // 0=fade in, 1=fade out
      rgb:   [r, g, b],
    };
  }

  /* ---- draw helpers ---- */
  function drawStar(x, y, r, angle) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.4;
      const a   = (i * Math.PI) / 5 + angle;
      i === 0 ? ctx.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a))
              : ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
    }
    ctx.closePath();
  }

  function drawDiamond(x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.3);
    ctx.lineTo(r * 0.7, 0);
    ctx.lineTo(0, r * 1.3);
    ctx.lineTo(-r * 0.7, 0);
    ctx.closePath();
    ctx.restore();
  }

  function drawHeart(x, y, r, angle) {
    const s = r * 0.95;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.bezierCurveTo(-s, -s * 0.2, -s * 1.6, s * 0.8, 0, s * 1.4);
    ctx.bezierCurveTo(s * 1.6,  s * 0.8,  s, -s * 0.2, 0, s * 0.4);
    ctx.closePath();
    ctx.restore();
  }

  function drawCrossSparkle(x, y, r, alpha, rgb) {
    // 4-point starburst for glitter
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grad.addColorStop(0,   `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.3, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.8})`);
    grad.addColorStop(1,   `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = grad;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.25, r * 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // centre dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function renderParticle(p) {
    // twinkle: modulate alpha
    const twinkle = 0.7 + 0.3 * Math.sin(p.twinklePhase);
    const a = Math.min(p.alpha * twinkle, 1);
    const [r, g, b] = p.rgb;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle   = `rgba(${r},${g},${b},${a})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
    ctx.shadowBlur  = p.r * 2.5;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'star') {
      drawStar(p.x, p.y, p.r * 1.5, p.angle);
      ctx.fill();
    } else if (p.shape === 'diamond') {
      drawDiamond(p.x, p.y, p.r, p.angle);
      ctx.fill();
    } else if (p.shape === 'heart') {
      drawHeart(p.x, p.y, p.r, p.angle);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- init ---- */
  function init() {
    resize();
    const count = Math.min(Math.floor((W * H) / 5500), 200);
    particles = Array.from({ length: count }, () => makeParticle(false));

    const gCount = Math.min(Math.floor((W * H) / 8000), 80);
    glitters = Array.from({ length: gCount }, makeGlitter);
  }

  /* ---- mouse repel ---- */
  const REPEL_RADIUS = 120;
  const REPEL_FORCE  = 3.5;
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  /* ---- tick ---- */
  function tick() {
    ctx.clearRect(0, 0, W, H);

    /* glitter flashes */
    for (const g of glitters) {
      if (g.phase === 0) {
        g.alpha += g.speed;
        if (g.alpha >= g.peak) { g.alpha = g.peak; g.phase = 1; }
      } else {
        g.alpha -= g.speed * 0.7;
        if (g.alpha <= 0) {
          // reposition
          Object.assign(g, makeGlitter());
        }
      }
      drawCrossSparkle(g.x, g.y, g.r, g.alpha, g.rgb);
    }

    /* drifting particles */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // mouse repel
      const dx   = p.x - mouseX;
      const dy   = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE;
        p.vxBoost += (dx / dist) * force * 0.18;
        p.vyBoost += (dy / dist) * force * 0.18;
      }
      // dampen boost
      p.vxBoost *= 0.88;
      p.vyBoost *= 0.88;

      p.x    += p.vx + p.vxBoost;
      p.y    += p.vy + p.vyBoost;
      p.angle += p.spin;
      p.twinklePhase += p.twinkleSpeed;
      p.alpha -= p.fadeRate;

      if (p.alpha <= 0 || p.y > H + 40 || p.x < -40 || p.x > W + 40) {
        particles[i] = makeParticle(true);
      } else {
        renderParticle(p);
      }
    }

    animId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    init();
    tick();
  });

  init();
  tick();
})();


/* ============================================================
   2. NAVBAR – scroll effect + mobile toggle
   ============================================================ */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const toggle    = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const allLinks  = navLinks.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Close on link click (mobile)
  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // Active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        allLinks.forEach(a => a.classList.remove('active-link'));
        const active = navLinks.querySelector(`a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active-link');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
})();


/* ============================================================
   3. TYPEWRITER EFFECT
   ============================================================ */
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  const phrases = [
    'Diplomás angoltanár 📚',
    'Érettségi & nyelvvizsga felkészítő ✏️',
    'Személyre szabott oktatás 💡',
    'Online & személyes órák 💻'
  ];
  let phraseIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }

    setTimeout(type, deleting ? 42 : 68);
  }

  setTimeout(type, 800);
})();


/* ============================================================
   4. SCROLL REVEAL
   ============================================================ */
(function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire once
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
})();


/* ============================================================
   5. COUNTER ANIMATION (hero stats)
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-num[data-target]');
  const duration = 1800;

  function animateCounter(el) {
    const target = +el.dataset.target;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();


/* ============================================================
   6. TESTIMONIALS SLIDER (drag + dots)
   ============================================================ */
(function initTestimonials() {
  const track     = document.getElementById('testimonialsTrack');
  const dotsWrap  = document.getElementById('testimonialDots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let startX  = 0, isDragging = false, startOffset = 0;

  // Build dots
  for (let i = 0; i < total; i++) {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `${i + 1}. vélemény`);
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  }

  function getOffset(idx) {
    const card = cards[idx];
    const gap = 24; // 1.5rem
    return Array.from(cards).slice(0, idx)
      .reduce((acc, c) => acc + c.offsetWidth + gap, 0);
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, total - 1));
    track.style.transform = `translateX(-${getOffset(current)}px)`;
    dotsWrap.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // Auto-play
  let autoTimer = setInterval(() => goTo((current + 1) % total), 4500);

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo((current + 1) % total), 4500);
  }

  // Drag / swipe
  track.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; startOffset = getOffset(current); e.preventDefault(); });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = startX - e.clientX;
    track.style.transform = `translateX(-${startOffset + dx}px)`;
  });
  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = startX - e.clientX;
    if (Math.abs(dx) > 60) goTo(dx > 0 ? current + 1 : current - 1);
    else goTo(current);
    resetAuto();
  });

  // Touch
  track.addEventListener('touchstart', e => { isDragging = true; startX = e.touches[0].clientX; startOffset = getOffset(current); }, { passive: true });
  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = startX - e.touches[0].clientX;
    track.style.transform = `translateX(-${startOffset + dx}px)`;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) goTo(dx > 0 ? current + 1 : current - 1);
    else goTo(current);
    resetAuto();
  });
})();


/* ============================================================
   7. CONTACT FORM – validation + submit handler
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  /* --- helpers --- */
  function getField(id) { return form.querySelector('#' + id); }

  function setError(field, msg) {
    const group = field.closest('.form-group');
    field.classList.add('input-error');
    let err = group.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      group.appendChild(err);
    }
    err.textContent = msg;
  }

  function clearError(field) {
    const group = field.closest('.form-group');
    field.classList.remove('input-error');
    const err = group.querySelector('.field-error');
    if (err) err.remove();
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function validate() {
    let ok = true;

    const name  = getField('name');
    const email = getField('email');
    const msg   = getField('message');

    clearError(name);
    clearError(email);
    clearError(msg);

    if (!name.value.trim()) {
      setError(name, 'Kérlek, add meg a neved! 🌸');
      ok = false;
    }
    if (!email.value.trim()) {
      setError(email, 'Kérlek, add meg az e-mail címed! 📧');
      ok = false;
    } else if (!isValidEmail(email.value)) {
      setError(email, 'Úgy tűnik, ez nem érvényes e-mail cím.');
      ok = false;
    }
    if (!msg.value.trim()) {
      setError(msg, 'Írj egy rövid üzenetet! 💬');
      ok = false;
    }

    return ok;
  }

  /* clear errors on input */
  ['name', 'email', 'message'].forEach(id => {
    const f = getField(id);
    if (f) f.addEventListener('input', () => clearError(f));
  });

  /* shake animation on invalid submit */
  function shake() {
    form.classList.remove('form-shake');
    void form.offsetWidth; // reflow to restart animation
    form.classList.add('form-shake');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!validate()) {
      shake();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Küldés…';
    btn.disabled = true;

    try {
      const response = await fetch('https://formspree.io/f/xaqlpnzl', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });

      if (response.ok) {
        form.innerHTML = `
          <div class="form-success show">
            <div class="success-icon">🎉</div>
            <h3>Üzeneted megérkezett!</h3>
            <p>Köszönöm, hogy felvetted velem a kapcsolatot! 💕<br>
               Általában 24 órán belül válaszolok – addig is sok sikert a tanuláshoz! ✨</p>
          </div>`;
      } else {
        // Formspree returned an error
        btn.textContent = 'Elküldöm 💌';
        btn.disabled = false;
        const err = form.querySelector('.submit-error') || document.createElement('p');
        err.className = 'submit-error';
        err.textContent = 'Valami hiba történt. Kérlek, próbáld újra, vagy írj e-mailt közvetlenül! 💌';
        form.insertBefore(err, btn.parentNode ?? btn);
      }
    } catch {
      btn.textContent = 'Elküldöm 💌';
      btn.disabled = false;
      const err = form.querySelector('.submit-error') || document.createElement('p');
      err.className = 'submit-error';
      err.textContent = 'Nem sikerült csatlakozni. Ellenőrizd az internetkapcsolatod! 🌐';
      form.appendChild(err);
    }
  });
})();


/* ============================================================
   8. SPARKLE CURSOR (desktop only)
   ============================================================ */
(function initSparkle() {
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(container);

  const SPARKLE_COLORS = ['#ff80c3','#a855f7','#ffb3da','#fff59d','#b8f7e4'];
  let throttle = false;

  document.addEventListener('mousemove', e => {
    if (throttle) return;
    throttle = true;
    setTimeout(() => throttle = false, 40);

    for (let i = 0; i < 3; i++) {
      const spark = document.createElement('span');
      const size  = 6 + Math.random() * 8;
      const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
      const angle = Math.random() * 360;
      const dist  = 20 + Math.random() * 30;
      const tx    = Math.cos(angle * Math.PI / 180) * dist;
      const ty    = Math.sin(angle * Math.PI / 180) * dist;

      spark.style.cssText = `
        position:absolute;
        left:${e.clientX - size / 2}px;
        top:${e.clientY - size / 2}px;
        width:${size}px;
        height:${size}px;
        background:${color};
        border-radius:50%;
        pointer-events:none;
        transition:transform 0.7s ease,opacity 0.7s ease;
        opacity:0.9;
      `;
      container.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.transform = `translate(${tx}px,${ty}px) scale(0)`;
        spark.style.opacity   = '0';
      });

      setTimeout(() => spark.remove(), 750);
    }
  });
})();


/* ============================================================
   9. SMOOTH ANCHOR SCROLL (backup for older browsers)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = document.getElementById('navbar').offsetHeight;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
  });
});


/* ============================================================
   10. STAGGERED SECTION ENTER (for cards inside revealed sections)
   ============================================================ */
(function initStagger() {
  const groups = document.querySelectorAll('.services-grid, .why-grid, .about-cards');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = entry.target.querySelectorAll('.glass-card, .why-item, .about-card');
      children.forEach((child, i) => {
        setTimeout(() => {
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        }, i * 100);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  groups.forEach(g => {
    const children = g.querySelectorAll('.glass-card, .why-item, .about-card');
    children.forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(32px)';
      c.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    observer.observe(g);
  });
})();
