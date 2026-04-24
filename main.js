/**
 * main.js — Alex Portfolio
 *
 * Modules:
 * - initYear()          Sets footer year
 * - initMobileNav()     Hamburger menu toggle & close logic
 * - initSmoothScroll()  Smooth anchor scroll
 * - initScrollFadeIn()  IntersectionObserver fade-in animations
 * - initThreeJS()       Three.js 3D scene (hero canvas)
 * - initTexture()       Injects paper texture from assets/ into body background
 */

/* ── TEXTURE ── */
/**
 * Loads the paper texture from assets and applies it as the body background.
 * Keeping it out of CSS avoids embedding a 30KB base64 blob in the stylesheet.
 * In production, swap this for a normal background-image url() pointing at the file.
 */
async function initTexture() {
  try {
    const res = await fetch('./assets/paper-texture.jpeg');
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    document.body.style.backgroundImage = `url("${url}")`;
  } catch {
    // Texture is decorative — silently skip if fetch fails (e.g. file:// protocol)
  }
}


/* ── YEAR ── */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ── MOBILE NAV ── */
function initMobileNav() {
  const toggle    = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('nav-mobile');
  if (!toggle || !mobileNav) return;

  function openMenu() {
    mobileNav.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileNav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close on nav link click
  mobileNav.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on backdrop click
  mobileNav.addEventListener('click', e => {
    if (e.target === mobileNav) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
  });
}


/* ── SMOOTH SCROLL ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}


/* ── SCROLL FADE-IN ── */
function initScrollFadeIn() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}


