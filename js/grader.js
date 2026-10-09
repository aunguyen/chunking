/*
 * Chấm điểm câu dịch (offline, không cần AI).
 *  1. Chuẩn hoá câu: chữ thường, bỏ dấu câu, mở rộng viết tắt (don't → do not),
 *     đồng nhất chính tả Anh–Mỹ (centre → center).
 *  2. Kiểm tra học viên có dùng đúng cụm chunk không (chấp nhận các dạng chia).
 *  3. So khớp từng từ với đáp án gần nhất (LCS, cho phép sai chính tả 1 ký tự).
 *  Điểm / câu (thang 10): dùng đúng chunk = 4đ + độ giống đáp án × 6đ.
 *  Không dùng chunk → tối đa 4đ.
 */
(function (root) {
  "use strict";

  // ---------- Chuẩn hoá (theo từng từ để giữ được vị trí trong câu gốc) ----------
  const CONTRACTIONS = [
    [/^won't$/, "will not"], [/^can't$/, "can not"], [/^cannot$/, "can not"], [/^shan't$/, "shall not"],
    [/^ain't$/, "is not"], [/^let's$/, "let us"],
    [/^(it|that|there|here|he|she|what|who|where|how|when|everything|nothing|this)'s$/, "$1 is"],
    [/n't$/, " not"], [/'re$/, " are"], [/'ve$/, " have"], [/'ll$/, " will"], [/'d$/, " would"], [/'m$/, " am"]
  ];

  const SPELLING = {
    centre: "center", centres: "centers", colour: "color", colours: "colors",
    favourite: "favorite", behaviour: "behavior", neighbour: "neighbor", neighbours: "neighbors",
    organise: "organize", organised: "organized", organising: "organizing",
    realise: "realize", realised: "realized", recognise: "recognize", recognised: "recognized",
    apologise: "apologize", apologised: "apologized", programme: "program", programmes: "programs",
    travelling: "traveling", travelled: "traveled", cancelled: "canceled", cancelling: "canceling",
    theatre: "theater", metre: "meter", litre: "liter", defence: "defense", licence: "license",
    analyse: "analyze", analysed: "analyzed", practise: "practice", grey: "gray",
    ok: "okay",
    // gõ thiếu dấu nháy
    dont: "do not", doesnt: "does not", didnt: "did not", cant: "can not", wont: "will not",
    isnt: "is not", arent: "are not", wasnt: "was not", werent: "were not", hasnt: "has not",
    havent: "have not", hadnt: "had not", wouldnt: "would not", couldnt: "could not",
    shouldnt: "should not", im: "i am", ive: "i have", youre: "you are", theyre: "they are",
    thats: "that is", whats: "what is", itll: "it will", youll: "you will"
  };

  // Một "từ" gốc (tách theo khoảng trắng) → 0..n từ đã chuẩn hoá
  function normalizeToken(raw) {
    const s = String(raw).toLowerCase()
      .replace(/[‘’ʼ`´]/g, "'")
      .replace(/\b([ap])\.m\.?/g, "$1m")            // p.m. → pm
      .replace(/(\d)([ap]m)\b/g, "$1 $2")            // 5pm → 5 pm
      .replace(/[^a-z0-9'\s-]/g, " ")                // bỏ dấu câu
      .replace(/-/g, " ");
    const out = [];
    for (let w of s.split(/\s+/)) {
      w = w.replace(/^'+|'+$/g, "");
      if (!w) continue;
      for (const [re, rep] of CONTRACTIONS) if (re.test(w)) { w = w.replace(re, rep); break; }
      for (const x of w.split(" ")) if (x) out.push(...(SPELLING[x] || x).split(" "));
    }
    return out;
  }

  // Tách câu gốc thành các từ hiển thị, kèm vị trí và dạng chuẩn hoá
  function splitDisplay(text) {
    const out = [], re = /\S+/g, s = String(text || "");
    let m;
    while ((m = re.exec(s))) out.push({ raw: m[0], start: m.index, end: m.index + m[0].length, norm: normalizeToken(m[0]) });
    return out;
  }

  // ---------- Từ tương đương do người học tự khai báo (vd: i will = i'll = ill) ----------
  // Mỗi nhóm: mọi cách viết được đổi về cách viết đầu tiên, áp dụng cho cả câu học viên lẫn đáp án.
  let EQUIV = []; // [{ from: [từ…], to: [từ…] }] — sắp xếp cụm dài trước
  function setEquivalences(groups) {
    const list = [];
    (groups || []).forEach(g => {
      const forms = g.map(v => splitDisplay(v).flatMap(t => t.norm)).filter(f => f.length);
      if (forms.length < 2) return;
      const to = forms[0];
      forms.slice(1).forEach(from => { if (from.join(" ") !== to.join(" ")) list.push({ from, to }); });
    });
    EQUIV = list.sort((a, b) => b.from.length - a.from.length);
  }
  // Danh sách từ đã chuẩn hoá, mỗi từ nhớ vị trí từ gốc (d) để tô đỏ đúng chỗ
  function flatTokens(disp) {
    const flat = [];
    disp.forEach((t, d) => t.norm.forEach(w => flat.push({ w, d })));
    if (!EQUIV.length) return flat;
    const out = [];
    for (let i = 0; i < flat.length;) {
      const hit = EQUIV.find(v => i + v.from.length <= flat.length && v.from.every((w, j) => flat[i + j].w === w));
      if (hit) { hit.to.forEach(w => out.push({ w, d: flat[i].d })); i += hit.from.length; }
      else out.push(flat[i++]);
    }
    return out;
  }

  const normalizeText = text => flatTokens(splitDisplay(text)).map(x => x.w);

  // ---------- Nhận diện cụm chunk ----------
  const WILDCARDS = new Set(["...", "…", "sb", "sth", "somebody", "someone", "something", "smt", "sbd", "(sb)", "(sth)"]);
  const GROUPS = [
    ["my", "your", "his", "her", "its", "our", "their", "one's"],
    ["me", "you", "him", "her", "it", "us", "them"],
    ["myself", "yourself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves", "oneself"],
    ["be", "am", "is", "are", "was", "were", "been", "being"]
  ];
  const IRREGULAR = {
    have: ["has", "had", "having"], do: ["does", "did", "done", "doing"], go: ["goes", "went", "gone", "going"],
    get: ["got", "gotten", "getting"], feel: ["felt"], make: ["made"], take: ["took", "taken"],
    give: ["gave", "given"], come: ["came"], see: ["saw", "seen"], say: ["said"], know: ["knew", "known"],
    think: ["thought"], find: ["found"], keep: ["kept"], leave: ["left"], run: ["ran"], bring: ["brought"],
    buy: ["bought"], catch: ["caught"], teach: ["taught"], tell: ["told"], hold: ["held"], stand: ["stood"],
    understand: ["understood"], lose: ["lost"], spend: ["spent"], send: ["sent"], build: ["built"],
    pay: ["paid"], meet: ["met"], sit: ["sat"], speak: ["spoke", "spoken"], write: ["wrote", "written"],
    break: ["broke", "broken"], choose: ["chose", "chosen"], begin: ["began", "begun"], eat: ["ate", "eaten"],
    fall: ["fell", "fallen"], forget: ["forgot", "forgotten"], grow: ["grew", "grown"], hear: ["heard"],
    lead: ["led"], show: ["shown"], sleep: ["slept"], wake: ["woke", "woken"], wear: ["wore", "worn"],
    win: ["won"], drive: ["drove", "driven"], ride: ["rode", "ridden"], rise: ["rose", "risen"],
    fly: ["flew", "flown"], throw: ["threw", "thrown"], draw: ["drew", "drawn"], deal: ["dealt"],
    mean: ["meant"], feed: ["fed"], fight: ["fought"], sell: ["sold"], sing: ["sang", "sung"],
    swim: ["swam", "swum"], drink: ["drank", "drunk"], lie: ["lay", "lain", "lying"], die: ["dying"],
    set: ["setting"], put: ["putting"], let: ["letting"], cut: ["cutting"], hit: ["hitting"]
  };
  // Từ chức năng: không chia (tránh "a" → "as")
  const FUNCTION_WORDS = new Set(("a an the to of in on at by for from with without about into onto over under " +
    "and or but so than then that this these those as if up down out off away back not no " +
    "everything something anything nothing everyone someone anyone everybody all any some every each " +
    "very too much many more most less least just only even also still already yet").split(" "));

  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function wordForms(w) {
    for (const g of GROUPS) if (g.includes(w)) return new Set(g);
    const f = new Set([w]);
    if (FUNCTION_WORDS.has(w) || !/^[a-z]{2,}$/.test(w)) return f;
    (IRREGULAR[w] || []).forEach(x => f.add(x));
    if (w.endsWith("ing") || w.endsWith("ed")) return f;     // đã chia rồi thì giữ nguyên
    f.add(w + "s"); f.add(w + "es"); f.add(w + "ed"); f.add(w + "d"); f.add(w + "ing");
    if (w.endsWith("e")) f.add(w.slice(0, -1) + "ing");
    if (w.endsWith("ie")) f.add(w.slice(0, -2) + "ying");
    if (/[^aeiou]y$/.test(w)) { f.add(w.slice(0, -1) + "ies"); f.add(w.slice(0, -1) + "ied"); }
    if (/(^|[^aeiou])[aeiou][bdgklmnprt]$/.test(w)) { f.add(w + w.slice(-1) + "ing"); f.add(w + w.slice(-1) + "ed"); }
    return f;
  }

  function buildChunkPattern(chunkText) {
    const raw = String(chunkText).toLowerCase().replace(/…/g, " ... ").replace(/\.{3,}/g, " ... ");
    const tokens = raw.split(/\s+/).filter(Boolean);
    let out = "", pendingWild = false;
    for (const t of tokens) {
      if (WILDCARDS.has(t)) { pendingWild = true; continue; }
      const words = normalizeText(t);
      for (const w of words) {
        if (out) out += pendingWild ? "\\s+(?:\\S+\\s+){0,4}" : "\\s+";
        const forms = [...wordForms(w)].sort((a, b) => b.length - a.length).map(escapeRe);
        out += forms.length > 1 ? "(?:" + forms.join("|") + ")" : forms[0];
        pendingWild = false;
      }
    }
    return out;
  }

  function makeChunkMatcher(chunk) {
    const sources = (chunk.match && chunk.match.length) ? chunk.match : [buildChunkPattern(chunk.chunk)];
    const normRes = sources.map(p => new RegExp("(?:^|\\s)(?:" + p + ")(?=\\s|$)"));
    const rawRes = sources.map(p => new RegExp("\\b(?:" + p.replace(/\\s\+/g, "[\\s,]+") + ")\\b", "gi"));
    return {
      label: String(chunk.chunk).replace(/\s*(\.{3,}|…)\s*/g, " ").trim(),
      test(text) {
        const norm = normalizeText(text).join(" ");
        return normRes.some(re => re.test(norm));
      },
      // Vị trí [start, end) của cụm chunk trong câu gốc, hoặc null
      range(text) {
        const s = String(text).replace(/[‘’]/g, "'");
        for (const re of rawRes) {
          re.lastIndex = 0;
          const m = re.exec(s);
          if (m) return [m.index, m.index + m[0].length];
        }
        return null;
      },
      // Trả về [{text, hit}] để tô sáng cụm chunk trong câu gốc
      segments(text) {
        const s = String(text), r = this.range(s);
        if (!r) return [{ text: s, hit: false }];
        return [
          { text: s.slice(0, r[0]), hit: false },
          { text: s.slice(r[0], r[1]), hit: true },
          { text: s.slice(r[1]), hit: false }
        ].filter(x => x.text);
      }
    };
  }

  // ---------- So khớp từng từ ----------
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        // đảo 2 chữ cái liền nhau (freind ↔ friend) tính là 1 lỗi
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    return dp[a.length][b.length];
  }

  function tokenWeight(u, r) {
    if (u === r) return 1;
    if (u.length >= 4 && r.length >= 4 && editDistance(u, r) <= 1) return 0.75; // lỗi chính tả nhỏ
    return 0;
  }

  // LCS có trọng số → độ giống + danh sách diff
  function align(user, ref) {
    const n = user.length, m = ref.length;
    const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= m; j++) {
        const w = tokenWeight(user[i - 1], ref[j - 1]);
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], w ? dp[i - 1][j - 1] + w : 0);
      }
    const ops = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const w = i > 0 && j > 0 ? tokenWeight(user[i - 1], ref[j - 1]) : 0;
      if (w && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + w)) < 1e-9) {
        ops.push(w === 1 ? { type: "same", word: ref[j - 1] } : { type: "typo", word: user[i - 1], fix: ref[j - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.push({ type: "missing", word: ref[j - 1] }); j--;
      } else {
        ops.push({ type: "extra", word: user[i - 1] }); i--;
      }
    }
    ops.reverse();
    const sim = n + m ? (2 * dp[n][m]) / (n + m) : 0;
    return { sim, ops };
  }

  /*
   * Từ danh sách diff → đánh dấu trên các từ gốc để hiển thị 2 dòng:
   *   user[d].err  : từ học viên viết sai / thừa        (dòng "Bạn viết")
   *   user[d].gap  : thiếu từ ngay trước từ này          (hiện "__")
   *   gapEnd       : thiếu từ ở cuối câu
   *   ref[d].fix   : từ được sửa / thêm vào              (dòng "Sửa lại")
   */
  function markTokens(ops, userDisp, refDisp, uFlat, rFlat) {
    const uMap = uFlat.map(x => x.d), rMap = rFlat.map(x => x.d);
    const uErr = new Set(), uGap = new Set(), rFix = new Set();
    let gapEnd = false, ui = 0, ri = 0;
    ops.forEach((o, k) => {
      if (o.type === "same") { ui++; ri++; return; }
      if (o.type === "typo") { uErr.add(uMap[ui]); rFix.add(rMap[ri]); ui++; ri++; return; }
      if (o.type === "extra") { uErr.add(uMap[ui]); ui++; return; }
      // missing: chỉ hiện "__" khi chỗ thiếu không nằm sát một từ sai (đã tô đỏ rồi)
      rFix.add(rMap[ri]); ri++;
      if (ops[k - 1] && ops[k - 1].type === "missing") return;
      let j = k;
      while (ops[j + 1] && ops[j + 1].type === "missing") j++;
      const nearWrong = (ops[k - 1] && ops[k - 1].type === "extra") || (ops[j + 1] && ops[j + 1].type === "extra");
      if (!nearWrong) { if (ui < uMap.length) uGap.add(uMap[ui]); else gapEnd = true; }
    });
    return {
      user: userDisp.map((t, d) => ({ raw: t.raw, start: t.start, end: t.end, err: uErr.has(d), gap: uGap.has(d) })),
      ref: refDisp.map((t, d) => ({ raw: t.raw, start: t.start, end: t.end, fix: rFix.has(d) })),
      gapEnd
    };
  }

  function grade(input, answers, matcher) {
    const userDisp = splitDisplay(input);
    const uFlat = flatTokens(userDisp);
    const user = uFlat.map(x => x.w);
    if (!user.length) return { empty: true, score: 0, chunkUsed: false, sim: 0, best: answers[0], marks: null };
    const chunkUsed = matcher.test(input);
    let best = null;
    for (const ans of answers) {
      const refDisp = splitDisplay(ans), rFlat = flatTokens(refDisp);
      const r = align(user, rFlat.map(x => x.w));
      if (!best || r.sim > best.sim) best = { ...r, answer: ans, refDisp, rFlat };
    }
    const raw = chunkUsed ? 4 + 6 * best.sim : 4 * best.sim;
    const score = best.sim > 0.999 && chunkUsed ? 10 : Math.round(raw);
    return {
      empty: false, score, chunkUsed, sim: best.sim, ops: best.ops, best: best.answer,
      marks: markTokens(best.ops, userDisp, best.refDisp, uFlat, best.rFlat)
    };
  }

  const api = { normalizeText, splitDisplay, buildChunkPattern, makeChunkMatcher, align, grade, markTokens, wordForms, setEquivalences };
  root.Grader = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
