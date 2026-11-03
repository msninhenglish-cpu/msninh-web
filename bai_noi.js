/* Bai noi quay video (muc 22, GD2, 29/10/2026) — chi tai khi mo #/noi/<lan lam> (HS) hoac #/t/noi/<bai giao> (GV).
 * HS: MediaRecorder 360p ~500 kbps (hoac chi ghi am), toi da gioi_han_giay, xem lai / quay lai / «Hoàn thành» -> ve tai -> bucket rieng tu video_noi.
 * GV: ve xem 10 phut -> tai video qua Storage (nhu signed URL) -> cham 0-10 (bac 0,5) + nhan xet; muc 27: khung «AI gợi ý» (chi GV thay).
 */
"use strict";

const NOI_MUC = { chu: "Chữ cái", tu: "Từ theo tranh", cau: "Câu theo tranh", doan: "Đọc đoạn văn", hoi_thoai: "Hội thoại", chant: "Chant", bai_hat: "Bài hát", hoi_dap: "Đối đáp" };
const NOI_MAX = 8388608;   // 8 MB / file (gioi han bucket)
// Chu chay theo nhip (karaoke) khi quay van_ban_mau: ms cho 1 tu (dau cau / cuoi dong dung lau hon)
const NOI_TOC = { cham: 950, vua: 650, nhanh: 430 };
const NOI_TOC_TEN = [["cham", "🐢 Chậm"], ["vua", "🚶 Vừa"], ["nhanh", "🐇 Nhanh"]];
const noiCoChay = (t) => !!t.van_ban_mau && t.chu_chay !== "tat" && ["doan", "hoi_thoai", "chant", "bai_hat"].includes(t.muc_noi);
// Tach dong: xuong dong cua co (fmt doi \n -> <br>, phai doi lai truoc khi lay chu) + moi cau (. ? !) mot dong cho de doc theo.
// Nhip moi tu theo so am tiet (nhom nguyen am), dung lau hon o dau phay / het cau / cuoi dong.
function noiChayHtml(t) {
  const tam = document.createElement("div"); tam.innerHTML = fmt(t.van_ban_mau).replace(/<br\s*\/?>/gi, "\n");
  let k = 0;
  const dong = tam.textContent.split("\n").flatMap((d) => d.split(/(?<=[.!?]["”’)]*)\s+(?=\S)/)).map((d) => d.trim()).filter(Boolean);
  return dong.map((d) => {
    const tu = d.split(/\s+/).filter(Boolean);
    return tu.map((w, j) => {
      const amTiet = Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").match(/[aeiouy]+/g) || []).length);
      const nang = 0.7 + 0.3 * amTiet + (/[.!?]["”’)]*$/.test(w) ? 0.8 : /[,;:]$/.test(w) ? 0.4 : 0) + (j === tu.length - 1 ? 0.4 : 0);
      return `<span class="nc-tu" data-k="${k++}" data-w="${nang.toFixed(2)}">${esc(w)}</span>`;
    }).join(" ");
  }).join("<br>");
}
// Bo chay chu: chay(hop, toc) -> {dung(), doiToc(t)}; bat dau sau 1,5 giay cho be san sang
function noiChay(hop, toc) {
  const tu = [...hop.querySelectorAll(".nc-tu")];
  let i = -1, hen = setTimeout(buoc, 1500);
  tu.forEach((x) => x.classList.remove("on", "qua"));
  hop.scrollTop = 0;
  function buoc() {
    if (i >= 0) { tu[i].classList.remove("on"); tu[i].classList.add("qua"); }
    i++;
    if (i >= tu.length) { hen = null; return; }
    const x = tu[i]; x.classList.add("on");
    if (x.offsetTop - hop.scrollTop > hop.clientHeight * 0.6 || x.offsetTop < hop.scrollTop) hop.scrollTop = Math.max(0, x.offsetTop - hop.clientHeight / 3);
    hen = setTimeout(buoc, NOI_TOC[toc] * Number(x.dataset.w));
  }
  return { dung: () => { clearTimeout(hen); hen = null; }, doiToc: (t) => { toc = t; } };
}
// May doc 1 cau tieng Anh, goi xong() khi doc het (hoac het gio du phong)
function noiDoc(chu, xong) {
  let da = false; const het = () => { if (!da) { da = true; xong(); } };
  const tam = document.createElement("div"); tam.innerHTML = fmt(chu); const t = tam.textContent;
  setTimeout(het, 1500 + t.length * 110);
  try {
    const sp = window.speechSynthesis; if (!sp) return het();
    sp.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = "en-US"; u.rate = 0.85;
    const v = sp.getVoices().find((x) => /^en[-_]US/i.test(x.lang)) || sp.getVoices().find((x) => /^en/i.test(x.lang)); if (v) u.voice = v;
    u.onend = het; u.onerror = het; sp.speak(u);
  } catch (e) { het(); }
}
// Doan trong file nghe cua de (giong sach); khong co file -> may doc
function noiNghe(dsAm, nd, chu, xong) {
  const f = nd && (dsAm || []).find((x) => x.ten === nd.tep);
  if (!f) { noiDoc(chu, xong); return { dung: () => {} }; }
  const a = new Audio(urlAmThanh(f.duong_dan)); let da = false;
  const het = () => { if (!da) { da = true; try { a.pause(); } catch (e) { /* bo */ } xong(); } };
  a.addEventListener("timeupdate", () => { if (a.currentTime >= nd.den_giay) het(); });
  a.addEventListener("error", () => { if (!da) { da = true; noiDoc(chu, xong); } });
  const bat = () => { a.currentTime = nd.tu_giay; a.play().catch(() => { if (!da) { da = true; noiDoc(chu, xong); } }); };
  a.preload = "auto"; a.addEventListener("loadedmetadata", bat, { once: true }); a.load();
  setTimeout(het, (nd.den_giay - nd.tu_giay) * 1000 + 8000);
  return { dung: () => { da = true; try { a.pause(); } catch (e) { /* bo */ } } };
}

// Dinh dang may ho tro: Safari (iPhone) quay mp4, Chrome / Android quay webm
function noiChonMime(video) {
  const ds = video ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1,mp4a", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  if (!window.MediaRecorder) return null;
  return ds.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || "";
}
const noiMimeGoc = (m) => String(m || "").split(";")[0] || "video/webm";
const noiGiay = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const noiSo = (n) => String(Number(n)).replace(".", ",");
function noiSao(n, to) { if (n === null || n === undefined) return ""; const d = Math.floor(n); return `<span class="noi-sao${to ? " to" : ""}">${"★".repeat(d)}<span class="faint">${"★".repeat(10 - d)}</span></span> <b>${noiSo(n)}/10</b>`; }

// Do am luong khi quay (muc 27): chi de nhac, khong dung den ban ghi. Khong do duoc thi tra null / mang rong -> khong nhac gi.
function noiDoAm(luong) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !luong.getAudioTracks().length) return null;
    const ac = new AC(), an = ac.createAnalyser(), cam = ac.createGain();
    if (!an.getFloatTimeDomainData) { ac.close().catch(() => {}); return null; }
    an.fftSize = 2048; cam.gain.value = 0;   // am = 0 ra loa: chi de trinh duyet chiu chay node
    ac.createMediaStreamSource(luong).connect(an); an.connect(cam); cam.connect(ac.destination);
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const buf = new Float32Array(an.fftSize);
    let mau = [], hen = null;
    const lay = () => {
      try {
        if (ac.state !== "running") return;
        an.getFloatTimeDomainData(buf);
        let s = 0; for (let k = 0; k < buf.length; k++) s += buf[k] * buf[k];
        mau.push(Math.sqrt(s / buf.length));
      } catch (e) { /* bo */ }
    };
    return { chay: () => { mau = []; clearInterval(hen); hen = setInterval(lay, 100); }, dung: () => { clearInterval(hen); hen = null; return mau; },
      tat: () => { clearInterval(hen); try { ac.close().catch(() => {}); } catch (e) { /* bo */ } } };
  } catch (e) { return null; }
}
// Xet 1 lan quay -> loi moi quay lai ("" = on). Mau toan 0 tuyet doi = khong do duoc (Safari chua chay node), khong nhac.
function noiXetAm(mau, giay, t) {
  const ds = (mau || []).slice().sort((a, b) => a - b), p95 = ds.length >= 10 ? ds[Math.floor(ds.length * 0.95)] : null;
  const coDo = p95 !== null && ds[ds.length - 1] > 0;
  if (coDo && p95 < 0.008) return "Cô gần như chưa nghe thấy tiếng em. Em kiểm tra micro rồi nói to, rõ nhé.";
  const soTu = String(t.van_ban_mau || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const can = t.luot && t.luot.length ? t.luot.length * 2 : soTu >= 3 ? soTu * 0.3 : 2;
  if (giay < can) return t.luot && t.luot.length ? "Bài quay hơi ngắn. Em trả lời hết các câu giúp cô nhé." : soTu >= 3 ? "Bài quay hơi ngắn. Em đọc hết bài giúp cô nhé." : "Bài quay hơi ngắn. Em nói lại rõ hơn giúp cô nhé.";
  if (coDo && p95 < 0.02) return "Tiếng em hơi nhỏ, cô nghe chưa rõ. Em nói to hơn, để máy gần em hơn nhé.";
  return "";
}
// Khung «AI goi y» (chi GV): ban nhap, khong tu luu. Co bam «Duyet» moi hien cho HS; da cham roi thi khong duyet nhanh de khoi ghi de nham.
function noiAiHtml(ai, daCham) {
  const TIN = { cao: ["alert-ok", "cao"], vua: ["", "vừa"], thap: ["alert-warn", "thấp, cô nên nghe lại"] }, tin = TIN[ai.do_tin] || TIN.vua;
  const phan = [["noi_dung", "Nội dung", 4], ["phat_am", "Phát âm", 4], ["toc_do", "Tốc độ", 2]].filter(([k]) => ai[k] !== undefined && ai[k] !== null);
  return `<div class="noi-ai"><div class="row between" style="gap:8px"><b>🤖 AI gợi ý</b><span class="small muted">bản nháp, học sinh không thấy</span></div>
    <div class="noi-ai-so">${ai.diem !== undefined && ai.diem !== null ? `<b>${noiSo(ai.diem)}</b><small>/10</small>` : '<span class="muted small">AI chưa cho điểm</span>'}
      ${phan.map(([k, t, m]) => `<span class="badge">${t} ${noiSo(ai[k])}/${m}</span>`).join(" ")}</div>
    <div class="alert ${tin[0]} noi-ai-tin">Độ tin của AI: <b>${tin[1]}</b></div>
    ${ai.tu_can_luyen && ai.tu_can_luyen.length ? `<div class="small"><b>Từ cần luyện:</b> ${ai.tu_can_luyen.map((x) => `<span class="badge gold">${esc(x)}</span>`).join(" ")}</div>` : ""}
    ${ai.loi_noi ? `<div class="small"><b>Máy nghe được:</b> <span class="muted">${esc(ai.loi_noi)}</span></div>` : ""}
    ${ai.nhan_xet ? `<div class="small"><b>Nhận xét:</b> ${esc(ai.nhan_xet)}</div>` : ""}
    ${ai.ghi_chu ? `<div class="small muted">Ghi chú: ${esc(ai.ghi_chu)}</div>` : ""}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">${ai.diem !== undefined && ai.diem !== null && !daCham ? '<button type="button" class="btn btn-sm btn-primary grow" data-act="noiDuyetAi">✅ Duyệt, hiện cho học sinh</button>' : ""}
      ${(ai.diem !== undefined && ai.diem !== null) || ai.nhan_xet ? '<button type="button" class="btn btn-sm grow" data-act="noiDungAi">✏️ Sửa rồi lưu</button>' : ""}</div></div>`;
}

// The nhiem vu (HS thay; GV xem thu cung dung)
function noiTheHtml(t, i, da, nut) {
  const doc = [t.instruction, t.van_ban_mau].filter(Boolean);
  return `<div class="card noi-the">
    <div class="row between" style="gap:8px"><b>🎤 Bài nói ${i + 1}</b><span class="badge">${esc(NOI_MUC[t.muc_noi] || "Nói")} · ${t.ghi === "am_thanh" ? "🎙 ghi âm" : "📹 quay video"} · tối đa ${noiGiay(t.gioi_han_giay || 60)}</span></div>
    ${t.instruction || doc.length ? `<div class="th-lenh">${doc.length && "speechSynthesis" in window ? `<button type="button" class="doc-nut" data-act="docTo" data-doc="${esc(JSON.stringify(doc))}" aria-label="Nghe mẫu">🔊</button>` : ""}${t.instruction ? `<div class="q-instr">${fmt(t.instruction)}</div>` : ""}</div>` : ""}
    ${t.anh ? `<div class="q-anh"><img src="${esc(urlAnh(t.anh))}" alt="Tranh bài nói ${i + 1}"></div>` : ""}
    ${t.goi_y ? `<p class="noi-goi-y">💡 ${fmt(t.goi_y)}</p>` : ""}
    ${t.van_ban_mau ? `<div class="noi-mau">${fmt(t.van_ban_mau).replace(/\n/g, "<br>")}</div>` : ""}
    ${t.luot ? `<ol class="noi-luot">${t.luot.map((l) => `<li><span class="hd-hoi-nho">❓ ${fmt(l.hoi)}</span>${l.tra_loi_goi_y && !t.an_goi_y ? `<br><span class="muted">💬 ${fmt(l.tra_loi_goi_y)}</span>` : ""}</li>`).join("")}</ol>
      <p class="small muted" style="margin:4px 0 0">Khi quay: máy hỏi từng câu, em trả lời${t.tu_chuyen_giay ? `, sau ${t.tu_chuyen_giay} giây tự sang câu sau` : ", rồi bấm <b>Tiếp</b>"}.</p>` : ""}
    ${da ? `<div class="alert ${da.sao != null ? "alert-ok" : ""}" style="margin:10px 0 0">${da.sao != null ? `⭐ Cô chấm: ${noiSao(da.sao)}${da.nhan_xet ? `<div style="margin-top:4px">💬 ${esc(da.nhan_xet)}</div>` : ""}` : `✅ Em đã nộp${da.giay ? " (" + noiGiay(da.giay) + ")" : ""} · <b>chờ cô chấm</b>`}</div>` : ""}
    ${nut || ""}</div>`;
}

/* ---------------- HOC SINH ---------------- */
async function sNoi(aid) {
  app.innerHTML = sShell("home", spinner());
  ACT.retry = () => route();
  let d;
  try { d = await api("student_bai_noi", { p_attempt_id: aid }); if (d.error) throw new Error(d.error); } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/"); return; }
  thGanNut();
  const coMay = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const ve = () => {
    const xong = d.ds.filter((_, i) => d.da[i]).length;
    app.querySelector("main").innerHTML = `<div class="th"><h1 style="margin-bottom:2px">🎤 Phần nói</h1><p class="muted" style="margin-top:0">${esc(d.title)} · đã nộp <b>${xong}/${d.ds.length}</b> bài</p>
      ${!coMay ? '<div class="alert alert-warn">Máy này chưa quay được. Em mở bài bằng <b>Chrome</b> (Android, máy tính) hoặc <b>Safari</b> (iPhone) bản mới và cho phép dùng camera, micro nhé.</div>' : ""}
      ${!d.mo ? '<div class="alert alert-warn">Đã quá hạn nộp bài nói.</div>' : ""}
      ${d.ds.map((t, i) => noiTheHtml(t, i, d.da[i], coMay && d.mo ? `<button type="button" class="btn ${d.da[i] ? "" : "btn-gold"} btn-block btn-lg" data-act="noiQuay" data-i="${i}" style="margin-top:10px">${d.da[i] ? "🔁 Quay lại" : t.ghi === "am_thanh" ? "🔴 Bấm để ghi âm" : "🔴 Bấm để quay"}</button>` : "")).join("")}
      <a class="btn btn-ghost btn-block" href="#/" style="margin-top:12px">Về trang chủ</a></div>`;
  };
  const dungQ = noiGanQuay(d, aid, ve);
  cleanup = () => { dungQ(); closeSheet(); thDungDoc(); };
  ve();
}

// Gan cac nut quay (ACT.noiQuay...) cho bai noi d cua lan lam aid; xong() goi khi nop xong 1 bai. Tra ve ham tat camera.
// Dung chung: trang #/noi va cau «🎤 Bài nói» ngay trong bai lam (sQuiz).
function noiGanQuay(d, aid, xong) {
  let luong = null, may = null, hen = null, amDo = null;
  const dung = () => { clearInterval(hen); hen = null; if (may && may.state !== "inactive") { try { may.stop(); } catch (e) { /* bo */ } } if (amDo) { amDo.tat(); amDo = null; } if (luong) luong.getTracks().forEach((t) => t.stop()); luong = null; };
  ACT.noiQuay = async (b) => {
    const i = +b.dataset.i, t = d.ds[i], video = t.ghi !== "am_thanh", han = t.gioi_han_giay || 60;
    const chay = noiCoChay(t), hd = !!(t.luot && t.luot.length);
    let toc = NOI_TOC[t.chu_chay] ? t.chu_chay : "cham", bc = null;
    const mime = noiChonMime(video);
    if (mime === null) { toast("Máy này chưa hỗ trợ quay.", 4000); return; }
    openSheet(`<div class="noi-quay"><h2 style="margin:0 0 6px">🎤 Bài nói ${i + 1}</h2>
      ${chay ? `<div class="seg noi-toc">${NOI_TOC_TEN.map(([k, ten]) => `<label class="${k === toc ? "on" : ""}" data-act="noiToc" data-v="${k}">${ten}</label>`).join("")}</div>
        <div class="noi-mau noi-chay" id="noiChay">${noiChayHtml(t)}</div>`
        : hd ? `<div class="noi-hd" id="noiHD"><div class="small muted" id="hdSo"></div><div id="hdAnh"></div><div class="hd-hoi" id="hdHoi">Chuẩn bị…</div><div class="hd-goi" id="hdGoi"></div><div id="hdTiep" class="row" style="gap:8px;flex-wrap:nowrap"></div></div>`
        : t.van_ban_mau ? `<div class="noi-mau nho">${fmt(t.van_ban_mau).replace(/\n/g, "<br>")}</div>` : t.goi_y ? `<p class="noi-goi-y">💡 ${fmt(t.goi_y)}</p>` : ""}
      <div class="noi-khung${chay || hd ? " gon" : ""}">${video ? '<video id="noiXem" playsinline muted autoplay></video>' : '<div class="noi-mic">🎙</div>'}<div class="noi-dong-ho" id="noiDH">0:00 / ${noiGiay(han)}</div></div>
      <div id="noiNut" class="row" style="gap:8px;flex-wrap:nowrap;margin-top:10px"><button type="button" class="btn btn-block" disabled>Đang mở ${video ? "camera" : "micro"}…</button></div>
      <div id="noiMsg"></div></div>`, { khoa: true });
    const nut = (html) => { document.getElementById("noiNut").innerHTML = html; };
    try {
      const am = hd ? { echoCancellation: false } : true;   // doi dap: giu tieng may hoi trong video
      luong = await navigator.mediaDevices.getUserMedia(video ? { audio: am, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24, max: 30 } } } : { audio: am });
    } catch (e) {
      document.getElementById("noiMsg").innerHTML = errBox(/NotAllowed|Permission/i.test(e.name + e.message) ? `Em chưa cho phép dùng ${video ? "camera / " : ""}micro. Em bấm vào biểu tượng 🔒 trên thanh địa chỉ → cho phép, rồi thử lại nhé.` : `Không mở được ${video ? "camera" : "micro"}: ${e.message || e.name}`);
      nut('<button type="button" class="btn btn-block" data-act="noiDong">Đóng</button>'); return;
    }
    if (video) { const v = document.getElementById("noiXem"); v.srcObject = luong; }
    amDo = noiDoAm(luong);
    let manh = [], bd = 0, blob = null, giay = 0;
    // Doi dap: lan luot hoi -> goi y -> be noi -> Tiep (hoac tu chuyen), tat ca trong 1 lan quay
    let hdI = -1, hdHen = null, hdAm = null;
    const hdDung = () => { clearTimeout(hdHen); clearInterval(hdHen); hdHen = null; if (hdAm) hdAm.dung(); hdAm = null; thDungDoc(); };
    const hdLuot = (k) => {
      hdDung(); hdI = k;
      const l = t.luot[k], cuoi = k === t.luot.length - 1, el = (x) => document.getElementById(x);
      if (!el("hdHoi")) return;
      el("hdSo").textContent = `Câu ${k + 1}/${t.luot.length}`;
      const anh = l.anh || (k === 0 ? t.anh : null);
      el("hdAnh").innerHTML = anh ? `<div class="q-anh hd-anh"><img src="${esc(urlAnh(anh))}" alt="Tranh câu ${k + 1}"></div>` : "";
      el("hdHoi").innerHTML = `❓ ${fmt(l.hoi)}`;
      el("hdGoi").innerHTML = ""; el("hdTiep").innerHTML = "";
      let daHien = false;
      const sauHoi = () => {
        if (daHien || hdI !== k || !el("hdGoi")) return;
        daHien = true;
        if (l.tra_loi_goi_y && !t.an_goi_y) el("hdGoi").innerHTML = `💬 ${fmt(l.tra_loi_goi_y)}`;
        el("hdTiep").innerHTML = `<button type="button" class="btn grow" data-act="hdNghe">🔊 Nghe lại</button><button type="button" class="btn btn-gold grow" data-act="hdTiep">${cuoi ? "✅ Xong" : "Tiếp ▶"}</button>`;
        if (t.tu_chuyen_giay) {
          let con = t.tu_chuyen_giay; const nutT = el("hdTiep").querySelector('[data-act="hdTiep"]');
          const nhan = () => { if (nutT) nutT.textContent = `${cuoi ? "✅ Xong" : "Tiếp ▶"} (${con})`; };
          nhan();
          hdHen = setInterval(() => { con--; if (con <= 0) ACT.hdTiep(); else nhan(); }, 1000);
        }
      };
      hdAm = noiNghe(d.am_thanh, l.nghe, l.hoi, sauHoi);
    };
    ACT.hdTiep = () => { if (hdI < 0) return; if (hdI >= t.luot.length - 1) { hdDung(); ACT.noiDung(); } else hdLuot(hdI + 1); };
    ACT.hdNghe = () => { if (hdI < 0) return; const l = t.luot[hdI]; clearInterval(hdHen); hdHen = null; if (hdAm) hdAm.dung(); hdAm = noiNghe(d.am_thanh, l.nghe, l.hoi, () => {}); };
    ACT.noiToc = (el) => { toc = el.dataset.v; document.querySelectorAll(".noi-toc label").forEach((x) => x.classList.toggle("on", x === el)); if (bc) bc.doiToc(toc); };
    const batDau = () => {
      manh = []; blob = null;
      try { may = new MediaRecorder(luong, Object.assign(mime ? { mimeType: mime } : {}, video ? { videoBitsPerSecond: 500000, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 })); }
      catch (e) { may = new MediaRecorder(luong); }
      may.ondataavailable = (ev) => { if (ev.data && ev.data.size) manh.push(ev.data); };
      may.onstop = () => {
        blob = new Blob(manh, { type: noiMimeGoc(may.mimeType || mime) });
        giay = Math.round((Date.now() - bd) / 1000);
        const dh0 = document.getElementById("noiDH"); if (dh0) dh0.textContent = "⏺ " + noiGiay(giay);
        const v = document.getElementById("noiXem"), url = URL.createObjectURL(blob);
        if (video && v) { v.srcObject = null; v.muted = false; v.controls = true; v.src = url; v.play().catch(() => {}); }
        else if (!video) document.querySelector(".noi-khung").innerHTML = `<audio controls src="${url}" style="width:100%"></audio><div class="noi-dong-ho">${noiGiay(giay)}</div>`;
        const qua = blob.size > NOI_MAX;
        const nhac = qua ? "" : noiXetAm(amDo ? amDo.dung() : null, giay, t);   // chi nhac, van nop duoc
        document.getElementById("noiMsg").innerHTML = qua ? errBox(`Bài quay ${Math.round(blob.size / 1048576)} MB, quá 8 MB. Em quay ngắn hơn nhé.`)
          : nhac ? `<div class="alert alert-warn" id="noiNhac" style="margin-top:8px"><b>🔁 Quay lại nhé!</b> ${nhac}<div class="small muted">Nếu em đã ưng ý thì vẫn bấm <b>Hoàn thành</b> được.</div></div>`
          : `<p class="small muted center">Em xem lại. Ưng ý thì bấm <b>Hoàn thành</b>.</p>`;
        nut(`<button type="button" class="btn grow" data-act="noiLai">🔁 Quay lại</button>${qua ? "" : '<button type="button" class="btn btn-gold grow" data-act="noiNop">✅ Hoàn thành</button>'}`);
      };
      may.start(1000); bd = Date.now();
      if (amDo) amDo.chay();
      if (chay) { if (bc) bc.dung(); bc = noiChay(document.getElementById("noiChay"), toc); }
      if (hd) { hdI = -1; document.getElementById("hdHoi").textContent = "Chuẩn bị…"; hdHen = setTimeout(() => hdLuot(0), 1200); }
      document.querySelector(".noi-khung").classList.add("dang");
      nut('<button type="button" class="btn btn-danger btn-block btn-lg" data-act="noiDung">⏹ Dừng</button>');
      hen = setInterval(() => {
        const s = (Date.now() - bd) / 1000, dh = document.getElementById("noiDH");
        if (dh) dh.textContent = `🔴 ${noiGiay(s)} / ${noiGiay(han)}`;
        if (s >= han) ACT.noiDung();
      }, 250);
    };
    ACT.noiDung = () => {
      clearInterval(hen); hen = null; if (bc) bc.dung();
      if (hd) { hdDung(); hdI = -1; const tp = document.getElementById("hdTiep"); if (tp) tp.innerHTML = ""; }
      document.querySelector(".noi-khung").classList.remove("dang"); if (may && may.state !== "inactive") may.stop();
    };
    ACT.noiLai = () => {
      if (video) { const v = document.getElementById("noiXem"); v.controls = false; v.muted = true; v.removeAttribute("src"); v.srcObject = luong; v.play().catch(() => {}); }
      else document.querySelector(".noi-khung").innerHTML = `<div class="noi-mic">🎙</div><div class="noi-dong-ho" id="noiDH">0:00 / ${noiGiay(han)}</div>`;
      document.getElementById("noiMsg").innerHTML = ""; batDau();
    };
    ACT.noiDong = () => { if (bc) bc.dung(); hdDung(); dung(); closeSheet(); };
    ACT.noiNop = async (btn) => {
      if (!blob) return;
      if (!blob.size) { document.getElementById("noiMsg").innerHTML = errBox("Bài quay chưa có hình / tiếng. Em bấm Quay lại nhé."); return; }
      const m = noiMimeGoc(blob.type);
      btn.disabled = true; nut(`<button type="button" class="btn btn-block" disabled>⏳ Đang gửi cho cô…</button>`);
      try {
        const v = await api("student_tao_ve_video", { p_attempt_id: aid, p_so: i, p_mime: m, p_kich_thuoc: blob.size });
        if (v.error) throw new Error(v.error);
        const up = await client().storage.from("video_noi").upload(v.duong_dan, await blob.arrayBuffer(), { contentType: m, upsert: false });
        if (up.error) throw new Error("Gửi video không được: " + up.error.message);
        const r = await api("student_nop_video", { p_attempt_id: aid, p_so: i, p_duong_dan: v.duong_dan, p_mime: m, p_kich_thuoc: blob.size, p_giay: giay });
        if (r.error) throw new Error(r.error);
        if (r.xoa) client().storage.from("video_noi").remove([r.xoa]).catch(() => {});   // bai quay cu
        d.da[i] = { id: null, giay, sao: null, nhan_xet: null };
        hdDung(); dung(); closeSheet(); toast("Đã gửi bài nói cho cô 🎉", 3000); xong();
      } catch (e) {
        document.getElementById("noiMsg").innerHTML = errBox(e);
        nut(`<button type="button" class="btn grow" data-act="noiLai">🔁 Quay lại</button><button type="button" class="btn btn-gold grow" data-act="noiNop">↻ Gửi lại</button>`);
      }
    };
    batDau();
  };
  return dung;
}

/* ---------------- GIAO VIEN: xem + cham ---------------- */
async function tNoi(asgId) {
  app.innerHTML = tShell("home", spinner());
  ACT.retry = () => route();
  let d;
  try { d = await api("t_bai_noi_ds", { p_assignment_id: asgId }); if (d.error) throw new Error(d.error); } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t"); return; }
  let loc = "cho";
  const ve = () => {
    const ds = d.rows.filter((r) => loc === "tat_ca" || (loc === "cho" ? r.sao == null : r.sao != null));
    app.querySelector("main").innerHTML = `<a href="#/t/a/${asgId}" class="small">‹ Kết quả bài giao</a>
      <h1 style="margin-top:8px">🎤 Chấm bài nói</h1><p class="muted" style="margin-top:0">${esc(d.title)} · ${d.ds.length} bài nói / em · ${d.rows.length} bài đã nộp · <b>${d.rows.filter((r) => r.sao == null).length} chờ chấm</b></p>
      <div class="seg" style="max-width:420px;margin-bottom:12px">${[["cho", "Chờ chấm"], ["da", "Đã chấm"], ["tat_ca", "Tất cả"]].map(([k, t]) => `<label class="${loc === k ? "on" : ""}" data-act="noiLoc" data-k="${k}">${t}</label>`).join("")}</div>
      ${ds.map((r) => `<div class="card row between" style="gap:8px;flex-wrap:wrap"><div class="grow"><b>${esc(r.ho_ten)}</b> <span class="small muted">mã ${esc(r.ma_hs)} · ${esc(r.lop || "")}</span>
          <div class="small">🎤 Bài nói ${r.so + 1}: ${esc(NOI_MUC[(d.ds[r.so] || {}).muc_noi] || "")}${r.giay ? " · " + noiGiay(r.giay) : ""} · nộp ${fmtDT(r.nop_luc)}${r.kich_thuoc ? " · " + (r.kich_thuoc / 1048576).toFixed(1) + " MB" : ""}</div>
          ${r.sao != null ? `<div>${noiSao(r.sao)}${r.nhan_xet ? ` <span class="small">💬 ${esc(r.nhan_xet)}</span>` : ""}</div>` : ""}${r.ai && r.ai.diem != null ? `<div class="small muted">🤖 AI gợi ý ${noiSo(r.ai.diem)}/10${r.sao == null ? " · <b>chờ cô duyệt</b>" : ""}</div>` : ""}</div>
        ${r.da_xoa ? '<span class="badge" title="Đã tải về máy trung tâm và xoá trên mạng">💾 Đã tải về máy</span>' : ""}
        <button class="btn btn-sm ${r.sao != null ? "" : "btn-primary"}" data-act="noiMo" data-id="${r.id}">${r.sao != null ? "Sửa điểm" : "▶ Xem & chấm"}</button></div>`).join("")
      || `<div class="empty">${loc === "cho" ? "Không còn bài nào chờ chấm 🎉" : "Chưa có bài."}</div>`}
      <p class="small muted">Video lưu riêng tư: chỉ cô xem được (mỗi lần mở một đường dẫn tạm 10 phút). Bài nói không tính vào điểm trắc nghiệm; điểm + nhận xét của cô hiện cho học sinh, phụ huynh và trong hồ sơ.</p>`;
  };
  ACT.noiLoc = (el) => { loc = el.dataset.k; ve(); };
  let url = null;
  const boUrl = () => { if (url) { URL.revokeObjectURL(url); url = null; } };
  cleanup = () => { boUrl(); closeSheet(); };
  ACT.noiMo = async (b) => {
    const r = d.rows.find((x) => x.id === +b.dataset.id), t = d.ds[r.so] || {};
    let sao = r.sao != null ? Number(r.sao) : null;
    openSheet(`<h2 style="margin:0">${esc(r.ho_ten)} — Bài nói ${r.so + 1}</h2>
      <p class="small muted" style="margin:2px 0 8px">${esc(NOI_MUC[t.muc_noi] || "")}${t.van_ban_mau ? " · mẫu: «" + esc(t.van_ban_mau.slice(0, 120)) + "»" : t.goi_y ? " · " + esc(t.goi_y) : ""}</p>
      <div id="noiPhat" class="noi-khung">${r.da_xoa ? '<div class="alert">💾 Video đã tải về máy trung tâm và xoá trên mạng. Cô vẫn chấm được.</div>' : spinner()}</div>
      ${r.ai ? noiAiHtml(r.ai, r.sao != null) : ""}
      <div class="field" style="margin-top:10px"><label class="f">Điểm (0–10, mỗi bậc 0,5)</label><div class="noi-chon-sao"><span id="noiSao"></span><input class="input" id="noiDiem" type="number" inputmode="decimal" min="0" max="10" step="0.5" data-in="noiDiem" value="${sao === null ? "" : sao}" aria-label="Điểm"></div></div>
      <div class="field"><label class="f">Nhận xét cho bé <span class="faint">(bé và phụ huynh thấy)</span></label><textarea class="input" rows="2" id="noiNx" maxlength="1000">${esc(r.nhan_xet || "")}</textarea></div>
      <div class="row" style="gap:8px;flex-wrap:nowrap"><button type="button" class="btn grow" data-act="closeSheet">Đóng</button><button type="button" class="btn btn-primary grow" data-act="noiLuu">💾 Lưu</button></div>`);
    const veSao = () => { document.getElementById("noiSao").innerHTML = Array.from({ length: 10 }, (_, k) => `<button type="button" class="${sao !== null && k < Math.floor(sao) ? "on" : ""}" data-act="noiChonSao" data-n="${k + 1}" aria-label="${k + 1} điểm">★</button>`).join(""); };
    const datDiem = (n) => { sao = n; document.getElementById("noiDiem").value = n === null ? "" : n; veSao(); };
    ACT.noiChonSao = (x) => datDiem(+x.dataset.n);
    ACT["in:noiDiem"] = (el) => { sao = el.value === "" ? null : Number(el.value); veSao(); };
    ACT.noiDungAi = () => { if (r.ai.diem != null) datDiem(Number(r.ai.diem)); if (r.ai.nhan_xet) document.getElementById("noiNx").value = r.ai.nhan_xet; toast("Đã điền sẵn. Cô sửa nếu cần rồi bấm Lưu."); };
    veSao();
    ACT.noiDuyetAi = (btn) => busy(btn, async () => {
      try {
        const kq = await api("t_cham_noi", { p_id: r.id, p_sao: r.ai.diem, p_nhan_xet: r.ai.nhan_xet || "" });
        if (kq.error) throw new Error(kq.error);
        r.sao = Number(r.ai.diem); r.nhan_xet = r.ai.nhan_xet || null; boUrl(); closeSheet(); toast("Đã duyệt"); ve();
      } catch (e) { toast(e.message, 4000); }
    });
    ACT.noiLuu = (btn) => busy(btn, async () => {
      if (sao === null || !(sao >= 0 && sao <= 10) || sao * 2 !== Math.trunc(sao * 2)) { toast("Cô nhập điểm từ 0 đến 10, mỗi bậc 0,5 nhé."); return; }
      try {
        const nx = document.getElementById("noiNx").value;
        const kq = await api("t_cham_noi", { p_id: r.id, p_sao: sao, p_nhan_xet: nx });
        if (kq.error) throw new Error(kq.error);
        r.sao = sao; r.nhan_xet = nx.trim() || null; boUrl(); closeSheet(); toast("Đã chấm"); ve();
      } catch (e) { toast(e.message, 4000); }
    });
    if (r.da_xoa) return;
    try {
      const v = await api("t_xem_video", { p_id: r.id });
      if (v.error) throw new Error(v.error);
      const tai = await client().storage.from("video_noi").download(v.duong_dan);
      if (tai.error) throw new Error("Không tải được video: " + tai.error.message);
      boUrl(); url = URL.createObjectURL(tai.data);
      const o = document.getElementById("noiPhat"); if (!o) return;
      o.innerHTML = /^audio\//.test(v.mime || "") ? `<audio controls autoplay src="${url}" style="width:100%"></audio>` : `<video controls autoplay playsinline src="${url}"></video>`;
    } catch (e) { const o = document.getElementById("noiPhat"); if (o) o.innerHTML = errBox(e); }
  };
  ve();
}
