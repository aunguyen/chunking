(function () {
  "use strict";
  const FILE_CHUNKS = window.CHUNKS || [];
  let CHUNKS = []; // = cụm trong file + cụm thêm / sửa trên web (xem loadChunks)
  const app = document.getElementById("app");

  // =========================================================
  // Tiện ích chung
  // =========================================================
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("chunking:" + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, val) { try { localStorage.setItem("chunking:" + key, JSON.stringify(val)); } catch (e) { /* bỏ qua */ } },
    del(key) { try { localStorage.removeItem("chunking:" + key); } catch (e) { /* bỏ qua */ } }
  };
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const pretty = s => String(s).replace(/\.{3,}/g, "…");
  const today = (d = new Date()) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD theo giờ máy
  const scoreClass = (v, max = 10) => (v >= max ? "good" : "mid"); // đủ điểm: xanh lá · còn lại: cam

  const ICONS = {
    logo: '<rect x="3" y="4" width="12" height="4" rx="2"/><rect x="7" y="10" width="14" height="4" rx="2"/><rect x="3" y="16" width="9" height="4" rx="2"/>',
    arrowLeft: '<path d="M5 12h14M5 12l6-6M5 12l6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    volume: '<path d="M15 8a5 5 0 0 1 0 8M17.7 5a9 9 0 0 1 0 14"/><path d="M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5L6 15"/>',
    headphones: '<path d="M4 15a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM15 15a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2z"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/>',
    translate: '<path d="M4 5h7M9 3v2c0 4.4-2.2 8-5 8"/><path d="M5 9c0 2.1 3 3.9 6.7 4"/><path d="M12 20l4-9 4 9M19.1 18h-6.2"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>',
    flame: '<path d="M12 12c2-3 0-7-1-8 0 3-1.8 4.7-3 6-1.2 1.3-2 3.2-2 5a6 6 0 1 0 12 0c0-1.5-1-3.9-2-5-1.8 3-2.8 3-4 2z"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    circleCheck: '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/>',
    skipBack: '<path d="M20 5v14L9 12z"/><path d="M4 5v14"/>',
    skipForward: '<path d="M4 5v14l11-7z"/><path d="M20 5v14"/>',
    refresh: '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
    adjust: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h11M19 18h1"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    mic: '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M8 21h8M12 17v4"/>',
    ear: '<path d="M6 10a7 7 0 1 1 13 3.6 10 10 0 0 1-2 2 8 8 0 0 0-2 3 4.5 4.5 0 0 1-6.8 1.4"/><path d="M10 10a3 3 0 1 1 5 2.2"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    external: '<path d="M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6M11 13l9-9M15 4h5v5"/>',
    download: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/>',
    upload: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12"/>',
    bookmark: '<path d="M18 7v14l-6-4-6 4V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4z"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2"/>',
    equal: '<path d="M5 10h14M5 14h14"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V16h6v-.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3z"/>'
  };
  const icon = (name, cls = "") =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // Hộp hỏi lại giữa trang → Promise<true|false>. Esc / bấm ra ngoài = Huỷ
  function confirmDialog({ title, body = "", okText = "Đồng ý", danger = false }) {
    return new Promise(resolve => {
      const wrap = document.createElement("div");
      wrap.className = "dlg-overlay";
      wrap.innerHTML = `
        <div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
          <h3 id="dlg-title">${title}</h3>
          ${body ? `<p>${body}</p>` : ""}
          <div class="dlg-actions">
            <button class="btn" data-ans="0">Huỷ</button>
            <button class="btn ${danger ? "danger-solid" : "primary"}" data-ans="1">${okText}</button>
          </div>
        </div>`;
      const done = ans => { document.removeEventListener("keydown", onKey, true); wrap.remove(); resolve(ans); };
      const onKey = e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(false); } };
      wrap.addEventListener("click", e => {
        const b = e.target.closest("[data-ans]");
        if (b) done(b.dataset.ans === "1"); else if (e.target === wrap) done(false);
      });
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(wrap);
      wrap.querySelector('[data-ans="0"]').focus(); // mặc định chọn Huỷ cho an toàn
    });
  }
  const askDeleteChunk = c => confirmDialog({
    title: `Xoá cụm “${esc(pretty(c.chunk))}”?`,
    body: "Điểm dịch, tiến độ nghe và lịch ôn của cụm này sẽ mất, không lấy lại được.",
    okText: "Xoá", danger: true
  });

  // Menu nhỏ bật ra cạnh một nút (vd: ⋯ trên thẻ cụm)
  const PopMenu = (() => {
    const el = document.createElement("div");
    el.className = "menu-pop";
    el.hidden = true;
    document.body.appendChild(el);
    let onPick = null;
    const close = () => { el.hidden = true; onPick = null; };
    el.addEventListener("click", e => {
      const it = e.target.closest("[data-act]");
      if (!it) return;
      const fn = onPick;
      close();
      if (fn) fn(it.dataset.act);
    });
    document.addEventListener("click", e => { if (!el.hidden && !el.contains(e.target) && !e.target.closest("[data-menu]")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("hashchange", close);
    return {
      open(anchor, items, pick) {
        el.innerHTML = items.map(it => `<button data-act="${it.act}" class="${it.danger ? "danger" : ""}">${icon(it.icon)} ${it.label}</button>`).join("");
        el.hidden = false;
        onPick = pick;
        const r = anchor.getBoundingClientRect();
        el.style.top = r.bottom + 6 + "px";
        el.style.left = Math.max(8, Math.min(r.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8)) + "px";
      },
      close
    };
  })();

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  // ---------- Cụm chunk ----------
  const matchers = {};
  const matcherFor = c => matchers[c.id] || (matchers[c.id] = Grader.makeChunkMatcher(c));
  // ---------- Cụm mới đang chờ (bôi đen trong lúc luyện để lưu) ----------
  // pending = [{ text, source, date }]
  const pendingList = () => store.get("pending", []);
  const normPhrase = s => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/\s*(\.{3,}|…)\s*/g, " ").replace(/\s+/g, " ").trim();
  const isPending = text => pendingList().some(p => normPhrase(p.text) === normPhrase(text));
  function addPending(text, source) {
    if (isPending(text)) return;
    store.set("pending", [{ text, source, date: today() }].concat(pendingList()));
  }
  function removePending(text) { store.set("pending", pendingList().filter(p => normPhrase(p.text) !== normPhrase(text))); }
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Vị trí các cụm đang chờ xuất hiện trong câu → để in đậm
  function pendingRanges(text) {
    const s = String(text).replace(/[‘’]/g, "'"), out = [];
    pendingList().forEach(p => {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}'])(${escRe(p.text.replace(/[‘’]/g, "'"))})(?=$|[^\\p{L}\\p{N}'])`, "giu");
      let m;
      while ((m = re.exec(s))) { out.push([m.index + m[1].length, m.index + m[1].length + m[2].length]); re.lastIndex = m.index + m[0].length; }
    });
    return out;
  }
  // Câu tiếng Anh: tô vàng cụm chunk, in đậm cụm mới đang chờ.
  // restFrom (tuỳ chọn): từ vị trí này trở đi bọc trong <span class="rest"> (phần bị che ở Phần 3)
  function highlight(c, text, restFrom) {
    const s = String(text), r = matcherFor(c).range(s), pend = pendingRanges(s);
    const hasRest = restFrom != null && restFrom < s.length;
    const cuts = [...new Set([0, s.length].concat(r || [], ...pend, hasRest ? [restFrom] : []))].sort((a, b) => a - b);
    let html = "", open = false;
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1];
      const inChunk = r && a >= r[0] && b <= r[1];
      if (inChunk && !open) { html += "<mark>"; open = true; } else if (!inChunk && open) { html += "</mark>"; open = false; }
      let piece = esc(s.slice(a, b));
      if (pend.some(([x, y]) => a >= x && b <= y)) piece = `<b class="pend">${piece}</b>`;
      html += hasRest && a >= restFrom ? `<span class="rest">${piece}</span>` : piece;
    }
    return html + (open ? "</mark>" : "");
  }
  let refreshMarks = null; // trang hiện tại đăng ký để vẽ lại khi danh sách cụm chờ thay đổi
  const spokenChunk = c => matcherFor(c).label.replace(/\bsb\b/gi, "somebody").replace(/\bsth\b/gi, "something");

  function playlistFor(c) {
    if (c.listen && c.listen.length) return c.listen.map(x => (typeof x === "string" ? { en: x, vi: "" } : x));
    return [{ en: spokenChunk(c), vi: c.meaning || "" }]
      .concat((c.sentences || []).map(s => ({ en: s.en[0], vi: s.vi })));
  }

  // ---------- Cụm thêm / sửa / xoá trên web (lưu trong trình duyệt) ----------
  //   chunks:added   = [cụm tự thêm]
  //   chunks:edited  = { id: bản đã sửa của cụm có sẵn trong file }
  //   chunks:deleted = [id các cụm có sẵn trong file đã bị xoá]
  function loadChunks() {
    const edited = store.get("chunks:edited", {});
    const deleted = new Set(store.get("chunks:deleted", []));
    CHUNKS = FILE_CHUNKS.filter(c => !deleted.has(c.id)).map(c => edited[c.id] || c)
      .concat(store.get("chunks:added", []));
    Object.keys(matchers).forEach(k => delete matchers[k]);
  }
  const isFileChunk = id => FILE_CHUNKS.some(c => c.id === id);
  function saveChunk(chunk) {
    if (isFileChunk(chunk.id)) {
      const edited = store.get("chunks:edited", {});
      edited[chunk.id] = chunk;
      store.set("chunks:edited", edited);
    } else {
      const added = store.get("chunks:added", []);
      const k = added.findIndex(c => c.id === chunk.id);
      if (k >= 0) added[k] = chunk; else added.push(chunk);
      store.set("chunks:added", added);
    }
    loadChunks();
  }
  function deleteChunk(id) {
    if (isFileChunk(id)) {
      store.set("chunks:deleted", [...new Set(store.get("chunks:deleted", []).concat(id))]);
      const edited = store.get("chunks:edited", {});
      delete edited[id];
      store.set("chunks:edited", edited);
    } else {
      store.set("chunks:added", store.get("chunks:added", []).filter(c => c.id !== id));
    }
    ["tr:", "best:", "listen:", "cue:", "tab:"].forEach(p => store.del(p + id));
    loadChunks();
  }

  // ---------- Từ tương đương ----------
  // 1) Bộ có sẵn: soạn sẵn theo chủ đề, luôn áp dụng (bật/tắt từng chủ đề) — cập nhật cùng app
  const BUILTIN_EQUIV = [
    {
      id: "will", title: "Cụm đi với will", groups: [
        ["i will", "i'll", "ill"],
        ["you will", "you'll", "youll"],
        ["he will", "he'll", "hell"],
        ["she will", "she'll", "shell"],
        ["it will", "it'll", "itll"],
        ["we will", "we'll", "well"],
        ["they will", "they'll", "theyll"],
        ["there will", "there'll", "therell"],
        ["that will", "that'll", "thatll"],
        ["who will", "who'll", "wholl"],
        ["what will", "what'll", "whatll"],
        ["will not", "won't", "wont"]
      ]
    }
  ];
  // 2) Danh sách của người học (tự sửa trên trang Từ tương đương)
  const DEFAULT_EQUIV = [
    "# Mỗi dòng một nhóm, các cách viết cách nhau bằng dấu =",
    "# Dòng bắt đầu bằng # là ghi chú, app bỏ qua.",
    "he is = he's = hes",
    "she is = she's = shes",
    "we have = we've = weve",
    "they have = they've = theyve",
    "you have = you've = youve"
  ].join("\n");
  function parseEquiv(text) {
    const groups = [], problems = [];
    String(text).split("\n").forEach((line, i) => {
      const l = line.trim();
      if (!l || l.startsWith("#")) return;
      const parts = l.split("=").map(x => x.trim()).filter(Boolean);
      if (parts.length < 2) problems.push(`Dòng ${i + 1} cần ít nhất 2 cách viết`);
      else groups.push(parts);
    });
    return { groups, problems };
  }
  function applyEquiv() {
    const off = new Set(store.get("equiv-off", []));
    const builtin = BUILTIN_EQUIV.filter(t => !off.has(t.id)).flatMap(t => t.groups);
    Grader.setEquivalences(builtin.concat(parseEquiv(store.get("equiv", DEFAULT_EQUIV)).groups));
  }
  applyEquiv();
  loadChunks();

  // ---------- Bôi đen một cụm trong câu tiếng Anh → thanh nhỏ "Lưu để thêm sau / Thêm cụm ngay" ----------
  // Chỉ áp dụng cho phần tử có thuộc tính data-en (đáp án, câu nghe…)
  function findExisting(text) {
    const n = normPhrase(text);
    return CHUNKS.find(c => {
      const m = matcherFor(c), lab = normPhrase(m.label);
      return lab === n || (m.test(text) && n.split(" ").length <= lab.split(" ").length + 1);
    });
  }
  const SelPop = (() => {
    const el = document.createElement("div");
    el.className = "sel-pop";
    el.hidden = true;
    document.body.appendChild(el);
    let cur = null, timer = null;
    const touch = window.matchMedia("(pointer: coarse)").matches;

    function hide() { el.hidden = true; cur = null; }
    function check() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return hide();
      const range = sel.getRangeAt(0);
      const host = n => (n.nodeType === 1 ? n : n.parentElement)?.closest("[data-en]");
      const box = host(range.startContainer);
      if (!box || box !== host(range.endContainer)) return hide();
      const source = box.textContent.replace(/\s+/g, " ").trim();
      let text = sel.toString().replace(/\s+/g, " ").trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      const at = source.indexOf(text); // nới ra cho trọn từ (lỡ bôi thiếu vài chữ cái)
      if (text && at >= 0) {
        let a = at, b = at + text.length;
        while (a > 0 && /[\p{L}\p{N}']/u.test(source[a - 1])) a--;
        while (b < source.length && /[\p{L}\p{N}']/u.test(source[b])) b++;
        text = source.slice(a, b);
      }
      if (text.length < 2 || text.split(" ").length > 10) return hide();
      cur = { text, source };
      const found = findExisting(text);
      el.innerHTML = found
        ? `<span class="sp-note">Đã có cụm này</span><a class="sp-btn on" href="#/c/${encodeURIComponent(found.id)}">Mở “${esc(pretty(found.chunk))}”</a>`
        : (isPending(text)
          ? `<span class="sp-note">${icon("check")} Đã lưu chờ thêm</span>`
          : `<button class="sp-btn on" data-act="save">${icon("bookmark")} Lưu để thêm sau</button>`)
          + `<button class="sp-btn" data-act="add">${icon("plus")} Thêm cụm ngay</button>`;
      el.hidden = false;
      const r = range.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      el.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8) + "px";
      const above = r.top - h - 10;
      el.style.top = (touch || above < 8 ? r.bottom + 10 : above) + "px"; // điện thoại: đặt dưới để không đè menu Copy
    }
    const later = () => { clearTimeout(timer); timer = setTimeout(check, 150); };
    document.addEventListener("selectionchange", later);
    window.addEventListener("scroll", () => { if (!el.hidden) later(); }, { passive: true });
    el.addEventListener("mousedown", e => e.preventDefault()); // giữ nguyên phần đang bôi đen
    el.addEventListener("click", e => {
      const act = e.target.closest("[data-act]");
      if (!act || !cur) return;
      const { text, source } = cur;
      window.getSelection().removeAllRanges();
      hide();
      if (act.dataset.act === "save") {
        addPending(text, source);
        toast(`Đã lưu “${text}” — xem ở trang chủ`);
        if (refreshMarks) refreshMarks();
      } else {
        store.set("prefill", { chunk: text, context: source });
        location.hash = "#/them";
      }
    });
    return { hide };
  })();

  // ---------- Giọng đọc ----------
  const LISTEN_DEFAULTS = { rate: 0.9, listens: 2, gapMode: "+2", rounds: 1, ting: true, textMode: "show", voiceURI: "", viMode: true, loop: false };
  const listenSettings = () => Object.assign({}, LISTEN_DEFAULTS, store.get("listen-settings", {}));
  let pauseActivePlayer = null; // phần Nghe đăng ký để tạm dừng khi bấm nghe lẻ một câu
  function sayOnce(text) {
    if (pauseActivePlayer) pauseActivePlayer();
    const s = listenSettings();
    Speech.cancel();
    setTimeout(() => Speech.speak(text, { rate: s.rate, voiceURI: s.voiceURI }), 60);
  }

  // =========================================================
  // Tiến độ học
  // =========================================================
  function markToday() {
    const days = store.get("stats:days", []);
    const d = today();
    if (!days.includes(d)) { days.push(d); store.set("stats:days", days.slice(-400)); }
  }
  function streak() {
    const days = new Set(store.get("stats:days", []));
    const d = new Date();
    if (!days.has(today(d))) d.setDate(d.getDate() - 1); // chưa luyện hôm nay thì chuỗi vẫn tính tới hôm qua
    let n = 0;
    while (days.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- Nhật ký mỗi ngày ----------
  // stats:log = { "YYYY-MM-DD": { tr: ms dịch, ls: ms nghe, graded: số câu chấm, scoreSum, heard: số câu nghe xong, c: { chunkId: ms } } }
  const EMPTY_DAY = { tr: 0, ls: 0, graded: 0, scoreSum: 0, heard: 0, c: {} };
  function logDay(fn) {
    const log = store.get("stats:log", {});
    const k = today();
    const e = log[k] = Object.assign({}, EMPTY_DAY, { c: {} }, log[k]);
    fn(e);
    store.set("stats:log", log);
    return e;
  }

  // ---------- Đếm thời gian học thật ----------
  // Chỉ cộng giờ khi: đang ở phần Dịch / Nghe, trang đang hiện trên màn hình,
  // và có thao tác trong 60 giây gần nhất HOẶC đang phát audio.
  const Tracker = (() => {
    const IDLE_MS = 60000, TICK_MS = 5000;
    let mode = null, chunkId = null, isPlaying = () => false, lastInput = 0, lastTick = Date.now();
    function tick(flush) {
      const now = Date.now();
      const dt = Math.min(now - lastTick, TICK_MS * 2); // máy ngủ dậy → không cộng cả quãng ngủ
      lastTick = now;
      if (!mode || dt <= 0 || (document.hidden && !flush)) return;
      if (now - lastInput > IDLE_MS && !isPlaying()) return;
      const e = logDay(e => { e[mode] += dt; e.c[chunkId] = (e.c[chunkId] || 0) + dt; });
      if (e.tr + e.ls >= 60000) markToday();
    }
    const poke = () => { lastInput = Date.now(); };
    ["keydown", "pointerdown", "pointermove", "wheel", "touchstart"]
      .forEach(ev => window.addEventListener(ev, poke, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", () => { if (document.hidden) tick(true); else lastTick = Date.now(); });
    window.addEventListener("pagehide", () => tick(true));
    setInterval(() => tick(false), TICK_MS);
    return {
      start(m, id, playing) { tick(false); mode = m; chunkId = id; isPlaying = playing || (() => false); lastTick = Date.now(); poke(); },
      stop() { tick(false); mode = null; }
    };
  })();

  // Trạng thái phần dịch: answers = đang gõ, gradedText = câu lúc bấm Enter (null = chưa chấm)
  function loadTr(c) {
    const N = (c.sentences || []).length;
    const saved = store.get("tr:" + c.id, null) || {};
    const answers = saved.answers || store.get("draft:" + c.id, []); // draft: dữ liệu bản cũ
    const at = (arr, i, d) => (arr && arr[i] !== undefined ? arr[i] : d);
    const st = {
      answers: Array.from({ length: N }, (_, i) => at(answers, i, "") || ""),
      gradedText: Array.from({ length: N }, (_, i) => at(saved.gradedText, i, null)),
      overrides: Array.from({ length: N }, (_, i) => !!at(saved.overrides, i, false)),
      hist: Array.from({ length: N }, (_, i) => { const h = at(saved.hist, i, []); return Array.isArray(h) ? h : []; }), // điểm từng lần làm
      due: Array.from({ length: N }, (_, i) => at(saved.due, i, null)),        // ngày câu quay lại để ôn (YYYY-MM-DD)
      review: Array.from({ length: N }, (_, i) => !!at(saved.review, i, false)) // câu đang được ôn lại
    };
    // Đến hạn ôn → câu trở lại như câu mới, phải dịch lại
    const t = today();
    let changed = false;
    for (let i = 0; i < N; i++) {
      if (!st.due[i] || st.due[i] > t) continue;
      st.gradedText[i] = null; st.answers[i] = ""; st.overrides[i] = false; st.hist[i] = [];
      st.due[i] = null; st.review[i] = true;
      changed = true;
    }
    if (changed) store.set("tr:" + c.id, st);
    return st;
  }
  const listenState = c => Object.assign({ done: [], rounds: 0 }, store.get("listen:" + c.id, {}));

  function chunkInfo(c) {
    const best = store.get("best:" + c.id, null);
    const tr = loadTr(c);
    const graded = tr.gradedText.filter(x => x !== null).length;
    const dueCount = tr.review.filter((r, i) => r && tr.gradedText[i] === null).length;
    const t = today();
    const allResting = tr.due.length > 0 && tr.due.every((d, i) => d && d > t && tr.hist[i][0] === 10);
    const restUntil = allResting ? tr.due.slice().sort()[0] : null;
    // Số câu dịch đã xong (chế độ "Luyện đến khi đúng": phải đạt 10/10; câu đang nghỉ cũng tính)
    const strict = store.get("strict", true);
    const doneCount = tr.gradedText.filter((g, i) => g !== null && (!strict || !tr.hist[i].length || tr.hist[i].includes(10))).length;
    const ls = listenState(c);
    const status = best != null && best >= 85 && ls.rounds >= 1 ? "ok"
      : best != null || graded || ls.rounds || ls.done.length ? "mid" : "new";
    return { c, best, graded, doneCount, total: (c.sentences || []).length, ls, items: playlistFor(c).length, status, dueCount, restUntil };
  }

  // =========================================================
  // Điều hướng
  // =========================================================
  let cleanup = null;

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    refreshMarks = null;
    SelPop.hide();
    Speech.cancel();
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    if (parts[0] === "tong-ket") return renderSummary();
    if (parts[0] === "tuong-duong") return renderEquiv();
    if (parts[0] === "them") return renderEditor(null);
    if (parts[0] === "c") {
      const chunk = CHUNKS.find(c => c.id === decodeURIComponent(parts[1] || ""));
      if (chunk && parts[2] === "sua") return renderEditor(chunk);
      if (chunk) return renderChunk(chunk, parts[2] || store.get("tab:" + chunk.id, "translate"));
    }
    renderHome();
  }
  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

  // =========================================================
  // TRANG CHỦ
  // =========================================================
  const STATUS = { new: ["st-new", "Chưa học"], mid: ["st-mid", "Đang luyện"], ok: ["st-ok", "Thành thạo"] };
  const FILTERS = [["all", "Tất cả"], ["new", "Chưa học"], ["mid", "Đang luyện"], ["ok", "Thành thạo"]];

  function renderHome() {
    document.title = "Chunking Practice";
    const infos = CHUNKS.map(chunkInfo);
    const bests = infos.filter(x => x.best != null).map(x => x.best);
    const avg = bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : null;
    const days = streak();
    const last = store.get("stats:last", null);
    const count = k => (k === "all" ? infos.length : infos.filter(x => x.status === k).length);
    let filter = store.get("home-filter", "all");

    app.innerHTML = `
      <header class="home-top">
        <div class="brand"><span class="brand-mark">${icon("logo")}</span>Chunking</div>
        <div class="home-actions">
          <span class="streak ${days ? "" : "off"}">${icon("flame")} ${days ? `${days} ngày liên tiếp` : "Luyện hôm nay để bắt đầu chuỗi ngày"}</span>
          <a class="btn sm" href="#/tong-ket">${icon("chart")} Tổng kết</a>
          <a class="btn sm primary" href="#/them">${icon("plus")} Thêm cụm</a>
        </div>
      </header>
      <section class="stats">
        <div class="stat"><small>Cụm đã thành thạo</small><b>${infos.filter(x => x.status === "ok").length}</b><span> / ${infos.length}</span></div>
        <div class="stat"><small>Điểm dịch trung bình</small><b>${avg == null ? "—" : avg}</b></div>
        <div class="stat"><small>Câu đã nghe – nhắc lại</small><b>${store.get("stats:heard", 0)}</b></div>
      </section>
      ${pendingBoxHtml()}
      <div class="toolbar">
        ${FILTERS.map(([k, l]) => `<button class="filter" data-f="${k}">${l}<span class="n">${count(k)}</span></button>`).join("")}
        <label class="search">${icon("search")}<input type="search" placeholder="Tìm cụm…" aria-label="Tìm cụm"></label>
      </div>
      <div class="grid">${infos.map(x => cardHtml(x, last)).join("")}</div>
      <p class="empty" hidden>${CHUNKS.length ? "Không có cụm nào khớp." : "Chưa có cụm nào — bấm “Thêm cụm” để bắt đầu."}</p>
      <footer class="home-foot">
        <span>Cụm tự thêm, điểm và thời gian học được lưu trong trình duyệt này.</span>
        <button class="link" id="backup-dl">${icon("download")} Tải file sao lưu</button>
        <label class="link">${icon("upload")} Khôi phục từ file<input type="file" accept=".json,application/json" id="backup-ul" hidden></label>
        <a class="link" href="#/tuong-duong">${icon("equal")} Từ tương đương</a>
      </footer>`;
    app.querySelector("#backup-dl").addEventListener("click", exportBackup);
    const pbox = app.querySelector(".pending-box");
    if (pbox) pbox.addEventListener("click", e => {
      const list = pendingList();
      const add = e.target.closest("[data-padd]"), del = e.target.closest("[data-pdel]");
      if (add) {
        const p = list[+add.dataset.padd];
        store.set("prefill", { chunk: p.text, context: p.source });
        location.hash = "#/them";
      } else if (del) {
        removePending(list[+del.dataset.pdel].text);
        renderHome();
      }
    });
    app.querySelector("#backup-ul").addEventListener("change", e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; });

    const search = app.querySelector(".search input");
    function apply() {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      app.querySelectorAll(".filter").forEach(b => b.classList.toggle("on", b.dataset.f === filter));
      app.querySelectorAll(".chunk-card").forEach(card => {
        const ok = (filter === "all" || card.dataset.status === filter) && (!q || card.dataset.q.includes(q));
        card.hidden = !ok;
        if (ok) shown++;
      });
      app.querySelector(".empty").hidden = shown > 0;
    }
    app.querySelector(".grid").addEventListener("click", e => {
      const btn = e.target.closest("[data-menu]");
      if (!btn) return;
      e.preventDefault(); // nút nằm trong thẻ (link) → không mở cụm
      e.stopPropagation();
      const c = CHUNKS.find(x => x.id === btn.dataset.menu);
      if (!c) return;
      PopMenu.open(btn, [
        { act: "edit", icon: "edit", label: "Sửa cụm" },
        { act: "delete", icon: "trash", label: "Xoá cụm", danger: true }
      ], async act => {
        if (act === "edit") { location.hash = `#/c/${encodeURIComponent(c.id)}/sua`; return; }
        if (!(await askDeleteChunk(c))) return;
        deleteChunk(c.id);
        toast(`Đã xoá cụm “${pretty(c.chunk)}”`);
        renderHome();
      });
    });
    app.querySelector(".toolbar").addEventListener("click", e => {
      const b = e.target.closest(".filter");
      if (!b) return;
      filter = b.dataset.f;
      store.set("home-filter", filter);
      apply();
    });
    search.addEventListener("input", apply);
    apply();
  }

  function pendingBoxHtml() {
    const list = pendingList();
    if (!list.length) return "";
    return `
      <section class="box pending-box">
        <div class="box-head"><h2>Cụm mới đang chờ <span class="muted">${list.length}</span></h2>
          <span class="hint">Bôi đen một cụm trong lúc luyện để lưu vào đây</span></div>
        ${list.map((p, i) => `
          <div class="pend-row">
            <span class="pend-ph">${esc(p.text)}</span>
            <span class="pend-src" title="${esc(p.source || "")}">${esc(p.source || "")}</span>
            <button class="btn sm primary" data-padd="${i}">${icon("plus")} Thêm cụm</button>
            <button class="icon-btn sm" data-pdel="${i}" title="Bỏ khỏi danh sách" aria-label="Bỏ khỏi danh sách">${icon("x")}</button>
          </div>`).join("")}
      </section>`;
  }

  function cardHtml(x, last) {
    const { c } = x;
    const isLast = last === c.id && x.status !== "new";
    // Thanh tiến độ: xám khi đang làm, đủ 100% mới chuyển xanh
    const trFull = x.total > 0 && x.doneCount >= x.total;
    const tr = trFull ? { label: `Xong ✓${x.best != null ? ` · ${x.best} điểm` : ""}`, w: 100, cls: "f-good" }
      : x.doneCount ? { label: `${x.doneCount}/${x.total} câu`, w: (x.doneCount / x.total) * 100, cls: "" }
      : { label: "—", w: 0, cls: "" };
    const heard = x.ls.done.length;
    const ls = !heard && x.ls.rounds ? { label: `Xong ✓ · ${x.ls.rounds} lượt`, w: 100, cls: "f-good" }
      : heard ? { label: `${heard}/${x.items} câu${x.ls.rounds ? ` · ${x.ls.rounds} lượt` : ""}`, w: (heard / x.items) * 100, cls: "" }
      : { label: "—", w: 0, cls: "" };
    return `
      <a class="chunk-card${isLast ? " continue" : ""}" href="#/c/${encodeURIComponent(c.id)}"
         data-status="${x.status}" data-q="${esc((c.chunk + " " + (c.meaning || "")).toLowerCase())}">
        <div class="card-top">
          <span class="status ${STATUS[x.status][0]}">${STATUS[x.status][1]}</span>
          ${isLast ? `<span class="cont">Luyện tiếp ${icon("arrowRight")}</span>` : ""}
          <button class="card-menu" data-menu="${esc(c.id)}" title="Sửa / xoá cụm" aria-label="Sửa hoặc xoá cụm">${icon("dots")}</button>
        </div>
        <div class="phrase">${esc(pretty(c.chunk))}</div>
        <p class="meaning">${esc(c.meaning || "")}</p>
        ${x.dueCount ? `<div class="due-tag">${icon("refresh")} ${x.dueCount} câu đến hạn ôn</div>`
          : x.restUntil ? `<div class="due-tag ok">${icon("check")} Đã thuộc — ôn lại ${fmtDay(x.restUntil)}</div>` : ""}
        <div class="meter">
          <div class="meter-label"><span>Dịch</span><span>${tr.label}</span></div>
          <div class="track"><div class="${tr.cls}" style="width:${tr.w}%"></div></div>
        </div>
        <div class="meter">
          <div class="meter-label"><span>Nghe</span><span>${ls.label}</span></div>
          <div class="track"><div class="${ls.cls}" style="width:${ls.w}%"></div></div>
        </div>
      </a>`;
  }

  // =========================================================
  // TRANG MỘT CỤM
  // =========================================================
  const TABS = [
    { key: "translate", icon: "translate", label: "Dịch", long: " Việt → Anh" },
    { key: "listen", icon: "headphones", label: "Nghe", long: " & nhắc lại" },
    { key: "goi-y", icon: "bulb", label: "Gợi ý", long: " & nhắc lại" }
  ];

  function formulaHtml(c) {
    const parts = c.structure ? c.structure.split(/\s+\+\s+/)
      : [matcherFor(c).label].concat(/\.{3}|…/.test(c.chunk) ? ["…"] : []);
    const isSlot = p => /^(V\b|N\b|O\b|S\b|sb\b|sth\b|adj|adv|noun|verb|clause|mệnh đề|danh từ|động từ|…|\.\.\.)/i.test(p.trim());
    return parts.map(p => `<span class="pill ${isSlot(p) ? "slot" : "fixed"}">${esc(p)}</span>`).join('<span class="plus">+</span>');
  }

  function renderChunk(c, tab) {
    if (!TABS.some(t => t.key === tab)) tab = "translate";
    store.set("tab:" + c.id, tab);
    store.set("stats:last", c.id);
    document.title = `${pretty(c.chunk)} · Chunking`;
    app.innerHTML = `
      <a class="back" href="#/">${icon("arrowLeft")} Tất cả cụm</a>
      <div class="hero">
        <h1>${esc(pretty(c.chunk))}</h1>
        <div class="hero-actions">
          <button class="icon-btn" id="say-chunk" title="Nghe phát âm" aria-label="Nghe phát âm">${icon("volume")}</button>
          <a class="icon-btn" href="#/c/${encodeURIComponent(c.id)}/sua" title="Sửa cụm" aria-label="Sửa cụm">${icon("edit")}</a>
        </div>
      </div>
      <div class="formula">${formulaHtml(c)}</div>
      <p class="hero-meaning">${esc(c.meaning || "")}</p>
      <nav class="seg">
        ${TABS.map(t => `<a class="tab${t.key === tab ? " on" : ""}" href="#/c/${encodeURIComponent(c.id)}/${t.key}">${icon(t.icon)}<span>${t.label}<span class="long">${t.long}</span></span></a>`).join("")}
      </nav>
      <section id="pane"></section>`;
    app.querySelector("#say-chunk").addEventListener("click", () => sayOnce(spokenChunk(c)));
    const pane = app.querySelector("#pane");
    if (tab === "listen") renderListen(c, pane, "repeat");
    else if (tab === "goi-y") renderListen(c, pane, "cue");
    else renderTranslate(c, pane);
  }

  // =========================================================
  // PHẦN 1 — DỊCH VIỆT → ANH
  // =========================================================
  function errWrap(raw) {
    const m = raw.match(/^([^\p{L}\p{N}']*)(.*?)([^\p{L}\p{N}']*)$/u);
    if (!m || !m[2]) return esc(raw);
    return `${esc(m[1])}<b class="err">${esc(m[2])}</b>${esc(m[3])}`;
  }

  // Ghép lại câu từ các từ đã đánh dấu: chỗ sai in đậm đỏ, chỗ thiếu "__", cụm chunk tô vàng
  function tokensHtml(tokens, text, isRef, gapEnd, matcher) {
    const r = matcher.range(text), pend = pendingRanges(text);
    let html = "", open = false;
    tokens.forEach((t, k) => {
      const inChunk = r && t.start < r[1] && t.end > r[0];
      const gap = !isRef && t.gap ? '<span class="gap">__</span> ' : "";
      if (open && (!inChunk || gap)) { html += "</mark>"; open = false; }
      html += (k ? " " : "") + gap;
      if (inChunk && !open) { html += "<mark>"; open = true; }
      const word = (isRef ? t.fix : t.err) ? errWrap(t.raw) : esc(t.raw);
      html += pend.some(([a, b]) => t.start < b && t.end > a) ? `<b class="pend">${word}</b>` : word;
    });
    if (open) html += "</mark>";
    if (gapEnd) html += ' <span class="gap">__</span>';
    return html;
  }

  const sayBtn = text => `<button class="icon-btn sm" data-say="${esc(text)}" title="Nghe câu này" aria-label="Nghe câu này">${icon("volume")}</button>`;
  const comment = sc => (sc === 10 ? "Chính xác!" : sc >= 8 ? "Rất tốt" : sc >= 5 ? "Khá — xem lại chỗ tô đỏ" : "Cần luyện thêm");

  function renderTranslate(c, pane) {
    const S = c.sentences || [];
    const N = S.length;
    const m = matcherFor(c);
    const label = m.label;
    const st = loadTr(c);
    const levels = [...new Set(S.map(s => s.level || ""))];
    const order = levels.flatMap(lv => S.map((_, i) => i).filter(i => (S[i].level || "") === lv));
    const results = S.map((s, i) => (st.gradedText[i] === null ? null : Grader.grade(st.gradedText[i], s.en, m)));
    // "Luyện đến khi đúng": câu chưa được 10/10 phải làm lại mới qua câu tiếp
    let strict = store.get("strict", true);

    const isGraded = i => st.gradedText[i] !== null;
    // dữ liệu bản cũ chưa có lịch sử điểm → lấy điểm lần chấm gần nhất
    S.forEach((_, i) => { if (isGraded(i) && !st.hist[i].length) st.hist[i] = [st.overrides[i] ? 10 : results[i].score]; });
    const tries = i => st.hist[i];
    const lastScore = i => (st.overrides[i] ? 10 : results[i].score);
    const passed = i => tries(i).includes(10);
    const isDone = i => (strict ? passed(i) : isGraded(i));
    const scoreOf = i => (strict ? tries(i)[0] || 0 : lastScore(i)); // chế độ chặt: tính điểm lần đầu
    const isStale = i => isGraded(i) && st.answers[i].trim() !== st.gradedText[i];
    // Đúng ngay lần đầu → nghỉ 2 ngày (mờ đi, bỏ qua); phải làm lại mới đúng → hôm sau quay lại
    const resting = i => !!st.due[i] && st.due[i] > today() && tries(i)[0] === 10;
    const setDue = i => { st.due[i] = today(addDays(new Date(), tries(i)[0] === 10 && !st.overrides[i] ? 2 : 1)); st.review[i] = false; };
    const reviewTag = i => (st.review[i] ? '<span class="tag-review">Ôn lại</span>' : "");
    const allDone = () => N > 0 && order.every(isDone);
    const pctNow = () => Math.round((order.reduce((a, i) => a + scoreOf(i), 0) / (N * 10)) * 100);
    const save = () => store.set("tr:" + c.id, st);
    function nextUndone(from) {
      const k = order.indexOf(from);
      for (let j = 1; j <= N; j++) { const i = order[(k + j) % N]; if (!isDone(i)) return i; }
      return null;
    }
    const firstUndone = () => { const i = order.find(x => !isDone(x)); return i === undefined ? null : i; };

    let current = firstUndone();
    let lastGraded = null;   // câu vừa chấm / câu đang xem lại: mở ra để xem phần sửa
    let armed = null;        // nút "Làm lại" cần bấm 2 lần
    let newBest = false;
    let reviewing = false;   // vừa chấm xong câu hiện tại: dừng lại xem kết quả, Enter lần nữa mới sang câu
    let announce = false;    // vừa làm xong cả bài → báo khi sang câu

    pane.innerHTML = `
      <div class="mode-row">
        <label class="switch"><input type="checkbox" id="strict"${strict ? " checked" : ""}> <b>Luyện đến khi đúng</b></label>
        <span class="hint">Câu chưa đúng 100% phải gõ lại mới qua câu tiếp</span>
      </div>
      <div class="progress" id="progress"></div><div id="list"></div><div id="result"></div>`;
    const progEl = pane.querySelector("#progress");
    const listEl = pane.querySelector("#list");
    const resultEl = pane.querySelector("#result");

    const grow = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; };
    const chip = (i, v = scoreOf(i)) => `<span class="score sc-${scoreClass(v)}">${v}/10</span>`;
    const triesHtml = i => tries(i).map((v, k) => `Lần ${k + 1}: <b class="t-${scoreClass(v)}">${v}/10</b>`).join(" → ");

    function render({ focus = false, scroll = false } = {}) {
      renderProgress();
      renderList();
      renderResult();
      if (current === null) return;
      const ta = listEl.querySelector("textarea");
      grow(ta);
      updateLive();
      if (focus) { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); }
      if (scroll) ta.closest(".q-card").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function renderProgress() {
      if (!N) { progEl.innerHTML = ""; return; }
      const done = order.filter(isDone);
      const total = done.reduce((a, i) => a + scoreOf(i), 0);
      progEl.innerHTML = `
        <span class="count">${done.length}/${N}</span>
        <div class="segs">${order.map((i, k) => {
          const cls = i === current ? "cur" : resting(i) ? "rest" : isDone(i) ? "f-" + scoreClass(scoreOf(i)) : strict ? "locked" : "";
          const tip = resting(i) ? ` · nghỉ đến ${fmtDay(st.due[i])}` : isDone(i) ? ` · ${scoreOf(i)}/10` : "";
          return `<button class="${cls}" data-go="${i}" title="Câu ${k + 1}${tip}" aria-label="Câu ${k + 1}"></button>`;
        }).join("")}</div>
        <span class="total">${total} điểm</span>
        <button class="btn ghost sm${armed ? " armed" : ""}" id="reset">${icon("refresh")}<span>${armed ? "Bấm lần nữa để xoá" : "Làm lại"}</span></button>`;
    }

    function renderList() {
      if (!N) { listEl.innerHTML = '<p class="empty">Cụm này chưa có câu luyện dịch.</p>'; return; }
      let html = "", n = 0;
      levels.forEach(lv => {
        html += `<div class="level"><b>${esc(lv || "—")}</b>${lv === "B1" ? "Cơ bản" : lv === "B2" ? "Nâng cao" : ""}</div>`;
        order.filter(i => (S[i].level || "") === lv).forEach(i => { html += itemHtml(i, ++n); });
      });
      listEl.innerHTML = html;
    }

    function itemHtml(i, n) {
      const s = S[i];
      if (i === current) {
        const retrying = strict && isGraded(i) && !passed(i); // đã chấm nhưng chưa đạt → đang làm lại
        const hideAns = retrying && st.answers[i].trim();      // bắt đầu gõ lại thì che đáp án
        const locked = reviewing && strict;                     // đúng rồi: khoá ô nhập, chờ Enter sang câu
        return `
        <div class="q-card cur${reviewing ? " reviewing" : ""}">
          <div class="q-head"><span class="num">${n}.</span><p class="vi">${esc(s.vi)}${reviewTag(i)}</p>${reviewing || (!strict && isGraded(i)) ? chip(i, lastScore(i)) : ""}</div>
          ${retrying ? `<div class="attempts">${triesHtml(i)} · chưa đúng 100% — <b>gõ lại cả câu</b> rồi nhấn Enter</div>`
            : reviewing && strict && tries(i).length > 1 ? `<div class="attempts">${triesHtml(i)}</div>` : ""}
          <textarea rows="1" spellcheck="false" autocomplete="off" autocapitalize="sentences"${locked ? " readonly" : ""}
            placeholder="${retrying ? "Gõ lại cả câu…" : "Gõ câu tiếng Anh…"}" aria-label="Câu trả lời câu ${n}">${esc(st.answers[i])}</textarea>
          <div class="live">
            <span class="live-status" id="live"></span>
            <span class="live-actions">
              ${reviewing
                ? `<span><kbd>Enter</kbd> sang câu tiếp${strict ? "" : " · sửa câu rồi Enter để chấm lại"}</span>
                   <button class="btn sm primary" data-next>${nextUndone(i) === null ? "Xem kết quả" : "Câu tiếp"} ${icon("arrowRight")}</button>`
                : `${isGraded(i) ? "" : '<button class="link" data-skip>Xem đáp án</button>'}
                   <span><kbd>Enter</kbd> chấm điểm</span>`}
            </span>
          </div>
          ${!isGraded(i) ? "" : strict ? `
            <div class="fb${hideAns ? " ans-hidden" : ""}" data-peek>${feedbackHtml(i)}
              <div class="peek-label">${icon("eye")} Đáp án đang ẩn — bấm để xem lại</div></div>` : `
            <div class="fb${isStale(i) ? " stale" : ""}">${feedbackHtml(i)}</div>
            <div class="stale-hint"${isStale(i) ? "" : " hidden"}>Bạn đã sửa câu — nhấn Enter để chấm lại</div>`}
        </div>`;
      }
      if (isGraded(i) && i === lastGraded) return `
        <div class="q-card open" data-go="${i}"${strict ? "" : ' title="Bấm để sửa câu này"'}>
          <div class="q-head"><span class="num">${n}.</span><p class="vi">${esc(s.vi)}</p>${chip(i)}</div>
          ${strict && tries(i).length > 1 ? `<div class="attempts">${triesHtml(i)}</div>` : ""}
          ${feedbackHtml(i)}
        </div>`;
      if (isDone(i)) {
        const txt = st.gradedText[i];
        const k = tries(i).length;
        return `<button class="q-row${resting(i) ? " resting" : ""}" data-go="${i}"><span class="num">${n}</span>
          <span class="tx${txt ? "" : " skip"}">${txt ? esc(txt) : "Đã xem đáp án"}</span>
          ${resting(i) ? `<span class="rest-tag" title="Đúng ngay lần đầu — nghỉ 2 ngày">${icon("check")} Nghỉ đến ${fmtDay(st.due[i])}</span>` : ""}
          ${strict && k > 1 ? `<span class="tries" title="Số lần làm">${k} lần</span>` : ""}${chip(i)}</button>`;
      }
      return `<button class="q-row todo${strict ? " locked" : ""}" data-go="${i}"><span class="num">${n}</span><span class="tx">${esc(s.vi)}</span>${reviewTag(i)}</button>`;
    }

    function feedbackHtml(i) {
      const r = results[i], s = S[i], sc = lastScore(i); // phần sửa luôn theo lần chấm gần nhất
      let top, lines;
      if (r.empty) {
        top = `<span class="no">${icon("x")} Chưa trả lời</span>`;
        lines = `<div class="fix-line"><span class="lb">Đáp án</span><span class="tx" data-en>${highlight(c, r.best)}</span>${sayBtn(r.best)}</div>`;
      } else {
        top = (r.chunkUsed
          ? `<span class="ok">${icon("circleCheck")} Đã dùng cụm “${esc(label)}”</span>`
          : `<span class="no">${icon("x")} Chưa dùng đúng cụm “${esc(label)}”</span>`)
          + `<span class="note">${st.overrides[i] ? "Tự chấm: đúng ý" : comment(sc)}</span>`;
        const yours = tokensHtml(r.marks.user, st.gradedText[i], false, r.marks.gapEnd, m);
        lines = r.sim > 0.999
          ? `<div class="fix-line"><span class="lb">Bạn viết</span><span class="tx" data-en>${yours}</span>${sayBtn(r.best)}</div>`
          : `<div class="fix-line"><span class="lb">Bạn viết</span><span class="tx" data-en>${yours}</span></div>
             <div class="fix-line"><span class="lb">Sửa lại</span><span class="tx" data-en>${tokensHtml(r.marks.ref, r.best, true, false, m)}</span>${sayBtn(r.best)}</div>`;
      }
      const others = s.en.filter(a => a !== r.best);
      const actions = r.empty || sc >= 10 ? "" : `<div class="fb-actions">
          ${strict ? "" : `<button class="link" data-self="${i}">Câu của mình cũng đúng ý → tính 10/10</button>`}
          <a class="link muted-link" href="#/tuong-duong">${icon("equal")} Thêm từ tương đương</a></div>`;
      return `
        <div class="fb-top">${top}</div>
        <div class="fix-lines">${lines}</div>
        ${others.length ? `<div class="alts"><div class="lb">Cách khác</div>${others.map(a => `<div><span data-en>${highlight(c, a)}</span>${sayBtn(a)}</div>`).join("")}</div>` : ""}
        ${actions}`;
    }

    function renderResult() {
      if (!allDone() || reviewing) { resultEl.innerHTML = ""; resultEl.dataset.key = ""; return; }
      const pct = pctNow();
      const wrong = order.filter(i => (strict ? scoreOf(i) < 10 : scoreOf(i) < 8));
      const retries = order.reduce((a, i) => a + Math.max(0, tries(i).length - 1), 0);
      const key = `${strict}|${pct}|${wrong.length}|${retries}|${newBest}`;
      if (resultEl.dataset.key === key) return; // tránh chạy lại hiệu ứng khi không đổi
      resultEl.dataset.key = key;
      const byLevel = levels.map(lv => {
        const idx = order.filter(i => (S[i].level || "") === lv);
        return `${esc(lv || "—")} <b>${idx.reduce((a, i) => a + scoreOf(i), 0)}</b>/${idx.length * 10}`;
      }).join(" · ");
      const used = order.filter(i => results[i].chunkUsed || st.overrides[i]).length;
      const firstTry = order.filter(i => tries(i)[0] === 10).length;
      const title = pct >= 90 ? "Xuất sắc!" : pct >= 75 ? "Tốt lắm!" : pct >= 50 ? "Khá ổn" : "Cần luyện thêm";
      const ring = pct >= 80 ? "st-good" : pct >= 50 ? "st-mid-c" : "st-bad";
      resultEl.innerHTML = `
        <div class="result">
          <div class="ring-wrap">
            <svg viewBox="0 0 100 100"><circle class="track-c" cx="50" cy="50" r="44"/>
              <circle class="prog-c ${ring}" cx="50" cy="50" r="44" pathLength="100" style="stroke-dashoffset:100"/></svg>
            <div class="center"><b>${pct}</b><small>/ 100</small></div>
          </div>
          <div>
            <h2>${title}${newBest ? '<span class="new-best">Kỷ lục mới</span>' : ""}</h2>
            <div class="meta">${strict
              ? `Điểm lần đầu: ${byLevel} · Đúng ngay lần đầu <b>${firstTry}</b>/${N} câu · Làm lại <b>${retries}</b> lần`
              : `${byLevel} · Dùng đúng cụm <b>${used}</b>/${N} câu`} · Cao nhất <b>${store.get("best:" + c.id, pct)}</b></div>
            <div class="actions">
              ${wrong.length ? `<button class="btn primary" id="retry-wrong">${icon("refresh")} Làm lại ${wrong.length} câu ${strict ? "chưa đúng ngay lần đầu" : "chưa tốt"}</button>` : ""}
              <a class="btn${wrong.length ? "" : " primary"}" href="#/c/${encodeURIComponent(c.id)}/listen">${icon("headphones")} Sang phần Nghe</a>
            </div>
          </div>
        </div>`;
      const circle = resultEl.querySelector(".prog-c");
      requestAnimationFrame(() => requestAnimationFrame(() => { circle.style.strokeDashoffset = 100 - pct; }));
    }

    function updateLive(error) {
      const el = listEl.querySelector("#live");
      if (!el || current === null) return;
      const v = st.answers[current].trim();
      if (reviewing && !error && (strict || !isStale(current))) {
        const sc = lastScore(current);
        el.className = "live-status " + (sc === 10 ? "ok" : sc >= 5 ? "no" : "err");
        el.innerHTML = sc === 10 ? `${icon("circleCheck")} Đúng rồi!` : `${icon("alert")} Được ${sc}/10 — xem phần sửa bên dưới`;
        return;
      }
      if (error) { el.className = "live-status err"; el.innerHTML = `${icon("alert")} ${error}`; }
      else if (!v) { el.className = "live-status"; el.innerHTML = `Nhớ dùng cụm <mark>${esc(label)}</mark>`; }
      else if (m.test(v)) { el.className = "live-status ok"; el.innerHTML = `${icon("circleCheck")} Đã có cụm “${esc(label)}”`; }
      else { el.className = "live-status no"; el.innerHTML = `${icon("alert")} Chưa thấy cụm “${esc(label)}”`; }
    }

    function checkComplete(announce) {
      if (!allDone()) return;
      const pct = pctNow();
      const prev = store.get("best:" + c.id, null);
      newBest = prev != null && pct > prev;
      if (prev == null || pct > prev) store.set("best:" + c.id, pct);
      if (announce) toast(`Hoàn thành ${N} câu — ${pct}/100 điểm`);
    }

    function gradeCurrent(skip) {
      const i = current;
      if (i === null) return;
      const text = skip ? "" : st.answers[i].trim();
      if (!skip && !text) {
        const ta = listEl.querySelector("textarea");
        ta.classList.remove("shake"); void ta.offsetWidth; ta.classList.add("shake");
        updateLive("Gõ câu tiếng Anh trước đã — hoặc bấm “Xem đáp án”");
        return;
      }
      const wasDone = allDone();
      st.gradedText[i] = text;
      st.overrides[i] = false;
      results[i] = Grader.grade(text, S[i].en, m);
      st.hist[i] = tries(i).concat(results[i].score);
      logDay(e => { e.graded++; e.scoreSum += results[i].score; });
      markToday();
      if (strict && results[i].score < 10) {
        st.answers[i] = "";                 // chưa đúng 100% → ở lại, gõ lại từ đầu
        save();
        lastGraded = null;
        render({ focus: true, scroll: true });
        return;
      }
      setDue(i);
      save();
      reviewing = true;                     // dừng lại ở câu này để xem kết quả
      announce = announce || !wasDone;
      lastGraded = null;
      render({ focus: true });
    }

    // Enter lần 2 (hoặc nút "Câu tiếp"): sang câu chưa làm tiếp theo
    function advance() {
      const i = current;
      reviewing = false;
      lastGraded = i;
      current = nextUndone(i);
      checkComplete(announce);
      announce = false;
      render({ focus: current !== null, scroll: current !== null });
      if (current === null) resultEl.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    function stopReview() { reviewing = false; announce = false; }
    function clearSentence(i) { st.gradedText[i] = null; st.overrides[i] = false; st.answers[i] = ""; st.hist[i] = []; st.due[i] = null; st.review[i] = false; results[i] = null; }

    function retryWrong() {
      const wrong = order.filter(i => (strict ? scoreOf(i) < 10 : scoreOf(i) < 8));
      wrong.forEach(clearSentence);
      save();
      stopReview();
      newBest = false;
      lastGraded = null;
      current = wrong.length ? wrong[0] : null;
      render({ focus: true, scroll: true });
    }

    function reset() {
      if (!armed) {
        armed = setTimeout(() => { armed = null; renderProgress(); }, 3000);
        renderProgress();
        return;
      }
      clearTimeout(armed); armed = null;
      for (let i = 0; i < N; i++) clearSentence(i);
      save();
      stopReview();
      newBest = false; lastGraded = null; current = N ? order[0] : null;
      render({ focus: true, scroll: true });
    }

    // ---------- Sự kiện ----------
    pane.querySelector("#strict").addEventListener("change", e => {
      strict = e.target.checked;
      store.set("strict", strict);
      stopReview();
      current = firstUndone();
      lastGraded = null;
      newBest = false;
      render({ focus: current !== null, scroll: current !== null });
      toast(strict ? "Đã bật: câu chưa đúng 100% phải làm lại" : "Đã tắt chế độ luyện đến khi đúng");
    });
    pane.addEventListener("click", e => {
      const t = e.target;
      if (!t.closest("button, a, input, label") && !window.getSelection().isCollapsed) return; // đang bôi đen chữ
      const peek = t.closest("[data-peek]");
      if (peek && peek.classList.contains("ans-hidden")) { peek.classList.remove("ans-hidden"); return; }
      const say = t.closest("[data-say]");
      if (say) return sayOnce(say.dataset.say);
      const self = t.closest("[data-self]");
      if (self) {
        st.overrides[+self.dataset.self] = true;
        setDue(+self.dataset.self);
        save(); checkComplete(false); render();
        return;
      }
      if (t.closest("[data-next]")) return advance();
      if (t.closest("[data-skip]")) return gradeCurrent(true);
      if (t.closest("#reset")) return reset();
      if (t.closest("#retry-wrong")) return retryWrong();
      const go = t.closest("[data-go]");
      if (!go || +go.dataset.go === current) return;
      const i = +go.dataset.go;
      if (strict) {
        if (!isDone(i)) { toast(reviewing ? "Nhấn Enter để sang câu tiếp" : "Làm đúng câu hiện tại trước đã"); return; }
        lastGraded = lastGraded === i ? null : i; // chỉ mở ra xem lại, không làm lại
        render();
        return;
      }
      stopReview();
      current = i;
      lastGraded = null;
      render({ focus: true, scroll: true });
    });
    pane.addEventListener("input", e => {
      if (e.target.tagName !== "TEXTAREA" || current === null) return;
      st.answers[current] = e.target.value.replace(/\s*\n\s*/g, " ");
      grow(e.target);
      save();
      updateLive();
      if (strict) {
        const fb = listEl.querySelector(".fb[data-peek]");
        if (fb) fb.classList.toggle("ans-hidden", !!st.answers[current].trim()); // gõ lại thì che đáp án
      } else {
        const fb = listEl.querySelector(".fb"), hint = listEl.querySelector(".stale-hint");
        if (fb) { fb.classList.toggle("stale", isStale(current)); hint.hidden = !isStale(current); }
      }
    });
    pane.addEventListener("keydown", e => {
      if (e.target.tagName !== "TEXTAREA" || e.key !== "Enter" || e.isComposing) return;
      e.preventDefault();
      if (reviewing && (strict || !isStale(current))) advance(); // Enter lần 2 → sang câu tiếp
      else gradeCurrent(false);
    });

    Tracker.start("tr", c.id);
    refreshMarks = () => render();
    cleanup = () => { clearTimeout(armed); Tracker.stop(); };
    render({ focus: current !== null });
  }

  // =========================================================
  // PHẦN 2 — NGHE & NHẮC LẠI
  // =========================================================
  // Nhịp mỗi câu: nghe N lần (cách nhau 0,5 giây) → "ting" → lượt nói (mặc định: độ dài câu + 2 giây) → câu tiếp
  const SETTINGS_UI = [
    { k: "rate", label: "Tốc độ đọc", opts: [[0.7, "0.7×"], [0.8, "0.8×"], [0.9, "0.9×"], [1, "1×"], [1.1, "1.1×"]] },
    { k: "listens", label: "Nghe mấy lần", opts: [[1, "1 lần"], [2, "2 lần"], [3, "3 lần"]] },
    { k: "gapMode", label: "Lượt nói", opts: [["+1", "câu +1s"], ["+2", "câu +2s"], ["+3", "câu +3s"], ["x1.5", "1,5× câu"], ["x2", "2× câu"]] },
    { k: "rounds", label: "Số vòng mỗi câu", opts: [[1, "1"], [2, "2"], [3, "3"]] },
    { k: "textMode", label: "Hiện chữ", opts: [["show", "Luôn hiện"], ["after", "Khi nhắc lại"], ["hide", "Ẩn"]] }
  ];
  const GAP_LABEL = { "+1": "câu +1s", "+2": "câu +2s", "+3": "câu +3s", "x1.5": "1,5× câu", "x2": "2× câu" };
  const speakMs = (dur, mode) => (String(mode).startsWith("x") ? dur * parseFloat(String(mode).slice(1)) : dur + (parseFloat(mode) || 2) * 1000);
  const TEXT_LABEL = { show: "Luôn hiện chữ", after: "Hiện chữ khi nhắc", hide: "Ẩn chữ" };
  const PHASE_TEXT = {
    idle: "Bấm ▶ hoặc phím Space để bắt đầu",
    speaking: "Đang nghe…",
    repeat: "Đến lượt bạn — nhắc lại!",
    paused: "Đang tạm dừng",
    done: "Hoàn thành danh sách!"
  };
  const fmtClock = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

  // Tiếng "ting" báo tới lượt nói (tạo bằng Web Audio, không cần file)
  const Ting = (() => {
    let ctx = null;
    const get = () => {
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); }
      catch (e) { ctx = null; }
      return ctx;
    };
    return {
      unlock: get, // gọi trong lúc người dùng bấm nút để trình duyệt cho phép phát âm thanh
      play() {
        const a = get();
        if (!a) return;
        const t = a.currentTime;
        [[880, 0], [1320, 0.08]].forEach(([freq, delay]) => {
          const o = a.createOscillator(), g = a.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.exponentialRampToValueAtTime(0.2, t + delay + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.38);
          o.connect(g).connect(a.destination);
          o.start(t + delay);
          o.stop(t + delay + 0.4);
        });
      }
    };
  })();

  // Phần 3: cắt câu ở chỗ ngắt tự nhiên gần giữa câu (dấu phẩy, từ nối…), không cắt ngang cụm chunk.
  // Mẫu gợi ý = phần đầu + 1 chữ của phần sau. Trả về { cue: câu gợi ý, cutChar: vị trí bắt đầu phần bị che }
  const CONNECTORS = new Set("because when if so although though while after before until unless since but and or which who that where without even as".split(" "));
  function cueSplit(c, text) {
    const words = [], re = /\S+/g;
    let m;
    while ((m = re.exec(text))) words.push({ w: m[0], s: m.index, e: m.index + m[0].length });
    const n = words.length;
    if (n < 2) return { cue: text, cutChar: text.length };
    if (n === 2) return { cue: words[0].w, cutChar: words[1].s };
    const r = matcherFor(c).range(text);
    let best = null;
    for (let k = 1; k <= n - 2; k++) {               // phần đầu = words[0..k-1], chữ gợi ý = words[k]
      let score = Math.abs(k - n / 2);
      if (k / n >= 0.3 && k / n <= 0.7) {
        if (/[,;:—–]$/.test(words[k - 1].w)) score -= 3;
        else if (CONNECTORS.has(words[k].w.toLowerCase().replace(/[^a-z]/g, ""))) score -= 2;
      }
      if (r && words[k - 1].s >= r[0] && words[k].e <= r[1]) score += 100; // cắt ngang cụm chunk
      if (!best || score < best.score) best = { k, score };
    }
    return { cue: text.slice(0, words[best.k].e), cutChar: words[best.k + 1].s };
  }

  function iphoneHelpHtml(c) {
    const info = (window.AUDIO_FILES || {})[c.id];
    const all = window.AUDIO_ALL;
    return `
      <details class="help-box">
        <summary>${icon("phone")} Nghe trên iPhone khi tắt màn hình</summary>
        <ol>
          <li>Trong thư mục app, bấm đúp file <b>Tao-bai-nghe.command</b>. Có cụm thêm trên web thì bấm “Tải file sao lưu” ở cuối trang chủ trước.</li>
          <li>Thư mục <b>audio</b> sẽ tự mở. Chuột phải vào file → <b>Chia sẻ</b> → <b>AirDrop</b> → chọn iPhone.</li>
          <li>Trên iPhone, mở file trong app <b>Tệp</b>, bấm phát rồi khoá màn hình. Nếu bị dừng khi khoá, dùng app <b>VLC</b> (miễn phí).</li>
        </ol>
        <p class="hint">${info
          ? `File của cụm này: <b>audio/${esc(info.file)}</b> (${fmtClock(info.seconds)})${all ? ` · file gộp: <b>${esc(all.file)}</b> (${fmtClock(all.seconds)})` : ""} · tạo lúc ${esc(window.AUDIO_CREATED || "")}.`
          : "Cụm này chưa có file bài nghe — làm bước 1."}
          ${window.AUDIO_PATTERN ? `Nhịp trong file: ${esc(window.AUDIO_PATTERN)}.` : ""}</p>
      </details>`;
  }

  // mode "repeat" = Phần 2 (nghe N lần → nói) · mode "cue" = Phần 3 (nghe đủ câu → nghe gợi ý → nói cả câu)
  function renderListen(c, pane, mode = "repeat") {
    const CUE = mode === "cue";
    const settings = listenSettings();
    const items = playlistFor(c);
    const splits = CUE ? items.map(it => cueSplit(c, it.en)) : null;
    const enHtml = i => highlight(c, items[i].en, CUE ? splits[i].cutChar : null);
    const pkey = (CUE ? "cue:" : "listen:") + c.id; // tiến độ tính riêng cho từng phần
    const ls = Object.assign({ done: [], rounds: 0 }, store.get(pkey, {}));
    const done = new Set(ls.done);
    const label = matcherFor(c).label;
    let idx = Math.max(0, items.findIndex((_, i) => !done.has(i)));
    let round = 0, heard = 0, playing = false, runId = 0, phase = "idle", revealed = false, roundShown = false, panelOpen = false;

    pane.innerHTML = `
      ${Speech.supported ? "" : '<div class="warn-box">Trình duyệt này không hỗ trợ đọc giọng nói. Hãy dùng Chrome, Edge hoặc Safari.</div>'}
      <div class="player">
        <div class="player-top"><span>Câu <b id="pos"></b></span><span class="reps" id="reps" title="Vòng"></span></div>
        <div class="steps"><span id="st-listen">${icon("ear")} Nghe <b id="lcount"></b></span><span id="st-repeat">${icon("mic")} Nhắc lại</span></div>
        <div class="sentence" id="text" data-en></div>
        <div class="sentence-vi" id="vi"></div>
        <div class="orb" id="orb" data-phase="idle">
          <svg viewBox="0 0 100 100"><circle class="track-c" cx="50" cy="50" r="44"/><circle class="prog-c" id="ring" cx="50" cy="50" r="44" pathLength="100"/></svg>
          <div class="inner">
            ${icon("headphones", "o-idle")}${icon("pause", "o-paused")}${icon("circleCheck", "o-done")}
            <div class="o-eq"><i></i><i></i><i></i><i></i></div>
            <div class="o-secs"><b id="secs">0.0</b><small>giây</small></div>
          </div>
        </div>
        <div class="status-line" id="status"></div>
        <div class="controls">
          <button class="icon-btn" id="prev" title="Câu trước (←)" aria-label="Câu trước">${icon("skipBack")}</button>
          <button class="play-btn" id="play"></button>
          <button class="icon-btn" id="next" title="Câu sau (→)" aria-label="Câu sau">${icon("skipForward")}</button>
        </div>
        <div class="chips" id="chips"></div>
      </div>
      <div class="panel" id="panel" hidden>
        ${SETTINGS_UI.filter(g => !CUE || (g.k !== "listens" && g.k !== "textMode")).map(g => `
          <div class="opt-row"><span>${g.label}</span>
            <div class="opt-group" data-k="${g.k}">${g.opts.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join("")}</div>
          </div>`).join("")}
        <div class="opt-row"><span>Giọng đọc</span><select id="voice"><option value="">Mặc định</option></select></div>
        <div class="toggles">
          <label class="switch"><input type="checkbox" data-t="ting"> Tiếng “ting” báo lượt nói</label>
          <label class="switch"><input type="checkbox" data-t="viMode"> Hiện nghĩa tiếng Việt</label>
          <label class="switch"><input type="checkbox" data-t="loop"> Lặp lại cả danh sách</label>
        </div>
        <div class="panel-foot"><button class="btn sm" id="panel-close">Xong</button></div>
      </div>
      ${CUE ? '<p class="cue-note">Mỗi câu: nghe <b>đủ câu</b> → nghe <b>gợi ý</b> (phần đầu + 1 chữ) → “ting” → bạn nói lại <b>cả câu</b>. Danh sách bên dưới: phần chữ mờ là phần bị che.</p>' : iphoneHelpHtml(c)}
      <div class="kbd-hint"><kbd>Space</kbd> phát / tạm dừng · <kbd>←</kbd> <kbd>→</kbd> chuyển câu · bấm vào câu bên dưới để nhảy tới</div>
      <ol class="playlist">${items.map((it, i) => `
        <li data-i="${i}"><span class="num">${i + 1}</span>
          <span class="en"><span data-en>${enHtml(i)}</span>${it.vi ? `<small>${esc(it.vi)}</small>` : ""}</span>${icon("check", "tick")}</li>`).join("")}
      </ol>`;

    const $ = sel => pane.querySelector(sel);
    const posEl = $("#pos"), repsEl = $("#reps"), textEl = $("#text"), viEl = $("#vi"), orbEl = $("#orb"), lcountEl = $("#lcount");
    const ringEl = $("#ring"), secsEl = $("#secs"), statusEl = $("#status"), playBtn = $("#play");
    const stListen = $("#st-listen"), stRepeat = $("#st-repeat"), chipsEl = $("#chips"), panelEl = $("#panel");
    const rows = [...pane.querySelectorAll(".playlist li")];

    // ---------- Hiển thị ----------
    function render() {
      const it = items[idx];
      posEl.textContent = `${idx + 1} / ${items.length}`;
      const active = playing || phase === "paused";
      repsEl.hidden = settings.rounds < 2;
      repsEl.innerHTML = Array.from({ length: settings.rounds },
        (_, k) => `<i class="${k < round ? "done" : k === round && active ? "now" : ""}"></i>`).join("");
      lcountEl.textContent = CUE ? (phase === "speaking" ? (heard === 0 ? "đủ câu" : "gợi ý") : "")
        : settings.listens < 2 ? "" : phase === "speaking" ? `${heard + 1}/${settings.listens}` : `×${settings.listens}`;
      // Phần 3: chỉ lúc nghe đủ câu mới hiện cả câu; còn lại che phần sau chữ gợi ý (bấm để xem)
      const cueView = CUE && !(phase === "speaking" && heard === 0);
      textEl.innerHTML = cueView ? enHtml(idx) : highlight(c, it.en);
      textEl.classList.toggle("cue-hide", cueView && !revealed);
      const hidden = !CUE && !revealed && (settings.textMode === "hide" || (settings.textMode === "after" && phase !== "repeat"));
      textEl.classList.toggle("blur", hidden);
      textEl.title = hidden ? "Bấm để xem chữ" : "";
      viEl.textContent = settings.viMode ? it.vi || "" : "";
      orbEl.dataset.phase = phase;
      if (phase !== "repeat") ringEl.style.strokeDashoffset = 100;
      stListen.className = phase === "speaking" ? "on-listen" : "";
      stRepeat.className = phase === "repeat" ? "on-repeat" : "";
      statusEl.className = "status-line" + (phase === "speaking" ? " listen" : phase === "repeat" ? " repeat" : "");
      statusEl.textContent = CUE && phase === "speaking" ? (heard === 0 ? "Nghe đủ câu…" : "Nghe gợi ý…")
        : CUE && phase === "repeat" ? "Đến lượt bạn — nói lại cả câu!"
        : phase === "speaking" && settings.listens > 1 ? `Đang nghe lần ${heard + 1}/${settings.listens}…` : PHASE_TEXT[phase];
      playBtn.innerHTML = icon(playing ? "pause" : "play");
      playBtn.setAttribute("aria-label", playing ? "Tạm dừng" : "Phát");
      rows.forEach((r, i) => {
        r.classList.toggle("on", i === idx);
        r.classList.toggle("done", roundShown || done.has(i));
      });
    }

    function renderChips() {
      chipsEl.innerHTML = `
        <button class="chip" data-tune>Tốc độ ${settings.rate}×</button>
        ${CUE ? "" : `<button class="chip" data-tune>Nghe ${settings.listens} lần</button>`}
        <button class="chip" data-tune>Nói: ${GAP_LABEL[settings.gapMode] || settings.gapMode}</button>
        ${settings.rounds > 1 ? `<button class="chip" data-tune>${settings.rounds} vòng</button>` : ""}
        ${CUE ? "" : `<button class="chip" data-tune>${TEXT_LABEL[settings.textMode]}</button>`}
        <button class="chip tune${panelOpen ? " on" : ""}" data-tune>${icon("adjust")} Tuỳ chỉnh</button>`;
    }

    function syncPanel() {
      panelEl.querySelectorAll(".opt-group").forEach(g => g.querySelectorAll("button")
        .forEach(b => b.classList.toggle("on", String(settings[g.dataset.k]) === b.dataset.v)));
      panelEl.querySelectorAll("[data-t]").forEach(cb => { cb.checked = !!settings[cb.dataset.t]; });
    }

    function togglePanel(open = !panelOpen) {
      panelOpen = open;
      panelEl.hidden = !open;
      renderChips();
      if (open) panelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function saveSettings() { store.set("listen-settings", settings); renderChips(); syncPanel(); render(); }

    // ---------- Phát ----------
    const pauseFor = (ms, id) => new Promise(r => setTimeout(() => r(id === runId), ms));
    function countdown(ms, id) {
      return new Promise(resolve => {
        const start = performance.now();
        const timer = setInterval(() => {
          if (id !== runId) { clearInterval(timer); return resolve(false); }
          const left = Math.max(0, ms - (performance.now() - start));
          ringEl.style.strokeDashoffset = 100 - (left / ms) * 100;
          secsEl.textContent = (left / 1000).toFixed(1);
          if (left <= 0) { clearInterval(timer); resolve(true); }
        }, 50);
      });
    }

    function completeItem(i) {
      store.set("stats:heard", store.get("stats:heard", 0) + 1);
      logDay(e => { e.heard++; });
      markToday();
      roundShown = false;
      done.add(i);
      if (done.size >= items.length) {
        ls.rounds++;
        done.clear();
        roundShown = true; // vẫn hiện đủ dấu ✓ cho tới câu tiếp theo
        toast(`Xong ${ls.rounds} lượt nghe “${label}”`);
      }
      ls.done = [...done];
      store.set(pkey, ls);
    }

    async function run(id) {
      while (id === runId) {
        const it = items[idx];
        let dur = 0;
        const plays = CUE ? 2 : settings.listens;
        for (heard = 0; heard < plays; heard++) {
          phase = "speaking";
          render();
          const text = CUE && heard === 1 ? splits[idx].cue : it.en;
          const d = await Speech.speak(text, { rate: settings.rate, voiceURI: settings.voiceURI });
          if (id !== runId) return;
          if (!CUE || heard === 0) dur = d; // lượt nói luôn tính theo độ dài câu đầy đủ
          if (heard < plays - 1 && !(await pauseFor(500, id))) return;
        }
        heard = 0;
        phase = "repeat";
        render();
        if (settings.ting) Ting.play();
        // Lượt nói: mặc định = thời lượng câu vừa đọc + 2 giây
        if (!(await countdown(speakMs(dur, settings.gapMode), id))) return;
        round++;
        if (round >= settings.rounds) {
          round = 0;
          revealed = false;
          completeItem(idx);
          if (idx < items.length - 1) idx++;
          else if (settings.loop) idx = 0;
          else { playing = false; phase = "done"; render(); return; }
        }
        if (!(await pauseFor(400, id))) return;
      }
    }

    function halt() { runId++; playing = false; heard = 0; Speech.cancel(); }
    function play() {
      if (playing) return;
      Ting.unlock();
      if (phase === "done") { idx = 0; round = 0; }
      halt();
      playing = true;
      phase = "speaking";
      render();
      const id = runId;
      setTimeout(() => run(id), 80); // Chrome cần nghỉ chút sau cancel() mới đọc tiếp được
    }
    function pause() { if (!playing) return; halt(); phase = "paused"; render(); }
    function jump(i) {
      const wasPlaying = playing;
      halt();
      idx = (i + items.length) % items.length;
      round = 0; revealed = false; phase = "idle";
      if (wasPlaying) play(); else render();
    }

    // ---------- Sự kiện ----------
    // Bấm chuột không giữ focus trên nút → phím Space luôn là phát / tạm dừng
    pane.addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
    pane.addEventListener("click", e => {
      const t = e.target;
      if (!t.closest("button, a, summary") && !window.getSelection().isCollapsed) return; // đang bôi đen chữ
      if (t.closest("#play")) return playing ? pause() : play();
      if (t.closest("#prev")) return jump(idx - 1);
      if (t.closest("#next")) return jump(idx + 1);
      if (t.closest("[data-tune]")) return togglePanel();
      if (t.closest("#panel-close")) return togglePanel(false);
      const opt = t.closest(".opt-group button");
      if (opt) {
        const k = opt.parentElement.dataset.k;
        settings[k] = k === "textMode" || k === "gapMode" ? opt.dataset.v : Number(opt.dataset.v);
        if (k === "rounds" && round >= settings.rounds) round = settings.rounds - 1;
        return saveSettings();
      }
      if (t.closest("#text") && (textEl.classList.contains("blur") || textEl.classList.contains("cue-hide"))) { revealed = true; return render(); }
      const li = t.closest(".playlist li");
      if (li) jump(+li.dataset.i);
    });
    panelEl.addEventListener("change", e => {
      if (e.target.dataset.t) settings[e.target.dataset.t] = e.target.checked;
      else if (e.target.id === "voice") settings.voiceURI = e.target.value;
      saveSettings();
    });

    const voiceSel = $("#voice");
    Speech.onVoices(vs => {
      if (!vs.length) return;
      voiceSel.innerHTML = vs.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} — ${esc(v.lang)}</option>`).join("");
      if (vs.some(v => v.voiceURI === settings.voiceURI)) voiceSel.value = settings.voiceURI;
      else settings.voiceURI = voiceSel.value;
    });

    const onKey = e => {
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") { e.preventDefault(); playing ? pause() : play(); }
      else if (e.key === "ArrowRight") jump(idx + 1);
      else if (e.key === "ArrowLeft") jump(idx - 1);
    };
    document.addEventListener("keydown", onKey);
    pauseActivePlayer = pause;
    refreshMarks = () => { rows.forEach((r, i) => { r.querySelector("[data-en]").innerHTML = enHtml(i); }); render(); };
    Tracker.start("ls", c.id, () => playing);
    cleanup = () => { halt(); document.removeEventListener("keydown", onKey); pauseActivePlayer = null; Tracker.stop(); };

    syncPanel();
    renderChips();
    render();
  }

  // =========================================================
  // TỔNG KẾT
  // =========================================================
  const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const RANGES = [["7", "7 ngày"], ["30", "30 ngày"], ["all", "Tất cả"]];
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const parseDay = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const ddmm = d => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dayDiff = (a, b) => Math.round((parseDay(a) - parseDay(b)) / 86400000);
  function fmtDay(k) { const d = parseDay(k); return `${WEEKDAY[d.getDay()]}, ${ddmm(d)}`; }

  function fmtDur(ms, short) {
    if (ms > 0 && ms < 60000) return short ? "<1p" : "dưới 1 phút";
    const m = Math.round(ms / 60000);
    if (m < 60) return short ? `${m}p` : `${m} phút`;
    const h = Math.floor(m / 60), r = m % 60;
    return short ? `${h}g${r ? ` ${r}p` : ""}` : `${h} giờ${r ? ` ${r} phút` : ""}`;
  }
  function longestStreak(days) {
    let best = 0, run = 0, prev = null;
    [...days].sort().forEach(k => { run = prev && dayDiff(k, prev) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    return best;
  }
  function relDay(k) {
    if (!k) return "—";
    const n = dayDiff(today(), k);
    return n === 0 ? "Hôm nay" : n === 1 ? "Hôm qua" : `${n} ngày trước`;
  }
  const niceTop = maxMin => [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720].find(v => v >= maxMin) || Math.ceil(maxMin / 60) * 60;

  // Tooltip dùng chung cho biểu đồ + lịch học: phần tử nào có data-tip sẽ hiện khi rê chuột / focus
  function attachTip(box) {
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.hidden = true;
    box.appendChild(tip);
    const show = el => {
      tip.innerHTML = el.dataset.tip;
      tip.hidden = false;
      const b = box.getBoundingClientRect();
      const r = (el.querySelector(".stack") || el).getBoundingClientRect();
      const half = tip.offsetWidth / 2;
      tip.style.left = Math.min(Math.max(r.left + r.width / 2 - b.left, half), b.width - half) + "px";
      tip.style.top = r.top - b.top - 6 + "px";
    };
    const find = e => e.target.closest && e.target.closest("[data-tip]");
    box.addEventListener("pointerover", e => { const el = find(e); if (el) show(el); });
    box.addEventListener("pointerleave", () => { tip.hidden = true; });
    box.addEventListener("focusin", e => { const el = find(e); if (el) show(el); });
    box.addEventListener("focusout", () => { tip.hidden = true; });
  }

  function renderSummary() {
    document.title = "Tổng kết · Chunking";
    const log = store.get("stats:log", {});
    const days = new Set(store.get("stats:days", []));
    const dayOf = k => log[k] || EMPTY_DAY;
    let range = store.get("sum-range", "7");

    app.innerHTML = `
      <a class="back" href="#/">${icon("arrowLeft")} Trang chủ</a>
      <div class="sum-head">
        <h1>Tổng kết</h1>
        <div class="opt-group" id="range">${RANGES.map(([k, l]) => `<button data-r="${k}">${l}</button>`).join("")}</div>
      </div>
      <div id="sum-body"></div>`;
    const body = app.querySelector("#sum-body");
    app.querySelector("#range").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      range = b.dataset.r;
      store.set("sum-range", range);
      draw();
    });
    body.addEventListener("click", e => {
      if (e.target.closest("[data-toggle-table]")) {
        const t = body.querySelector(".data-table");
        t.hidden = !t.hidden;
        e.target.closest("[data-toggle-table]").textContent = t.hidden ? "Xem dạng bảng" : "Ẩn bảng";
        return;
      }
      const row = e.target.closest("tr[data-href]");
      if (row) location.hash = row.dataset.href;
    });

    function rangeKeys() {
      let n = +range;
      if (range === "all") {
        const all = Object.keys(log).concat([...days]).sort();
        n = all.length ? Math.max(7, dayDiff(today(), all[0]) + 1) : 7;
      }
      const now = new Date();
      return Array.from({ length: n }, (_, i) => today(addDays(now, i - n + 1)));
    }

    function draw() {
      app.querySelectorAll("#range button").forEach(b => b.classList.toggle("on", b.dataset.r === range));
      const keys = rangeKeys();
      const totalMs = keys.reduce((a, k) => a + dayOf(k).tr + dayOf(k).ls, 0);
      const studied = keys.filter(k => days.has(k)).length;
      const first = Object.keys(log).sort()[0];
      body.innerHTML = `
        ${todayHtml()}
        <section class="stats sum-tiles">
          <div class="stat"><small>Tổng thời gian</small><b>${fmtDur(totalMs, true)}</b></div>
          <div class="stat"><small>Số ngày đã học</small><b>${studied}</b><span> / ${keys.length}</span></div>
          <div class="stat"><small>Chuỗi hiện tại</small><b>${streak()}</b><span> ngày</span></div>
          <div class="stat"><small>Chuỗi dài nhất</small><b>${longestStreak(days)}</b><span> ngày</span></div>
        </section>
        ${chartHtml(keys, totalMs)}
        ${heatHtml()}
        ${tableHtml(keys)}
        <p class="sum-note">${first ? `Thời gian học được ghi lại từ ngày ${ddmm(parseDay(first))}.` : "Thời gian học sẽ được ghi lại từ lần luyện tiếp theo."}
          Chỉ tính lúc bạn đang luyện (có thao tác trong 60 giây gần nhất hoặc đang phát audio).</p>`;
      body.querySelectorAll(".tip-box").forEach(attachTip);
    }

    function todayHtml() {
      const t = dayOf(today()), total = t.tr + t.ls, d = new Date();
      return `
        <section class="box today">
          <div class="today-main"><small>Hôm nay · ${WEEKDAY[d.getDay()]}, ${ddmm(d)}</small><b>${total ? fmtDur(total) : "Chưa học"}</b></div>
          <div>
            ${total ? `
              <div class="split">${t.tr ? `<div class="s-tr" style="flex:${t.tr}"></div>` : ""}${t.ls ? `<div class="s-ls" style="flex:${t.ls}"></div>` : ""}</div>
              <div class="legend"><span><i class="sw s-tr"></i>Dịch ${fmtDur(t.tr)}</span><span><i class="sw s-ls"></i>Nghe ${fmtDur(t.ls)}</span></div>`
              : '<p class="hint" style="margin:0">Mở một cụm và luyện — thời gian sẽ tự được tính.</p>'}
            <div class="today-kv">
              <span><b>${t.graded}</b> câu dịch</span>
              <span>điểm TB <b>${t.graded ? (t.scoreSum / t.graded).toFixed(1) : "—"}</b>/10</span>
              <span><b>${t.heard}</b> câu nghe – nhắc lại</span>
            </div>
          </div>
        </section>`;
    }

    function chartHtml(keys, totalMs) {
      const todayKey = today();
      let bars;
      if (keys.length > 45) {           // dài quá thì gộp theo tuần (tuần cuối chứa hôm nay)
        bars = [];
        for (let end = keys.length; end > 0; end -= 7) {
          const ks = keys.slice(Math.max(0, end - 7), end);
          bars.unshift({
            long: `${ddmm(parseDay(ks[0]))} – ${ddmm(parseDay(ks[ks.length - 1]))}`,
            short: ddmm(parseDay(ks[0])), now: ks.includes(todayKey),
            tr: ks.reduce((a, k) => a + dayOf(k).tr, 0), ls: ks.reduce((a, k) => a + dayOf(k).ls, 0)
          });
        }
      } else {
        bars = keys.map(k => {
          const d = parseDay(k);
          return { long: `${WEEKDAY[d.getDay()]}, ${ddmm(d)}`, short: keys.length <= 7 ? WEEKDAY[d.getDay()] : ddmm(d),
            now: k === todayKey, tr: dayOf(k).tr, ls: dayOf(k).ls };
        });
      }
      const n = bars.length, unit = keys.length > 45 ? "tuần" : "ngày";
      const every = n <= 7 ? 1 : n <= 16 ? 2 : 5; // nhãn trục X thưa dần, luôn giữ nhãn cuối
      const top = niceTop(Math.max(...bars.map(b => (b.tr + b.ls) / 60000)));
      const dense = n > 14 ? " dense" : "";
      return `
        <section class="box">
          <div class="box-head"><h2>Thời gian học mỗi ${unit}</h2><span class="hint">Trung bình ${fmtDur(totalMs / n)}/${unit}</span></div>
          <div class="legend"><span><i class="sw s-tr"></i>Dịch</span><span><i class="sw s-ls"></i>Nghe &amp; nhắc lại</span>
            <button class="link" data-toggle-table>Xem dạng bảng</button></div>
          <div class="chart tip-box">
            <div class="grid-line" style="bottom:100%"><span>${top} phút</span></div>
            <div class="grid-line" style="bottom:50%"><span>${top / 2}</span></div>
            <div class="cols${dense}">${bars.map(b => `
              <div class="col" tabindex="0" aria-label="${b.long}: Dịch ${fmtDur(b.tr)}, Nghe ${fmtDur(b.ls)}"
                   data-tip="<b>${b.long}</b><br>Dịch ${fmtDur(b.tr)} · Nghe ${fmtDur(b.ls)}">
                <div class="stack" style="height:${((b.tr + b.ls) / 60000 / top) * 100}%">${b.ls ? `<div class="s-ls" style="flex:${b.ls}"></div>` : ""}${b.tr ? `<div class="s-tr" style="flex:${b.tr}"></div>` : ""}</div>
              </div>`).join("")}</div>
            ${totalMs ? "" : '<div class="chart-empty">Chưa có thời gian học trong khoảng này</div>'}
          </div>
          <div class="x-labels${dense}">${bars.map((b, i) => `<span class="${b.now ? "now" : ""}">${(n - 1 - i) % every === 0 ? (b.now && unit === "ngày" ? "Nay" : b.short) : ""}</span>`).join("")}</div>
          <table class="tbl data-table" hidden>
            <thead><tr><th>${unit === "tuần" ? "Tuần" : "Ngày"}</th><th class="n">Dịch</th><th class="n">Nghe</th><th class="n">Tổng</th></tr></thead>
            <tbody>${bars.slice().reverse().map(b => `<tr><td>${b.long}</td><td class="n">${fmtDur(b.tr, true)}</td><td class="n">${fmtDur(b.ls, true)}</td><td class="n">${fmtDur(b.tr + b.ls, true)}</td></tr>`).join("")}</tbody>
          </table>
        </section>`;
    }

    function heatHtml() {
      const WEEKS = 12, now = new Date(), todayKey = today();
      const start = addDays(now, -((now.getDay() + 6) % 7) - 7 * (WEEKS - 1)); // thứ Hai của 12 tuần trước
      const level = ms => (ms <= 0 ? 0 : ms < 5 * 60000 ? 1 : ms < 15 * 60000 ? 2 : ms < 30 * 60000 ? 3 : 4);
      let html = '<span class="ml"></span>' + ["T2", "", "T4", "", "T6", "", "CN"].map(l => `<span class="dl">${l}</span>`).join("");
      for (let w = 0; w < WEEKS; w++) {
        const ws = addDays(start, w * 7);
        const newMonth = w === 0 || ws.getMonth() !== addDays(ws, -7).getMonth();
        html += `<span class="ml">${newMonth ? `Th ${ws.getMonth() + 1}` : ""}</span>`;
        for (let i = 0; i < 7; i++) {
          const d = addDays(ws, i), k = today(d);
          if (k > todayKey) { html += '<i class="hc future"></i>'; continue; }
          const ms = dayOf(k).tr + dayOf(k).ls;
          html += `<i class="hc l${level(ms)}${k === todayKey ? " is-today" : ""}" data-tip="<b>${WEEKDAY[d.getDay()]}, ${ddmm(d)}</b><br>${ms ? fmtDur(ms) : "Không học"}"></i>`;
        }
      }
      return `
        <section class="box">
          <div class="box-head"><h2>Lịch học 12 tuần</h2>
            <span class="heat-legend">Ít <i class="hc l0"></i><i class="hc l1"></i><i class="hc l2"></i><i class="hc l3"></i><i class="hc l4"></i> Nhiều</span></div>
          <div class="heat tip-box">${html}</div>
          <p class="hint" style="margin:10px 0 0">Ô càng đậm là học càng lâu: dưới 5 phút · 5–15 · 15–30 · trên 30 phút.</p>
        </section>`;
    }

    function tableHtml(keys) {
      const rows = CHUNKS.map(c => {
        const ms = keys.reduce((a, k) => a + (dayOf(k).c[c.id] || 0), 0);
        let last = null;
        Object.keys(log).forEach(k => { if ((log[k].c || {})[c.id] && (!last || k > last)) last = k; });
        return { c, info: chunkInfo(c), ms, last };
      }).sort((a, b) => (b.last || "").localeCompare(a.last || "") || b.ms - a.ms);
      return `
        <section class="box">
          <div class="box-head"><h2>Theo từng cụm</h2><span class="hint">Bấm vào một dòng để luyện tiếp</span></div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Cụm</th><th class="n">Điểm dịch</th><th class="n">Lượt nghe</th><th class="n">Thời gian</th><th class="n">Lần cuối</th></tr></thead>
            <tbody>${rows.map(r => `
              <tr data-href="#/c/${encodeURIComponent(r.c.id)}">
                <td><span class="t-name">${esc(pretty(r.c.chunk))}</span><span class="status ${STATUS[r.info.status][0]}">${STATUS[r.info.status][1]}</span></td>
                <td class="n">${r.info.best == null ? "—" : r.info.best}</td>
                <td class="n">${r.info.ls.rounds}</td>
                <td class="n">${r.ms ? fmtDur(r.ms, true) : "—"}</td>
                <td class="n">${relDay(r.last)}</td>
              </tr>`).join("")}</tbody>
          </table></div>
        </section>`;
    }

    draw();
  }

  // =========================================================
  // THÊM / SỬA CỤM
  // =========================================================
  const slugify = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/\.{3,}|…/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cum";
  function uniqueId(base) {
    let id = base, n = 2;
    while (CHUNKS.some(c => c.id === id) || FILE_CHUNKS.some(c => c.id === id)) id = `${base}-${n++}`;
    return id;
  }

  // Đoạn yêu cầu để dán vào claude.ai (miễn phí, không cần API key)
  function buildPrompt(chunk, meaning, topic, context) {
    const sample = {
      chunk,
      meaning: meaning || "nghĩa tiếng Việt ngắn gọn",
      structure: "công thức ngắn, ví dụ: look forward to + V-ing",
      sentences: [{ level: "B1", vi: "câu tiếng Việt", en: ["cách dịch tự nhiên nhất", "cách dịch khác"] }]
    };
    return [
      `Bạn là giáo viên tiếng Anh. Hãy soạn bài luyện "chunking" cho cụm: "${chunk}"`,
      meaning ? `Nghĩa tiếng Việt: ${meaning}` : "Hãy tự viết nghĩa tiếng Việt ngắn gọn cho cụm này.",
      ...(context ? [`Cụm này xuất hiện trong câu: ${context}`, "Hãy giải nghĩa và soạn câu theo đúng nghĩa của cụm trong câu đó."] : []),
      ...(topic ? [`Chủ đề các câu ví dụ: ${topic}`] : []),
      "",
      "Yêu cầu:",
      "- 10 câu tiếng Việt tự nhiên, gần gũi đời sống: 5 câu trình độ B1 (ngắn, đơn giản), rồi 5 câu trình độ B2 (dài hơn, có mệnh đề phụ).",
      `- Mỗi câu kèm 2–3 cách dịch tiếng Anh đúng và tự nhiên. Cách dịch nào cũng PHẢI dùng cụm "${chunk}" (chia động từ cho phù hợp).`,
      "- Cách dịch đầu tiên là cách tự nhiên nhất (sẽ dùng để luyện nghe).",
      "- Không dùng dấu ngoặc kép bên trong câu.",
      "",
      "Chỉ trả về MỘT khối JSON hợp lệ, không giải thích gì thêm, theo đúng mẫu:",
      "```json",
      JSON.stringify(sample, null, 2),
      "```"
    ].join("\n");
  }

  // Đọc kết quả dán từ claude.ai (chịu được chữ thừa / dấu ``` bao quanh)
  function parseAiResult(text) {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s < 0 || e <= s) return { error: "Chưa thấy khối kết quả — hãy copy cả khối bắt đầu bằng { và kết thúc bằng }." };
    const raw = text.slice(s, e + 1);
    let obj;
    try { obj = JSON.parse(raw); } catch (err) {
      try { obj = JSON.parse(raw.replace(/[“”]/g, '"').replace(/,\s*([}\]])/g, "$1")); }
      catch (err2) { return { error: "Kết quả bị thiếu hoặc sai định dạng — hãy bấm nút Copy của claude.ai để copy lại toàn bộ khối." }; }
    }
    if (!obj || !Array.isArray(obj.sentences)) return { error: "Không tìm thấy danh sách câu (sentences) trong kết quả." };
    const sentences = obj.sentences.map(x => ({
      level: /b2/i.test(String(x && x.level)) ? "B2" : "B1",
      vi: String((x && x.vi) || "").trim(),
      en: (Array.isArray(x && x.en) ? x.en : [x && x.en]).map(a => String(a || "").trim()).filter(Boolean)
    })).filter(x => x.vi || x.en.length);
    const problems = [];
    sentences.forEach((x, i) => {
      if (!x.vi) problems.push(`câu ${i + 1} thiếu câu tiếng Việt`);
      if (!x.en.length) problems.push(`câu ${i + 1} chưa có cách dịch`);
    });
    return {
      data: { chunk: String(obj.chunk || "").trim(), meaning: String(obj.meaning || "").trim(), structure: String(obj.structure || "").trim(), sentences },
      problems
    };
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) { /* bỏ qua */ }
      ta.remove();
      return ok;
    }
  }

  function renderEditor(c) {
    const isNew = !c;
    const backHref = isNew ? "#/" : `#/c/${encodeURIComponent(c.id)}`;
    document.title = `${isNew ? "Thêm cụm" : "Sửa cụm"} · Chunking`;
    app.innerHTML = `
      <a class="back" href="${backHref}">${icon("arrowLeft")} ${isNew ? "Trang chủ" : "Quay lại cụm"}</a>
      <h1 class="page-title">${isNew ? "Thêm cụm mới" : `Sửa cụm “${esc(pretty(c.chunk))}”`}</h1>
      ${isNew ? `
      <section class="box ai-steps">
        <div class="step"><span class="step-n">1</span><div class="step-body">
          <h2>Nhập cụm</h2>
          <div class="fields">
            <label class="field"><span>Cụm chunking *</span><input id="ai-chunk" placeholder="look forward to ..." autocomplete="off"></label>
            <label class="field"><span>Nghĩa tiếng Việt (tuỳ chọn)</span><input id="ai-meaning" placeholder="Claude tự điền" autocomplete="off"></label>
            <label class="field"><span>Chủ đề câu (tuỳ chọn)</span><input id="ai-topic" placeholder="công việc, du lịch…" autocomplete="off"></label>
          </div>
          <p class="ctx" id="ai-ctx" hidden>Ngữ cảnh: <span></span> <button class="link" id="ai-ctx-x">Bỏ</button></p>
        </div></div>
        <div class="step"><span class="step-n">2</span><div class="step-body">
          <h2>Nhờ Claude soạn <span class="free">miễn phí</span></h2>
          <pre class="prompt-box" id="ai-prompt"></pre>
          <div class="row-actions">
            <button class="btn primary" id="ai-copy">${icon("copy")} Copy yêu cầu</button>
            <a class="btn" href="https://claude.ai/new" target="_blank" rel="noopener">Mở claude.ai ${icon("external")}</a>
            <span class="hint">Dán vào claude.ai → gửi → bấm Copy ở góc khối kết quả</span>
          </div>
        </div></div>
        <div class="step"><span class="step-n">3</span><div class="step-body">
          <h2>Dán kết quả vào đây</h2>
          <textarea class="paste-box" id="ai-paste" spellcheck="false" placeholder="Dán khối kết quả từ claude.ai (bắt đầu bằng {  …  })"></textarea>
          <div class="row-actions">
            <span class="parse-status" id="ai-status"></span>
            <button class="btn primary" id="ai-preview" disabled>Xem trước &amp; sửa ${icon("arrowRight")}</button>
          </div>
        </div></div>
        <p class="manual">Hoặc <button class="link" id="ai-manual">tự nhập tay cả 10 câu</button></p>
      </section>` : ""}
      <section id="editor"${isNew ? " hidden" : ""}></section>`;

    const $ = sel => app.querySelector(sel);
    const editorEl = $("#editor");
    let prefillChunk = null; // cụm đến từ "Thêm cụm ngay" / danh sách chờ

    // ---------- 3 bước soạn qua claude.ai ----------
    if (isNew) {
      const promptEl = $("#ai-prompt"), copyBtn = $("#ai-copy"), statusEl = $("#ai-status"), previewBtn = $("#ai-preview");
      let parsed = null;
      const val = sel => $(sel).value.trim();
      const pre = store.get("prefill", null);
      store.del("prefill");
      let context = pre && pre.context ? pre.context : "";
      if (pre) { $("#ai-chunk").value = pre.chunk; prefillChunk = pre.chunk; }
      const ctxEl = $("#ai-ctx");
      const showCtx = () => { ctxEl.hidden = !context; ctxEl.querySelector("span").textContent = `“${context}”`; };
      $("#ai-ctx-x").addEventListener("click", () => { context = ""; showCtx(); updatePrompt(); });
      showCtx();
      function updatePrompt() {
        const ch = val("#ai-chunk");
        promptEl.textContent = ch ? buildPrompt(ch, val("#ai-meaning"), val("#ai-topic"), context) : "Nhập cụm ở bước 1 để tạo yêu cầu.";
        promptEl.classList.toggle("empty", !ch);
        copyBtn.disabled = !ch;
      }
      ["#ai-chunk", "#ai-meaning", "#ai-topic"].forEach(s => $(s).addEventListener("input", updatePrompt));
      updatePrompt();
      $("#ai-chunk").focus();
      copyBtn.addEventListener("click", async () => {
        toast((await copyText(promptEl.textContent)) ? "Đã copy — dán vào claude.ai nhé" : "Không copy được — hãy bôi đen đoạn yêu cầu rồi copy");
      });
      $("#ai-paste").addEventListener("input", () => {
        const txt = val("#ai-paste");
        parsed = null;
        previewBtn.disabled = true;
        if (!txt) { statusEl.className = "parse-status"; statusEl.textContent = ""; return; }
        const r = parseAiResult(txt);
        if (r.error) { statusEl.className = "parse-status err"; statusEl.innerHTML = `${icon("alert")} ${esc(r.error)}`; return; }
        parsed = r.data;
        if (!parsed.chunk) parsed.chunk = val("#ai-chunk");
        if (!parsed.meaning) parsed.meaning = val("#ai-meaning");
        const S = parsed.sentences;
        const m = parsed.chunk ? Grader.makeChunkMatcher({ chunk: parsed.chunk }) : null;
        const noChunk = m ? S.filter(x => x.en.some(a => !m.test(a))).length : 0;
        const warn = r.problems.length || noChunk;
        statusEl.className = "parse-status " + (warn ? "warn" : "ok");
        statusEl.innerHTML = `${icon(warn ? "alert" : "circleCheck")} Đọc được ${S.length} câu (${S.filter(x => x.level === "B1").length} B1 + ${S.filter(x => x.level === "B2").length} B2)`
          + (noChunk ? ` · ${noChunk} câu có cách dịch chưa thấy cụm` : "")
          + (r.problems.length ? ` · ${esc(r.problems.join(", "))}` : "");
        previewBtn.disabled = !S.length;
      });
      previewBtn.addEventListener("click", () => { if (parsed) openEditor(parsed); });
      $("#ai-manual").addEventListener("click", () => openEditor({
        chunk: val("#ai-chunk"), meaning: val("#ai-meaning"), structure: "",
        sentences: ["B1", "B1", "B1", "B1", "B1", "B2", "B2", "B2", "B2", "B2"].map(level => ({ level, vi: "", en: [] }))
      }));
    } else {
      fillEditor(c);
    }

    function openEditor(d) {
      editorEl.hidden = false; // hiện trước để ô nhập tính đúng chiều cao
      fillEditor(d);
      editorEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // ---------- Khung sửa nội dung ----------
    function sentHtml(s) {
      return `
      <div class="ed-sent">
        <div class="ed-head">
          <span class="ed-num"></span>
          <select class="ed-level" aria-label="Trình độ"><option${s.level !== "B2" ? " selected" : ""}>B1</option><option${s.level === "B2" ? " selected" : ""}>B2</option></select>
          <button class="icon-btn sm ed-remove" title="Xoá câu này" aria-label="Xoá câu này">${icon("x")}</button>
        </div>
        <textarea class="ed-vi" rows="1" placeholder="Câu tiếng Việt">${esc(s.vi || "")}</textarea>
        <textarea class="ed-en" rows="2" placeholder="Cách dịch 1&#10;Cách dịch 2 (tuỳ chọn)" spellcheck="false">${esc((s.en || []).join("\n"))}</textarea>
        <div class="ed-warn"></div>
      </div>`;
    }

    function fillEditor(d) {
      editorEl.innerHTML = `
        <section class="box">
          <div class="box-head"><h2>${isNew ? "Xem trước & sửa" : "Nội dung cụm"}</h2></div>
          <div class="err-box" id="ed-errors" hidden></div>
          <div class="fields">
            <label class="field"><span>Cụm chunking *</span><input id="ed-chunk" value="${esc(d.chunk || "")}" placeholder="look forward to ..." autocomplete="off"></label>
            <label class="field"><span>Nghĩa tiếng Việt</span><input id="ed-meaning" value="${esc(d.meaning || "")}" autocomplete="off"></label>
            <label class="field"><span>Công thức</span><input id="ed-structure" value="${esc(d.structure || "")}" placeholder="look forward to + V-ing" autocomplete="off"></label>
          </div>
          <p class="hint">Mỗi câu gồm 1 câu tiếng Việt và các cách dịch tiếng Anh — <b>mỗi dòng một cách dịch</b>, dòng đầu tiên dùng cho phần Nghe.</p>
          <div id="ed-list">${(d.sentences || []).map(sentHtml).join("")}</div>
          <button class="btn sm" id="ed-add">${icon("plus")} Thêm câu</button>
          ${isNew ? "" : '<p class="hint">Lưu ý: sửa câu sẽ làm mới bài dịch đang làm dở của cụm này (điểm cao nhất vẫn giữ).</p>'}
          <div class="ed-foot">
            ${isNew ? "" : `<button class="btn danger" id="ed-delete">${icon("trash")}<span>Xoá cụm</span></button>`}
            <span class="spacer"></span>
            <a class="btn" href="${backHref}">Huỷ</a>
            <button class="btn primary" id="ed-save">${icon("check")} Lưu cụm</button>
          </div>
        </section>`;
      editorEl.querySelectorAll("textarea").forEach(grow);
      renumber();
      checkAll();
    }

    function grow(t) { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }
    function renumber() { editorEl.querySelectorAll(".ed-num").forEach((el, i) => { el.textContent = `Câu ${i + 1}`; }); }
    function checkAll() {
      const ch = editorEl.querySelector("#ed-chunk").value.trim();
      const m = ch ? Grader.makeChunkMatcher({ chunk: ch }) : null;
      editorEl.querySelectorAll(".ed-sent").forEach(row => {
        const lines = row.querySelector(".ed-en").value.split("\n").map(x => x.trim()).filter(Boolean);
        const bad = m ? lines.map((l, i) => (m.test(l) ? 0 : i + 1)).filter(Boolean) : [];
        row.querySelector(".ed-warn").innerHTML = bad.length ? `${icon("alert")} Dòng ${bad.join(", ")} chưa thấy cụm “${esc(m.label)}”` : "";
      });
    }

    function collect() {
      const get = sel => editorEl.querySelector(sel).value.trim();
      const sentences = [...editorEl.querySelectorAll(".ed-sent")].map(row => ({
        level: row.querySelector(".ed-level").value,
        vi: row.querySelector(".ed-vi").value.trim(),
        en: row.querySelector(".ed-en").value.split("\n").map(x => x.trim()).filter(Boolean)
      })).filter(s => s.vi || s.en.length);
      return { chunk: get("#ed-chunk"), meaning: get("#ed-meaning"), structure: get("#ed-structure"), sentences };
    }

    function save() {
      const d = collect();
      const errs = [];
      if (!d.chunk) errs.push("Chưa nhập cụm chunking");
      if (!d.sentences.length) errs.push("Cần ít nhất 1 câu");
      d.sentences.forEach((s, i) => {
        if (!s.vi) errs.push(`Câu ${i + 1} thiếu câu tiếng Việt`);
        if (!s.en.length) errs.push(`Câu ${i + 1} chưa có cách dịch`);
      });
      const box = editorEl.querySelector("#ed-errors");
      if (errs.length) {
        box.innerHTML = `${icon("alert")} ${esc(errs.join(" · "))}`;
        box.hidden = false;
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const chunk = { id: isNew ? uniqueId(slugify(d.chunk)) : c.id, chunk: d.chunk, meaning: d.meaning };
      if (d.structure) chunk.structure = d.structure;
      chunk.sentences = d.sentences;
      if (!isNew) {
        if (c.match && c.chunk === d.chunk) chunk.match = c.match;   // regex tự viết chỉ giữ khi cụm không đổi
        if (c.listen) chunk.listen = c.listen;
        if (JSON.stringify(c.sentences) !== JSON.stringify(d.sentences)) {
          store.del("tr:" + c.id);                                  // bài dịch dở không còn khớp câu mới
          ["listen:", "cue:"].forEach(k => {
            const st = Object.assign({ done: [], rounds: 0 }, store.get(k + c.id, {}));
            st.done = [];
            store.set(k + c.id, st);
          });
        }
      }
      saveChunk(chunk);
      removePending(chunk.chunk);              // đã thêm thì bỏ khỏi danh sách chờ
      if (prefillChunk) removePending(prefillChunk);
      toast(isNew ? `Đã thêm cụm “${pretty(chunk.chunk)}”` : "Đã lưu thay đổi");
      location.hash = `#/c/${encodeURIComponent(chunk.id)}/translate`;
    }

    editorEl.addEventListener("input", e => {
      if (e.target.tagName === "TEXTAREA") grow(e.target);
      if (e.target.matches(".ed-en, #ed-chunk")) checkAll();
    });
    editorEl.addEventListener("click", e => {
      const t = e.target;
      const rm = t.closest(".ed-remove");
      if (rm) {
        if (editorEl.querySelectorAll(".ed-sent").length > 1) { rm.closest(".ed-sent").remove(); renumber(); }
        return;
      }
      if (t.closest("#ed-add")) {
        const rows = editorEl.querySelectorAll(".ed-sent");
        const level = rows.length ? rows[rows.length - 1].querySelector(".ed-level").value : "B1";
        editorEl.querySelector("#ed-list").insertAdjacentHTML("beforeend", sentHtml({ level, vi: "", en: [] }));
        renumber();
        const added = editorEl.querySelector(".ed-sent:last-child .ed-vi");
        added.focus();
        return;
      }
      if (t.closest("#ed-save")) return save();
      if (t.closest("#ed-delete")) {
        askDeleteChunk(c).then(ok => {
          if (!ok) return;
          deleteChunk(c.id);
          toast(`Đã xoá cụm “${pretty(c.chunk)}”`);
          location.hash = "#/";
        });
      }
    });
  }

  // =========================================================
  // TỪ TƯƠNG ĐƯƠNG
  // =========================================================
  function renderEquiv() {
    document.title = "Từ tương đương · Chunking";
    const saved = store.get("equiv", DEFAULT_EQUIV);
    const off = new Set(store.get("equiv-off", []));
    app.innerHTML = `
      <button class="back" id="eq-back">${icon("arrowLeft")} Quay lại</button>
      <h1 class="page-title">Từ tương đương</h1>
      <p class="lead">Những cách viết trong cùng một nhóm được coi là <b>giống nhau</b> khi chấm điểm — áp dụng cho cả câu bạn viết lẫn đáp án mẫu.</p>
      <section class="box">
        <div class="box-head"><h2>Bộ có sẵn</h2><span class="hint">Claude soạn sẵn, tự cập nhật — bật / tắt từng chủ đề</span></div>
        ${BUILTIN_EQUIV.map(t => `
          <div class="topic">
            <label class="switch"><input type="checkbox" data-topic="${t.id}"${off.has(t.id) ? "" : " checked"}> <b>${esc(t.title)}</b> <span class="muted">${t.groups.length} nhóm</span></label>
            <details><summary>Xem danh sách</summary>
              <ul class="topic-list">${t.groups.map(g => `<li><code>${g.map(esc).join(" = ")}</code></li>`).join("")}</ul>
            </details>
          </div>`).join("")}
      </section>
      <section class="box">
        <div class="box-head"><h2>Danh sách của bạn</h2><span class="hint">Mỗi dòng một nhóm, cách nhau bằng dấu <b>=</b></span></div>
        <textarea class="eq-box" id="eq-text" spellcheck="false" rows="10">${esc(saved)}</textarea>
        <div class="row-actions">
          <span class="parse-status" id="eq-status"></span>
          <button class="btn ghost sm" id="eq-default">Khôi phục mặc định</button>
          <button class="btn primary" id="eq-save">${icon("check")} Lưu</button>
        </div>
        <p class="hint" style="margin:10px 0 0">Ví dụ: <code>i will = i'll = ill</code> · <code>kids = children</code> · <code>outside = outdoors</code>. Lưu xong, các câu đã chấm sẽ tự chấm lại.</p>
      </section>
      <section class="box">
        <div class="box-head"><h2>App đã tự hiểu sẵn</h2><span class="hint">Không cần thêm vào danh sách</span></div>
        <ul class="builtin">
          <li>Viết tắt: <b>don't</b> = do not, <b>I'm</b> = I am, <b>I'll</b> = I will, <b>I've</b> = I have, <b>I'd</b> = I would, <b>can't</b> = cannot, <b>won't</b> = will not, <b>it's / that's / what's</b> = … is</li>
          <li>Gõ thiếu dấu nháy: <b>dont, doesnt, didnt, cant, wont, isnt, arent, wasnt, werent, havent, hasnt, wouldnt, couldnt, shouldnt, im, ive, youre, theyre, thats, whats, itll, youll</b></li>
          <li>Chính tả Anh – Mỹ: centre = center, colour = color, favourite = favorite, organise = organize, travelling = traveling…</li>
          <li>Giờ: <b>5pm</b> = 5 p.m. = 5 pm · <b>ok</b> = okay</li>
          <li>Không phân biệt viết hoa, dấu câu, dấu gạch nối; gõ sai 1 chữ cái chỉ bị trừ nhẹ</li>
        </ul>
      </section>`;
    const ta = app.querySelector("#eq-text"), status = app.querySelector("#eq-status");
    const grow = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + 2 + "px"; };
    function check() {
      const { groups, problems } = parseEquiv(ta.value);
      status.className = "parse-status " + (problems.length ? "warn" : "ok");
      status.innerHTML = problems.length ? `${icon("alert")} ${esc(problems.join(" · "))}` : `${icon("circleCheck")} ${groups.length} nhóm`;
    }
    ta.addEventListener("input", () => { grow(); check(); });
    app.querySelector("#eq-default").addEventListener("click", () => { ta.value = DEFAULT_EQUIV; grow(); check(); });
    app.querySelector("#eq-save").addEventListener("click", () => {
      store.set("equiv", ta.value);
      applyEquiv();
      loadChunks();
      toast(`Đã lưu ${parseEquiv(ta.value).groups.length} nhóm từ tương đương`);
    });
    app.querySelector("#eq-back").addEventListener("click", () => { if (history.length > 1) history.back(); else location.hash = "#/"; });
    app.querySelectorAll("[data-topic]").forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) off.delete(cb.dataset.topic); else off.add(cb.dataset.topic);
      store.set("equiv-off", [...off]);
      applyEquiv();
      loadChunks();
      const t = BUILTIN_EQUIV.find(x => x.id === cb.dataset.topic);
      toast(`${cb.checked ? "Đã bật" : "Đã tắt"} “${t.title}”`);
    }));
    grow();
    check();
  }

  // =========================================================
  // SAO LƯU / KHÔI PHỤC (toàn bộ dữ liệu của app trong trình duyệt)
  // =========================================================
  function exportBackup() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith("chunking:")) data[k] = localStorage.getItem(k);
      }
    } catch (e) { return toast("Trình duyệt không cho đọc dữ liệu để sao lưu"); }
    const blob = new Blob([JSON.stringify({ app: "chunking-practice", version: 1, exported: new Date().toISOString(), data }, null, 2)],
      { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chunking-sao-luu-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Đã tải file sao lưu");
  }

  function importBackup(file) {
    file.text().then(txt => {
      let obj = null;
      try { obj = JSON.parse(txt); } catch (e) { /* xử lý bên dưới */ }
      if (!obj || obj.app !== "chunking-practice" || !obj.data || typeof obj.data !== "object") {
        return toast("File này không phải file sao lưu của app");
      }
      if (!confirm("Khôi phục sẽ thay toàn bộ dữ liệu hiện tại (cụm tự thêm, điểm, thời gian học) bằng dữ liệu trong file. Tiếp tục?")) return;
      try {
        Object.keys(localStorage).filter(k => k.startsWith("chunking:")).forEach(k => localStorage.removeItem(k));
        Object.entries(obj.data).forEach(([k, v]) => { if (k.startsWith("chunking:")) localStorage.setItem(k, v); });
      } catch (e) { return toast("Không ghi được dữ liệu vào trình duyệt"); }
      applyEquiv();
      loadChunks();
      route();
      toast("Đã khôi phục dữ liệu");
    });
  }

  route();
})();
