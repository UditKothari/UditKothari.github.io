// ═══════════════════════════════
// OSCILLOSCOPE CANVAS (hero)
// ═══════════════════════════════
const canvas = document.getElementById('scope');
const ctx    = canvas.getContext('2d');
let W, H, t = 0, raf;
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

function drawScope() {
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
    ctx.strokeStyle = acc + '0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  raf = requestAnimationFrame(drawScope);
}

window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  const ratio = Math.min(1, window.scrollY / (hero.offsetHeight * 0.55));
  canvas.style.opacity = String(1 - ratio * 0.92);
}, { passive: true });

window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); drawScope(); });
resize();
drawScope();


// ═══════════════════════════════════════════════════
// PCB COPPER TRACE BACKGROUND
// Draws orthogonal copper/gold traces with pads and
// slow signal pulses travelling along them.
// Visible below the hero, fades in on scroll.
// ═══════════════════════════════════════════════════
(function() {
  const pcb = document.getElementById('pcb-canvas');
  const pc  = pcb.getContext('2d');
  let PW, PH, pcbRaf;
  let pcbTraces = [];
  let pcbPads   = [];
  let pcbTime   = 0;
  let pcbVisible = false;

  // copper color palette
  const COPPER   = 'rgba(180, 130, 60,';   // warm copper
  const COPPER_B = 'rgba(210, 160, 70,';   // brighter highlight
  const PAD_C    = 'rgba(200, 150, 55,';   // pad fill
  const SIGNAL   = 'rgba(255, 200, 80,';   // signal pulse colour

  function pcbResize() {
    PW = pcb.width  = window.innerWidth;
    PH = pcb.height = window.innerHeight;
    buildPCB();
  }

  // Build an orthogonal trace network that covers the whole page
  function buildPCB() {
    pcbTraces = [];
    pcbPads   = [];

    // grid spacing
    const GX = Math.round(PW / 11);
    const GY = Math.round(PH / 8);
    const cols = 12;
    const rows = 9;

    // snap point grid
    const pts = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // jitter each grid point slightly for organic feel
        pts.push({
          x: c * GX + (Math.random() < 0.4 ? Math.round((Math.random()-.5)*GX*0.4) : 0),
          y: r * GY + (Math.random() < 0.4 ? Math.round((Math.random()-.5)*GY*0.4) : 0),
          c, r,
        });
      }
    }

    // connect adjacent grid points with orthogonal routes
    // PCB traces are always horizontal or vertical, never diagonal
    const connected = new Set();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      // try right neighbour
      const right = pts.find(q => q.c === p.c+1 && q.r === p.r);
      // try down neighbour
      const down  = pts.find(q => q.c === p.c   && q.r === p.r+1);

      if (right && Math.random() > 0.25) {
        const key = i + '-' + pts.indexOf(right);
        if (!connected.has(key)) {
          connected.add(key);
          addOrthogonalTrace(p, right);
        }
      }
      if (down && Math.random() > 0.25) {
        const key = i + '-' + pts.indexOf(down);
        if (!connected.has(key)) {
          connected.add(key);
          addOrthogonalTrace(p, down);
        }
      }
    }

    // place pads at a random subset of grid intersections
    for (const p of pts) {
      if (Math.random() < 0.28) {
        pcbPads.push({ x: p.x, y: p.y, r: Math.random() > 0.5 ? 5 : 3.5, phase: Math.random()*Math.PI*2 });
      }
    }
  }

  // Orthogonal route: horizontal then vertical (L-shape)
  function addOrthogonalTrace(a, b) {
    // 50/50 — go horizontal first or vertical first
    const goHorizFirst = Math.random() > 0.5;
    let mid;
    if (goHorizFirst) {
      mid = { x: b.x, y: a.y };
    } else {
      mid = { x: a.x, y: b.y };
    }
    // segment 1
    if (a.x !== mid.x || a.y !== mid.y) {
      pcbTraces.push({
        x1: a.x, y1: a.y, x2: mid.x, y2: mid.y,
        len: Math.hypot(mid.x-a.x, mid.y-a.y),
        phase: Math.random()*Math.PI*2,
        speed: 0.003 + Math.random()*0.004,
        pulse: Math.random() > 0.55,
        pulsePos: Math.random(),
      });
    }
    // segment 2
    if (mid.x !== b.x || mid.y !== b.y) {
      pcbTraces.push({
        x1: mid.x, y1: mid.y, x2: b.x, y2: b.y,
        len: Math.hypot(b.x-mid.x, b.y-mid.y),
        phase: Math.random()*Math.PI*2,
        speed: 0.003 + Math.random()*0.004,
        pulse: Math.random() > 0.55,
        pulsePos: Math.random(),
      });
    }
  }

  function drawPCB() {
    pc.clearRect(0, 0, PW, PH);
    pcbTime += 0.008;

    // Draw traces
    for (const tr of pcbTraces) {
      const base = 0.04 + Math.sin(tr.phase + pcbTime * 0.3) * 0.015;
      pc.beginPath();
      pc.moveTo(tr.x1, tr.y1);
      pc.lineTo(tr.x2, tr.y2);
      pc.strokeStyle = COPPER + base + ')';
      pc.lineWidth = 1.2;
      pc.stroke();

      // travelling signal pulse
      if (tr.pulse) {
        tr.pulsePos = (tr.pulsePos + tr.speed) % 1;
        const px = tr.x1 + (tr.x2 - tr.x1) * tr.pulsePos;
        const py = tr.y1 + (tr.y2 - tr.y1) * tr.pulsePos;

        // glow
        const grd = pc.createRadialGradient(px, py, 0, px, py, 12);
        grd.addColorStop(0, SIGNAL + '0.25)');
        grd.addColorStop(1, SIGNAL + '0)');
        pc.beginPath();
        pc.arc(px, py, 12, 0, Math.PI * 2);
        pc.fillStyle = grd;
        pc.fill();

        // dot
        pc.beginPath();
        pc.arc(px, py, 2, 0, Math.PI * 2);
        pc.fillStyle = SIGNAL + '0.7)';
        pc.fill();
      }
    }

    // Draw pads (PTH / SMD style circles)
    for (const pad of pcbPads) {
      pad.phase += 0.01;
      const a = 0.12 + Math.sin(pad.phase) * 0.04;

      // outer ring
      pc.beginPath();
      pc.arc(pad.x, pad.y, pad.r + 2, 0, Math.PI * 2);
      pc.strokeStyle = COPPER + (a * 0.7) + ')';
      pc.lineWidth = 0.8;
      pc.stroke();

      // inner fill
      pc.beginPath();
      pc.arc(pad.x, pad.y, pad.r, 0, Math.PI * 2);
      pc.fillStyle = PAD_C + (a * 0.5) + ')';
      pc.fill();

      // drill hole (dark centre)
      if (pad.r > 4) {
        pc.beginPath();
        pc.arc(pad.x, pad.y, 2, 0, Math.PI * 2);
        pc.fillStyle = 'rgba(8,8,9,0.85)';
        pc.fill();
      }
    }

    pcbRaf = requestAnimationFrame(drawPCB);
  }

  // Show PCB canvas once user scrolls past hero
  function checkPCBVisibility() {
    const heroH = document.querySelector('.hero').offsetHeight;
    const scrolled = window.scrollY > heroH * 0.3;
    if (scrolled && !pcbVisible) {
      pcbVisible = true;
      pcb.classList.add('visible');
      drawPCB();
    } else if (!scrolled && pcbVisible) {
      pcbVisible = false;
      pcb.classList.remove('visible');
      cancelAnimationFrame(pcbRaf);
    }
  }

  window.addEventListener('scroll', checkPCBVisibility, { passive: true });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pcbRaf);
    pcbResize();
    if (pcbVisible) drawPCB();
  });
  pcbResize();
})();


