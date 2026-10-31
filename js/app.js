/**
 * Catherine's Birthday Surprise - Main Interactive Engine
 */

// Global Configuration Manager
const ConfigManager = {
  STORAGE_KEY: 'catherine_birthday_config',
  remoteConfig: null,
  
  getDefaultConfig() {
    return {
      mode: 'timer', // 'timer' | 'unlocked' | 'locked'
      targetTime: '2026-11-01T00:00',
      recipientName: '賴品岑',
      recipientNickname: 'Patty',
      recipientEnglish: 'Patty',
      countdownTitle: '距離 賴品岑 (Patty) 的專屬驚喜解鎖還有',
      countdownSubtitle: '這是一份為妳精心準備的生日特別禮物，時間一到自動揭曉 🎂',
      heroTagline: '願妳的每一歲，都奔走在自己的熱愛裡。生日快樂，永遠閃閃發光！',
      photo1Caption: '✨ 願妳的每一歲都奔走在熱愛裡 ‧ 永遠閃亮的 Patty ✨',
      photo2Caption: '💖 在 Catherine 課堂展開第三年友情 ‧ 全世界最棒的 Patty 賴品岑 💖',
      prizes: [
        {
          id: 'drink',
          title: '☕ 今日特調 ‧ 飲料一杯兌換券',
          desc: '憑此券可兌換全品項特調飲品 / 星巴克任選一杯，好友 Bobo 隨時買單！',
          code: 'BDAY-DRINK-2026',
          icon: '☕'
        },
        {
          id: 'gift',
          title: '🎁 命中注定 ‧ 神秘小禮一個',
          desc: '由好友 Bobo 親自挑選並為妳準備的神秘生日禮物，見面時親手奉上！',
          code: 'BDAY-GIFT-999',
          icon: '🎁'
        }
      ],
      cardLetter: `不知不覺，已經國三了，
或許國一的我們都沒有想過一個英文班，竟然有辦法英文班不在，但卻能把我們這群人聚在一起。

從 Allen 到 Angel 再到 Catherine，我們的友情竟然已經要展開第三年了，想想就覺得好特別！
第一次見面的時候，我的第一反應竟然是「這個女生蠻好看的」。

我們可能以前不常聊天，但在這段時間，聽了英文班的八卦，再到王先生勸妳不要戀愛腦，一直到最後面開始在 Catherine 的課上聽 Gina 還有她的感情史，甚至還有 petroleum 跟諧音的 gas therine……

好啦總而言之，謝謝妳有來上英文班，
認識妳、跟妳當朋友，真是件人生難得的好事啊！

祝妳跟妳的老公們 99，
成績變好，人就不用變漂亮了，因為本來就很漂亮！

（我還記得妳的老公們：安乾鎬、嚴成玹、金泰亨、崔秀彬、崔然竣 💖）`,
      authorSign: 'Bobo 上',
      easterEggMessage: '🎉 恭喜發現隱藏彩蛋！祝 Patty 新的一歲吃不胖、睡得好、天天都有好心情！✨'
    };
  },

  async syncRemoteConfig() {
    try {
      const res = await fetch('config.json?v=' + Date.now());
      if (res.ok) {
        this.remoteConfig = await res.json();
        return this.remoteConfig;
      }
    } catch (e) {
      // offline or standalone
    }
    return null;
  },

  getConfig() {
    let base = this.getDefaultConfig();

    // If remoteConfig was loaded, merge it
    if (this.remoteConfig) {
      base = { ...base, ...this.remoteConfig };
    }

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved config still had the initial placeholder, replace with Bobo's real text
        if (parsed.cardLetter && (!parsed.cardLetter.includes('安乾鎬') || !parsed.cardLetter.includes('不知不覺') || parsed.cardLetter.includes('親愛的'))) {
          delete parsed.cardLetter;
        }
        if (parsed.photo2Caption && parsed.photo2Caption.includes('Catherine 賴品岑')) {
          delete parsed.photo2Caption;
        }
        if (parsed.recipientName === 'Catherine') {
          parsed.recipientName = '賴品岑';
        }
        base = { ...base, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load saved config, using default', e);
    }

    // URL parameters have the highest priority for direct sharing!
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'unlocked' || urlParams.get('open') === '1' || urlParams.get('unlock') === '1') {
      base.mode = 'unlocked';
    } else if (urlParams.get('mode') === 'timer') {
      base.mode = 'timer';
    } else if (urlParams.get('mode') === 'locked') {
      base.mode = 'locked';
    }

    if (urlParams.get('until')) {
      base.targetTime = urlParams.get('until');
    }

    return base;
  },

  saveConfig(newConfig) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newConfig));
      return true;
    } catch (e) {
      console.error('Error saving config', e);
      return false;
    }
  }
};

