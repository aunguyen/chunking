/*
 * TẠO BÀI NGHE (.m4a) để nghe trên iPhone khi tắt màn hình.
 *
 * Cách chạy: bấm đúp file "Tao-bai-nghe.command" trong thư mục app.
 * Dùng giọng có sẵn của macOS (lệnh `say`) và `afconvert` — miễn phí, không cần mạng.
 *
 * Lấy cụm từ: data/chunks.js + file sao lưu mới nhất trong thư mục Downloads
 * (để có cả cụm thêm / sửa / xoá trên web).
 * Kết quả: thư mục audio/ — mỗi cụm 1 file + 1 file gộp tất cả các cụm.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

// ---------- CÀI ĐẶT (sửa ở đây nếu muốn) ----------
const CONFIG = {
  voice: "Samantha",    // giọng đọc: Samantha (Mỹ), Daniel (Anh)…
  wordsPerMinute: 160,  // tốc độ đọc (mặc định của Mac khoảng 175–185 từ/phút)
  listens: 2,           // nghe mấy lần trước khi tới lượt nói
  pauseBetween: 0.5,    // nghỉ giữa các lần nghe (giây)
  extraSpeak: 2,        // lượt nói = độ dài câu + bấy nhiêu giây
  ting: true,           // tiếng "ting" báo tới lượt nói
  pauseAfter: 0.4,      // nghỉ trước khi sang câu tiếp (giây)
  sampleRate: 22050     // đừng đổi
};

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "audio");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "chunking-audio-"));
const say = s => process.stdout.write(s + "\n");

// ---------- Đọc danh sách cụm ----------
function newestBackup() {
  const dir = path.join(os.homedir(), "Downloads");
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /^chunking-sao-luu.*\.json$/i.test(f)); } catch (e) { return null; }
  if (!files.length) return null;
  const file = files.map(f => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  try {
    const obj = JSON.parse(fs.readFileSync(file, "utf8"));
    return obj && obj.app === "chunking-practice" ? { file, data: obj.data || {} } : null;
  } catch (e) { return null; }
}

function loadChunks() {
  global.window = {};
  require(path.join(ROOT, "data", "chunks.js"));
  let chunks = global.window.CHUNKS || [];
  const backup = newestBackup();
  if (backup) {
    const get = (k, d) => { try { return backup.data["chunking:" + k] ? JSON.parse(backup.data["chunking:" + k]) : d; } catch (e) { return d; } };
    const edited = get("chunks:edited", {});
    const deleted = new Set(get("chunks:deleted", []));
    chunks = chunks.filter(c => !deleted.has(c.id)).map(c => edited[c.id] || c).concat(get("chunks:added", []));
  }
  return { chunks, backup };
}

const label = c => String(c.chunk).replace(/\s*(\.{3,}|…)\s*/g, " ").trim();
function playlist(c) {
  if (c.listen && c.listen.length) return c.listen.map(x => (typeof x === "string" ? x : x.en));
  const spoken = label(c).replace(/\bsb\b/gi, "somebody").replace(/\bsth\b/gi, "something");
  return [spoken].concat((c.sentences || []).map(s => s.en[0]).filter(Boolean));
}

// ---------- Âm thanh ----------
function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error("WAV không hợp lệ");
  let p = 12, channels = 1, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") channels = b.readUInt16LE(p + 10);
    if (id === "data") { data = b.subarray(p + 8, Math.min(b.length, p + 8 + size)); break; }
    p += 8 + size + (size % 2);
  }
  if (!data) throw new Error("WAV không có dữ liệu");
  if (channels === 1) return data;
  const mono = Buffer.alloc(Math.floor(data.length / (2 * channels)) * 2); // gộp về 1 kênh
  for (let i = 0; i < mono.length / 2; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) sum += data.readInt16LE((i * channels + ch) * 2);
    mono.writeInt16LE(Math.round(sum / channels), i * 2);
  }
  return mono;
}

let voiceOk = true;
function synth(text) {
  const txt = path.join(TMP, "line.txt"), wav = path.join(TMP, "line.wav");
  fs.writeFileSync(txt, text);
  execFileSync("say", [...(voiceOk ? ["-v", CONFIG.voice] : []), "-r", String(CONFIG.wordsPerMinute),
    "-f", txt, "-o", wav, "--file-format=WAVE", `--data-format=LEI16@${CONFIG.sampleRate}`]);
  return readWav(wav);
}

const silence = sec => Buffer.alloc(Math.round(sec * CONFIG.sampleRate) * 2);
function makeTing() {
  const rate = CONFIG.sampleRate, len = Math.round(0.4 * rate), buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const t = i / rate;
    let v = 0;
    for (const [freq, delay] of [[880, 0], [1320, 0.08]]) {
      if (t < delay) continue;
      const tt = t - delay;
      v += Math.sin(2 * Math.PI * freq * tt) * Math.exp(-tt * 9) * Math.min(1, tt / 0.005);
    }
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * 0.22)) * 32767), i * 2);
  }
  return buf;
}