// ═══════════════════════════════
// EXPERIENCE MODAL SYSTEM
// ═══════════════════════════════
const overlay    = document.getElementById('modal-overlay');
const closeBtn   = document.getElementById('modal-close');
let activeModal  = null;

function openModal(cardEl) {
  const modalId = cardEl.dataset.modal;
  const cardKey = cardEl.dataset.card;
  if (!modalId) return;
  const modal = document.getElementById(modalId);
  if (!modal) return;

  document.querySelectorAll('.modal.visible').forEach(m => m.classList.remove('visible', 'animated'));

  overlay.className = 'modal-overlay active for-' + cardKey;
  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('animated')));
  activeModal = modal;
}

function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove('animated');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (activeModal) { activeModal.classList.remove('visible'); activeModal = null; }
    overlay.className = 'modal-overlay';
  }, 320);
}

document.querySelectorAll('.exp-card').forEach(card => card.addEventListener('click', () => openModal(card)));
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


// ═══════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════
const revealEls = document.querySelectorAll('.reveal');
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.06 });
revealEls.forEach(el => ro.observe(el));


// ═══════════════════════════════
// NAV ACTIVE STATE
// ═══════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(l => {
      l.style.color = l.getAttribute('href') === '#' + e.target.id ? 'rgba(239,239,239,0.9)' : '';
    });
  });
}, { threshold: 0.35 });
sections.forEach(s => so.observe(s));


// ═══════════════════════════════
// CURSOR GLOW
// ═══════════════════════════════
const glow = document.createElement('div');
glow.style.cssText = `
  position:fixed;width:360px;height:360px;border-radius:50%;
  background:radial-gradient(circle,rgba(79,140,240,0.04) 0%,transparent 70%);
  pointer-events:none;z-index:0;
  transform:translate(-50%,-50%);
  transition:left .18s ease,top .18s ease;
  will-change:left,top;
`;
document.body.appendChild(glow);
window.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top  = e.clientY + 'px';
});