// -------------------------------------------------------------------
// Pure Web Audio API Synthesizer (No external mp3 download needed!)
// -------------------------------------------------------------------
const AudioSynth = {
  ctx: null,
  isPlaying: false,
  melodyTimeout: null,
  noteIndex: 0,
  
  // Notes in Hz for "Happy Birthday" (Key of C)
  melody: [
    { note: 261.63, dur: 0.35, pause: 0.05 }, // C4
    { note: 261.63, dur: 0.2,  pause: 0.05 }, // C4
    { note: 293.66, dur: 0.5,  pause: 0.08 }, // D4
    { note: 261.63, dur: 0.5,  pause: 0.08 }, // C4
    { note: 349.23, dur: 0.5,  pause: 0.08 }, // F4
    { note: 329.63, dur: 0.9,  pause: 0.2 },  // E4
    
    { note: 261.63, dur: 0.35, pause: 0.05 }, // C4
    { note: 261.63, dur: 0.2,  pause: 0.05 }, // C4
    { note: 293.66, dur: 0.5,  pause: 0.08 }, // D4
    { note: 261.63, dur: 0.5,  pause: 0.08 }, // C4
    { note: 392.00, dur: 0.5,  pause: 0.08 }, // G4
    { note: 349.23, dur: 0.9,  pause: 0.2 },  // F4
    
    { note: 261.63, dur: 0.35, pause: 0.05 }, // C4
    { note: 261.63, dur: 0.2,  pause: 0.05 }, // C4
    { note: 523.25, dur: 0.5,  pause: 0.08 }, // C5
    { note: 440.00, dur: 0.5,  pause: 0.08 }, // A4
    { note: 349.23, dur: 0.5,  pause: 0.08 }, // F4
    { note: 329.63, dur: 0.5,  pause: 0.08 }, // E4
    { note: 293.66, dur: 0.8,  pause: 0.2 },  // D4
    
    { note: 466.16, dur: 0.35, pause: 0.05 }, // Bb4
    { note: 466.16, dur: 0.2,  pause: 0.05 }, // Bb4
    { note: 440.00, dur: 0.5,  pause: 0.08 }, // A4
    { note: 349.23, dur: 0.5,  pause: 0.08 }, // F4
    { note: 392.00, dur: 0.5,  pause: 0.08 }, // G4
    { note: 349.23, dur: 1.2,  pause: 1.2 }   // F4 (hold then pause)
  ],

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playBell(freq, duration = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Primary chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Subtle harmonic overtone for music box shimmer
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  },

  playScratchSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  },

  playWinChord() {
    this.init();
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chords.forEach((freq, idx) => {
      setTimeout(() => this.playBell(freq, 1.2), idx * 90);
    });
  },

  startMelody() {
    this.init();
    this.isPlaying = true;
    this.noteIndex = 0;
    this.stepMelody();
    this.updateToggleBtn();
  },

  stopMelody() {
    this.isPlaying = false;
    clearTimeout(this.melodyTimeout);
    this.updateToggleBtn();
  },

  toggleMelody() {
    if (this.isPlaying) {
      this.stopMelody();
    } else {
      this.startMelody();
    }
  },

  stepMelody() {
    if (!this.isPlaying) return;
    const item = this.melody[this.noteIndex];
    this.playBell(item.note, item.dur);
    
    this.noteIndex = (this.noteIndex + 1) % this.melody.length;
    const waitTime = (item.dur + item.pause) * 1000;
    this.melodyTimeout = setTimeout(() => this.stepMelody(), waitTime);
  },

  updateToggleBtn() {
    const btn = document.getElementById('musicToggleBtn');
    if (!btn) return;
    if (this.isPlaying) {
      btn.classList.add('playing');
      btn.querySelector('.music-label').textContent = '音樂播放中';
    } else {
      btn.classList.remove('playing');
      btn.querySelector('.music-label').textContent = '播放生日旋律';
    }
  }
};

