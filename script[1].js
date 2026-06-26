// ===== CIRCUIT CANVAS ANIMATION =====
const canvas = document.getElementById('circuit-canvas');
const ctx = canvas.getContext('2d');

let W, H, nodes, lines, animationId;
let tick = 0;

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
  init();
}

function init() {
  // Generate circuit nodes on a grid with slight randomness
  nodes = [];
  const cols = Math.floor(W / 80);
  const rows = Math.floor(H / 80);

  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      if (Math.random() > 0.45) {
        nodes.push({
          x: c * 80 + (Math.random() - 0.5) * 20,
          y: r * 80 + (Math.random() - 0.5) * 20,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          active: Math.random() > 0.5,
        });
      }
    }
  }

  // Connect nearby nodes with horizontal/vertical lines (circuit style)
  lines = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = Math.abs(nodes[i].x - nodes[j].x);
      const dy = Math.abs(nodes[i].y - nodes[j].y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 110 && Math.random() > 0.55) {
        lines.push({
          from: i,
          to: j,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          active: Math.random() > 0.4,
        });
      }
    }
  }
}

function drawFrame() {
  ctx.clearRect(0, 0, W, H);

  const accent = '79,142,247';

  // Draw lines
  for (const line of lines) {
    const a = nodes[line.from];
    const b = nodes[line.to];

    // Static base line
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(${accent}, 0.06)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Travelling pulse on some lines
    if (line.active) {
      line.progress += line.speed;
      if (line.progress > 1.4) line.progress = -0.2;

      const t = Math.max(0, Math.min(1, line.progress));
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, 12);
      grad.addColorStop(0, `rgba(${accent}, 0.5)`);
      grad.addColorStop(1, `rgba(${accent}, 0)`);
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Draw nodes
  for (const node of nodes) {
    node.pulse += node.pulseSpeed;
    const alpha = 0.08 + Math.sin(node.pulse) * 0.06;
    const r = 1.5 + Math.sin(node.pulse) * 0.5;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${accent}, ${alpha + 0.15})`;
    ctx.fill();

    // Outer ring on active nodes
    if (node.active && Math.sin(node.pulse) > 0.6) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${accent}, ${alpha * 0.4})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  tick++;
  animationId = requestAnimationFrame(drawFrame);
}

window.addEventListener('resize', () => {
  cancelAnimationFrame(animationId);
  resize();
  drawFrame();
});

resize();
drawFrame();


// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll('.section-header, .project-card, .skills-grid, .about-strip, .contact-inner, .skill-group');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});


// ===== SMOOTH NAV HIGHLIGHT =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'rgba(240,240,240,0.9)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));


// ===== CURSOR GLOW (subtle) =====
const glow = document.createElement('div');
glow.style.cssText = `
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79,142,247,0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  transform: translate(-50%, -50%);
  transition: left 0.12s ease, top 0.12s ease;
`;
document.body.appendChild(glow);

document.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});
