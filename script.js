// Nav toggle (mobile)
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
if (toggle) {
  toggle.addEventListener('click', () => links.classList.toggle('active'));
}
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('active'));
});

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step-card, .benefit-card, .result-card, .qualify-card, .comm-feature, .tier, .pricing-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// Stagger animations
document.querySelectorAll('.steps-grid, .results-grid, .deliverables-grid, .qualify-grid, .community-features, .pricing-tiers').forEach(grid => {
  Array.from(grid.children).forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.1}s`;
  });
});

// Newsletter form — submit to Google Sheets
const form = document.getElementById('newsletterForm');
const confirm = document.getElementById('newsletterConfirm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]').value;
    const action = form.getAttribute('action');

    // If placeholder URL, just show confirm
    if (action.includes('PLACEHOLDER')) {
      form.style.display = 'none';
      confirm.style.display = 'block';
      return;
    }

    try {
      await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}`,
        mode: 'no-cors'
      });
      form.style.display = 'none';
      confirm.style.display = 'block';
    } catch (err) {
      form.style.display = 'none';
      confirm.style.display = 'block';
    }
  });
}
