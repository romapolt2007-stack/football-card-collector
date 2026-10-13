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
};