// Ghi WAV từng phần (không giữ cả file lớn trong bộ nhớ)
class WavWriter {
  constructor(file) { this.file = file; this.fd = fs.openSync(file, "w"); this.bytes = 0; fs.writeSync(this.fd, Buffer.alloc(44)); }
  write(buf) { fs.writeSync(this.fd, buf); this.bytes += buf.length; }
  get seconds() { return this.bytes / 2 / CONFIG.sampleRate; }
  close() {
    const r = CONFIG.sampleRate, h = Buffer.alloc(44);
    h.write("RIFF", 0); h.writeUInt32LE(36 + this.bytes, 4); h.write("WAVE", 8);
    h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
    h.writeUInt32LE(r, 24); h.writeUInt32LE(r * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
    h.write("data", 36); h.writeUInt32LE(this.bytes, 40);
    fs.writeSync(this.fd, h, 0, 44, 0);
    fs.closeSync(this.fd);
  }
}

const toM4a = (wav, m4a) => execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", "48000", wav, m4a]);
const safeName = s => s.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
const clock = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

// ---------- Chạy ----------
function main() {
  try { voiceOk = execFileSync("say", ["-v", "?"]).toString().split("\n").some(l => l.startsWith(CONFIG.voice + " ")); }
  catch (e) { voiceOk = false; }
  if (!voiceOk) say(`(!) Không thấy giọng "${CONFIG.voice}" — dùng giọng mặc định của máy.`);

  const { chunks, backup } = loadChunks();
  say(backup ? `Đã đọc thêm cụm từ file sao lưu: ${path.basename(backup.file)}` : "Không thấy file sao lưu trong Downloads — chỉ dùng cụm trong data/chunks.js.");
  if (!chunks.length) { say("Chưa có cụm nào để tạo bài nghe."); return; }

  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).filter(f => f.endsWith(".m4a")).forEach(f => fs.unlinkSync(path.join(OUT, f)));

  const ting = makeTing();
  const all = new WavWriter(path.join(TMP, "all.wav"));
  const index = {};
  const usedNames = new Set();

  chunks.forEach((c, n) => {
    const lines = playlist(c);
    let name = safeName(label(c)) || c.id;
    while (usedNames.has(name.toLowerCase())) name += " (2)";
    usedNames.add(name.toLowerCase());
    say(`\n[${n + 1}/${chunks.length}] ${label(c)} — ${lines.length} câu`);

    const one = new WavWriter(path.join(TMP, "one.wav"));
    const put = buf => { one.write(buf); all.write(buf); };
    put(silence(1));
    lines.forEach((line, i) => {
      let voice;
      try { voice = synth(line); } catch (e) { say(`   (!) Bỏ qua câu ${i + 1}: không đọc được`); return; }
      const dur = voice.length / 2 / CONFIG.sampleRate;
      for (let k = 0; k < CONFIG.listens; k++) {
        put(voice);
        if (k < CONFIG.listens - 1) put(silence(CONFIG.pauseBetween));
      }
      const speak = dur + CONFIG.extraSpeak;          // lượt nói = độ dài câu + 2 giây
      if (CONFIG.ting) { put(ting); put(silence(Math.max(0, speak - 0.4))); } else put(silence(speak));
      put(silence(CONFIG.pauseAfter));
      process.stdout.write(`   ${i + 1}/${lines.length} ✓\r`);
    });
    put(silence(1));
    one.close();
    const file = `${name}.m4a`;
    toM4a(one.file, path.join(OUT, file));
    index[c.id] = { file, seconds: Math.round(one.seconds) };
    say(`   → audio/${file} (${clock(one.seconds)})`);
  });

  all.close();
  const allName = "Tất cả các cụm.m4a";
  say(`\nĐang gộp tất cả các cụm (${clock(all.seconds)})…`);
  toM4a(all.file, path.join(OUT, allName));

  const stamp = new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  const pattern = `nghe ${CONFIG.listens} lần → ${CONFIG.ting ? "“ting” → " : ""}lượt nói = độ dài câu + ${CONFIG.extraSpeak} giây`;
  fs.writeFileSync(path.join(OUT, "index.js"),
    "// Tạo tự động bởi tools/tao-bai-nghe.js — đừng sửa tay\n" +
    `window.AUDIO_CREATED = ${JSON.stringify(stamp)};\n` +
    `window.AUDIO_PATTERN = ${JSON.stringify(pattern)};\n` +
    `window.AUDIO_ALL = ${JSON.stringify({ file: allName, seconds: Math.round(all.seconds) })};\n` +
    `window.AUDIO_FILES = ${JSON.stringify(index, null, 2)};\n`);

  say(`\nXong! ${chunks.length} cụm + 1 file gộp, lưu trong thư mục audio/.`);
  say("Gửi sang iPhone: chuột phải vào file → Chia sẻ → AirDrop → chọn iPhone.");
  if (!process.argv.includes("--no-open")) execFileSync("open", [OUT]);
}

try { main(); }
catch (e) { say(`\nCó lỗi: ${e.message}`); process.exitCode = 1; }
finally { fs.rmSync(TMP, { recursive: true, force: true }); }
