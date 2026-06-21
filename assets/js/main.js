/* ============================================
   UNDANGAN DIGITAL - MAIN JS
   Kontrol: panel slide, envelope idle/open,
   frame animation (8 frame), zoom + fade transisi
   ============================================ */

// ============================================
// CONFIG — sesuaikan di sini
// ============================================
const CONFIG = {
  // Path frame amplop (letakkan di assets/envelope/)
  // Frame 1 = amplop tertutup
  // Frame 2-7 = animasi buka bertahap
  // Frame 8 = kertas undangan (transisi ke main page)
  // Path di-resolve dari ASSET_BASE yang didefinisikan di HTML
  // ASSET_BASE = 'assets/img/' (index.php) atau '../assets/img/' (pages/)
  get envelopeFrames() {
    const base = (typeof ASSET_BASE !== 'undefined') ? ASSET_BASE : 'assets/img/';
    return Array.from({length: 8}, (_, i) => `${base}envelope/frame${i+1}.webp`);
  },
  // Durasi tiap frame saat animasi buka (ms)
  frameDuration: 150,
  // Durasi frame terakhir sebelum zoom (ms)
  lastFrameHoldDuration: 1000,
  // Durasi animasi zoom frame 8 (ms)
  zoomDuration: 800,
  // Durasi fade ke halaman utama (ms)
  fadeDuration: 500,
  // Mode debug: gunakan shape placeholder (true) atau gambar nyata (false)
  debugMode: false,
};

// ============================================
// STATE
// ============================================
const STATE = {
  isOpening: false,
  currentFrame: 0,
  framesLoaded: false,
  idleTimeout: null,
};

// ============================================
// DOM ELEMENTS
// ============================================
const $ = id => document.getElementById(id);
const panelLeft   = $('panel-left');
const panelRight  = $('panel-right');
const envelope    = $('envelope-container');
const openOverlay = $('envelope-open-overlay');
const frameDisplay= $('frame-display');
const transOverlay= $('transition-overlay');
const mainPage    = $('main-page');

// ============================================
// INIT — Jalankan saat DOM siap
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  preloadFrames();
  addPetals();
  createButterflies();
  createBirds();
  setupEnvelopeClick();
  startIdleHint();
});

// ============================================
// PRELOAD FRAMES
// ============================================
function preloadFrames() {
  if (CONFIG.debugMode) {
    STATE.framesLoaded = true;
    buildPlaceholderFrames();
    return;
  }

  let loaded = 0;
  CONFIG.envelopeFrames.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.id = `frame-${i + 1}`;
    img.alt = `Frame ${i + 1}`;
    img.onload = () => {
      loaded++;
      if (loaded === CONFIG.envelopeFrames.length) {
        STATE.framesLoaded = true;
      }
    };
    img.onerror = () => {
      // Jika gambar tidak ada, tetap lanjutkan
      loaded++;
      if (loaded === CONFIG.envelopeFrames.length) {
        STATE.framesLoaded = true;
      }
    };
    frameDisplay.appendChild(img);
  });
}

