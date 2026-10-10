'use strict';
/* ===== Sound: procedural sound effects, ambience and generative music (Web Audio — no audio files) ===== */

const Sfx = {
  ctx: null, master: null, sfxBus: null, musBus: null, ambBus: null, verb: null, noiseBuf: null,
  last: {}, started: false, mood: null, nextBar: 0, bar: 0, step: 0, amb: {}, lastBell: 0,
  cfg() { const s = (typeof S !== 'undefined' && S && S.settings) || {}; return { sfx: s.sound !== false, music: s.music !== false, amb: s.ambient !== false, vol: s.vol == null ? 0.8 : s.vol, mvol: s.mvol == null ? 0.45 : s.mvol, avol: s.avol == null ? 0.5 : s.avol }; },
  /* the browser only lets audio start after a click or key press */
  unlock() {
    try {
      if (!this.ctx) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const c = this.ctx = new C();
        this.master = c.createGain(); this.master.connect(c.destination);
        this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
        this.musBus = c.createGain(); this.ambBus = c.createGain();
        // a cheap reverb: a decaying noise impulse
        this.verb = c.createConvolver(); const len = Math.floor(c.sampleRate * 2.2), ir = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        this.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = 0.55; this.verb.connect(vg); vg.connect(this.master);
        this.musBus.connect(this.master); this.musBus.connect(this.verb); this.ambBus.connect(this.master);
        const nb = this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.started) { this.started = true; this.nextBar = this.ctx.currentTime + 0.3; setInterval(() => this.tick(), 120); }
      this.apply();
    } catch (e) {}
  },
  apply() {
    if (!this.ctx) return; const c = this.cfg(), t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(1, t, 0.05); this.sfxBus.gain.setTargetAtTime(c.sfx ? c.vol : 0, t, 0.05);
    this.musBus.gain.setTargetAtTime(c.music ? c.mvol * 0.5 : 0, t, 0.4); this.ambBus.gain.setTargetAtTime(c.amb ? c.avol * 0.5 : 0, t, 0.6);
  },
  /* ---- building blocks ---- */
  tone(freq, t0, dur, o) {
    o = o || {}; const c = this.ctx, osc = c.createOscillator(), g = c.createGain(), bus = o.bus || this.sfxBus;
    osc.type = o.type || 'triangle'; osc.frequency.setValueAtTime(freq, t0); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const a = o.attack || 0.01, v = o.vol == null ? 0.2 : o.vol; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); if (o.filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter; g.connect(f); f.connect(bus); } else g.connect(bus);
    osc.start(t0); osc.stop(t0 + dur + 0.05); return osc;
  },
  noise(t0, dur, o) {
    o = o || {}; const c = this.ctx, src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), bus = o.bus || this.sfxBus;
    src.buffer = this.noiseBuf; src.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1800, t0); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur); f.Q.value = o.q || 0.8;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.15, t0 + (o.attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  },
  /* ---- effects ---- */
  play(kind) {
    const cfg = this.cfg(); if (!cfg.sfx) return; this.unlock(); if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, gap = { pop: 0.05, sale: 0.08, bell: 1.2, thunder: 1.5, click: 0.03 }[kind] || 0.04; if (this.last[kind] && now - this.last[kind] < gap) return; this.last[kind] = now;
    const t = now + 0.005, n = (f) => 440 * Math.pow(2, (f - 69) / 12);
    switch (kind) {
      case 'sale': this.tone(n(88), t, 0.09, { type: 'triangle', vol: 0.12 }); this.tone(n(95), t + 0.07, 0.24, { type: 'sine', vol: 0.14 }); this.noise(t, 0.12, { type: 'highpass', freq: 6000, vol: 0.05 }); break;
      case 'coin': [84, 91, 96, 103].forEach((m, i) => this.tone(n(m), t + i * 0.06, 0.3, { type: 'sine', vol: 0.12 })); break;
      case 'pop': this.tone(380, t, 0.09, { type: 'sine', to: 900, vol: 0.18 }); break;
      case 'buy': this.tone(n(76), t, 0.07, { type: 'square', vol: 0.05, filter: 2200 }); this.tone(n(83), t + 0.06, 0.1, { type: 'triangle', vol: 0.12 }); break;
      case 'good': [72, 76, 79, 84].forEach((m, i) => this.tone(n(m), t + i * 0.07, 0.2, { type: 'triangle', vol: 0.13 })); break;
      case 'level': [72, 76, 79, 84, 88].forEach((m, i) => this.tone(n(m), t + i * 0.09, 0.32, { type: 'triangle', vol: 0.15 })); this.tone(n(60), t, 0.9, { type: 'sine', vol: 0.12 }); break;
      case 'err': this.tone(150, t, 0.16, { type: 'sawtooth', to: 110, vol: 0.12, filter: 900 }); break;
      case 'click': this.tone(1200, t, 0.03, { type: 'square', vol: 0.04 }); break;
      case 'bell': this.tone(n(88), t, 0.5, { type: 'sine', vol: 0.1 }); this.tone(n(84), t + 0.18, 0.7, { type: 'sine', vol: 0.1 }); break;
      case 'card': this.noise(t, 0.25, { type: 'bandpass', freq: 600, to: 3200, vol: 0.12, attack: 0.05 }); this.tone(n(79), t + 0.2, 0.5, { type: 'sine', vol: 0.08 }); this.tone(n(86), t + 0.28, 0.6, { type: 'sine', vol: 0.08 }); break;
      case 'splash': this.noise(t, 0.5, { type: 'bandpass', freq: 1400, to: 500, vol: 0.18 }); this.tone(220, t, 0.25, { type: 'sine', to: 90, vol: 0.12 }); break;
      case 'thunder': this.noise(t + 0.15, 2.4, { type: 'lowpass', freq: 380, to: 80, vol: 0.55, attack: 0.25 }); this.noise(t, 0.12, { type: 'highpass', freq: 3000, vol: 0.2 }); break;
      case 'event': [67, 71, 74, 79].forEach((m, i) => this.tone(n(m), t + i * 0.1, 0.35, { type: 'triangle', vol: 0.13 })); break;
      default: break;
    }
  },
  /* ---- ambience and music, driven by a scheduler ---- */
  tick() {
    if (!this.ctx || this.ctx.state !== 'running' || typeof S === 'undefined' || !S) return;
    const c = this.cfg(), t = this.ctx.currentTime; this.apply();
    this.ambience(c, t); if (c.music) this.music(t);
  },
  currentMood() {
    if (typeof wxNow !== 'function') return 'day';
    if (S.town && S.town.cur) return 'event'; const k = S.wx.kind; if (k === 'storm') return 'storm'; if (k === 'rain' || k === 'snow') return 'rain';
    const h = lightHour(); return h >= 21 || h < 5.5 ? 'night' : h >= 17 ? 'evening' : 'day';
  },
  ambience(c, t) {
    const A = this.amb;
    const layer = (id, make) => { if (!A[id]) A[id] = make(); return A[id]; };
    const water = layer('water', () => { const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); src.buffer = this.noiseBuf; src.loop = true; f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.4; g.gain.value = 0; lfo.frequency.value = 0.13; lg.gain.value = 140; lfo.connect(lg); lg.connect(f.frequency); src.connect(f); f.connect(g); g.connect(this.ambBus); src.start(); lfo.start(); return { g }; });
    water.g.gain.setTargetAtTime(0.5, t, 1);
    const rain = layer('rain', () => { const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain(); src.buffer = this.noiseBuf; src.loop = true; f.type = 'highpass'; f.frequency.value = 1500; g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.ambBus); src.start(); return { g }; });
    const kind = S.wx ? S.wx.kind : 'clear'; rain.g.gain.setTargetAtTime(kind === 'rain' ? 0.32 : kind === 'storm' ? 0.55 : 0, t, 1.5);
    // bubbles now and then
    if (Math.random() < 0.05) this.tone(500 + Math.random() * 500, t + Math.random() * 0.2, 0.08, { type: 'sine', to: 1400, vol: 0.05, bus: this.ambBus });
    // crickets at night, birds by day
    const h = typeof lightHour === 'function' ? lightHour() : 12, night = h >= 21 || h < 5.5;
    if (night && kind !== 'rain' && kind !== 'storm' && Math.random() < 0.18) { for (let i = 0; i < 3; i++) this.tone(4300 + Math.random() * 300, t + i * 0.07, 0.05, { type: 'sine', vol: 0.02, bus: this.ambBus }); }
    else if (!night && (kind === 'clear' || kind === 'cloudy') && Math.random() < 0.03 && UI && (UI.tab === 'home')) { const b = 2000 + Math.random() * 900; this.tone(b, t, 0.08, { type: 'sine', to: b * 1.3, vol: 0.03, bus: this.ambBus }); this.tone(b * 1.2, t + 0.1, 0.08, { type: 'sine', to: b * 0.9, vol: 0.03, bus: this.ambBus }); }
    if (kind === 'storm' && S.wx.flash && this._thunderFor !== S.wx.flash) { this._thunderFor = S.wx.flash; setTimeout(() => this.play('thunder'), 0); }
  },
  MOODS: {
    day:     { tempo: 92, root: 60, chords: [[0, 4, 7, 11], [9, -3, 0, 4], [5, 9, 12, 16], [7, 11, 14, 17]], arp: [0, 2, 1, 3, 2, 1, 3, 2], lead: [0, 2, 4, 7, 9], vol: 1 },
    evening: { tempo: 78, root: 57, chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]], arp: [0, 1, 2, 3, 2, 1], lead: [0, 3, 5, 7, 10], vol: 0.95 },
    night:   { tempo: 58, root: 50, chords: [[0, 3, 7, 10, 14], [-4, 0, 3, 7, 11], [-7, -3, 0, 4, 7], [-2, 2, 5, 9, 12]], arp: [0, -1, 2, -1, 1, -1, 3, -1], lead: [0, 3, 7, 10], vol: 0.8 },
    rain:    { tempo: 66, root: 52, chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-9, -5, -2, 2], [-5, -2, 2, 5]], arp: [0, -1, 2, -1, 1, -1, 3, 2], lead: [0, 3, 5, 7, 10], vol: 0.85, soft: true },
    storm:   { tempo: 54, root: 38, chords: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], arp: [0, -1, -1, -1, 1, -1, -1, -1], lead: [0, 3, 7], vol: 0.9, drone: true },
    event:   { tempo: 118, root: 60, chords: [[0, 4, 7, 12], [7, 11, 14, 19], [9, 12, 16, 21], [5, 9, 12, 17]], arp: [0, 1, 2, 3, 2, 3, 1, 2], lead: [0, 2, 4, 7, 9, 12], vol: 1 },
  },
  music(t) {
    if (t < this.nextBar - 0.6) return;
    const m = this.MOODS[this.currentMood()] || this.MOODS.day, beat = 60 / m.tempo, c = this.ctx, mid = f => 440 * Math.pow(2, (f - 69) / 12), chord = m.chords[this.bar % 4], t0 = this.nextBar, bus = this.musBus;
    // pad: long soft notes
    chord.forEach(i => this.tone(mid(m.root + i - 12), t0, beat * 4.2, { type: 'sine', vol: m.soft ? 0.05 : 0.07, attack: beat * 1.2, bus, filter: 1400 }));
    // bass on the first beat
    this.tone(mid(m.root + chord[0] - 24), t0, beat * 1.6, { type: 'triangle', vol: 0.1 * m.vol, bus, filter: 500 });
    if (m.drone) this.tone(mid(m.root - 12), t0, beat * 4, { type: 'sawtooth', vol: 0.03, bus, filter: 220, attack: beat });
    // arpeggio, one note per half beat
    for (let s = 0; s < 8; s++) {
      const idx = m.arp[s]; if (idx < 0) continue; if (m.soft && s % 2 && Math.random() < 0.5) continue;
      const note = mid(m.root + chord[idx % chord.length] + (idx >= chord.length ? 12 : 0)); this.tone(note, t0 + s * beat * 0.5, beat * (m.soft ? 1.4 : 0.9), { type: m.soft ? 'sine' : 'triangle', vol: (m.soft ? 0.09 : 0.075) * m.vol, bus });
    }
    // a little melody in the second half of every other bar
    if (this.bar % 2 === 1 && Math.random() < 0.8) { let tt = t0 + beat * 2; for (let k = 0; k < 3; k++) { const deg = m.lead[Math.floor(Math.random() * m.lead.length)]; this.tone(mid(m.root + 12 + deg), tt, beat * (0.8 + Math.random() * 0.8), { type: 'sine', vol: 0.07 * m.vol, bus }); tt += beat * (0.5 + Math.floor(Math.random() * 2) * 0.5); } }
    this.nextBar = t0 + beat * 4; this.bar++;
  },
  /* the mood currently playing, for the settings page */
  moodName() { return { day: 'Daytime theme', evening: 'Evening theme', night: 'Night theme', rain: 'Rainy-day theme', storm: 'Storm theme', event: 'Event theme' }[this.currentMood()]; },
};
document.addEventListener('pointerdown', () => Sfx.unlock(), { capture: true });
document.addEventListener('keydown', () => Sfx.unlock(), { capture: true });