// -------------------------------------------------------------------
// Ambient Stardust Canvas Particles
// -------------------------------------------------------------------
const AmbientCanvas = {
  canvas: null,
  ctx: null,
  particles: [],
  maxParticles: 35,

  init() {
    this.canvas = document.getElementById('ambient-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      radius: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      fadeSpeed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
    };
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.opacity += p.fadeSpeed;

      if (p.opacity > 0.8 || p.opacity < 0.1) {
        p.fadeSpeed = -p.fadeSpeed;
      }

      if (p.y < -10) {
        p.y = this.canvas.height + 10;
        p.x = Math.random() * this.canvas.width;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0, p.opacity)})`;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = '#ffeaa7';
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
};

// -------------------------------------------------------------------
// Scratch Card Component Controller
// -------------------------------------------------------------------
class ScratchCardController {
  constructor(cardEl, index, prizeData) {
    this.cardEl = cardEl;
    this.index = index;
    this.prizeData = prizeData;
    this.canvas = cardEl.querySelector('.scratch-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.isCompleted = false;
    this.lastPoint = null;
    this.totalPixels = 0;
    this.scratchCheckCounter = 0;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.renderCover(rect.width, rect.height);
  }

  renderCover(width, height) {
    const ctx = this.ctx;
    
    // Metallic Holographic Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (this.index === 0) {
      // Champagne Gold
      grad.addColorStop(0, '#f9df90');
      grad.addColorStop(0.3, '#d4af37');
      grad.addColorStop(0.7, '#eecf73');
      grad.addColorStop(1, '#aa8214');
    } else {
      // Rose Platinum
      grad.addColorStop(0, '#ffd1dc');
      grad.addColorStop(0.4, '#b76e79');
      grad.addColorStop(0.7, '#f5b7b1');
      grad.addColorStop(1, '#965a63');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Stardust Dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 40; i++) {
      const rx = (i * 37) % width;
      const ry = (i * 59) % height;
      ctx.beginPath();
      ctx.arc(rx, ry, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Elegant Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Text Label
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelText = this.index === 0 
      ? '✨ 手指輕刮 領取 ☕ 飲料一杯 ✨' 
      : '✨ 手指輕刮 揭曉 🎁 神秘小禮 ✨';
    ctx.fillText(labelText, width / 2, height / 2 - 8);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('刮開面積超過 50% 自動解鎖', width / 2, height / 2 + 16);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  bindEvents() {
    const canvas = this.canvas;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.startScratch(e));
    window.addEventListener('mousemove', (e) => this.scratch(e));
    window.addEventListener('mouseup', () => this.endScratch());

    // Touch events for mobile & Instagram browser
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startScratch(e.touches[0]);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.scratch(e.touches[0]);
    }, { passive: false });

    canvas.addEventListener('touchend', () => this.endScratch());

    // Quick reveal button
    const quickBtn = this.cardEl.querySelector('.quick-reveal-btn');
    if (quickBtn) {
      quickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.completeCard();
      });
    }
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startScratch(e) {
    if (this.isCompleted) return;
    this.isDrawing = true;
    this.lastPoint = this.getPos(e);
    this.eraseCircle(this.lastPoint.x, this.lastPoint.y);
  }

  scratch(e) {
    if (!this.isDrawing || this.isCompleted) return;
    const currentPoint = this.getPos(e);
    
    this.eraseLine(this.lastPoint.x, this.lastPoint.y, currentPoint.x, currentPoint.y);
    this.lastPoint = currentPoint;

    // Throttle sound & progress check
    this.scratchCheckCounter++;
    if (this.scratchCheckCounter % 4 === 0) {
      AudioSynth.playScratchSound();
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(8);
      }
    }

    if (this.scratchCheckCounter % 12 === 0) {
      this.checkProgress();
    }
  }

  endScratch() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (!this.isCompleted) {
      this.checkProgress();
    }
  }

  eraseCircle(x, y) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  eraseLine(x1, y1, x2, y2) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  checkProgress() {
    if (this.isCompleted) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Sample down for quick calculation
    const step = 10;
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    let transparentCount = 0;
    let totalSamples = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4 + 3; // Alpha channel
        if (pixels[index] < 128) {
          transparentCount++;
        }
        totalSamples++;
      }
    }

    const percentage = (transparentCount / totalSamples) * 100;
    const statusText = this.cardEl.querySelector('.scratch-status-text');
    if (statusText) {
      statusText.textContent = `已刮開 ${Math.min(100, Math.round(percentage))}%`;
    }

    if (percentage > 48) {
      this.completeCard();
    }
  }

  completeCard() {
    this.isCompleted = true;
    this.canvas.style.opacity = '0';
    setTimeout(() => {
      this.canvas.style.display = 'none';
    }, 600);

    this.cardEl.classList.add('completed');
    const statusText = this.cardEl.querySelector('.scratch-status-text');
    if (statusText) {
      statusText.innerHTML = '🎉 恭喜兌換成功！';
      statusText.classList.add('unlocked');
    }

    AudioSynth.playWinChord();
    
    // Confetti burst for this card
    if (window.confetti) {
      const rect = this.cardEl.getBoundingClientRect();
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;
      window.confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#d4af37', '#ffd1dc', '#ff7675', '#74b9ff']
      });
    }

    showToast(`✨ 恭喜解鎖：${this.prizeData.title}！`);
  }
}

// -------------------------------------------------------------------
// Master Application Controller
// -------------------------------------------------------------------
const App = {
  config: null,
  countdownInterval: null,
  easterEggClicks: 0,
  scratchCards: [],

  async init() {
    this.config = ConfigManager.getConfig();
    this.applyConfigToDOM();
    this.bindEvents();
    AmbientCanvas.init();
    this.evaluateDisplayState();

    const remote = await ConfigManager.syncRemoteConfig();
    if (remote) {
      this.config = ConfigManager.getConfig();
      this.applyConfigToDOM();
      this.evaluateDisplayState();
    }
  },

  applyConfigToDOM() {
    const c = this.config;

    // Recipient Names
    const heroName = document.getElementById('heroChineseName');
    if (heroName) heroName.textContent = c.recipientName || '賴品岑';

    const heroEn = document.getElementById('heroEnglishName');
    if (heroEn) heroEn.textContent = c.recipientNickname || c.recipientEnglish || 'Patty';

    const letterTo = document.getElementById('letterToName');
    if (letterTo) letterTo.textContent = c.recipientNickname || 'Patty';

    document.querySelectorAll('.recipient-name-text').forEach(el => {
      el.textContent = c.recipientName;
    });

    // Countdown Texts
    const cdTitle = document.getElementById('countdownTitle');
    if (cdTitle) cdTitle.textContent = c.countdownTitle;

    const cdSubtitle = document.getElementById('countdownSubtitle');
    if (cdSubtitle) cdSubtitle.textContent = c.countdownSubtitle;

    // Hero Tagline
    const heroTag = document.getElementById('heroTagline');
    if (heroTag) heroTag.textContent = c.heroTagline;

    // Photo Captions
    const cap1 = document.getElementById('photo1CaptionText');
    if (cap1) cap1.textContent = c.photo1Caption || '✨ 願妳的每一歲都奔走在熱愛裡 ‧ 永遠閃亮的 Patty ✨';

    const cap2 = document.getElementById('photo2CaptionText');
    if (cap2) cap2.textContent = c.photo2Caption || '💖 在 Catherine 課堂展開第三年友情 ‧ 全世界最棒的 Patty 賴品岑 💖';

    // Card Letter Text
    const letterBody = document.getElementById('letterBodyText');
    if (letterBody) letterBody.textContent = c.cardLetter;

    // Author Signoff
    const signoff = document.getElementById('letterSignoffText');
    if (signoff) signoff.textContent = c.authorSign || 'Bobo 上';

    // Prize Contents
    if (c.prizes && c.prizes.length >= 2) {
      const p1 = c.prizes[0];
      const p2 = c.prizes[1];

      document.getElementById('prize1Title').textContent = p1.title;
      document.getElementById('prize1Desc').textContent = p1.desc;
      document.getElementById('prize1Code').textContent = p1.code;
      document.getElementById('prize1CardTitle').textContent = p1.title.split('‧')[0].trim() || '特調飲品券';

      document.getElementById('prize2Title').textContent = p2.title;
      document.getElementById('prize2Desc').textContent = p2.desc;
      document.getElementById('prize2Code').textContent = p2.code;
      document.getElementById('prize2CardTitle').textContent = p2.title.split('‧')[0].trim() || '神秘小禮物';
    }
  },

  bindEvents() {
    // Music Toggle Button
    const musicBtn = document.getElementById('musicToggleBtn');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => AudioSynth.toggleMelody());
    }

    // Unboxing Overlay
    const unboxOverlay = document.getElementById('unboxingOverlay');
    if (unboxOverlay) {
      const dismissUnbox = (e) => {
        if (e && e.type === 'touchend') e.preventDefault();
        unboxOverlay.classList.add('opened');
        unboxOverlay.style.display = 'none';
        AudioSynth.startMelody();
        if (window.confetti) {
          window.confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
      };
      unboxOverlay.addEventListener('click', dismissUnbox);
      unboxOverlay.addEventListener('touchend', dismissUnbox);
    }

    // Photo Lightbox & 3D Tilt for all polaroid frames
    const photoLightbox = document.getElementById('photoLightbox');
    const lightboxImg = document.getElementById('lightboxImg');

    document.querySelectorAll('.polaroid-frame').forEach(frame => {
      // Lightbox click
      frame.addEventListener('click', () => {
        const src = frame.dataset.lightbox || frame.querySelector('img')?.src;
        if (src && lightboxImg) lightboxImg.src = src;
        if (photoLightbox) photoLightbox.classList.add('open');
      });

      // 3D Tilt effect
      frame.addEventListener('mousemove', (e) => {
        const rect = frame.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const tiltX = (y / rect.height) * -10;
        const tiltY = (x / rect.width) * 10;
        frame.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
      });

      frame.addEventListener('mouseleave', () => {
        const isRight = frame.classList.contains('polaroid-right');
        frame.style.transform = `rotate(${isRight ? '1.8deg' : '-1.5deg'})`;
      });
    });

    if (photoLightbox) {
      photoLightbox.addEventListener('click', () => {
        photoLightbox.classList.remove('open');
      });
    }

    // Copy Voucher Code Buttons
    document.querySelectorAll('.redeem-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            showToast(`已複製兌換代碼：${code}`);
          });
        }
      });
    });

    // Easter Egg (Cake Button)
    const cakeBtn = document.getElementById('easterEggBtn');
    if (cakeBtn) {
      cakeBtn.addEventListener('click', () => {
        this.easterEggClicks++;
        AudioSynth.playBell(500 + this.easterEggClicks * 100, 0.3);
        if (this.easterEggClicks >= 5) {
          this.easterEggClicks = 0;
          if (window.confetti) {
            window.confetti({
              particleCount: 150,
              spread: 120,
              origin: { y: 0.8 }
            });
          }
          alert(this.config.easterEggMessage || '🎉 生日快樂！祝 品岑 永遠開心、平安順遂！');
        }
      });
    }
  },

  evaluateDisplayState() {
    clearInterval(this.countdownInterval);
    const countdownScreen = document.getElementById('countdownScreen');
    const celebrationView = document.getElementById('celebrationView');
    const mode = this.config.mode;

    if (mode === 'unlocked') {
      this.showCelebration();
      return;
    }

    if (mode === 'locked') {
      this.showCountdown(true); // Locked indefinitely
      return;
    }

    // 'timer' mode: check target time
    const targetDate = new Date(this.config.targetTime);
    const now = new Date();

    if (now >= targetDate) {
      this.showCelebration();
    } else {
      this.showCountdown(false, targetDate);
    }
  },

  showCountdown(isIndefinite, targetDate = null) {
    const countdownScreen = document.getElementById('countdownScreen');
    const celebrationView = document.getElementById('celebrationView');
    const unboxingOverlay = document.getElementById('unboxingOverlay');
    
    countdownScreen.style.display = 'flex';
    celebrationView.style.display = 'none';
    if (unboxingOverlay) unboxingOverlay.style.display = 'none';

    if (isIndefinite) {
      document.getElementById('daysVal').textContent = '--';
      document.getElementById('hoursVal').textContent = '--';
      document.getElementById('minutesVal').textContent = '--';
      document.getElementById('secondsVal').textContent = '--';
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(this.countdownInterval);
        this.onCountdownComplete();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      document.getElementById('daysVal').textContent = String(days).padStart(2, '0');
      document.getElementById('hoursVal').textContent = String(hours).padStart(2, '0');
      document.getElementById('minutesVal').textContent = String(minutes).padStart(2, '0');
      document.getElementById('secondsVal').textContent = String(seconds).padStart(2, '0');
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  },

  onCountdownComplete() {
    if (window.confetti) {
      window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    }
    AudioSynth.playWinChord();
    showToast('✨ 倒數結束！驚喜正式解鎖！✨');
    setTimeout(() => {
      this.showCelebration();
    }, 1200);
  },

  showCelebration() {
    const countdownScreen = document.getElementById('countdownScreen');
    const celebrationView = document.getElementById('celebrationView');
    const unboxingOverlay = document.getElementById('unboxingOverlay');
    
    countdownScreen.style.display = 'none';
    celebrationView.style.display = 'block';
    if (unboxingOverlay && !unboxingOverlay.classList.contains('opened')) {
      unboxingOverlay.style.display = 'flex';
    }

    // Initialize scratch cards
    this.initScratchCards();
  },

  initScratchCards() {
    if (this.scratchCards.length > 0) return; // already initialized
    const cards = document.querySelectorAll('.scratch-card');
    cards.forEach((cardEl, idx) => {
      const prize = this.config.prizes[idx] || {};
      const controller = new ScratchCardController(cardEl, idx, prize);
      this.scratchCards.push(controller);
    });
  }
};

// Global Toast utility
function showToast(msg) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Kick off when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
