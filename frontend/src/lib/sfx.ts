/**
 * Лёгкие игровые звуки через Web Audio API — без файлов-ассетов
 * (которых в проекте нет). AudioContext создаётся лениво и только
 * по жесту пользователя (политика автоплея браузеров это требует),
 * так что вызовы безопасны даже если звук не поддерживается/заблокирован.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  try {
    if (!ctx) ctx = new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, peak: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const sfx = {
  /** Свист при полёте карты/пака. */
  whoosh() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  },
  /** Треск разрыва коробки при вскрытии пака. */
  crackle() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const bufferSize = Math.floor(c.sampleRate * 0.28);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 2;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 700;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.18, now);
    noise.connect(filter).connect(gain).connect(c.destination);
    noise.start(now);
  },
  /** Короткий тик при приземлении карты рубашкой вверх. */
  tick() {
    const c = getCtx();
    if (!c) return;
    tone(c, 520, c.currentTime, 0.08, "sine", 0.05);
  },
  /** Приятный перезвон при обычном вскрытии карты. */
  chime() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [660, 880].forEach((f, i) => tone(c, f, now + i * 0.06, 0.4, "sine", 0.06));
  },
  /** Рывок мотора в момент старта рулетки. */
  launch() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  },
  /**
   * Щелчок при прохождении карточки через маркер — тяжелее и ниже тоном,
   * чем ближе к победной карте (distanceToWinner: 3=далеко, 0=она самая).
   */
  reelLandTick(distanceToWinner: number) {
    const c = getCtx();
    if (!c) return;
    const t = Math.max(0, Math.min(1, (3 - distanceToWinner) / 3));
    const freq = 420 - t * 200; // 420Hz далеко -> 220Hz на самой карте
    const peak = 0.05 + t * 0.06;
    tone(c, freq, c.currentTime, 0.1 + t * 0.06, "square", peak);
  },
  /** Глухой звук при приземлении на базовую редкость (не триумф). */
  thud() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  },
  /** Триумфальный аккорд для топ-карты (Walkout / джекпот). */
  fanfare() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, now + i * 0.09, 0.9, "triangle", 0.07));
  },
  /**
   * Тиканье рулетки, замедляющееся к концу (классический эффект колеса).
   * Возвращает cancel() — обязательно вызывать при размонтировании/смене фазы.
   */
  reelTicker(durationMs: number): () => void {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext(elapsed: number) {
      if (cancelled || elapsed >= durationMs) return;
      const progress = elapsed / durationMs;
      const c = getCtx();
      if (c) tone(c, 420, c.currentTime, 0.05, "square", 0.025 * (1 - progress * 0.5));
      const delay = 60 + progress * progress * 260; // ускоренно в начале, редко к концу
      timer = setTimeout(() => scheduleNext(elapsed + delay), delay);
    }
    scheduleNext(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  },
  /** Удар бутсы по мячу — короткий транзиент + глухой низкий хвост, для тапа по карточке. */
  kick() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;

    const bufferSize = Math.floor(c.sampleRate * 0.04);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noise.connect(noiseGain).connect(c.destination);
    noise.start(now);

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },
  /** Свисток арбитра — стартовый/финальный или нарушение. */
  whistle() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [0, 0.18, 0.36].forEach((offset) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2300, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(0.06, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain).connect(c.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.17);
    });
  },
  /** Рёв трибун при голе. */
  goalRoar() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const bufferSize = Math.floor(c.sampleRate * 1.1);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((Math.PI * i) / bufferSize);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.22, now);
    noise.connect(filter).connect(gain).connect(c.destination);
    noise.start(now);
    this.fanfare();
  },
  /** Короткий резкий сигнал при показе карточки — выше тон для жёлтой, ниже и жёстче для красной. */
  cardReveal(color: "YELLOW" | "RED") {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(c, color === "YELLOW" ? 760 : 320, now, color === "YELLOW" ? 0.25 : 0.4, "sawtooth", 0.07);
  },
  /** Глухой стон при травме. */
  injury() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    tone(c, 180, now, 0.5, "sine", 0.05);
  },
  /** Металлический "дзынь" при ударе в штангу. */
  postClang() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [1, 1.6, 2.3].forEach((mult, i) => tone(c, 1200 * mult, now + i * 0.01, 0.4, "triangle", 0.05 / (i + 1)));
  },
  /**
   * Низкий нарастающий гул для "заморозки" ультра-редкой карты (93+) перед тапами.
   * Возвращает stop() — обязательно вызывать при переходе к развороту/размонтировании.
   */
  tensionHum(): () => void {
    const c = getCtx();
    if (!c) return () => {};
    const now = c.currentTime;
    const osc = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc2.type = "sawtooth";
    osc.frequency.setValueAtTime(55, now);
    osc2.frequency.setValueAtTime(55.5, now);
    osc.frequency.linearRampToValueAtTime(90, now + 2.5);
    osc2.frequency.linearRampToValueAtTime(91, now + 2.5);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 1.2);
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(c.destination);
    osc.start(now);
    osc2.start(now);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.stop(t + 0.32);
      osc2.stop(t + 0.32);
    };
  },
  /** Звонкий хрустальный щелчок — для каждого тапа по замороженной карте. */
  crystalTap() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [1760, 2350, 3100].forEach((f, i) => tone(c, f, now + i * 0.012, 0.22, "triangle", 0.055 / (i + 1)));
  },
  /** Мощный золотой взрыв — финальный разворот ультра-редкой карты после тапов. */
  goldBurst() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const bufferSize = Math.floor(c.sampleRate * 0.5);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 1.5;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 0.4;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.16, now);
    noise.connect(filter).connect(noiseGain).connect(c.destination);
    noise.start(now);
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(c, f, now + i * 0.05, 1.1, "triangle", 0.08));
  },
};
