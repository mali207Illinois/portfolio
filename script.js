const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 35, 280)}ms`;
  revealObserver.observe(item);
});

const cursorGlow = document.querySelector('.cursor-glow');
if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
    cursorGlow.style.opacity = '1';
  });
  document.querySelectorAll('a').forEach((link) => {
    link.addEventListener('mouseenter', () => {
      cursorGlow.style.width = '42px';
      cursorGlow.style.height = '42px';
    });
    link.addEventListener('mouseleave', () => {
      cursorGlow.style.width = '22px';
      cursorGlow.style.height = '22px';
    });
  });
}
