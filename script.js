/* =====================================================
   EMBER & BEAN — OPTIMIZED JS v2
   GPU cursor · Lenis scroll · GSAP · Performance
===================================================== */
'use strict';

/* ====================================================
   LOADING SCREEN
==================================================== */
window.addEventListener('load', () => {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;
  setTimeout(() => {
    ls.classList.add('hidden');
    triggerHeroAnimations();
  }, 2300);
});

/* ====================================================
   LENIS SMOOTH SCROLL (if available)
==================================================== */
let lenis = null;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
    touchMultiplier: 1.8,
  });
  (function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  })(0);
}

/* ====================================================
   CURSOR — GPU-ACCELERATED (no layout thrash)
==================================================== */
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

// Start off-screen
let mx = -200, my = -200;
let rx = -200, ry = -200;

// Track mouse (passive for perf)
document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
}, { passive: true });

// Single RAF loop — both elements in one frame
(function tickCursor() {
  // Dot: immediate snap, no lerp
  if (cursorDot) {
    cursorDot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
  }
  // Ring: smooth lerp follow
  if (cursorRing) {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    cursorRing.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
  }
  requestAnimationFrame(tickCursor);
})();

// Hover states — event delegation (faster than per-element listeners)
document.addEventListener('mouseover', e => {
  const el = e.target;
  if (el.closest('button, a, input, [role="button"]')) {
    document.body.classList.add('cursor-hover');
  }
  if (el.closest('a')) document.body.classList.add('cursor-link');
}, { passive: true });

document.addEventListener('mouseout', e => {
  const el = e.target;
  if (el.closest('button, a, input, [role="button"]')) {
    document.body.classList.remove('cursor-hover', 'cursor-link');
  }
}, { passive: true });

/* ====================================================
   SCROLL PROGRESS BAR
==================================================== */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

window.addEventListener('scroll', () => {
  const pct = document.documentElement.scrollTop /
    (document.documentElement.scrollHeight - window.innerHeight);
  progressBar.style.transform = `scaleX(${pct})`;
}, { passive: true });

/* ====================================================
   NAVIGATION
==================================================== */
const nav        = document.getElementById('nav');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

hamburger?.addEventListener('click', () => {
  const open = hamburger.classList.toggle('active');
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu?.classList.toggle('open', open);
  mobileMenu?.setAttribute('aria-hidden', String(!open));
});

document.querySelectorAll('.mob-link, .mob-order').forEach(l => {
  l.addEventListener('click', () => {
    hamburger?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  });
});

