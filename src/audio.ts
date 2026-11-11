/**
 * A living outdoor soundscape, synthesised in the browser (WebAudio, no recordings).
 *
 * The aim is "being outside", not "music": there is no sustained synth chord.
 * Every sound is modelled on how the real thing is made, and placed somewhere:
 *  - air: a breeze that gusts (two layers of brown noise with slow random gusts),
 *    leaves that rustle when it gusts, a faint whistle over mountains
 *  - water: lake lapping, small bubbles (rising "Minnaert" chirps, the sound of a
 *    real air bubble), rain as a soft bed plus individual drops on leaves and water
 *  - creatures: resident songbirds with their own songs, a dove, crickets that
 *    chirp in pulse trains (kept faint and far), spring peepers and a green frog by
 *    the lake, an owl at night, a hawk far over the mountains, distant thunder
 *  - touch: a kalimba (plucked metal tine) and real wind-chime tubes (inharmonic
 *    partials), tuned to the planted emotions, plus earth, leaf and water sounds
 * Everything goes through a stereo position, distance (air absorbs highs), and
 * a generated outdoor reverb, which is most of what makes it sound real.
 */
export interface Mood {
  rain: number; wind: number; birds: number; night: number; sparkle: number; bright: number; water: number;
  bees: number; frogs: number; owl: number; hawk: number; doves: number; leaves: number;
}
type Pt = (u: number) => number;
interface Seg { dur: number; f?: Pt; a?: Pt }
type BirdKind = 'warbler' | 'whistler' | 'caroler' | 'chip';
interface Bird { kind: BirdKind; p: number; pan: number; dist: number; vol: number }
interface Cricket { pulse: GainNode; level: GainNode; next: number; period: number; pulses: number; vol: number }

