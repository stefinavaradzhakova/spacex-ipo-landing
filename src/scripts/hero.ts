/**
 * Hero animations + interactivity — ported from the static script.js.
 * Runs after page load. GSAP is dynamic-imported so it can be split into its own chunk.
 */

/* ============= STARFIELD — static, one paint per resize ============= */
export function initStarfield() {
  const canvas = document.getElementById('starfield') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function paint() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas!.clientWidth;
    const h = canvas!.clientHeight;
    canvas!.width = w * dpr;
    canvas!.height = h * dpr;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.scale(dpr, dpr);
    ctx!.clearRect(0, 0, w, h);
    const density = w < 700 ? 9000 : 6000;
    const count = Math.floor((w * h) / density);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.3 + 0.2;
      const a = Math.random() * 0.7 + 0.25;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx!.fill();
    }
  }
  paint();
  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(paint, 120);
  });
}

/* ============= NAV scroll styling ============= */
export function initNav() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  const onScroll = () => {
    const passed = window.scrollY > window.innerHeight * 0.85;
    navEl.classList.toggle('scrolled', passed);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============= GSAP hero entrance + scroll reveals =============
   GSAP is heavy (~80 KB parse + execute on slow mobile CPUs). Wait for an
   idle slot before importing — TBT drops significantly. The hero is fully
   readable + interactive without animations, so deferring is safe. */
export function initHeroAnimations() {
  const idle: (cb: () => void) => void =
    (window as any).requestIdleCallback?.bind(window) ||
    ((cb: () => void) => setTimeout(cb, 200));
  idle(() => void runHeroAnimations());
}

async function runHeroAnimations() {
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from(['.hero-headline-stack', '.moon-mini-toggle-wrap'], {
    y: 24,
    opacity: 0,
    duration: 0.55,
    ease: 'power2.out',
  });

  tl.from(
    '.moon-3d-container',
    { scale: 0.92, opacity: 0, duration: 0.6, ease: 'power2.out' },
    '-=0.20',
  );
  tl.from(
    '.moon-rotation-hint',
    { y: 10, opacity: 0, duration: 0.45, ease: 'power2.out' },
    '<',
  );
  tl.to(
    '.float-card',
    {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0,
      ease: 'power2.out',
      onComplete: () => {
        document.querySelectorAll('.float-card').forEach((c) => c.classList.add('in-view'));
      },
    },
    '<',
  );

  gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });

  // Moon click cue pulse — respects prefers-reduced-motion.
  const svg = document.querySelector('.moon-click-cue svg');
  if (svg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(svg, { transformOrigin: 'center center', scale: 0.94, opacity: 0.78 });
    gsap.to(svg, {
      scale: 1.06,
      opacity: 1,
      duration: 0.9,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }
}

/* ============= Bright / Dark toggle ============= */
export function initSegToggle() {
  const stage = document.getElementById('moonStage');
  const toggle = document.getElementById('moonToggle');
  if (!stage || !toggle) return;
  const segs = toggle.querySelectorAll<HTMLButtonElement>('.seg-btn');

  function setSide(side: string) {
    const isDark = side === 'dark';
    stage!.classList.toggle('is-dark', isDark);
    stage!.classList.toggle('is-bright', !isDark);
    segs.forEach((s) => {
      const active = s.dataset.side === side;
      s.classList.toggle('active', active);
      s.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll<HTMLElement>('.float-card').forEach((card) => {
      card.style.transition = 'opacity 0.3s ease';
      card.style.opacity = '0.35';
      setTimeout(() => {
        card.style.opacity = '1';
      }, 320);
    });
  }

  segs.forEach((s) =>
    s.addEventListener('click', (e) => {
      e.stopPropagation();
      setSide(s.dataset.side || 'bright');
    }),
  );

  // Clicking/tapping the Moon itself toggles between bright and dark.
  const moonHit = document.getElementById('moonContainer');
  if (moonHit) {
    moonHit.addEventListener('click', () => {
      setSide(stage.classList.contains('is-dark') ? 'bright' : 'dark');
    });
  }
}

/* ============= Sticky mobile CTA ============= */
export function initStickyMobileCta() {
  const wrap = document.querySelector<HTMLElement>('.moon-cta-wrap');
  if (!wrap) return;
  const mq = window.matchMedia('(max-width: 768px)');

  function check() {
    if (!mq.matches) {
      wrap!.classList.remove('is-floating');
      return;
    }
    const rect = wrap!.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const naturalBelowViewport = rect.bottom > vh - 8;
    wrap!.classList.toggle('is-floating', naturalBelowViewport);
  }

  let pending = false;
  function onScroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      check();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', check);
  if (mq.addEventListener) mq.addEventListener('change', check);
  check();
}