// Active nav highlight
const allSections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const offset = window.scrollY + 120;
  allSections.forEach(sec => {
    if (offset >= sec.offsetTop && offset < sec.offsetTop + sec.offsetHeight) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav-link[href="#${sec.id}"]`)?.classList.add('active');
    }
  });
}, { passive: true });

/* ====================================================
   STEAM CANVAS — optimised particles
==================================================== */
const canvas = document.getElementById('steam-canvas');
const ctx    = canvas ? canvas.getContext('2d', { alpha: true }) : null;
let particles  = [];

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

class Particle {
  constructor(startedMid = false) { this.init(startedMid); }
  init(mid = false) {
    const w = canvas?.width  || 800;
    const h = canvas?.height || 600;
    this.x      = Math.random() * w;
    this.y      = mid ? Math.random() * h : h + 8;
    this.vx     = (Math.random() - 0.5) * 0.35;
    this.vy     = -(Math.random() * 0.7 + 0.15);
    this.r      = Math.random() * 2.5 + 0.8;
    this.alpha  = Math.random() * 0.1 + 0.02;
    this.decay  = 0.0005 + Math.random() * 0.001;
    this.wobble = Math.random() * Math.PI * 2;
  }
  update() {
    this.wobble += 0.018;
    this.x      += this.vx + Math.sin(this.wobble) * 0.22;
    this.y      += this.vy;
    this.r      += 0.008;
    this.alpha  -= this.decay;
    if (this.alpha <= 0) this.init(false);
  }
  draw() {
    if (!ctx) return;
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

if (canvas) {
  resizeCanvas();
  // Spawn 36 particles, some already mid-flight
  particles = Array.from({ length: 36 }, (_, i) => new Particle(i < 20));

  let lastTime = 0;
  (function drawLoop(ts) {
    // Cap at ~60fps
    if (ts - lastTime >= 16) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      particles.forEach(p => { p.update(); p.draw(); });
      ctx.restore();
      lastTime = ts;
    }
    requestAnimationFrame(drawLoop);
  })(0);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 200);
  }, { passive: true });
}

/* ====================================================
   HERO ENTRANCE ANIMATIONS (GSAP timeline)
==================================================== */
function triggerHeroAnimations() {
  const items = ['#hero-badge','#hero-headline','#hero-desc','#hero-btns','#hero-special-card'];

  if (typeof gsap === 'undefined') {
    // Plain CSS fallback
    items.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    return;
  }

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('#hero-badge',        { opacity:1, y:0, duration:0.75 }, 0.05)
    .to('#hero-headline',     { opacity:1, y:0, duration:0.95 }, 0.2)
    .to('#hero-desc',         { opacity:1, y:0, duration:0.75 }, 0.42)
    .to('#hero-btns',         { opacity:1, y:0, duration:0.75 }, 0.58)
    .to('#hero-special-card', { opacity:1, x:0, duration:0.8  }, 0.72);
}

/* ====================================================
   GSAP SCROLL ANIMATIONS
==================================================== */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with ScrollTrigger
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
  }

  // Left / Right reveals
  gsap.utils.toArray('.js-reveal-left').forEach(el => {
    gsap.to(el, {
      x: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
  gsap.utils.toArray('.js-reveal-right').forEach(el => {
    gsap.to(el, {
      x: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  // Stagger groups — batch by parent
  const parents = new Set();
  document.querySelectorAll('.js-stagger').forEach(el => parents.add(el.parentElement));
  parents.forEach(parent => {
    gsap.to(parent.querySelectorAll('.js-stagger'), {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: parent, start: 'top 85%', once: true }
    });
  });

  // Subtle parallax on hero image only
  gsap.to('.hero-bg-img', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });

  // Section headings fade+rise
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 22, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 91%', once: true }
    });
  });
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 10, duration: 0.5,
      scrollTrigger: { trigger: el, start: 'top 93%', once: true }
    });
  });
});

/* ====================================================
   MAGNETIC BUTTONS
==================================================== */
function applyMagnetic(btn) {
  if (!btn) return;
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    btn.style.transform = `translate3d(${dx * 0.28}px,${dy * 0.28}px,0)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });
}
document.querySelectorAll('.magnetic-btn').forEach(applyMagnetic);

/* ====================================================
   3D TILT CARDS (bean cards)
==================================================== */
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width  - 0.5;
    const dy = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform =
      `perspective(900px) rotateX(${-dy * 8}deg) rotateY(${dx * 10}deg) scale3d(1.02,1.02,1.02)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ====================================================
   DRINK CARD SUBTLE TILT
==================================================== */
document.querySelectorAll('.drink-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width  - 0.5;
    const dy = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform =
      `translateY(-8px) perspective(800px) rotateX(${-dy * 4}deg) rotateY(${dx * 5}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ====================================================
   STATS COUNTER
==================================================== */
function animateCount(el) {
  const target = +el.dataset.count;
  const t0     = performance.now();
  const dur    = 1600;
  (function step(now) {
    const pct  = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - pct, 3);   // ease-out-cubic
    el.textContent = Math.floor(ease * target);
    if (pct < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(t0);
}

const statSection = document.querySelector('.about-stats');
if (statSection) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-num').forEach(animateCount);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 }).observe(statSection);
}

/* ====================================================
   BREWING CARDS
==================================================== */
document.querySelectorAll('.bc-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.brewing-card');
    const open = card.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.innerHTML = open
      ? 'Close <i class="fa-solid fa-chevron-up" aria-hidden="true"></i>'
      : 'Details <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
  });
});

/* ====================================================
   MENU TABS
==================================================== */
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
  });
});

/* ====================================================
   FAQ ACCORDION
==================================================== */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling?.classList.remove('open');
    });
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling?.classList.add('open');
    }
  });
});