const r = Math.random;
const arc = (u: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
const soft = (u: number) => Math.pow(arc(u), 0.6);
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

export class Sound {
  on = false;
  private ac: AudioContext | null = null;
  private master!: GainNode; private dry!: GainNode; private verb!: GainNode;
  private white!: AudioBuffer; private pink!: AudioBuffer; private brown!: AudioBuffer;
  private windA!: { g: GainNode; f: BiquadFilterNode }; private windB!: { g: GainNode; f: BiquadFilterNode };
  private whistle!: { g: GainNode; f: BiquadFilterNode }; private rustle!: { g: GainNode; f: BiquadFilterNode };
  private rainBed!: { g: GainNode; f: BiquadFilterNode }; private rainFar!: { g: GainNode; f: BiquadFilterNode };
  private lake!: { g: GainNode; f: BiquadFilterNode }; private air!: { g: GainNode; f: BiquadFilterNode };
  private crickets: Cricket[] = [];
  private birds: Bird[] = [];
  private frogs: { pan: number; dist: number; p: number }[] = [];
  private gust = [0.5, 0.5]; private gustTo = [0.5, 0.5]; private gustIn = [0, 0];
  private mood: Mood = { rain: 0, wind: 0, birds: 0, night: 0, sparkle: 0, bright: 0, water: 0, bees: 0, frogs: 0, owl: 0, hawk: 0, doves: 0, leaves: 0 };
  private timers = { bird: 1.5, frog: 2, bee: 5, owl: 6, hawk: 8, dove: 6, chime: 3, lap: 1, swap: 40 };
  private root = 196;
  private chord: number[] = [0, 7, 12, 16];
  private tag: HTMLAudioElement | null = null;

  constructor() {
    // iPhones silence web audio when the ring/silent switch is on unless the page asks to be treated as media playback
    try { const as = (navigator as any).audioSession; if (as) as.type = 'playback'; } catch { /* older browsers */ }
  }
  /** true only when sound is wanted AND the browser is actually letting it play */
  get audible() { return this.on && !!this.ac && this.ac.state === 'running'; }

  /**
   * Turn sound on, and do every unlocking step phones need. Safe to call on every
   * touch: phones only allow audio to start inside certain gestures (touchend/click
   * on iPhone, pointerup on Android), so it is called from all of them.
   */
  start() {
    this.on = true;
    try {
      if (!this.ac) this.build();
      const ac = this.ac!;
      if (ac.state !== 'running') void ac.resume().catch(() => { /* try again on the next touch */ });
      // older iPhones only unlock once something is actually played inside the gesture
      const b = ac.createBufferSource(); b.buffer = ac.createBuffer(1, 1, 22050); b.connect(ac.destination); b.start(0);
      // a silent, looping media element moves iPhones onto the media channel, so the silent switch no longer mutes us
      if (!this.tag) { this.tag = new Audio(silentWav()); this.tag.loop = true; (this.tag as any).playsInline = true; this.tag.volume = 0; }
      void this.tag.play().catch(() => { /* not allowed yet: the next touch will try again */ });
      this.master.gain.setTargetAtTime(2.2, ac.currentTime, 0.8);
    } catch { /* no web audio at all: the garden stays silent */ }
  }
  stop() {
    this.on = false;
    this.tag?.pause();
    if (this.ac) this.master.gain.setTargetAtTime(0, this.ac.currentTime, 0.15);
  }
  /** must be called from a user gesture */
  toggle(): boolean {
    if (this.audible) this.stop(); else this.start();
    return this.on;
  }
  /** touch browsers only unlock audio on release, so nudge the context again then */
  wake() { if (this.on && !this.audible) this.start(); }

  /* ================= building the world's air ================= */
  private build() {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ac: AudioContext = new AC({ latencyHint: 'playback' }); this.ac = ac;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.4;
    comp.connect(ac.destination);
    this.master = ac.createGain(); this.master.gain.value = 0; this.master.connect(comp);
    this.dry = ac.createGain(); this.dry.connect(this.master);
    const conv = ac.createConvolver(); conv.buffer = this.impulse(2.8);
    this.verb = ac.createGain(); this.verb.gain.value = 0.5; this.verb.connect(conv); conv.connect(this.master);

    this.white = this.noise('white'); this.pink = this.noise('pink'); this.brown = this.noise('brown');
    this.windA = this.bed(this.brown, [this.filt('lowpass', 350, 0.6)], -0.6, 0.25);
    this.windB = this.bed(this.brown, [this.filt('lowpass', 300, 0.6)], 0.6, 0.25);
    this.whistle = this.bed(this.pink, [this.filt('bandpass', 620, 9)], 0.2, 0.5);
    this.rustle = this.bed(this.white, [this.filt('bandpass', 5200, 0.8), this.filt('highpass', 1800, 0.7)], -0.25, 0.3);
    this.rainBed = this.bed(this.pink, [this.filt('lowpass', 6500, 0.5), this.filt('highpass', 500, 0.6)], 0, 0.35);
    this.rainFar = this.bed(this.brown, [this.filt('lowpass', 900, 0.5)], 0, 0.4);
    this.lake = this.bed(this.brown, [this.filt('lowpass', 520, 0.8)], 0.45, 0.3);
    this.air = this.bed(this.pink, [this.filt('bandpass', 600, 2.5)], 0, 0.3);
    const room = this.bed(this.pink, [this.filt('lowpass', 260, 0.5)], 0, 0.2); room.g.gain.value = 0.012; // the outdoors is never silent

    for (let i = 0; i < 3; i++) { // crickets: a pure tone at 4-5 kHz, pulsed 3-4 times per chirp
      const o = ac.createOscillator(); o.frequency.value = 3600 + r() * 500;
      const pulse = ac.createGain(); pulse.gain.value = 0;
      const level = ac.createGain(); level.gain.value = 0;
      o.connect(pulse); pulse.connect(level); level.connect(this.spot(r() * 1.8 - 0.9, 0.75 + r() * 0.2)); o.start();
      this.crickets.push({ pulse, level, next: ac.currentTime + r(), period: 0.55 + r() * 0.5, pulses: 3 + Math.floor(r() * 2), vol: 0.012 + r() * 0.008 });
    }
    for (let i = 0; i < 5; i++) this.birds.push(this.newBird((['warbler', 'warbler', 'whistler', 'caroler', 'chip'] as BirdKind[])[i]));
    for (let i = 0; i < 3; i++) this.frogs.push({ pan: 0.2 + r() * 0.7, dist: 0.35 + r() * 0.4, p: 2550 + r() * 500 });
  }

  private noise(kind: 'white' | 'pink' | 'brown'): AudioBuffer {
    const ac = this.ac!, n = ac.sampleRate * 4, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'pink') { // Paul Kellet's filter
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    // crossfade the loop point so the bed never clicks
    const fade = Math.floor(ac.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] = d[i] * k + d[n - fade + i] * (1 - k); }
    return b;
  }
  /** an outdoor space: no walls, so a soft diffuse tail that darkens as it fades */
  private impulse(sec: number): AudioBuffer {
    const ac = this.ac!, n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate), pre = Math.floor(ac.sampleRate * 0.018);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let y = 0;
      for (let i = 0; i < n; i++) { const u = i / n, x = (r() * 2 - 1) * Math.pow(1 - u, 3); y += (0.6 - 0.52 * u) * (x - y); d[i] = i < pre ? 0 : y * 1.4; }
    }
    return b;
  }
  private filt(type: BiquadFilterType, freq: number, q = 0.7) { const f = this.ac!.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
  private pan(p: number): AudioNode {
    const ac = this.ac!;
    if ((ac as any).createStereoPanner) { const s = ac.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p)); return s; }
    return ac.createGain();
  }
  private bed(buf: AudioBuffer, chain: BiquadFilterNode[], p: number, send: number) {
    const ac = this.ac!, src = ac.createBufferSource(); src.buffer = buf; src.loop = true; src.playbackRate.value = 0.9 + r() * 0.2;
    let node: AudioNode = src; for (const f of chain) { node.connect(f); node = f; }
    const g = ac.createGain(); g.gain.value = 0; node.connect(g);
    const pn = this.pan(p); g.connect(pn); pn.connect(this.dry);
    const s = ac.createGain(); s.gain.value = send; pn.connect(s); s.connect(this.verb);
    src.start(0, r() * 3.5);
    return { g, f: chain[0] };
  }
  /** a place in the world: pan -1..1, dist 0 (at your ear) .. 1 (far away). Returns where to plug a sound in. */
  private spot(p: number, dist: number): AudioNode {
    const ac = this.ac!, lp = this.filt('lowpass', 15000 - dist * 10500, 0.5), pn = this.pan(p), g = ac.createGain();
    g.gain.value = 1 - dist * 0.6;
    lp.connect(pn); pn.connect(g); g.connect(this.dry);
    const s = ac.createGain(); s.gain.value = 0.15 + dist * 0.75; pn.connect(s); s.connect(this.verb);
    return lp;
  }
  private at(delay: number) { return this.ac!.currentTime + 0.02 + delay; }

  /* ================= small sound-making tools ================= */
  /** one voice following a pitch and loudness contour: the basis of every bird and frog */
  private phrase(segs: Seg[], t0: number, out: AudioNode, vol: number, harm = 0.1, type: OscillatorType = 'sine') {
    const ac = this.ac!, R = 600, total = segs.reduce((s, q) => s + q.dur, 0), n = Math.max(8, Math.ceil(total * R));
    const fr = new Float32Array(n), am = new Float32Array(n);
    let i = 0, lastF = 1000;
    for (const sg of segs) {
      const m = Math.max(1, Math.round(sg.dur * R));
      for (let k = 0; k < m && i < n; k++, i++) { const u = k / Math.max(1, m - 1); if (sg.f) lastF = sg.f(u); fr[i] = lastF; am[i] = sg.a ? Math.max(0, sg.a(u)) * vol : 0; }
    }
    for (; i < n; i++) { fr[i] = lastF; am[i] = 0; }
    am[0] = 0; am[n - 1] = 0;
    const voice = (mult: number, amp: number, ty: OscillatorType) => {
      const o = ac.createOscillator(); o.type = ty; o.frequency.value = fr[0] * mult;
      const g = ac.createGain(); g.gain.value = 0;
      o.frequency.setValueCurveAtTime(mult === 1 ? fr : fr.map(v => v * mult), t0, total);
      g.gain.setValueCurveAtTime(amp === 1 ? am : am.map(v => v * amp), t0, total);
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + total + 0.05);
    };
    voice(1, 1, type);
    if (harm > 0) voice(2, harm, 'sine');
    return total;
  }
  /** a short burst of filtered noise: raindrops on leaves, soil, a twig */
  private burst(buf: AudioBuffer, t0: number, dur: number, vol: number, out: AudioNode, type: BiquadFilterType, freq: number, q = 1, attack = 0.002) {
    const ac = this.ac!, src = ac.createBufferSource(); src.buffer = buf;
    const f = this.filt(type, freq, q), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + dur);
    src.connect(f); f.connect(g); g.connect(out); src.start(t0, r() * 3); src.stop(t0 + attack + dur + 0.05);
    return f;
  }
  /** a real air bubble rings at a pitch set by its size and rises as it closes: drops on water, the lake, a "plop" */
  private bubble(t0: number, f: number, vol: number, out: AudioNode, dur = 0.06, rise = 1.6) {
    const ac = this.ac!, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * rise, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private partial(t0: number, f: number, vol: number, decay: number, out: AudioNode, bend = 1) {
    const ac = this.ac!, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(f * bend, t0); if (bend !== 1) o.frequency.exponentialRampToValueAtTime(f, t0 + 0.045);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + decay + 0.05);
  }
  /** a kalimba: a plucked metal tine, warm fundamental, quick bright overtone, a little pitch settle */
  private kalimba(t0: number, f: number, vol: number, out: AudioNode, decay = 1.1) {
    this.partial(t0, f, vol, decay, out, 1.012);
    this.partial(t0, f * 2.01, vol * 0.07, decay * 0.45, out);
    this.partial(t0, f * 5.93, vol * 0.16, 0.16, out);
    this.burst(this.white, t0, 0.006, vol * 0.25, out, 'bandpass', 2600, 1.2, 0.001);
  }
  /** a wind-chime tube: struck metal, inharmonic overtones that ring and fade at different rates */
  private tube(t0: number, f: number, vol: number, out: AudioNode) {
    for (const [m, a, d] of [[1, 1, 2.4], [2.76, 0.42, 1.3], [5.4, 0.2, 0.7], [8.93, 0.08, 0.35]]) this.partial(t0, f * m, vol * a, d, out);
    this.burst(this.white, t0, 0.004, vol * 0.3, out, 'highpass', 3500, 0.7, 0.001);
  }
  private hz(semi: number, octave = 1) { return this.root * octave * Math.pow(2, semi / 12); }
  private note(step: number) { return this.chord[((step % this.chord.length) + this.chord.length) % this.chord.length] + 12 * Math.floor(step / this.chord.length); }

  /* ================= creatures ================= */
  private newBird(kind: BirdKind): Bird {
    const p = kind === 'warbler' ? 3500 + r() * 1500 : kind === 'whistler' ? 2700 + r() * 900 : kind === 'caroler' ? 2100 + r() * 800 : 3600 + r() * 900;
    return { kind, p, pan: r() * 1.8 - 0.9, dist: 0.25 + r() * 0.65, vol: kind === 'chip' ? 0.05 : 0.07 + r() * 0.03 };
  }
  private song(b: Bird): Seg[] {
    const out: Seg[] = [], gap = (d: number) => out.push({ dur: d });
    switch (b.kind) {
      case 'warbler': { // a rapid run of down-slurred notes that speeds up and climbs at the end
        const n = 7 + Math.floor(r() * 8); let f = b.p * (0.96 + r() * 0.08);
        for (let i = 0; i < n; i++) {
          const f0 = f, d = (0.05 + r() * 0.02) * (i > n * 0.65 ? 0.8 : 1), depth = 0.22 + r() * 0.12, lv = 0.55 + 0.45 * (i / n);
          out.push({ dur: d, f: u => f0 * (1 + depth * (0.5 - u)) * (1 + 0.012 * Math.sin(u * 30)), a: u => soft(u) * lv });
          gap(0.012 + r() * 0.014); f *= i > n * 0.65 ? 1.05 : 0.993;
        }
        break;
      }
      case 'whistler': { // two to four clear, held whistles, stepping down ("fee-bee")
        const n = 2 + Math.floor(r() * 3); let f = b.p * 0.82;
        for (let i = 0; i < n; i++) {
          const f0 = f, d = 0.26 + r() * 0.18, glide = (r() - 0.5) * 0.05;
          out.push({ dur: d, f: u => f0 * (1 + glide * u) * (1 + 0.01 * Math.sin(u * d * Math.PI * 2 * 6)), a: u => Math.pow(arc(u), 0.35) });
          gap(0.07 + r() * 0.1); f *= i === 0 ? 0.85 : r() < 0.5 ? 1 : 0.94;
        }
        break;
      }
      case 'caroler': { // a robin-like run of rising-and-falling syllables at different pitches
        const n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) {
          const f0 = b.p * (0.78 + r() * 0.45), d = 0.11 + r() * 0.09, up = 0.12 + r() * 0.22;
          out.push({ dur: d, f: u => f0 * (1 + up * Math.sin(Math.PI * u)) * (1 + 0.018 * Math.sin(u * 55)), a: u => soft(u) });
          gap(0.06 + r() * 0.12);
        }
        break;
      }
      case 'chip': { // a few sharp call notes
        const n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { out.push({ dur: 0.03, f: u => b.p * 1.6 * (1 - 0.45 * u), a: arc }); gap(0.13 + r() * 0.2); }
        break;
      }
    }
    return out;
  }
  private sing(b: Bird, delay = 0) { return this.phrase(this.song(b), this.at(delay), this.spot(b.pan, b.dist), b.vol, 0.08); }
  /** one bird sings; sometimes it sings again, sometimes another answers */
  private birdBout(delay = 0) {
    const b = pick(this.birds), first = this.sing(b, delay);
    if (r() < 0.45) this.sing(b, delay + first + 0.8 + r() * 2.2);
    if (r() < 0.4) { const o = pick(this.birds.filter(q => q !== b)); if (o) this.sing(o, delay + first + 0.3 + r() * 1.5); }
  }
  private dove(delay = 0) { // "hoo-OO, hoo, hoo, hoo": soft, low, breathy
    const p = 470 + r() * 70, segs: Seg[] = [
      { dur: 0.32, f: u => p * (0.92 + 0.12 * u), a: u => Math.pow(arc(u), 0.7) * 0.55 }, { dur: 0.05 },
      { dur: 0.6, f: u => p * (1.1 - 0.1 * u), a: u => Math.pow(arc(u), 0.5) }, { dur: 0.22 }];
    for (let i = 0; i < 3; i++) segs.push({ dur: 0.44, f: u => p * (0.99 - 0.03 * u), a: u => Math.pow(arc(u), 0.6) * 0.8 }, { dur: 0.14 });
    const out = this.spot(0.55, 0.55), t0 = this.at(delay);
    this.phrase(segs, t0, out, 0.11, 0.05);
    this.burst(this.pink, t0, 1.6, 0.012, out, 'bandpass', p * 2, 2, 0.4); // the breath in it
  }
  private peep(delay = 0) { // spring peepers: short rising whistles, repeated
    const fr = pick(this.frogs), n = 2 + Math.floor(r() * 4), out = this.spot(fr.pan, fr.dist);
    for (let i = 0; i < n; i++) this.phrase([{ dur: 0.1, f: u => fr.p * (0.86 + 0.2 * u), a: u => Math.pow(arc(u), 0.5) }], this.at(delay + i * (0.75 + r() * 0.35)), out, 0.045, 0.04);
  }
  private greenFrog(delay = 0) { // a single low "gunk", like a loose banjo string
    const out = this.spot(0.5 + r() * 0.4, 0.5), t0 = this.at(delay), f = 150 + r() * 60;
    this.partial(t0, f, 0.16, 0.22, out, 1.05); this.partial(t0, f * 2.02, 0.06, 0.12, out);
    this.burst(this.brown, t0, 0.08, 0.1, out, 'bandpass', 420, 2, 0.003);
  }
  private owl(delay = 0) { // great horned rhythm: hoo, hoo-hoo, hoooo, far off
    const p = 320 + r() * 50, h = (d: number, lv = 1): Seg => ({ dur: d, f: u => p * (0.97 + 0.06 * arc(u)), a: u => Math.pow(arc(u), 0.45) * lv });
    this.phrase([h(0.32), { dur: 0.32 }, h(0.18, 0.8), { dur: 0.1 }, h(0.18, 0.8), { dur: 0.22 }, h(0.6)], this.at(delay), this.spot(r() * 1.6 - 0.8, 0.75), 0.13, 0.18);
  }
  private hawk() { // a long descending scream, very far over the mountains
    const d = 1.1 + r() * 0.3, p = 2900 + r() * 400;
    this.phrase([{ dur: d, f: u => p * (1 - 0.42 * u) * (1 + 0.03 * Math.sin(u * d * 2 * Math.PI * 34)), a: u => Math.pow(arc(Math.min(1, u * 1.25)), 0.5) * (1 - 0.5 * u) }],
      this.at(0), this.spot(r() * 1.4 - 0.7, 0.92), 0.05, 0.3);
  }
  private chimes(delay = 0, n = 1 + Math.floor(r() * 3)) { // wind chimes in the tree, stirred by the breeze
    const out = this.spot(-0.35, 0.3); let t = this.at(delay);
    for (let i = 0; i < n; i++) { this.tube(t, this.hz(this.note(4 + Math.floor(r() * 5)), 2), 0.016 + r() * 0.014, out); t += 0.09 + r() * 0.3; }
  }
  private lap() { // a small wave against the shore, and a bubble or two
    const out = this.spot(0.5 + r() * 0.3, 0.3), t0 = this.at(0), lv = 0.05 * (0.5 + this.mood.water);
    this.burst(this.brown, t0, 1.1, lv, out, 'lowpass', 520, 0.7, 0.35);
    this.burst(this.pink, t0 + 0.25, 0.5, lv * 0.25, out, 'bandpass', 1400, 1.2, 0.15);
    for (let i = 0; i < 1 + Math.floor(r() * 2); i++) this.bubble(t0 + 0.3 + r() * 0.6, 500 + r() * 700, 0.018, out, 0.07, 1.5);
  }
  private drop() { // one raindrop: mostly on leaves, sometimes on water
    const t0 = this.at(r() * 0.05), out = this.spot(r() * 2 - 1, 0.15 + r() * 0.75);
    if (r() < 0.72) this.burst(this.white, t0, 0.005 + r() * 0.01, 0.025 + r() * 0.05, out, 'bandpass', 1800 + r() * 5000, 0.9 + r(), 0.001);
    else this.bubble(t0, 1100 + r() * 2600, 0.02 + r() * 0.035, out, 0.035 + r() * 0.04, 1.5);
  }
  private rustleBurst(delay: number, dur: number, vol: number) { // leaves stirred close by
    const t0 = this.at(delay);
    for (const p of [-0.6, 0.6]) this.burst(this.white, t0 + r() * 0.08, dur, vol, this.spot(p, 0.2), 'bandpass', 4200 + r() * 1800, 0.7, dur * 0.35);
  }
  /** the garden answers a change: whoever lives in this weather calls out */
  private react(delay: number) {
    const m = this.mood;
    if (m.birds > 0.2) this.birdBout(delay);
    else if (m.frogs > 0.2) this.peep(delay);
    else if (m.owl > 0.25) this.owl(delay);
    else if (m.night > 0.3) this.peep(delay);
    else this.birdBout(delay); // even a grey day has one small bird in it
  }

  /* ================= every frame ================= */
  private last = 0;
  tick(dt: number, m: Mood) {
    this.mood = m;
    if (!this.audible) return;
    const ac = this.ac!, now = ac.currentTime;
    dt = Math.min(dt, 0.1);
    // breeze: two layers with their own slow, random gusts
    for (const k of [0, 1]) {
      if ((this.gustIn[k] -= dt) < 0) { this.gustIn[k] = 2 + r() * 6; this.gustTo[k] = 0.2 + r() * 1.1; }
      this.gust[k] += (this.gustTo[k] - this.gust[k]) * (1 - Math.exp(-0.6 * dt));
    }
    const breeze = 0.3 + m.wind * 0.9, [g0, g1] = this.gust;
    this.windA.g.gain.setTargetAtTime(breeze * 0.055 * g0, now, 0.3); this.windA.f.frequency.setTargetAtTime(170 + g0 * 380 + m.wind * 200, now, 0.4);
    this.windB.g.gain.setTargetAtTime(breeze * 0.05 * g1, now, 0.3); this.windB.f.frequency.setTargetAtTime(150 + g1 * 340 + m.wind * 180, now, 0.4);
    this.whistle.g.gain.setTargetAtTime(Math.pow(m.wind, 1.5) * 0.011 * Math.max(g0, g1), now, 0.5); this.whistle.f.frequency.setTargetAtTime(480 + g0 * 320, now, 0.8);
    // leaves only rustle when the air moves; the per-frame jitter is the crackle of individual leaves
    const gm = Math.max(g0, g1);
    this.rustle.g.gain.setTargetAtTime(m.leaves * (0.006 + 0.026 * gm * gm * breeze) * (0.45 + 0.55 * r()), now, 0.025);
    this.rainBed.g.gain.setTargetAtTime(m.rain * 0.06, now, 0.8); this.rainFar.g.gain.setTargetAtTime(m.rain * 0.05, now, 1);
    const swell = 0.55 + 0.45 * Math.sin(now * 0.41) * Math.sin(now * 0.13 + 1);
    this.lake.g.gain.setTargetAtTime(m.water * 0.03 * swell, now, 0.6);

    // rain, drop by drop
    const drops = Math.min(6, Math.floor(m.rain * 50 * dt + r()));
    if (m.rain > 0.05) for (let i = 0; i < drops; i++) this.drop();
    // crickets: scheduled slightly ahead so their rhythm is exact
    for (const c of this.crickets) {
      c.level.gain.setTargetAtTime(Math.max(0, m.night - 0.25 * m.rain) * c.vol, now, 1.2);
      if (c.next < now) c.next = now + 0.05;
      while (c.next < now + 0.3) {
        for (let k = 0; k < c.pulses; k++) {
          const ts = c.next + k * 0.034;
          c.pulse.gain.setValueAtTime(0, ts); c.pulse.gain.linearRampToValueAtTime(1, ts + 0.005);
          c.pulse.gain.setValueAtTime(1, ts + 0.014); c.pulse.gain.linearRampToValueAtTime(0, ts + 0.021);
        }
        c.next += c.period * (0.94 + r() * 0.12) + (r() < 0.03 ? 2 + r() * 5 : 0);
      }
    }
    const T = this.timers, every = (k: keyof typeof T, level: number, base: number, fn: () => void, min = 0.1) => {
      if (level < min) { T[k] = Math.min(T[k], base); return; }
      if ((T[k] -= dt) < 0) { T[k] = (base * (0.5 + r())) / (0.3 + level); fn(); }
    };
    every('bird', m.birds, 3.2, () => this.birdBout(), 0.12);
    every('dove', m.doves, 11, () => this.dove(), 0.15);
    every('frog', m.frogs, 2.6, () => (r() < 0.8 ? this.peep() : this.greenFrog()), 0.12);
    every('owl', m.owl, 13, () => this.owl(), 0.2);
    every('hawk', m.hawk, 16, () => this.hawk(), 0.25);
    every('chime', m.sparkle * gm, 16, () => this.chimes(0, 1 + Math.floor(r() * 2)), 0.3); // only when a real gust stirs them
    every('lap', m.water, 3, () => this.lap(), 0.2);
    if ((T.swap -= dt) < 0) { T.swap = 40 + r() * 40; const i = Math.floor(r() * this.birds.length); this.birds[i] = this.newBird(this.birds[i].kind); } // new birds arrive
  }

  /* ================= what your hands do ================= */
  setChord(semis: number[]) { this.chord = semis; }
  setRain(_a: number) { /* rain now follows the mood in tick() */ }

  /** the small sound of the garden's answer to a planted feeling (see garden/gesture.ts) */
  cue(kind: string) {
    if (!this.audible) return;
    const near = this.spot((r() - 0.5) * 0.3, 0.12), t0 = this.at(0);
    switch (kind) {
      case 'ember': // a small crackle as an ember lands
        for (let i = 0; i < 4; i++) this.burst(this.white, t0 + r() * 0.12, 0.004 + r() * 0.006, 0.03 + r() * 0.03, near, 'bandpass', 2200 + r() * 2600, 1.4, 0.001);
        this.partial(t0, 150 + r() * 30, 0.05, 0.5, near);
        break;
      case 'settle': // the stones take the heat: a low, steady warmth
        this.partial(t0, 98, 0.1, 2.6, near); this.partial(t0, 147, 0.05, 2.2, near);
        this.burst(this.brown, t0, 1.6, 0.05, near, 'lowpass', 300, 0.7, 0.5);
        break;
      case 'lantern': // a soft tone, as a small light comes on
        this.kalimba(t0, this.hz(this.note(4), 2), 0.08, near, 1.6);
        this.tube(t0 + 0.08, this.hz(this.note(6), 2), 0.02, near);
        break;
      case 'bloom': [0, 2, 4].forEach((n, i) => this.kalimba(this.at(i * 0.16), this.hz(this.note(n), 2), 0.07, near, 1.3)); break;
      case 'bud': this.phrase([{ dur: 0.5, f: u => 520 * (1 + 0.25 * u), a: u => Math.sin(Math.PI * u) }], t0, near, 0.035, 0.05); break;
      case 'sprout': this.kalimba(t0, this.hz(this.note(0), 2), 0.07, near, 1.4); this.rustleBurst(0, 0.5, 0.02); break;
      case 'hop': this.bubble(t0, 330 + r() * 60, 0.12, near, 0.08, 1.7); break;
      case 'drop': this.bubble(t0, 1600 + r() * 500, 0.09, near, 0.07, 1.5); this.burst(this.white, t0, 0.02, 0.025, near, 'highpass', 3000, 0.7, 0.002); break;
      case 'leaf': this.rustleBurst(0, 0.6, 0.02); break;
      case 'flutter': for (let i = 0; i < 6; i++) this.burst(this.pink, t0 + i * 0.06, 0.03, 0.012, near, 'bandpass', 900, 1.5, 0.01); break;
      case 'spark': this.tube(t0, this.hz(this.note(5), 2), 0.03, near); break;
      case 'ripple': this.bubble(t0, 420, 0.05, near, 0.12, 1.3); break;
      case 'reveal': this.kalimba(t0, this.hz(this.note(2), 2), 0.05, this.spot(0, 0.3), 2.2); break;
    }
  }
  /** a touch: a kalimba for close, wooden things; a small chime tube for high, glinting ones */
  chime(step = Math.floor(r() * 6), vol = 0.16, octave = 2) {
    if (!this.audible) return;
    const f = this.hz(this.note(step), octave), out = this.spot((r() - 0.5) * 0.4, 0.12), t0 = this.at(0);
    if (octave >= 3) this.tube(t0, f * 0.5, vol * 0.55, out); else this.kalimba(t0, f, vol * 0.95, out);
  }
  /** a transformation or a discovery: a rising kalimba figure, the chimes stir, and the garden answers */
  bloom() {
    if (!this.audible) return;
    const out = this.spot(0, 0.15);
    [0, 1, 2, 3, 5].forEach((s, i) => this.kalimba(this.at(i * 0.13), this.hz(this.note(s), 2), 0.1 - i * 0.012, out, 1.3));
    this.chimes(0.75, 1); this.rustleBurst(0.1, 1.4, 0.03); this.react(1.3);
  }
  /** a small round thing bounces, or a seed goes home: a water-drop "plop" */
  pop() {
    if (!this.audible) return;
    const out = this.spot((r() - 0.5) * 0.4, 0.1), t0 = this.at(0);
    this.bubble(t0, 260 + r() * 120, 0.22, out, 0.1, 1.9);
    this.burst(this.white, t0, 0.01, 0.03, out, 'bandpass', 2400, 1, 0.001);
  }
  /** lifting a seed off the ledge: a kalimba note and a brush of leaves */
  pickup(semis: number[]) {
    if (!this.audible) return;
    this.kalimba(this.at(0), this.hz(semis[0], 2), 0.09, this.spot(0, 0.1));
    this.rustleBurst(0, 0.3, 0.025);
  }
  /** while a seed is in your hand: air moving past it, brighter the higher you carry it */
  carry(amount: number, height = 0, _semis?: number[]) {
    if (!this.ac) return;
    const now = this.ac.currentTime;
    this.air.g.gain.setTargetAtTime(this.audible ? amount * (0.012 + height * 0.022) : 0, now, 0.12);
    this.air.f.frequency.setTargetAtTime(380 + height * 1700, now, 0.1);
  }
  /** the seed goes into the ground: a soft thud of earth, soil settling, leaves, a few notes, and nature answers */
  plant() {
    if (!this.audible) return;
    const near = this.spot(0, 0.05), t0 = this.at(0);
    this.burst(this.brown, t0, 0.28, 0.4, near, 'lowpass', 220, 0.7, 0.004);
    this.partial(t0, 70, 0.3, 0.3, near, 1.4);
    for (let i = 0; i < 8; i++) this.burst(this.white, t0 + 0.04 + r() * 0.25, 0.004, 0.02 + r() * 0.03, this.spot((r() - 0.5) * 0.6, 0.1), 'bandpass', 900 + r() * 2200, 1.5, 0.001);
    this.rustleBurst(0.15, 1.8, 0.035);
    // the garden's own answer follows (gesture cues); no extra chorus here, so the moment stays quiet
  }
  /** something large moves (a door opens, the sky comes down): air rushing through leaves */
  whoosh(up = true) {
    if (!this.audible) return;
    const ac = this.ac!, t0 = this.at(0), src = ac.createBufferSource(); src.buffer = this.pink;
    const f = this.filt('bandpass', up ? 300 : 2400, 1.1), g = ac.createGain();
    f.frequency.setValueAtTime(up ? 300 : 2400, t0); f.frequency.exponentialRampToValueAtTime(up ? 2400 : 300, t0 + 0.9);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.13, t0 + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    src.connect(f); f.connect(g); g.connect(this.spot(0, 0.2)); src.start(t0, r() * 2); src.stop(t0 + 1.2);
    this.rustleBurst(0.1, 0.9, 0.03);
  }
  /** a touch on the lake */
  splash() {
    if (!this.audible) return;
    const out = this.spot(0.4, 0.2), t0 = this.at(0);
    this.burst(this.white, t0, 0.16, 0.06, out, 'highpass', 1500, 0.7, 0.004);
    for (let i = 0; i < 3; i++) this.bubble(t0 + 0.02 + i * (0.02 + r() * 0.04), 650 + r() * 1100, 0.07, out, 0.06 + r() * 0.04, 1.6);
  }
  /** distant thunder: a rumble that rolls, never a crack in your ear */
  thunder() {
    if (!this.audible) return;
    const ac = this.ac!, t0 = this.at(0.3 + r() * 0.6), dur = 5 + r() * 2, src = ac.createBufferSource(); src.buffer = this.brown; src.loop = true;
    const f = this.filt('lowpass', 900, 0.6), g = ac.createGain(), n = 240, curve = new Float32Array(n);
    f.frequency.setValueAtTime(900, t0); f.frequency.exponentialRampToValueAtTime(140, t0 + 1.4);
    let w = 0.5; for (let i = 0; i < n; i++) { const u = i / (n - 1); w += (r() - 0.5) * 0.35; w = Math.max(0.15, Math.min(1, w)); curve[i] = Math.min(1, u * 12) * Math.exp(-u * 2.3) * w * 0.5; }
    curve[n - 1] = 0; g.gain.value = 0; g.gain.setValueCurveAtTime(curve, t0, dur);
    src.connect(f); f.connect(g); g.connect(this.spot(r() * 1.2 - 0.6, 0.7)); src.start(t0, r() * 3); src.stop(t0 + dur + 0.1);
    this.partial(t0 + 0.1, 42, 0.18, 2.5, this.spot(0, 0.6));
  }
}

/** half a second of silence as a WAV blob, made in code (no files, no network) */
function silentWav(): string {
  const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
