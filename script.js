/* Oscilloscope-style circuit traces and waveforms */
function setupScope(ctx, canvas) {
  let W, H, t = 0;
  let frame = null;
  let visible = true;
  let paused = false;
  let nodes = [], traces = [];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildGrid();
  }

  function buildGrid() {
    nodes = []; traces = [];
    const cols = Math.ceil(W / 90) + 1;
    const rows = Math.ceil(H / 90) + 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.55) {
          nodes.push({
            x: c * 90 + (Math.random() < 0.5 ? 0 : 22),
            y: r * 90 + (Math.random() < 0.5 ? 0 : 22),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = Math.abs(nodes[i].x - nodes[j].x);
        const dy = Math.abs(nodes[i].y - nodes[j].y);
        if ((dx < 100 && dy < 8) || (dy < 100 && dx < 8)) {
          traces.push({
            x1: nodes[i].x, y1: nodes[i].y,
            x2: nodes[j].x, y2: nodes[j].y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.004 + Math.random() * 0.005,
            active: Math.random() > 0.35,
          });
        }
      }
    }
  }

  const waves = [
    { amp: 0.06, freq: 1.8, phase: 0,   y: 0.25 },
    { amp: 0.04, freq: 2.6, phase: 1.1, y: 0.55 },
    { amp: 0.05, freq: 1.2, phase: 0.7, y: 0.78 },
  ];

  function ekg(x, t) {
    const pos = ((x / W) + t * 0.12) % 1;
    const base = Math.sin(pos * Math.PI * 2 * 3) * 0.015;
    const spike = Math.exp(-Math.pow((pos % 0.5 - 0.25) * 18, 2)) * 0.9;
    return base + spike;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;
    const acc = 'rgba(79,140,240,';

    for (const tr of traces) {
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = acc + '0.055)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      if (tr.active) {
        tr.phase += tr.speed;
        const p  = (Math.sin(tr.phase) + 1) / 2;
        const px = tr.x1 + (tr.x2 - tr.x1) * p;
        const py = tr.y1 + (tr.y2 - tr.y1) * p;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = acc + '0.55)';
        ctx.fill();
      }
    }

    for (const n of nodes) {
      n.phase = (n.phase || 0) + 0.014;
      const a = 0.12 + Math.sin(n.phase) * 0.06;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = acc + a + ')';
      ctx.fill();
    }

    for (const w of waves) {
      const cy = H * w.y;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const ekgVal = ekg(x, t + w.phase);
        const sinVal = Math.sin((x / W) * Math.PI * 2 * w.freq + t * 2 + w.phase) * 0.4;
        const y = cy + (ekgVal + sinVal) * H * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = acc + '0.34)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

  }


  const hero = canvas.closest('.hero');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');

  function animate() {
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (visible && !document.hidden && !paused && !reducedMotion.matches) {
      frame = requestAnimationFrame(animate);
    }
  }

  function updateFade() {
    const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / (hero.offsetHeight * 0.65)));
    canvas.style.opacity = String(1 - progress * 0.92);
  }

  function renderStaticFrame() {
    resize();
    draw();
  }

  toggle.hidden = false;
  document.body.classList.add("motion-ready");
  toggle.addEventListener('click', () => {
    paused = !paused;
    document.body.classList.toggle('motion-paused', paused);
    toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('resize', renderStaticFrame);
  window.addEventListener('scroll', updateFade, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncMotion();
    }).observe(hero);
  }

  renderStaticFrame();
  updateFade();
  syncMotion();
}

const scope = document.querySelector('#scope');
const context = scope.getContext('2d');
if (context) setupScope(context, scope);

if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('on');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => reveal.observe(element));

  const links = document.querySelectorAll('.nav-links a');
  const activeSection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const link = Array.from(links).find(item => item.hash === '#' + entry.target.id);
      if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-20% 0px -60% 0px' });
  links.forEach(link => activeSection.observe(document.querySelector(link.hash)));
}

const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const glow = document.createElement('div');
glow.className = 'cursor-glow';
glow.setAttribute('aria-hidden', 'true');
glow.hidden = true;
document.body.append(glow);

window.addEventListener('pointermove', event => {
  glow.hidden = !finePointer.matches || reducedMotion.matches || document.body.classList.contains('motion-paused');
  if (glow.hidden) return;
  glow.style.left = event.clientX + 'px';
  glow.style.top = event.clientY + 'px';
});
document.documentElement.addEventListener('pointerleave', () => { glow.hidden = true; });
document.querySelector('.motion-toggle').addEventListener('click', () => { glow.hidden = true; });
reducedMotion.addEventListener('change', () => { glow.hidden = true; });
