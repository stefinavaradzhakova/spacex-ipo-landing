/* =================================================================
   STARFIELD
   ================================================================= */
(function starfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    seed();
  }

  function seed() {
    const count = Math.floor((w * h) / 6000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.003,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    t += 0.01;
    for (const s of stars) {
      const alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed * 100 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

/* =================================================================
   NAV — switch styling once we leave the dark hero
   ================================================================= */
(function nav() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  const onScroll = () => {
    const passed = window.scrollY > window.innerHeight * 0.85;
    navEl.classList.toggle('scrolled', passed);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =================================================================
   HERO ENTRANCE + SCROLL REVEALS
   ================================================================= */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  /* Top-to-bottom cascade. The order matches the mobile flex column
     (headline → toggle → moon → arrow → cards → CTA) and also reads
     correctly on desktop. */
  tl.from('#badge', { y: 20, opacity: 0, duration: 0.35 })
    .from('.hero-headline', { y: 40, opacity: 0, duration: 0.6 }, '-=0.2')
    .from('.moon-mini-toggle-wrap', { y: 14, opacity: 0, duration: 0.35 }, '-=0.15')
    .from('.moon-3d-container', { scale: 0.78, opacity: 0, duration: 0.65, ease: 'power2.out' }, '-=0.2')
    .from('.moon-rotation-hint', { y: 10, opacity: 0, duration: 0.3 }, '-=0.15')
    .to('.float-card', {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out',
      onComplete: () => {
        document.querySelectorAll('.float-card').forEach((c) => c.classList.add('in-view'));
      },
    }, '-=0.15')
    .from('.moon-cta-wrap > .cta-button', { y: 14, opacity: 0, duration: 0.4, clearProps: 'transform,opacity' }, '-=0.15');

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
});

/* =================================================================
   SEGMENTED LIGHT / DARK TOGGLE
   ================================================================= */
(function segToggle() {
  const stage = document.getElementById('moonStage');
  const toggle = document.getElementById('moonToggle');
  if (!stage || !toggle) return;
  const segs = toggle.querySelectorAll('.seg-btn');

  function setSide(side) {
    const isDark = side === 'dark';
    stage.classList.toggle('is-dark', isDark);
    stage.classList.toggle('is-bright', !isDark);
    segs.forEach((s) => {
      const active = s.dataset.side === side;
      s.classList.toggle('active', active);
      s.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.float-card').forEach((card) => {
      card.style.transition = 'opacity 0.3s ease';
      card.style.opacity = '0.35';
      setTimeout(() => { card.style.opacity = '1'; }, 320);
    });
  }

  segs.forEach((s) => s.addEventListener('click', (e) => {
    e.stopPropagation();
    setSide(s.dataset.side);
  }));

  // Clicking/tapping the Moon itself toggles between the two states.
  const moonHit = document.getElementById('moonContainer');
  if (moonHit) {
    moonHit.addEventListener('click', () => {
      setSide(stage.classList.contains('is-dark') ? 'bright' : 'dark');
    });
  }
})();

/* =================================================================
   STICKY MOBILE CTA
   On mobile (<= 768px) the Register Now button is fixed at the
   viewport bottom WHILE the user scrolls toward it. Once the wrap's
   natural position in the moon-stage comes into view, the button
   releases from sticky and continues to scroll naturally with the page.
   ================================================================= */
(function stickyMobileCta() {
  const wrap = document.querySelector('.moon-cta-wrap');
  if (!wrap) return;
  const mq = window.matchMedia('(max-width: 768px)');

  function check() {
    if (!mq.matches) {
      wrap.classList.remove('is-floating');
      return;
    }
    // We need the wrap's flow-position. While .is-floating is on, the wrap
    // keeps a placeholder height equal to the button height, so its
    // getBoundingClientRect().bottom still reflects the natural in-flow position.
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    // Float while the natural bottom is still below the viewport bottom.
    const naturalBelowViewport = rect.bottom > vh - 8;
    wrap.classList.toggle('is-floating', naturalBelowViewport);
  }

  let pending = false;
  function onScroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; check(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', check);
  if (mq.addEventListener) mq.addEventListener('change', check);
  else if (mq.addListener) mq.addListener(check);

  check();
})();

/* =================================================================
   MOON CLICK CUE — pulsing hand pointer.
   Driven by GSAP (instead of CSS @keyframes) so the pulse runs
   reliably across preview tools and real browsers, and respects
   prefers-reduced-motion.
   ================================================================= */
(function moonClickCuePulse() {
  if (typeof gsap === 'undefined') return;
  const svg = document.querySelector('.moon-click-cue svg');
  if (!svg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.set(svg, { transformOrigin: 'center center', scale: 0.94, opacity: 0.78 });
  gsap.to(svg, {
    scale: 1.06,
    opacity: 1,
    duration: 0.9,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
})();
