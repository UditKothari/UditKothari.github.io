// ═══════════════════════════════
// OSCILLOSCOPE CANVAS
// Draws a live ECG/signal trace
// behind the hero
// ═══════════════════════════════
const canvas = document.getElementById('scope');
const ctx    = canvas.getContext('2d');
let W, H, t = 0, raf;

// Circuit node positions (fixed grid)
let nodes = [], traces = [];

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
  buildGrid();
}

function buildGrid() {
  nodes = []; traces = [];
  const cols = Math.ceil(W / 90) + 1;
  const rows = Math.ceil(H / 90) + 1;
  // Place nodes on a snapped grid with minor offset
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
  // Connect nearby nodes with right-angle (circuit) traces
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

// Oscilloscope waveform data
const waves = [
  { amp: 0.06, freq: 1.8, phase: 0,    y: 0.25 },
  { amp: 0.04, freq: 2.6, phase: 1.1,  y: 0.55 },
  { amp: 0.05, freq: 1.2, phase: 0.7,  y: 0.78 },
];

function ekg(x, t) {
  // Generates an ECG-like spike shape
  const pos = ((x / W) + t * 0.12) % 1;
  const base = Math.sin(pos * Math.PI * 2 * 3) * 0.015;
  // Narrow spike
  const spike = Math.exp(-Math.pow((pos % 0.5 - 0.25) * 18, 2)) * 0.9;
  return base + spike;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  t += 0.008;

  const acc = 'rgba(79,140,240,';

  // Draw circuit traces (static grid lines)
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

  // Draw nodes
  for (const n of nodes) {
    n.phase = (n.phase || 0) + 0.014;
    const a = 0.12 + Math.sin(n.phase) * 0.06;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = acc + a + ')';
    ctx.fill();
  }

  // Draw oscilloscope waveforms
  for (const w of waves) {
    const cy = H * w.y;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const ekgVal = ekg(x, t + w.phase);
      const sinVal = Math.sin((x / W) * Math.PI * 2 * w.freq + t * 2 + w.phase) * 0.4;
      const y = cy + (ekgVal + sinVal) * H * w.amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = acc + '0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  raf = requestAnimationFrame(draw);
}

// Fade out canvas on scroll
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  const ratio = Math.min(1, window.scrollY / (hero.offsetHeight * 0.55));
  canvas.style.opacity = String(1 - ratio * 0.92);
}, { passive: true });

window.addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  resize();
  draw();
});
resize();
draw();


// ═══════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════
const revealEls = document.querySelectorAll('.reveal');
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.08 });
revealEls.forEach(el => ro.observe(el));


// ═══════════════════════════════
// NAV active state
// ═══════════════════════════════
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(l => {
      l.style.color = l.getAttribute('href') === '#' + e.target.id
        ? 'rgba(239,239,239,0.9)' : '';
    });
  });
}, { threshold: 0.4 });
sections.forEach(s => so.observe(s));


// ═══════════════════════════════
// CURSOR GLOW
// ═══════════════════════════════
const glow = Object.assign(document.createElement('div'), {
  style: `
    position:fixed;width:360px;height:360px;border-radius:50%;
    background:radial-gradient(circle,rgba(79,140,240,0.045) 0%,transparent 70%);
    pointer-events:none;z-index:0;
    transform:translate(-50%,-50%);
    transition:left .18s ease,top .18s ease;
    will-change:left,top;
  `
});
document.body.appendChild(glow);
window.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top  = e.clientY + 'px';
});
