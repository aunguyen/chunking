/*
 * ĐỒNG BỘ TÀI KHOẢN (Firebase: đăng nhập email + mật khẩu, lưu dữ liệu trên Firestore)
 *
 * App vẫn đọc / ghi localStorage như cũ (chạy được cả khi mất mạng). Module này:
 *  - ghi lại thời điểm sửa của từng mục dữ liệu ("chunking:<key>")
 *  - khi đã đăng nhập: đẩy các mục vừa sửa lên Firestore (users/{uid}.kv.<key> = { v, t })
 *  - khi mở app / quay lại tab: kéo dữ liệu mới hơn từ máy khác về
 *  Mục nào sửa sau thì thắng; riêng thời gian học, chuỗi ngày, số câu nghe thì cộng gộp.
 * Thư viện Firebase chỉ được tải khi người dùng đăng nhập.
 */
(function (root) {
  "use strict";
  const CONFIG = {
    apiKey: "AIzaSyBLTc8AbjfUmo8ZZm7_RDqgpC0ukO_jI-w",
    authDomain: "chunking-web.firebaseapp.com",
    projectId: "chunking-web",
    storageBucket: "chunking-web.firebasestorage.app",
    messagingSenderId: "452955149319",
    appId: "1:452955149319:web:419d5d507ab23ba07306a2"
  };
  const SDK = "https://www.gstatic.com/firebasejs/12.19.0/";
  const PREFIX = "chunking:";
  const META_KEY = PREFIX + "__sync";               // { uid, email, t: {key: ms}, pending: {key: 1} } — không đồng bộ
  const LOCAL_ONLY = new Set(["prefill", "home-focus"]); // trạng thái tạm, chỉ của máy này
  const FLUSH_DELAY = 4000, MIN_GAP = 15000, PULL_GAP = 30000;

  // ---------- Dữ liệu phụ ----------
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } },
    keys: () => { try { return Object.keys(localStorage); } catch (e) { return []; } }
  };
  function readMeta() {
    try { const m = JSON.parse(ls.get(META_KEY)); if (m && m.t) return Object.assign({ pending: {} }, m); } catch (e) { /* bỏ qua */ }
    return { t: {}, pending: {} };
  }
  let meta = readMeta();
  const saveMeta = () => ls.set(META_KEY, JSON.stringify(meta));
  const syncable = k => !k.startsWith("__") && !LOCAL_ONLY.has(k);
  const localKeys = () => ls.keys().filter(k => k.startsWith(PREFIX)).map(k => k.slice(PREFIX.length)).filter(syncable);

  // Các mục cộng gộp thay vì "bản sau thắng"
  const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  const MERGE = {
    "stats:log": (a, b) => {
      const out = Object.assign({}, b);
      Object.entries(a || {}).forEach(([day, e]) => {
        const f = out[day];
        if (!f) { out[day] = e; return; }
        const m = Object.assign({}, f);
        ["tr", "ls", "graded", "scoreSum", "heard"].forEach(x => { m[x] = Math.max(e[x] || 0, f[x] || 0); });
        m.c = Object.assign({}, f.c);
        Object.entries(e.c || {}).forEach(([id, ms]) => { m.c[id] = Math.max(ms, m.c[id] || 0); });
        if (e.p || f.p) m.p = Object.assign({}, f.p, e.p); // cụm đạt 100/100 trong ngày: gộp hai máy
        out[day] = m;
      });
      return out;
    },
    "stats:days": (a, b) => [...new Set([].concat(a || [], b || []))].sort(),
    "stats:heard": (a, b) => Math.max(+a || 0, +b || 0)
  };

  // ---------- Trạng thái & sự kiện ----------
  let fb = null, auth = null, db = null, user = null;
  let state = "off"; // off | loading | syncing | synced | offline | error
  let flushTimer = null, pullRetry = null, lastFlush = 0, lastPull = 0, flushing = null;
  const handlers = { change: [], state: [] };
  const emit = (ev, x) => handlers[ev].forEach(fn => { try { fn(x); } catch (e) { console.error(e); } });
  function setState(s) { if (s !== state) { state = s; emit("state", info()); } }
  function info() {
    // known: máy này đã đăng nhập trước đó (kể cả khi đang mất mạng, chưa kết nối lại được)
    return { loggedIn: !!user, known: !!meta.uid, email: user ? user.email : meta.email || "", state, pending: Object.keys(meta.pending).length };
  }

  // ---------- Tải thư viện Firebase (khi cần) ----------
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("Không tải được " + src));
    document.head.appendChild(s);
  });
  let loading = null;
  function ensureFirebase() {
    if (fb) return Promise.resolve();
    if (loading) return loading;
    loading = (async () => {
      if (!root.firebase) await loadScript(SDK + "firebase-app-compat.js");
      await Promise.all([
        root.firebase.auth || loadScript(SDK + "firebase-auth-compat.js"),
        root.firebase.firestore || loadScript(SDK + "firebase-firestore-compat.js")
      ]);
      const app = (root.firebase.apps || [])[0] || root.firebase.initializeApp(CONFIG);
      auth = root.firebase.auth();
      auth.languageCode = "vi";
      db = root.firebase.firestore();
      fb = app;
      await new Promise(resolve => {
        let first = true;
        auth.onAuthStateChanged(u => { onAuth(u); if (first) { first = false; resolve(); } });
      });
    })();
    loading.catch(() => { loading = null; });
    return loading;
  }
  const docRef = () => db.collection("users").doc(user.uid);

  function wipeLocal() {
    ls.keys().filter(k => k.startsWith(PREFIX)).forEach(ls.del);
    meta = { t: {}, pending: {} };
  }

  function onAuth(u) {
    user = u || null;
    if (!user) { setState("off"); return; }
    if (meta.uid && meta.uid !== user.uid) { wipeLocal(); emit("change"); } // dữ liệu trên máy là của tài khoản khác
    meta.uid = user.uid;
    meta.email = user.email;
    saveMeta();
    pull();
  }

  // ---------- Đẩy lên ----------
  // Gom các lần ghi lại: đẩy lên chậm nhất ~15 giây một lần (đang học thì thời gian được ghi liên tục)
  function schedule() {
    if (!user) return;
    if (flushTimer) return; // đã hẹn giờ rồi — không lùi lại, để vẫn đẩy lên đều đặn
    const wait = Math.max(FLUSH_DELAY, MIN_GAP - (Date.now() - lastFlush));
    flushTimer = setTimeout(flush, wait);
  }
  function flush() {
    clearTimeout(flushTimer);
    flushTimer = null;
    if (!user || !db) return Promise.resolve();
    if (flushing) return flushing;
    const keys = Object.keys(meta.pending);
    if (!keys.length) { setState("synced"); return Promise.resolve(); }
    setState("syncing");
    const kv = {};
    keys.forEach(k => { kv[k] = { v: ls.get(PREFIX + k), t: meta.t[k] || Date.now() }; });
    const write = docRef().set({ kv, updatedAt: Date.now() }, { merge: true });
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000));
    flushing = Promise.race([write, timeout]).then(() => {
      lastFlush = Date.now();
      keys.forEach(k => { if (meta.pending[k] && (meta.t[k] || 0) <= kv[k].t) delete meta.pending[k]; });
      saveMeta();
      setState("synced"); // mục mới sửa trong lúc gửi sẽ được gửi ở lượt sau
      if (Object.keys(meta.pending).length) schedule();
    }).catch(() => {
      setState(navigator.onLine === false ? "offline" : "error");
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 30000); // thử lại sau
    }).finally(() => { flushing = null; });
    return flushing;
  }

  // ---------- Kéo về ----------
  async function pull() {
    if (!user || !db) return;
    clearTimeout(pullRetry);
    setState("syncing");
    let remote;
    try {
      const snap = await docRef().get();
      remote = (snap.exists && snap.data().kv) || {};
    } catch (e) {
      setState(navigator.onLine === false ? "offline" : "error");
      clearTimeout(pullRetry);
      pullRetry = setTimeout(pull, 60000); // thử lại sau
      return;
    }
    lastPull = Date.now();
    let changed = false;
    const keys = new Set([...Object.keys(remote), ...localKeys(), ...Object.keys(meta.t)]);
    keys.forEach(k => {
      if (!syncable(k)) return;
      const r = remote[k], lt = meta.t[k] || 0, rt = r ? r.t || 0 : 0;
      const lv = ls.get(PREFIX + k);
      if (MERGE[k] && r && r.v != null && lv != null) {               // cộng gộp
        const mv = JSON.stringify(MERGE[k](parse(lv), parse(r.v)));
        if (mv !== lv) { ls.set(PREFIX + k, mv); changed = true; }
        if (mv !== r.v) { meta.t[k] = Math.max(lt, rt) + 1; meta.pending[k] = 1; } else { meta.t[k] = rt; delete meta.pending[k]; }
        return;
      }
      if (r && rt > lt) {                                             // máy khác sửa sau → lấy về
        if (r.v == null) { if (lv != null) { ls.del(PREFIX + k); changed = true; } }
        else if (r.v !== lv) { ls.set(PREFIX + k, r.v); changed = true; }
        meta.t[k] = rt;
        delete meta.pending[k];
      } else if (lt > rt || (!r && lv != null)) {                     // máy này sửa sau / chưa có trên mạng → đẩy lên
        if (!lt) meta.t[k] = Date.now();
        meta.pending[k] = 1;
      }
    });
    saveMeta();
    if (changed) emit("change");
    await flush();
  }

  // ---------- API cho app ----------
  const Sync = {
    // app gọi mỗi khi ghi / xoá một mục dữ liệu
    touch(key) {
      if (!syncable(key)) return;
      meta.t[key] = Date.now();
      if (meta.uid) { meta.pending[key] = 1; schedule(); }
      saveMeta();
    },
    // sau khi khôi phục từ file sao lưu: coi mọi mục là vừa sửa
    touchAll() {
      const now = Date.now();
      const keys = new Set([...Object.keys(meta.t), ...localKeys()]); // gồm cả mục vừa bị xoá → xoá luôn trên tài khoản
      meta = { uid: meta.uid, email: meta.email, t: {}, pending: {} };
      keys.forEach(k => { if (!syncable(k)) return; meta.t[k] = now; if (meta.uid) meta.pending[k] = 1; });
      saveMeta();
      if (user) flush();
    },
    async signIn(email, password) { await ensureFirebase(); await auth.signInWithEmailAndPassword(email, password); },
    async signUp(email, password) { await ensureFirebase(); await auth.createUserWithEmailAndPassword(email, password); },
    async resetPassword(email) { await ensureFirebase(); await auth.sendPasswordResetEmail(email); },
    async signOut() {
      if (user) { try { await flush(); } catch (e) { /* bỏ qua */ } await auth.signOut(); }
      wipeLocal();
      ls.del(META_KEY);
    },
    syncNow() { return user ? pull() : Promise.resolve(); },
    hasPending: () => Object.keys(meta.pending).length > 0,
    info,
    on(ev, fn) { handlers[ev].push(fn); }
  };
  root.Sync = Sync;

  // ---------- Tự động ----------
  // đã đăng nhập trước đó → kết nối lại (mất mạng thì đợi có mạng / quay lại app rồi thử tiếp)
  const reconnect = () => { if (meta.uid && !fb) { setState("loading"); ensureFirebase().catch(() => setState("offline")); } };
  reconnect();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) reconnect();
    if (!user) return;
    if (document.hidden) flush();
    else if (Date.now() - lastPull > PULL_GAP) pull();
  });
  root.addEventListener("online", () => { reconnect(); if (user) pull(); });
  root.addEventListener("pagehide", () => { if (user) flush(); });
})(window);