// ============================================
// PLACEHOLDER FRAMES (Mode Debug / tanpa gambar)
// Menampilkan animasi CSS sebagai pengganti gambar frame
// ============================================
function buildPlaceholderFrames() {
  // Warna per frame: progres buka amplop
  const frameColors = [
    { flap: '0deg',   sealOp: 1,    paperY: '0%',   label: 'Frame 1 — Amplop Tertutup' },
    { flap: '-20deg', sealOp: 0.8,  paperY: '0%',   label: 'Frame 2' },
    { flap: '-50deg', sealOp: 0.4,  paperY: '0%',   label: 'Frame 3' },
    { flap: '-90deg', sealOp: 0,    paperY: '0%',   label: 'Frame 4 — Flap Terbuka' },
    { flap: '-120deg',sealOp: 0,    paperY: '-10%', label: 'Frame 5' },
    { flap: '-140deg',sealOp: 0,    paperY: '-30%', label: 'Frame 6' },
    { flap: '-160deg',sealOp: 0,    paperY: '-55%', label: 'Frame 7' },
    { flap: '-180deg',sealOp: 0,    paperY: '-80%', label: 'Frame 8 — Kertas Undangan' },
  ];

  frameColors.forEach((f, i) => {
    const div = document.createElement('div');
    div.id = `frame-${i + 1}`;
    div.className = 'frame-placeholder';
    div.style.cssText = `
      position: absolute; inset: 0;
      opacity: 0;
      transition: opacity 0.05s;
      display: flex; align-items: center; justify-content: center;
    `;

    if (i < 7) {
      // Frame 1-7: amplop dengan flap berputar
      div.innerHTML = `
        <div class="ph-envelope" style="
          width: 240px; height: 168px; position: relative;
        ">
          <!-- Body amplop -->
          <div style="
            position: absolute; bottom: 0; width: 240px; height: 130px;
            background: linear-gradient(135deg, #c8a870, #e8c890);
            border-radius: 4px 4px 10px 10px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          "></div>
          <!-- Flap kiri -->
          <div style="
            position: absolute; bottom: 0; left: 0;
            width: 0; height: 0;
            border-bottom: 80px solid #d4b07a;
            border-right: 120px solid transparent;
          "></div>
          <!-- Flap kanan -->
          <div style="
            position: absolute; bottom: 0; right: 0;
            width: 0; height: 0;
            border-bottom: 80px solid #c8a870;
            border-left: 120px solid transparent;
          "></div>
          <!-- Flap atas (berputar) -->
          <div style="
            position: absolute; top: 0; left: 0;
            width: 0; height: 0;
            border-left: 120px solid transparent;
            border-right: 120px solid transparent;
            border-top: 78px solid #b8985e;
            transform-origin: top center;
            transform: rotate(${f.flap});
            transition: transform 0.1s;
            z-index: 4;
          "></div>
          <!-- Seal -->
          <div style="
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 40px; height: 40px;
            background: radial-gradient(circle, #8b0000, #c0392b);
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,215,0,0.6);
            opacity: ${f.sealOp};
            z-index: 5;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,215,0,0.9); font-size: 18px;
          ">♥</div>
          <!-- Kertas naik dari dalam -->
          <div style="
            position: absolute; bottom: 20px; left: 50%;
            transform: translateX(-50%) translateY(${f.paperY});
            width: 180px; height: 110px;
            background: linear-gradient(135deg, #fffef5, #fff8e1);
            border-radius: 4px;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.2);
            z-index: 3;
            display: flex; align-items: center; justify-content: center;
            padding: 12px;
          ">
            <div style="color: #3d2010; font-size: 11px; text-align: center; line-height: 1.6; font-family: Georgia,serif;">
              <div style="font-size:14px;font-weight:bold;margin-bottom:6px;">✿ Undangan ✿</div>
              <div style="font-style:italic;">Kepada Yth.</div>
              <div style="font-size: 12px; margin-top:4px;">Tamu Undangan</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Frame 8: tampilan kertas undangan penuh (transisi ke main page)
      div.innerHTML = `
        <div style="
          width: 280px; height: 196px;
          background: linear-gradient(135deg, #fffef5, #fff8e1);
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          border: 1px solid rgba(200,168,112,0.4);
        ">
          <div style="text-align: center; color: #3d2010;">
            <div style="font-size: 11px; letter-spacing: 3px; color: #b8985e; margin-bottom: 8px;">UNDANGAN PERNIKAHAN</div>
            <div style="font-size: 22px; font-style: italic; margin-bottom: 6px;">Ahmad & Sari</div>
            <div style="width: 60px; height: 1px; background: #c8a870; margin: 8px auto;"></div>
            <div style="font-size: 11px; color: #6b4226;">Sabtu, 12 Juli 2025</div>
            <div style="font-size: 10px; color: #8b6040; margin-top: 4px;">Gedung Serbaguna, Jakarta</div>
          </div>
        </div>
      `;
    }

    frameDisplay.appendChild(div);
  });
}

// ============================================
// SETUP KLIK AMPLOP
// ============================================
function setupEnvelopeClick() {
  envelope.addEventListener('click', () => {
    if (STATE.isOpening) return;
    startOpenAnimation();
  });

  // Touch support
  envelope.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (STATE.isOpening) return;
    startOpenAnimation();
  });
}

// ============================================
// ANIMASI MEMBUKA AMPLOP (8 Frame)
// ============================================
function startOpenAnimation() {
  if (!STATE.framesLoaded) return;
  STATE.isOpening = true;

  // Mulai putar musik saat user klik amplop
  // (browser izinkan autoplay karena ada interaksi user)
  // const music = document.getElementById('bg-music-preview');
  // if (music) {
  //   music.volume = 0;
  //   music.play().then(() => {
  //     // Fade in volume perlahan
  //     let vol = 0;
  //     const fadeIn = setInterval(() => {
  //       vol = Math.min(vol + 0.05, 0.8);
  //       music.volume = vol;
  //       if (vol >= 0.8) clearInterval(fadeIn);
  //     }, 100);
  //   }).catch(() => {});
  // }

  // Stop idle animation pada amplop
  envelope.classList.add('opening');

  // Sembunyikan hint
  const hint = document.querySelector('.envelope-hint');
  if (hint) hint.style.opacity = '0';

  // Tampilkan overlay frame
  openOverlay.style.opacity = '1';
  openOverlay.classList.add('active');

  // Sembunyikan amplop placeholder
  const ph = document.getElementById('envelope-placeholder');
  if (ph) ph.style.opacity = '0';

  // Mulai looping frame
  playFrame(1);
}

function playFrame(frameNum) {
  // Sembunyikan semua frame
  const allFrames = frameDisplay.querySelectorAll('[id^="frame-"]');
  allFrames.forEach(f => {
    f.style.opacity = '0';
    if (f.classList) f.classList.remove('visible');
  });

  // Tampilkan frame saat ini
  const currentFrame = $(`frame-${frameNum}`);
  if (currentFrame) {
    currentFrame.style.opacity = '1';
    if (currentFrame.classList) currentFrame.classList.add('visible');
  }

  STATE.currentFrame = frameNum;

  if (frameNum < 8) {
    // Lanjut ke frame berikutnya
    setTimeout(() => playFrame(frameNum + 1), CONFIG.frameDuration);
  } else {
    // Frame 8: tahan sebentar, lalu zoom + fade transisi
    setTimeout(() => triggerZoomTransition(), CONFIG.lastFrameHoldDuration);
  }
}

// ============================================
// ZOOM + FADE TRANSISI KE HALAMAN UTAMA
// ============================================
function triggerZoomTransition() {
  const frame8 = $('frame-8');
  if (!frame8) return;

  // Zoom animasi pada frame 8
  frame8.style.transition = `transform ${CONFIG.zoomDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${CONFIG.zoomDuration}ms ease`;
  frame8.style.transform = 'scale(5.5)';

  // Fade out overlay frame
  setTimeout(() => {
    openOverlay.style.transition = `opacity ${CONFIG.fadeDuration}ms ease`;
    openOverlay.style.opacity = '0';

    // Fade in transition white overlay
    transOverlay.style.opacity = '1';
    transOverlay.classList.add('active');
  }, CONFIG.zoomDuration * 0.6);

  // Tampilkan halaman utama + redirect
  setTimeout(() => {
    mainPage.classList.add('visible');

    // Simpan posisi musik DULU sebelum redirect
    const music = document.getElementById('bg-music-preview');
    if (music && !music.paused) {
      sessionStorage.setItem('music_pos',     String(music.currentTime));
      sessionStorage.setItem('music_playing', 'true');
      sessionStorage.setItem('music_volume',  String(music.volume));
    } else {
      sessionStorage.setItem('music_playing', 'true');
      sessionStorage.setItem('music_pos',     '0');
      sessionStorage.setItem('music_volume',  '0.8');
    }

    // Redirect setelah sessionStorage tersimpan
    setTimeout(() => {
      window.location.href = 'pages/invitation.html';
    }, 600);

  }, CONFIG.zoomDuration + CONFIG.fadeDuration);
}


// ============================================
// BUTTERFLY SPRITE ANIMATION
// ============================================
const BUTTERFLY_CONFIG = {
  frameCount: 16,
  get framePath() { return (typeof ASSET_BASE !== 'undefined' ? ASSET_BASE : 'assets/img/') + 'butterfly/'; },
  frameName: 'Frame ',      // nama file sebelum nomor
  frameExt: '.webp',
  fps: 12,                  // kecepatan kepak sayap (frame per detik)
  count: 4,                 // jumlah kupu-kupu
  minSize: Math.min(20, window.innerWidth * 0.08),
  maxSize: Math.min(30, window.innerWidth * 0.12),
  get minSpeed() { return window.innerWidth / 120; },
  get maxSpeed() { return window.innerWidth / 80; },
};

function createButterflies() {
  const frames = [];

  // Preload semua frame
  let loaded = 0;
  const total = BUTTERFLY_CONFIG.frameCount;

  for (let i = 1; i <= total; i++) {
    const img = new Image();
    img.onload = () => {
      loaded++;
      if (loaded === total) {
        // Semua frame siap — baru spawn kupu-kupu
        for (let b = 0; b < BUTTERFLY_CONFIG.count; b++) {
          spawnButterfly(frames, b * 2000);
        }
      }
    };
    img.onerror = () => {
      loaded++;
      console.warn(`Gagal load: ${img.src}`);
      if (loaded === total) {
        for (let b = 0; b < BUTTERFLY_CONFIG.count; b++) {
          spawnButterfly(frames, b * 2000);
        }
      }
    };
    img.src = `${BUTTERFLY_CONFIG.framePath}${BUTTERFLY_CONFIG.frameName}${i}${BUTTERFLY_CONFIG.frameExt}`;
    frames.push(img);
  }
}

function spawnButterfly(frames, initialDelay) {
  const scene = document.getElementById('scene');

  // Buat canvas untuk render sprite
  const canvas = document.createElement('canvas');
  const size = randomBetween(BUTTERFLY_CONFIG.minSize, BUTTERFLY_CONFIG.maxSize);
  canvas.width  = size;
  canvas.height = size;
  canvas.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 25;
    opacity: 0;
    transition: opacity 0.8s ease;
  `;
  scene.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let currentFrame = 0;
  let frameInterval = null;
  let flyTimeout   = null;

  // Animasi kepak sayap
function startWingFlap() {
    if (frameInterval) clearInterval(frameInterval);
    frameInterval = setInterval(() => {
      const img = frames[currentFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch(e) {
          // skip frame rusak
        }
      }
      currentFrame = (currentFrame + 1) % BUTTERFLY_CONFIG.frameCount;
    }, 1000 / BUTTERFLY_CONFIG.fps);
  }

  // Jalur terbang: mulai dari sisi acak, tuju sisi lain dengan kurva natural
  function fly() {
    const fromLeft = Math.random() > 0.5;
    const startX   = fromLeft ? -size : window.innerWidth + size;
    const startY   = randomBetween(window.innerHeight * 0.1, window.innerHeight * 0.85);
    const endX     = fromLeft ? window.innerWidth + size : -size;
    const endY     = randomBetween(window.innerHeight * 0.1, window.innerHeight * 0.85);

    const cp1x = randomBetween(window.innerWidth * 0.2, window.innerWidth * 0.4);
    const cp1y = randomBetween(window.innerHeight * 0.05, window.innerHeight * 0.5);
    const cp2x = randomBetween(window.innerWidth * 0.6, window.innerWidth * 0.8);
    const cp2y = randomBetween(window.innerHeight * 0.5, window.innerHeight * 0.95);

    const duration = randomBetween(
      BUTTERFLY_CONFIG.minSpeed,
      BUTTERFLY_CONFIG.maxSpeed
    ) * 1000;

    // Skala awal dan akhir — efek mendekat/menjauh layar
    const startScale = randomBetween(0.5, 1.0);
    const endScale   = randomBetween(0.5, 1.2);

    const startTime = performance.now();
    let prevX = startX;
    let prevY = startY;

    canvas.style.opacity = '0';
    canvas.style.left = startX + 'px';
    canvas.style.top  = startY + 'px';

    requestAnimationFrame(() => {
      canvas.style.opacity = '0.85';
    });

    function animateAlongPath(now) {
      if (STATE.isOpening) {
        canvas.style.opacity = '0';
        return;
      }

      const elapsed = now - startTime;
      const t  = Math.min(elapsed / duration, 1);
      const mt = 1 - t;

      // Posisi bezier
      const x = mt*mt*mt*startX + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*endX;
      const y = mt*mt*mt*startY + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*endY;

      // Flutter vertikal kecil
      const flutter = Math.sin(elapsed / 300) * 4;

      // Hitung arah gerak dari posisi sebelumnya
      const dx = x - prevX;
      const dy = (y + flutter) - prevY;
      // Sudut dalam derajat — 0° = kanan, 90° = bawah
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      // Kupu-kupu menghadap atas (sprite) jadi offset +90
      const rotation = angle + 90;

      // Skala interpolasi — efek zoom in/out
      const scale = startScale + (endScale - startScale) * t;

      canvas.style.left      = x + 'px';
      canvas.style.top       = (y + flutter) + 'px';
      canvas.style.transform = `rotate(${rotation}deg) scale(${scale})`;

      prevX = x;
      prevY = y + flutter;

      if (t < 1) {
        requestAnimationFrame(animateAlongPath);
      } else {
        canvas.style.opacity = '0';
        flyTimeout = setTimeout(() => fly(), randomBetween(500, 2000));
      }
    }

    requestAnimationFrame(animateAlongPath);
  }

  // Mulai setelah delay
  setTimeout(() => {
    startWingFlap();
    fly();
  }, initialDelay);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ============================================
// BIRD SPRITE ANIMATION
// ============================================
const BIRD_CONFIG = {
  frameCount: 16,
  get framePath() { return (typeof ASSET_BASE !== 'undefined' ? ASSET_BASE : 'assets/img/') + 'Bird/'; },
  frameName: 'Frame ',
  frameExt: '.webp',
  fps: 14,
  count: 3,
  minSize: Math.min(15, window.innerWidth * 0.08),
  maxSize: Math.min(20, window.innerWidth * 0.12),
  get minSpeed() { return window.innerWidth / 120; },
  get maxSpeed() { return window.innerWidth / 70; },
};

function createBirds() {
  const frames = [];
  let loaded = 0;
  const total = BIRD_CONFIG.frameCount;

  for (let i = 1; i <= total; i++) {
    const img = new Image();
    img.onload = () => {
      loaded++;
      if (loaded === total) {
        for (let b = 0; b < BIRD_CONFIG.count; b++) {
          spawnBird(frames, b * 2500);
        }
      }
    };
    img.onerror = () => {
      loaded++;
      console.warn(`Gagal load: ${img.src}`);
      if (loaded === total) {
        for (let b = 0; b < BIRD_CONFIG.count; b++) {
          spawnBird(frames, b * 2500);
        }
      }
    };
    img.src = `${BIRD_CONFIG.framePath}${BIRD_CONFIG.frameName}${i}${BIRD_CONFIG.frameExt}`;
    frames.push(img);
  }
}

function spawnBird(frames, initialDelay) {
  const scene = document.getElementById('scene');

  const canvas = document.createElement('canvas');
  const size   = randomBetween(BIRD_CONFIG.minSize, BIRD_CONFIG.maxSize);
  canvas.width  = size;
  canvas.height = size;
  canvas.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 25;
    opacity: 0;
    transition: opacity 0.8s ease;
  `;
  scene.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let currentFrame = 0;
  let frameInterval = null;
  let flyTimeout    = null;

  function startWingFlap() {
    if (frameInterval) clearInterval(frameInterval);
    frameInterval = setInterval(() => {
      const img = frames[currentFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch(e) {}
      }
      currentFrame = (currentFrame + 1) % BIRD_CONFIG.frameCount;
    }, 1000 / BIRD_CONFIG.fps);
  }

  function fly() {
    // Burung selalu terbang horizontal kiri <-> kanan seperti placeholder lama
    const fromLeft = Math.random() > 0.5;
    const startX   = fromLeft ? -size : window.innerWidth + size;
    const endX     = fromLeft ? window.innerWidth + size : -size;

    // Jalur di sepertiga atas layar seperti placeholder lama
    const startY = randomBetween(window.innerHeight * 0.05, window.innerHeight * 0.35);
    const endY   = randomBetween(window.innerHeight * 0.05, window.innerHeight * 0.35);

    // Kurva sedikit naik turun tapi tetap di area atas
    const cp1x = window.innerWidth * 0.3;
    const cp1y = startY + randomBetween(-40, 40);
    const cp2x = window.innerWidth * 0.7;
    const cp2y = endY   + randomBetween(-40, 40);

    const duration   = randomBetween(BIRD_CONFIG.minSpeed, BIRD_CONFIG.maxSpeed) * 1000;
    const startScale = randomBetween(0.6, 1.0);
    const endScale   = randomBetween(0.6, 1.0);

    const startTime = performance.now();
    let prevX = startX;
    let prevY = startY;

    canvas.style.opacity   = '0';
    canvas.style.left      = startX + 'px';
    canvas.style.top       = startY + 'px';

    requestAnimationFrame(() => {
      canvas.style.opacity = '0.9';
    });

    function animateAlongPath(now) {
      if (STATE.isOpening) {
        canvas.style.opacity = '0';
        return;
      }

      const elapsed = now - startTime;
      const t  = Math.min(elapsed / duration, 1);
      const mt = 1 - t;

      const x = mt*mt*mt*startX + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*endX;
      const y = mt*mt*mt*startY + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*endY;

      // Ombak naik turun kecil seperti burung asli
      const wave = Math.sin(elapsed / 400) * 5;

      const dx = x - prevX;
      const dy = (y + wave) - prevY;
      const angle    = Math.atan2(dy, dx) * (180 / Math.PI);
      const scale  = startScale + (endScale - startScale) * t;
      const flipX  = fromLeft ? 1 : -1;

      canvas.style.left      = x + 'px';
      canvas.style.top       = (y + wave) + 'px';
      canvas.style.transform = `rotate(${angle}deg) scaleY(${flipX}) scale(${scale})`;

      prevX = x;
      prevY = y + wave;

      if (t < 1) {
        requestAnimationFrame(animateAlongPath);
      } else {
        canvas.style.opacity = '0';
        flyTimeout = setTimeout(() => fly(), randomBetween(1000, 4000));
      }
    }

    requestAnimationFrame(animateAlongPath);
  }

  setTimeout(() => {
    startWingFlap();
    fly();
  }, initialDelay);
}


function addPetals() {
  const scene = $('scene');
  const petalCount = 10;

  // Skala durasi berdasarkan tinggi layar
  // Desktop ~900px → durasi normal 6-10 detik
  // HP ~700px → durasi dikurangi proporsional agar kecepatan px/s sama
  const heightRatio = window.innerHeight / 900;
  const minDuration = 10  * heightRatio;
  const maxDuration = 16 * heightRatio;

  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('div');
    petal.className = `petal petal-${i + 1}`;
    petal.style.left            = `${Math.random() * 100}%`;
    petal.style.animationDelay  = `${Math.random() * 8}s`;
    petal.style.animationDuration = `${minDuration + Math.random() * (maxDuration - minDuration)}s`;
    scene.appendChild(petal);
  }
}

// ============================================
// IDLE HINT — Amplop bergerak lebih aktif
// setelah 3 detik jika user belum klik
// ============================================
function startIdleHint() {
  function doShake() {
    if (STATE.isOpening) return;
    envelope.style.animation = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        envelope.style.animation = 'envelope-shake 0.8s ease-in-out 3';
      });
    });
    STATE.idleTimeout = setTimeout(doShake, 5000);
  }
  STATE.idleTimeout = setTimeout(doShake, 3000);
}

// ============================================
// PANEL SLIDE — Dipanggil dari HTML
// atau bisa dipanggil otomatis saat membuka amplop
// ============================================
function openPanels() {
  panelLeft.classList.add('open');
  panelRight.classList.add('open');
}

// Ekspor untuk digunakan di HTML jika perlu
window.openPanels = openPanels;
window.startOpenAnimation = startOpenAnimation;
