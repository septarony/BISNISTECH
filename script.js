// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.card, .product-card, .ppob-item, .acard, .name-card, .contact-item, .testi-card, .faq-item, .order-step, .mitra-item').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 4) * 0.08 + 's';
  revealObserver.observe(el);
});

// ===== PRODUCT TABS =====
const tabBtns = document.querySelectorAll('.tab-btn');
const productCards = document.querySelectorAll('.product-card');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.dataset.tab;
    productCards.forEach(card => {
      if (card.dataset.category === target) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ===== CONTACT FORM → WHATSAPP =====
const form        = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name    = document.getElementById('name').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const service = document.getElementById('service').value;
  const message = document.getElementById('message').value.trim();

  const serviceMap = {
    elektronik: 'Elektronik & Gadget',
    keamanan:   'Sistem Keamanan',
    ppob:       'PPOB / Pembayaran',
    lainnya:    'Lainnya'
  };
  const serviceLabel = serviceMap[service] || 'Umum';

  const text = `Halo SEPTA \ud83d\udc4b\n\nSaya *${name}*\nNo. WA/HP: ${phone}\nLayanan: ${serviceLabel}\n\nPesan:\n${message || '-'}`;
  const waUrl = `https://wa.me/6282235352270?text=${encodeURIComponent(text)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');

  formSuccess.classList.remove('hidden');
  form.reset();
  setTimeout(() => formSuccess.classList.add('hidden'), 5000);
});

// ===== SMOOTH ACTIVE NAV LINK HIGHLIGHT =====
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}`
          ? 'var(--text-primary)' : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ===== NUMBER COUNTER ANIMATION =====
function animateCounter(el, target, duration = 1600) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.round(start) + (el.dataset.suffix || '');
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const val = parseInt(el.dataset.count, 10);
      animateCounter(el, val);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

// Attach to stat numbers
document.querySelectorAll('.stat-num').forEach(el => {
  const raw = el.textContent.replace(/[^0-9]/g, '');
  if (raw) {
    const suffix = el.textContent.replace(/[0-9]/g, '');
    el.dataset.count  = raw;
    el.dataset.suffix = suffix;
    el.textContent    = '0' + suffix;
    counterObserver.observe(el);
  }
});

// ===== PRELOADER =====
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) setTimeout(() => preloader.classList.add('hide'), 300);
});

// ===== BACK TO TOP =====
const btnTop = document.getElementById('btnTop');
window.addEventListener('scroll', () => {
  if (btnTop) btnTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
if (btnTop) {
  btnTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});