/* ====================================================
   SWIPER REVIEWS
==================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Swiper === 'undefined') return;
  new Swiper('.reviews-swiper', {
    slidesPerView:  1,
    spaceBetween:   24,
    loop:           true,
    speed:          650,
    autoplay:       { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
    pagination:     { el: '.swiper-pagination', clickable: true },
    breakpoints:    { 900: { slidesPerView: 2 } },
  });
});

/* ====================================================
   GALLERY DRAG SCROLL
==================================================== */
const galleryWrap = document.getElementById('gallery-scroll-wrap');
if (galleryWrap) {
  let isDown = false, startX = 0, scrollLeft = 0;
  const start = e => {
    isDown = true;
    galleryWrap.classList.add('dragging');
    startX = (e.pageX ?? e.touches?.[0]?.pageX ?? 0) - galleryWrap.offsetLeft;
    scrollLeft = galleryWrap.scrollLeft;
  };
  const stop  = () => { isDown = false; galleryWrap.classList.remove('dragging'); };
  const move  = e => {
    if (!isDown) return;
    e.preventDefault?.();
    const x = (e.pageX ?? e.touches?.[0]?.pageX ?? 0) - galleryWrap.offsetLeft;
    galleryWrap.scrollLeft = scrollLeft - (x - startX) * 1.6;
  };
  galleryWrap.addEventListener('mousedown',  start);
  galleryWrap.addEventListener('touchstart', start, { passive: true });
  galleryWrap.addEventListener('mouseleave', stop);
  galleryWrap.addEventListener('mouseup',    stop);
  galleryWrap.addEventListener('touchend',   stop);
  galleryWrap.addEventListener('mousemove',  move);
  galleryWrap.addEventListener('touchmove',  move, { passive: false });
}

/* ====================================================
   COFFEE QUIZ
==================================================== */
const answers = {};
const quizResultMap = {
  'bold_focus_intense':   { name:'Double Espresso',      desc:'No-nonsense, pure intensity. A double shot of our finest single origin gives you the clarity and energy to create brilliance.' },
  'smooth_cozy_fruity':   { name:'Ethiopian Pour Over',  desc:'Peaceful, floral and complex. Our Ethiopian Heirloom slow pour over is made for quiet mornings and thoughtful moments.' },
  'sweet_social_nutty':   { name:'Caramel Latte',        desc:'Warm, sweet and always crowd-pleasing. Our signature caramel latte is smooth, indulgent, and utterly delightful.' },
  'bold_social_nutty':    { name:'Colombian Flat White', desc:'Bold espresso meets silky micro-foam. The Colombian Supremo flat white is powerful yet perfectly smooth.' },
  'smooth_focus_intense': { name:'Cold Brew',            desc:'Calm concentration in a glass. 18-hour cold brew is silky, low-acid, and keeps you focused without jitters.' },
  'sweet_cozy_fruity':    { name:'Matcha Latte',         desc:'Calm, sweet and earthy. Our ceremonial matcha latte is the perfect gentle companion for slow, cozy mornings.' },
  'bold_social_fruity':   { name:'Kenyan AA Pour Over',  desc:'Complex, bold and full of life. The Kenyan AA is for those who want their coffee to surprise them every single sip.' },
};

function showQuizStep(id) {
  document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`qs-${id}`)?.classList.add('active');
}

document.querySelectorAll('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = btn.closest('.quiz-step').id.replace('qs-', '');
    answers[step] = btn.dataset.val;
    const next    = btn.dataset.next;
    if (next === 'result') {
      const key = `${answers[1]}_${answers[2]}_${answers[3]}`;
      const res = quizResultMap[key] || { name:'Kenyan AA Pour Over', desc:'Complex and bold — coffee that reveals something new with every sip. The curious coffee lover\'s perfect match.' };
      document.getElementById('quiz-result-name').textContent = res.name;
      document.getElementById('quiz-result-desc').textContent = res.desc;
      showQuizStep('result');
    } else {
      showQuizStep(next);
    }
  });
});

document.getElementById('quiz-restart-btn')?.addEventListener('click', () => {
  Object.keys(answers).forEach(k => delete answers[k]);
  showQuizStep('1');
});

/* ====================================================
   NEWSLETTER
==================================================== */
document.getElementById('nl-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = document.getElementById('nl-submit');
  const inp = document.getElementById('nl-email');
  if (!inp.value.trim()) return;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> You\'re in!';
  btn.style.background = '#5a7a5a';
  btn.disabled = true;
  inp.value = '';
  setTimeout(() => {
    btn.innerHTML = 'Subscribe <i class="fa-solid fa-paper-plane"></i>';
    btn.style.background = '';
    btn.disabled = false;
  }, 3500);
});

