/*
 * Giọng đọc tiếng Anh dùng Web Speech API có sẵn trong trình duyệt (không cần file audio).
 * speak() trả về Promise với thời lượng đọc thực tế (ms) → dùng để tính khoảng nghỉ.
 */
(function (root) {
  "use strict";
  const synth = root.speechSynthesis;
  // Các giọng "hiệu ứng" của macOS — không hợp để luyện nghe
  const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
  const PREFERRED = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Ava", "Allison", "Alex", "Daniel", "Google UK English Female", "Karen"];

  let voices = [];
  const listeners = [];
  let current = null; // giữ tham chiếu để Chrome không thu gom utterance giữa chừng

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices()
      .filter(v => /^en[-_]/i.test(v.lang) && !NOVELTY.test(v.name))
      .sort((a, b) => rank(a) - rank(b));
    listeners.forEach(fn => fn(voices));
  }
  function rank(v) {
    const i = PREFERRED.findIndex(p => v.name.startsWith(p));
    return (i === -1 ? 50 : i) + (/en[-_]US/i.test(v.lang) ? 0 : 20);
  }
  if (synth) {
    loadVoices();
    synth.addEventListener ? synth.addEventListener("voiceschanged", loadVoices) : (synth.onvoiceschanged = loadVoices);
  }

  function estimateMs(text, rate) {
    const words = String(text).trim().split(/\s+/).length;
    return (words * 380) / (rate || 1) + 300;
  }

  function speak(text, opts = {}) {
    return new Promise(resolve => {
      const rate = opts.rate || 1;
      const estimate = estimateMs(text, rate);
      if (!synth) return setTimeout(() => resolve(estimate), estimate);

      const u = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.voiceURI === opts.voiceURI) || voices[0];
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
      u.rate = rate;

      let started = 0, done = false, idleTicks = 0;
      const finish = (reliable = true) => {
        if (done) return;
        done = true;
        clearTimeout(guard); clearInterval(poll);
        const measured = started ? performance.now() - started : 0;
        resolve(reliable && measured > 300 ? measured : estimate);
      };
      u.onstart = () => { started = performance.now(); };
      u.onend = () => finish();
      u.onerror = () => finish();
      // Đôi khi trình duyệt không bắn onend (nhất là câu đầu tiên) → tự kiểm tra trạng thái
      const poll = setInterval(() => {
        if (!started) return;
        idleTicks = synth.speaking || synth.pending ? 0 : idleTicks + 1;
        if (idleTicks >= 2) finish();
      }, 120);
      const guard = setTimeout(() => finish(false), estimate * 2.5 + 2500);

      current = u;
      synth.speak(u);
      if (synth.paused) synth.resume();
    });
  }

  function cancel() { if (synth) synth.cancel(); current = null; }

  root.Speech = {
    supported: !!synth,
    speak, cancel, estimateMs,
    getVoices: () => voices,
    onVoices(fn) { listeners.push(fn); if (voices.length) fn(voices); }
  };
})(window);
