// ===========================
// CANVAS — particle field with circuit traces
// ===========================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, particles, connections, raf;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
  build();
}

function build() {
  const count = Math.floor((W * H) / 14000);
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - .5) * .18,
    vy: (Math.random() - .5) * .18,
    r: .8 + Math.random() * 1.2,
    pulse: Math.random() * Math.PI * 2,
  }));
  connections = [];
}

function tick() {
  ctx.clearRect(0, 0, W, H);
  connections = [];

  // move + wrap
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.pulse += .012;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
  }

  // find connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 130) connections.push([i, j, d]);
    }
  }

  // draw lines
  for (const [i, j, d] of connections) {
    const a = (1 - d / 130) * 0.12;
    ctx.beginPath();
    ctx.moveTo(particles[i].x, particles[i].y);
    ctx.lineTo(particles[j].x, particles[j].y);
    ctx.strokeStyle = `rgba(91,155,248,${a})`;
    ctx.lineWidth = .6;
    ctx.stroke();
  }

  // draw dots
  for (const p of particles) {
    const alpha = 0.15 + Math.sin(p.pulse) * 0.08;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(91,155,248,${alpha})`;
    ctx.fill();
  }

  raf = requestAnimationFrame(tick);
}

window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); tick(); });
resize();
tick();

// Fade canvas out as user scrolls past hero
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  const ratio = Math.min(1, window.scrollY / (hero.offsetHeight * 0.6));
  canvas.style.opacity = (1 - ratio) * 0.9;
}, { passive: true });


// ===========================
// SCROLL REVEAL
// ===========================
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
revealEls.forEach(el => revealObserver.observe(el));


// ===========================
// NAV — active link highlight
// ===========================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.style.color = '');
      const match = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (match) match.style.color = 'rgba(237,237,237,0.9)';
    }
  });
}, { threshold: 0.35 });
sections.forEach(s => sectionObs.observe(s));


// ===========================
// CURSOR GLOW
// ===========================
const glow = document.createElement('div');
glow.style.cssText = `
  position:fixed; width:400px; height:400px; border-radius:50%;
  background:radial-gradient(circle, rgba(91,155,248,0.035) 0%, transparent 70%);
  pointer-events:none; z-index:0;
  transform:translate(-50%,-50%);
  transition:left .15s ease, top .15s ease;
  will-change:left,top;
`;
document.body.appendChild(glow);
document.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top  = e.clientY + 'px';
});