/* ====================================================
   QUICK VIEW MODAL
==================================================== */
const beanData = [
  { name:'Ethiopian Heirloom', origin:'🇪🇹 Ethiopia · Yirgacheffe', roast:'Light Roast',   price:'$22 / 250g', desc:'Natural-processed Heirloom cultivar with extraordinary floral complexity. Blueberry jam, jasmine blossom, and a silky wine-like finish that lingers beautifully.', img:'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name:'Colombian Supremo',  origin:'🇨🇴 Colombia · Huila',       roast:'Medium Roast',  price:'$19 / 250g', desc:'From the lush Huila mountains. Smooth caramel sweetness, a hint of red apple, and warm hazelnut notes. The perfect everyday crowd-pleaser.', img:'https://images.pexels.com/photos/2523645/pexels-photo-2523645.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name:'Brazilian Santos',   origin:'🇧🇷 Brazil · Cerrado',        roast:'Dark Roast',    price:'$17 / 250g', desc:'Classic Brazilian natural from the Cerrado savanna. Deep dark chocolate, roasted walnut, and a smooth, low-acid finish perfect for espresso.', img:'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name:'Kenyan AA',          origin:'🇰🇪 Kenya · Nyeri',           roast:'Medium-Light',  price:'$24 / 250g', desc:'Kenya\'s finest AA-grade beans. Bold blackcurrant, ripe tomato, and bright citrus zest with a full, juicy body and complex finish that evolves as it cools.', img:'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

const modalOverlay  = document.getElementById('modal-overlay');
const modalContentEl = document.getElementById('modal-content');

function openModal(i) {
  const b = beanData[i];
  if (!b || !modalContentEl) return;
  modalContentEl.innerHTML = `
    <img src="${b.img}" alt="${b.name}" style="width:100%;height:260px;object-fit:cover;display:block;">
    <div class="modal-body-text">
      <span class="modal-origin">${b.origin} · ${b.roast}</span>
      <h3 id="modal-title">${b.name}</h3>
      <p>${b.desc}</p>
      <div class="modal-price">${b.price}</div>
      <button class="btn-primary magnetic-btn" style="width:100%;justify-content:center;">Add to Cart <i class="fa-solid fa-bag-shopping"></i></button>
    </div>`;
  modalContentEl.querySelectorAll('.magnetic-btn').forEach(applyMagnetic);
  modalOverlay.classList.add('active');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay?.classList.remove('active');
  modalOverlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.btn-quick-view').forEach(btn => {
  btn.addEventListener('click', () => openModal(+btn.dataset.bean));
});
document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ====================================================
   ADD TO CART — micro-animation
==================================================== */
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.style.background = '#5a7a5a';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
      btn.style.background = '';
    }, 1500);
  });
});

/* ====================================================
   SMOOTH ANCHOR SCROLL
==================================================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href   = a.getAttribute('href');
    const target = href !== '#' && document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    if (lenis) {
      lenis.scrollTo(top, { duration: 1.2 });
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ====================================================
   LAZY IMAGE FADE-IN (IntersectionObserver)
==================================================== */
const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
lazyImgs.forEach(img => {
  img.style.opacity  = '0';
  img.style.transform = 'translateY(10px)';
  img.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
});
new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity  = '1';
      e.target.style.transform = 'translateY(0)';
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })
  .observe = (() => {
    const orig = IntersectionObserver.prototype.observe;
    // Re-apply on each lazy image individually
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity  = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    lazyImgs.forEach(img => io.observe(img));
    return orig;
  })();

/* ====================================================
   ROAST BAR ANIMATION
==================================================== */
const beansGrid = document.querySelector('.beans-grid');
if (beansGrid) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.roast-fill').forEach(bar => {
          const target = bar.style.width;
          bar.style.width = '0';
          // Force reflow then animate
          requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = target; }));
        });
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 }).observe(beansGrid);
}

/* ====================================================
   CONSOLE BRANDING
==================================================== */
console.log(
  '%c☕ EMBER & BEAN%c — Crafted Slowly. Savored Deeply.',
  'color:#B8865B;font-size:17px;font-weight:bold;font-family:Georgia,serif;',
  'color:#5A3E2B;font-size:12px;font-family:sans-serif;'
);