/* ── THREE.JS 3D SCENE ── */
function initThreeJS() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Scene & camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Resize handler
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  // Helpers
  const mkSolid = color    => new THREE.MeshBasicMaterial({ color });
  const mkWire  = color    => new THREE.MeshBasicMaterial({ color, wireframe: true });

  // Geometry group
  const group = new THREE.Group();
  scene.add(group);

  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,  1), mkSolid(0x1C1C2E)));
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 1), mkWire(0xE8612C)));

  const innerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 0), mkSolid(0x3A7D44));
  const innerWire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.67, 0), mkWire(0xF0C040));
  group.add(innerMesh, innerWire);

  const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mkSolid(0xF0C040));
  group.add(coreMesh);

  // Vertex nodes on outer icosahedron
  const nodeGeo  = new THREE.SphereGeometry(0.055, 6, 6);
  const icosaGeo = new THREE.IcosahedronGeometry(1.1, 1);
  const positions = icosaGeo.attributes.position;
  const seen = new Set();

  for (let i = 0; i < positions.count; i++) {
    const key = `${positions.getX(i).toFixed(2)},${positions.getY(i).toFixed(2)},${positions.getZ(i).toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      const node = new THREE.Mesh(nodeGeo, mkSolid(0xF0C040));
      node.position.set(positions.getX(i), positions.getY(i), positions.getZ(i));
      group.add(node);
    }
  }

  // Ambient particles
  const PARTICLE_COUNT = 60;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r     = 1.8 + Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x8C8C8C, size: 0.045 }));
  scene.add(particles);

  // Drag interaction (mouse + touch)
  let isDragging = false;
  let prevX = 0, prevY = 0, velX = 0, velY = 0;

  const onDragStart = (x, y) => { isDragging = true; prevX = x; prevY = y; velX = 0; velY = 0; };
  const onDragMove  = (x, y) => {
    if (!isDragging) return;
    velX = (x - prevX) * 0.005;
    velY = (y - prevY) * 0.005;
    group.rotation.y += velX;
    group.rotation.x += velY;
    prevX = x;
    prevY = y;
  };
  const onDragEnd = () => { isDragging = false; };

  canvas.addEventListener('mousedown', e => onDragStart(e.clientX, e.clientY));
  window.addEventListener('mouseup',   onDragEnd);
  window.addEventListener('mousemove', e => onDragMove(e.clientX, e.clientY));

  canvas.addEventListener('touchstart', e => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchend',   onDragEnd);
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

  // Animation loop
  let t = 0;
  let animId;

  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.008;

    if (!isDragging) {
      velX *= 0.95;
      velY *= 0.95;
      group.rotation.y += velX + 0.004;
      group.rotation.x += velY;
    }

    coreMesh.rotation.x  += 0.018;
    coreMesh.rotation.z  += 0.014;
    innerMesh.rotation.y -= 0.006;
    innerWire.rotation.y -= 0.006;
    particles.rotation.y += 0.001;
    group.scale.setScalar(1 + 0.04 * Math.sin(t * 1.5));

    renderer.render(scene, camera);
  }

  // Pause rendering when canvas scrolls out of view (battery saving)
  const visibilityObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) animate();
        else cancelAnimationFrame(animId);
      });
    },
    { threshold: 0.1 }
  );
  visibilityObserver.observe(canvas);

  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize);
}


/* ── SKILLS ORB 3D SCENE ── */
function initSkillsOrb() {
  const canvas = document.getElementById('skills-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4.5);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const mk = (color, wire) => new THREE.MeshBasicMaterial({ color, wireframe: !!wire });

  const group = new THREE.Group();
  scene.add(group);

  // Outer torus knot wireframe
  const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.0, 0.28, 80, 12),
    mk(0xE8612C, true)
  );
  group.add(torusKnot);

  // Inner sphere solid
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), mk(0x1C1C2E)));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.57, 12, 12), mk(0xF0C040, true)));

  // Orbiting dots
  const orbitGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const orbitMat = mk(0xF0C040);
  const orbitCount = 6;
  const orbiters = [];
  for (let i = 0; i < orbitCount; i++) {
    const m = new THREE.Mesh(orbitGeo, orbitMat);
    group.add(m);
    orbiters.push({ mesh: m, phase: (i / orbitCount) * Math.PI * 2, radius: 1.35, speed: 0.8 + i * 0.1 });
  }

  // Particles
  const pCount = 40;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = 1.7 + Math.random() * 0.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x8C8C8C, size: 0.04 })));

  // Drag
  let isDragging = false, prevX = 0, prevY = 0, velX = 0, velY = 0;
  const onDragStart = (x, y) => { isDragging = true; prevX = x; prevY = y; velX = 0; velY = 0; };
  const onDragMove  = (x, y) => {
    if (!isDragging) return;
    velX = (x - prevX) * 0.005; velY = (y - prevY) * 0.005;
    group.rotation.y += velX; group.rotation.x += velY;
    prevX = x; prevY = y;
  };
  const onDragEnd = () => { isDragging = false; };
  canvas.addEventListener('mousedown', e => onDragStart(e.clientX, e.clientY));
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('mousemove', e => onDragMove(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', e => { e.preventDefault(); onDragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchend', onDragEnd);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); onDragMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

  let t = 0, animId2;
  function animate() {
    animId2 = requestAnimationFrame(animate);
    t += 0.01;
    if (!isDragging) {
      velX *= 0.95; velY *= 0.95;
      group.rotation.y += velX + 0.006;
      group.rotation.x += velY;
    }
    torusKnot.rotation.z += 0.003;
    orbiters.forEach(o => {
      o.mesh.position.x = Math.cos(t * o.speed + o.phase) * o.radius;
      o.mesh.position.y = Math.sin(t * o.speed + o.phase) * o.radius * 0.5;
      o.mesh.position.z = Math.sin(t * o.speed * 0.7 + o.phase) * o.radius * 0.5;
    });
    renderer.render(scene, camera);
  }

  const vis2 = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) animate(); else cancelAnimationFrame(animId2); });
  }, { threshold: 0.1 });
  vis2.observe(canvas);
  new ResizeObserver(resize).observe(canvas);
}


/* ── PROJECT CAROUSEL ── */
function initProjectCarousel() {
  const carousel  = document.getElementById('proj-carousel');
  const dotsWrap  = document.getElementById('proj-dots');
  const btnLeft   = document.querySelector('.proj-arrow-left');
  const btnRight  = document.querySelector('.proj-arrow-right');
  if (!carousel) return;

  const cards = Array.from(carousel.querySelectorAll('.proj-card'));

  /* One "page" = the carousel's visible width (shows ~3 cards at once).
     Arrows scroll exactly one page. Dots represent pages, not cards. */
  const pageWidth  = () => carousel.clientWidth;
  const totalPages = () => Math.ceil(carousel.scrollWidth / pageWidth());
  const currentPage = () => Math.round(carousel.scrollLeft / pageWidth());

  cards.forEach(card => {
  card.addEventListener('click', () => {
    const url = card.getAttribute('data-href');
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  });
});

  /* ── Build page-based dot indicators ── */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const n = totalPages();
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('button');
      dot.className = 'proj-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to page ${i + 1}`);
      dot.addEventListener('click', () => {
        carousel.scrollTo({ left: i * pageWidth(), behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    }
  }

  /* ── Sync dots & arrow disabled state to current scroll position ── */
  function updateState() {
    const page = currentPage();

    dotsWrap && dotsWrap.querySelectorAll('.proj-dot').forEach((d, i) => {
      d.classList.toggle('active', i === page);
    });

    if (btnLeft)  btnLeft.disabled  = carousel.scrollLeft < 4;
    if (btnRight) btnRight.disabled = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
  }

  buildDots();
  carousel.addEventListener('scroll', updateState, { passive: true });
  window.addEventListener('resize', () => { buildDots(); updateState(); });
  updateState();

  /* ── Arrow buttons scroll one full page ── */
  btnLeft  && btnLeft.addEventListener('click',  () => { carousel.scrollBy({ left: -pageWidth(), behavior: 'smooth' }); });
  btnRight && btnRight.addEventListener('click', () => { carousel.scrollBy({ left:  pageWidth(), behavior: 'smooth' }); });

  /* ── Keyboard nav ── */
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { carousel.scrollBy({ left: -pageWidth(), behavior: 'smooth' }); e.preventDefault(); }
    if (e.key === 'ArrowRight') { carousel.scrollBy({ left:  pageWidth(), behavior: 'smooth' }); e.preventDefault(); }
  });
}


/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initMobileNav();
  initSmoothScroll();
  initScrollFadeIn();
  initThreeJS();
  initSkillsOrb();
  initProjectCarousel();
  // initTexture(); // Uncomment when serving over HTTP (not file://)
});
