/* Trinh soan «Bai tieu hoc» (giao vien) — chi tai khi mo #/t/qth/... (28/10/2026; mo rong lop 2 theo tap huan Bo).
 * Dinh dang cau: muc 19 CO_SO_DU_LIEU_HOC_SINH.md (loai, anh, anh_lc, doan_van, doc_lenh, muc, ky_nang, chang, nhom, o_chu, loi_nghe, nghe_doan).
 * Moi the = 1 cau, rieng «Noi cau - tranh» (ghep) = 1 the cho ca nhom cap (luu thanh moi cap 1 cau cung «nhom»).
 * Anh nen ngay tren trinh duyet (webp, canh dai ≤ 1000 px, ≤ 500 KB) roi tai len kho anh_de bang ve 15 phut.
 */
"use strict";

const TH_LOAI = {
  hinh: "🖼 Nhìn hình chọn đáp án", dien: "📝 Điền vào đoạn văn", nghe: "🎧 Nghe chọn đáp án", chon: "🔤 Chọn đáp án thường",
  nghe_chu: "🔡 Nghe âm → chạm chữ cái", dung_sai: "✅ Đúng / Sai với tranh", ghep: "🔗 Nối câu với tranh", dien_chu: "✏️ Điền chữ cái thiếu",
  noi: "🎤 Nói (quay video)",
};
const TH_LENH = {
  hinh: "Nhìn hình và chọn đáp án đúng.", dien: "Đọc đoạn văn và chọn từ đúng điền vào chỗ trống.",
  nghe: "Nghe và chọn đáp án đúng.", chon: "Chọn đáp án đúng.", nghe_chu: "Nghe và chạm vào chữ cái đúng.",
  dung_sai: "Nhìn tranh rồi chọn Đúng ✓ hoặc Sai ✗.", ghep: "Đọc câu và nối với tranh đúng.", dien_chu: "Chạm chữ cái để điền vào chỗ trống.",
  noi: "Bấm 🔴 rồi nói to, rõ theo gợi ý.",
};
const TH_KN = { hinh: "doc", dien: "doc", nghe: "nghe", chon: "doc", nghe_chu: "nghe", dung_sai: "doc", ghep: "doc", dien_chu: "viet", noi: "noi" };
// Bai noi (muc 22): khong co lua chon, luu rieng (bai_noi), co cham sao
const TH_MUC_NOI = { chu: "Chữ cái", tu: "Từ theo tranh", cau: "Câu theo tranh", doan: "Đọc đoạn văn", hoi_thoai: "Hội thoại", chant: "Chant", bai_hat: "Bài hát", hoi_dap: "Đối đáp (hỏi – trả lời)" };
const TH_CHU_CHAY = { cham: "🐢 Chữ chạy chậm", vua: "🚶 Chữ chạy vừa", nhanh: "🐇 Chữ chạy nhanh", tat: "Không chạy chữ" };
const TH_NOI_CHAY = ["doan", "hoi_thoai", "chant", "bai_hat"];
const TH_MUC = { "": "— Mức —", nhan_biet: "Nhận biết", thong_hieu: "Thông hiểu", van_dung: "Vận dụng" };
const TH_KYN = { "": "— Kỹ năng —", nghe: "Nghe", noi: "Nói", doc: "Đọc", viet: "Viết" };
const TH_CO_NGHE = ["nghe", "nghe_chu", "dung_sai"];
const thCauMacDinh = (q, so) => ({
  hinh: "Look and choose.", nghe: "Listen and choose.", dien: `Chọn từ điền vào chỗ (${so}).`, nghe_chu: "Listen and tap the letter.",
  dung_sai: "Is it right?",
}[q.loai] || "Choose the correct answer.");

// Nen anh: thu webp (Safari cu khong ho tro -> jpg), nho dan toi khi ≤ 500 KB
async function thNenAnh(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, loi) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => loi(new Error("Không đọc được ảnh này. Cô chọn ảnh jpg, png hoặc webp nhé."));
      i.src = url;
    });
    for (const [max, cl] of [[1000, 0.82], [800, 0.75], [640, 0.7], [480, 0.62]]) {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * r)); c.height = Math.max(1, Math.round(img.naturalHeight * r));
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      let b = await new Promise((ok) => c.toBlob(ok, "image/webp", cl));
      if (!b || b.type !== "image/webp") b = await new Promise((ok) => c.toBlob(ok, "image/jpeg", cl + 0.05));
      if (b && b.size <= 500000) return b;
    }
    throw new Error("Ảnh quá lớn, nén không xuống được 500 KB. Cô cắt bớt ảnh rồi thử lại.");
  } finally { URL.revokeObjectURL(url); }
}
async function thTaiAnh(file) {
  const b = await thNenAnh(file);
  const v = await api("t_tao_ve_anh", { p_mime: b.type, p_kich_thuoc: b.size });
  const up = await client().storage.from("anh_de").upload(v.duong_dan, await b.arrayBuffer(), { contentType: b.type, upsert: false });
  if (up.error) throw new Error("Tải ảnh lên không được: " + up.error.message);
  return v.duong_dan;
}

// Cau tu may chu -> the soan (gom cac cau «ghep» cung nhom thanh 1 the)
function thVaoThe(qs) {
  const ds = [];
  qs.forEach((x) => {
    if (x.loai === "noi") { ds.push(Object.assign({ goi_y: "", van_ban_mau: "", gioi_han_giay: 60, ghi: "video", anh: null }, x)); return; }
    const q = Object.assign({ loai: "chon" }, x, { anh_lc: x.options.map((_, j) => (x.anh_lc || [])[j] || null) });
    if (q.loai === "ghep") {
      const truoc = ds[ds.length - 1], cap = { cau: q.question, anh: q.anh_lc[q.correct] || null, stt: q.stt };
      if (truoc && truoc.loai === "ghep" && truoc.nhom === q.nhom) { truoc.cap.push(cap); truoc.tranh = q.anh_lc; return; }
      ds.push(Object.assign(q, { cap: [cap], tranh: q.anh_lc }));
      return;
    }
    if (q.loai === "dien_chu") {
      q.dap_an_chu = q.options[0] || "";
      const con = (q.o_chu || []).slice();  // chu gay nhieu = o_chu tru cac chu cua dap an
      for (const c of q.dap_an_chu) { const j = con.indexOf(c); if (j >= 0) con.splice(j, 1); }
      q.chu_nhieu = con.join(" ");
    }
    if (q.nghe_doan) q.nghe_doan = Object.assign({}, q.nghe_doan);
    ds.push(q);
  });
  // tranh nhieu cua the ghep = tranh khong thuoc cap nao
  ds.forEach((q) => { if (q.loai === "ghep") q.tranh_them = (q.tranh || []).filter((a) => a && !q.cap.some((c) => c.anh === a)); });
  return ds;
}

// nh: che do «Kho cau hoi» — {id: muc kho | null (them moi), khoi, unit, bo_sach, ten_unit}; luu bang t_ngan_hang_luu (moi the = 1 muc)
async function tEditorTH(id, nh) {
  app.innerHTML = tShell("quizzes", spinner());
  ACT.retry = () => route();
  const E = { id, title: "", qs: [], am_thanh: [], i_can: "", dirty: false };
  if (nh && nh.id) {
    try {
      const it = await api("t_ngan_hang_mot", { p_id: nh.id });
      if (!it) throw new Error("Không tìm thấy câu trong kho.");
      Object.assign(nh, { khoi: it.khoi, unit: it.unit, bo_sach: it.bo_sach || "", ten_unit: it.ten_unit || "", nguon: it.nguon, loi: it.loi });
      E.qs = thVaoThe(it.cau); E.am_thanh = it.am_thanh || [];
    } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/nh"); return; }
  } else if (id) {
    try {
      const q = await api("t_get_quiz", { p_id: id });
      if (!q) throw new Error("Không tìm thấy đề.");
      E.title = q.title; E.am_thanh = q.am_thanh || []; E.i_can = (q.i_can || []).join("\n"); E.khoi = q.khoi;
      E.qs = thVaoThe(q.questions.concat(q.bai_noi || []));
    } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/quizzes"); return; }
  }
  leaveGuard = () => !E.dirty || confirm("Đề chưa lưu. Rời trang và bỏ các thay đổi?");
  const onUnload = (e) => { if (E.dirty) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", onUnload);
  cleanup = () => { window.removeEventListener("beforeunload", onUnload); thDungDoc(); };
  thGanNut();
  const mark = () => { E.dirty = true; };
  // so cau (the ghep chiem nhieu cau); de tu may cham co stt thi theo stt
  const soCau = (i) => { const q = E.qs[i]; if (q.stt) return q.stt; let n = 1; for (let k = 0; k < i; k++) n += E.qs[k].loai === "ghep" ? E.qs[k].cap.length : E.qs[k].loai === "noi" ? 0 : 1; return n; };
  const soNoi = (i) => E.qs.slice(0, i).filter((q) => q.loai === "noi").length + 1;   // bai noi danh so rieng
  const nhanCau = (i) => { const q = E.qs[i], a = soCau(i); return q.loai === "noi" ? `🎤 Bài nói ${soNoi(i)}` : q.loai === "ghep" && q.cap.length > 1 ? `Câu ${a}–${a + q.cap.length - 1}` : `Câu ${a}`; };
  // the i dung chung doan van voi the truoc (cung dang «dien», cung noi dung)
  const chungTruoc = (i) => i > 0 && E.qs[i].loai === "dien" && E.qs[i - 1].loai === "dien" && E.qs[i].doan_van && E.qs[i].doan_van === E.qs[i - 1].doan_van;
  const dauNhom = (i) => { while (chungTruoc(i)) i--; return i; };
  const anhNut = (dd, act, i, j, to) => dd
    ? `<img src="${esc(urlAnh(dd))}" alt=""><button type="button" class="${to ? "btn btn-sm btn-ghost" : "icon-btn"}" data-act="anhXoa" data-k="${act}" data-i="${i}" data-j="${j}" title="Bỏ ảnh">✕${to ? " Bỏ ảnh" : ""}</button>`
    : `<button type="button" class="${to ? "btn btn-sm" : "icon-btn"}" data-act="anhChon" data-k="${act}" data-i="${i}" data-j="${j}" title="Chọn ảnh">📷${to ? " Chọn ảnh" : ""}</button>`;
  const ngheCau = (i) => E.am_thanh.filter((f) => f.tu == null || (soCau(i) >= f.tu && soCau(i) <= f.den));
  const chon = (ten, i, ds, gt) => `<select class="input" data-ch="${ten}" data-i="${i}" style="width:auto">${Object.entries(ds).map(([k, t]) => `<option value="${k}" ${String(gt ?? "") === k ? "selected" : ""}>${t}</option>`).join("")}</select>`;

  // cau bat buoc co am thanh: ky nang Nghe (chua chon ky nang thi theo dang)
  const canNghe = (q) => (q.ky_nang || TH_KN[q.loai]) === "nghe";
  // --- cac phan cua the
  const phanAmThanh = (q, i) => {
    const nd = q.nghe_doan || {}, coDoan = nd.tep && E.am_thanh.some((f) => f.ten === nd.tep), coFile = ngheCau(i).length > 0;
    const nguon = coDoan ? `🎧 đoạn ${nd.tu_giay}–${nd.den_giay} giây của «${esc(nd.tep)}»` : coFile ? "🎧 " + ngheCau(i).map((f) => esc(f.ten)).join(", ")
      : q.loi_nghe ? "🤖 máy đọc (tạm, khi chưa có file)" : canNghe(q) ? `<span style="color:var(--bad)">chưa có — thêm file nghe hoặc chữ cho máy đọc</span>` : '<span class="faint">không cần (câu không phải kỹ năng Nghe)</span>';
    return `<details class="box" style="margin:8px 0" ${coDoan || q.loi_nghe || !canNghe(q) ? "" : "open"}><summary>🎧 Âm thanh của câu: ${nguon}</summary>
      <div class="small muted" style="margin:6px 0">Cách 1 — file nghe của đề (nút 🎧 File nghe): cả file theo «từ câu – đến câu», hoặc chỉ <b>một đoạn</b>:</div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><select class="input" data-ch="ndTep" data-i="${i}" style="width:auto"><option value="">— không dùng đoạn —</option>${E.am_thanh.map((f) => `<option ${f.ten === nd.tep ? "selected" : ""}>${esc(f.ten)}</option>`).join("")}</select>
        <label class="small">từ giây <input class="input" type="number" min="0" step="0.5" data-in="nd" data-f="tu_giay" data-i="${i}" value="${nd.tu_giay ?? ""}" style="width:90px"></label>
        <label class="small">đến giây <input class="input" type="number" min="0" step="0.5" data-in="nd" data-f="den_giay" data-i="${i}" value="${nd.den_giay ?? ""}" style="width:90px"></label>
        <label class="small">nghe tối đa <input class="input" type="number" min="0" max="20" data-in="nd" data-f="so_lan" data-i="${i}" value="${nd.so_lan ?? ""}" placeholder="∞" style="width:70px"> lần</label></div>
      <div class="small muted" style="margin:8px 0 4px">Cách 2 — chưa có file: máy đọc tiếng Anh câu này (giọng máy, tạm thời):</div>
      <input class="input" data-in="qf" data-f="loi_nghe" data-i="${i}" value="${esc(q.loi_nghe || "")}" placeholder="vd: b. b. ball  /  It is a cat."></details>`;
  };
  const phanLuaChon = (q, i) => `<label class="f">Các lựa chọn — bấm ◉ để chọn đáp án đúng${q.loai === "nghe_chu" ? " (mỗi ô 1 chữ cái, vd b / d / p)" : ". Lựa chọn là hình thì chữ có thể bỏ trống"}.</label>
    ${q.options.map((o, j) => `<div class="th-lc"><input type="radio" name="c${i}" data-ch="cor" data-i="${i}" data-j="${j}" ${q.correct === j ? "checked" : ""} aria-label="Đáp án đúng ${LETTERS[j]}">
      <span class="L"><b>${LETTERS[j]}</b></span><input class="input" data-in="qo" data-i="${i}" data-j="${j}" value="${esc(o)}" placeholder="${q.anh_lc[j] ? "(chỉ có hình)" : "chữ của lựa chọn"}">
      <span class="th-anh-o" style="margin:0">${anhNut(q.anh_lc[j], "lc", i, j)}</span>
      <button type="button" class="icon-btn" data-act="odel" data-i="${i}" data-j="${j}" title="Xoá lựa chọn" ${q.options.length <= 2 ? "disabled" : ""}>🗑</button></div>`).join("")}
    ${q.options.length < 6 ? `<button type="button" class="btn btn-sm" data-act="oadd" data-i="${i}">+ Thêm lựa chọn</button>` : ""}`;
  const phanRieng = (q, i) => {
    if (q.loai === "dung_sai") {
      return `<div class="field"><label class="f">Câu (bé đọc hoặc nghe) <span class="faint">(bỏ trống = «${esc(thCauMacDinh(q))}»)</span></label><textarea class="input" rows="2" data-in="qf" data-i="${i}" data-f="question">${esc(q.question || "")}</textarea></div>
        <div class="row" style="gap:16px"><b>Đáp án:</b><label class="check"><input type="radio" name="c${i}" data-ch="cor" data-i="${i}" data-j="0" ${q.correct === 0 ? "checked" : ""}> ✓ Đúng</label>
          <label class="check"><input type="radio" name="c${i}" data-ch="cor" data-i="${i}" data-j="1" ${q.correct === 1 ? "checked" : ""}> ✗ Sai</label></div>`;
    }
    if (q.loai === "dien_chu") {
      return `<div class="field"><label class="f">Câu có chỗ thiếu — mỗi chữ thiếu là 1 dấu <b>_</b> <span class="faint">(vd: The p _ _ _ _ is yummy.)</span></label><input class="input" data-in="qf" data-i="${i}" data-f="question" value="${esc(q.question || "")}"></div>
        <div class="grid2"><div class="field"><label class="f">Các chữ cần điền (theo thứ tự)</label><input class="input" data-in="qf" data-i="${i}" data-f="dap_an_chu" value="${esc(q.dap_an_chu || "")}" placeholder="izza"></div>
          <div class="field"><label class="f">Chữ cái gây nhiễu thêm <span class="faint">(không bắt buộc)</span></label><input class="input" data-in="qf" data-i="${i}" data-f="chu_nhieu" value="${esc(q.chu_nhieu || "")}" placeholder="e o"></div></div>`;
    }
    if (q.loai === "ghep") {
      return `<label class="f">Các cặp câu – tranh (2–6 cặp). Học sinh thấy tranh đã xáo trộn.</label>
        ${q.cap.map((c, j) => `<div class="th-lc" style="grid-template-columns:auto 1fr auto auto"><span class="ghep-so">${j + 1}</span>
          <input class="input" data-in="cap" data-i="${i}" data-j="${j}" value="${esc(c.cau || "")}" placeholder="vd: This is a cat.">
          <span class="th-anh-o" style="margin:0">${anhNut(c.anh, "cap", i, j)}</span>
          <button type="button" class="icon-btn" data-act="capXoa" data-i="${i}" data-j="${j}" ${q.cap.length <= 2 ? "disabled" : ""} title="Xoá cặp">🗑</button></div>`).join("")}
        ${q.cap.length < 6 ? `<button type="button" class="btn btn-sm" data-act="capThem" data-i="${i}">+ Thêm cặp</button>` : ""}
        <div class="small" style="margin-top:8px">Tranh nhiễu (không khớp câu nào): ${(q.tranh_them || []).map((a, j) => `<span class="th-anh-o" style="display:inline-flex">${anhNut(a, "nhieu", i, j)}</span>`).join("")}
          ${(q.tranh_them || []).length < 2 ? anhNut(null, "nhieu", i, (q.tranh_them || []).length) : ""}</div>`;
    }
    return `<div class="field"><label class="f">Câu hỏi <span class="faint">(bỏ trống = «${esc(thCauMacDinh(q, soCau(i)))}»; dùng &lt;b&gt; &lt;u&gt; &lt;i&gt;)</span></label><textarea class="input" rows="2" data-in="qf" data-i="${i}" data-f="question">${esc(q.question || "")}</textarea></div>
      ${phanLuaChon(q, i)}`;
  };
  // The bai noi: tranh / goi y / van ban mau / gioi han giay / quay video hay chi ghi am
  const noiCard = (q, i) => `<div class="card qedit" id="q${i}" style="border-left:5px solid var(--warn)">
    <div class="row between"><b>${nhanCau(i)}</b><div class="row" style="gap:2px">
      <button type="button" class="btn btn-sm" data-act="xem" data-i="${i}" title="Xem thử như học sinh">👀 Xem thử</button>
      <button type="button" class="icon-btn" data-act="up" data-i="${i}" title="Lên" ${i === 0 ? "disabled" : ""}>↑</button>
      <button type="button" class="icon-btn" data-act="down" data-i="${i}" title="Xuống" ${i === E.qs.length - 1 ? "disabled" : ""}>↓</button>
      <button type="button" class="icon-btn" data-act="qdel" data-i="${i}" title="Xoá" style="color:var(--bad)">🗑</button></div></div>
    <div class="small muted" style="margin:4px 0 8px">Học sinh làm sau phần trắc nghiệm: bấm 🔴 quay, xem lại, quay lại, «Hoàn thành». <b>Không tính vào điểm tự chấm</b> — cô chấm 1–10 sao + nhận xét.</div>
    <div class="field"><label class="f">Dạng câu</label><select class="input" data-ch="loai" data-i="${i}">${Object.entries(TH_LOAI).map(([k, t]) => `<option value="${k}" ${q.loai === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${chon("muc_noi", i, TH_MUC_NOI, q.muc_noi)}${chon("muc", i, TH_MUC, q.muc)}${chon("chang", i, { "": "— Chặng —", 1: "Chặng 1", 2: "Chặng 2", 3: "Chặng 3", 4: "Chặng 4" }, q.chang)}
      ${chon("ghi", i, { video: "📹 Quay video", am_thanh: "🎙 Chỉ ghi âm" }, q.ghi)}
      <label class="small">tối đa <input class="input" type="number" min="10" max="120" step="5" data-in="qf" data-f="gioi_han_giay" data-i="${i}" value="${q.gioi_han_giay || 60}" style="width:80px"> giây</label></div>
    <div class="field"><label class="f">Lệnh <span class="faint">(bé bấm 🔊 để nghe)</span></label><input class="input" data-in="qf" data-i="${i}" data-f="instruction" value="${esc(q.instruction || "")}" placeholder="${esc(TH_LENH.noi)}"></div>
    <div class="field"><label class="f">Tranh <span class="faint">(nói theo tranh — không bắt buộc)</span></label><div class="th-anh-o">${anhNut(q.anh, "de", i, -1, true)}</div></div>
    ${q.muc_noi === "hoi_dap" ? luotHtml(q, i) : `<div class="field"><label class="f">Gợi ý hiện cho bé <span class="faint">(tiếng Việt hoặc Anh, vd: Nói tên con vật)</span></label><input class="input" data-in="qf" data-i="${i}" data-f="goi_y" value="${esc(q.goi_y || "")}"></div>
    <div class="field"><label class="f">Câu / đoạn mẫu <span class="faint">(bé đọc theo; nút 🔊 đọc mẫu bằng giọng máy)</span></label><textarea class="input" rows="3" data-in="qf" data-i="${i}" data-f="van_ban_mau" placeholder="vd: It's a cat.  /  A, a, apple. B, b, ball.">${esc(q.van_ban_mau || "")}</textarea></div>
    ${TH_NOI_CHAY.includes(q.muc_noi) ? `<div class="row small" style="gap:6px">Khi quay, đoạn mẫu ${chon("chu_chay", i, TH_CHU_CHAY, q.chu_chay || "cham")} <span class="muted">(tô sáng từng từ cho bé đọc theo; bé tự đổi tốc độ được)</span></div>` : ""}`}
  </div>`;
  // Doi dap: danh sach luot hoi -> goi y tra loi
  const luotHtml = (q, i) => {
    const ds = q.luot && q.luot.length ? q.luot : (q.luot = [{ hoi: "", tra_loi_goi_y: "" }]);
    return `<label class="f">Các lượt hỏi – đáp <span class="faint">(máy đọc câu hỏi, hiện gợi ý, bé trả lời — tất cả trong một video)</span></label>
      ${ds.map((l, j) => `<div class="th-lc" style="grid-template-columns:auto 1fr 1fr auto"><span class="ghep-so">${j + 1}</span>
        <input class="input" data-in="luot" data-i="${i}" data-j="${j}" data-f="hoi" value="${esc(l.hoi || "")}" placeholder="Hỏi: Is she flying a kite?">
        <input class="input" data-in="luot" data-i="${i}" data-j="${j}" data-f="tra_loi_goi_y" value="${esc(l.tra_loi_goi_y || "")}" placeholder="Gợi ý: Yes, she is.">
        <button type="button" class="icon-btn" data-act="luotXoa" data-i="${i}" data-j="${j}" ${ds.length <= 1 ? "disabled" : ""} title="Xoá lượt">🗑</button></div>`).join("")}
      ${ds.length < 12 ? `<button type="button" class="btn btn-sm" data-act="luotThem" data-i="${i}">+ Thêm lượt</button>` : ""}
      <div class="row small" style="gap:10px;margin-top:8px"><label class="check"><input type="checkbox" data-ch="an_goi_y" data-i="${i}" ${q.an_goi_y ? "checked" : ""}> Ẩn gợi ý (mức khó)</label>
        ${chon("tu_chuyen_giay", i, { "": "Bé bấm «Tiếp»", 5: "Tự sang sau 5 giây", 8: "Tự sang sau 8 giây", 12: "Tự sang sau 12 giây" }, q.tu_chuyen_giay || "")}</div>
      <p class="small muted" style="margin:6px 0 0">Nhớ đặt «tối đa … giây» ở trên đủ cho mọi lượt (khoảng 15 giây / lượt).</p>`;
  };
  const qCard = (q, i) => q.loai === "noi" ? noiCard(q, i) : `<div class="card qedit" id="q${i}">
    <div class="row between"><b>${nhanCau(i)}</b><div class="row" style="gap:2px">
      <button type="button" class="btn btn-sm" data-act="xem" data-i="${i}" title="Xem thử như học sinh">👀 Xem thử</button>
      <button type="button" class="icon-btn" data-act="up" data-i="${i}" title="Lên" ${i === 0 ? "disabled" : ""}>↑</button>
      <button type="button" class="icon-btn" data-act="down" data-i="${i}" title="Xuống" ${i === E.qs.length - 1 ? "disabled" : ""}>↓</button>
      <button type="button" class="icon-btn" data-act="qdel" data-i="${i}" title="Xoá câu" style="color:var(--bad)">🗑</button></div></div>
    <div class="field"><label class="f">Dạng câu</label><select class="input" data-ch="loai" data-i="${i}">${Object.entries(TH_LOAI).map(([k, t]) => `<option value="${k}" ${q.loai === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${chon("muc", i, TH_MUC, q.muc)}${chon("ky_nang", i, TH_KYN, q.ky_nang)}${chon("chang", i, { "": "— Chặng —", 1: "Chặng 1", 2: "Chặng 2", 3: "Chặng 3", 4: "Chặng 4" }, q.chang)}</div>
    <div class="field"><label class="f">Lệnh của đề <span class="faint">(học sinh bấm 🔊 để nghe đọc)</span></label><input class="input" data-in="qf" data-i="${i}" data-f="instruction" value="${esc(q.instruction || "")}" placeholder="${esc(TH_LENH[q.loai] || "")}"></div>
    ${q.loai === "dien" ? (chungTruoc(i)
      ? `<div class="alert alert-ok small">↑ Dùng chung đoạn văn với ${nhanCau(dauNhom(i))}. <button type="button" class="btn btn-sm" data-act="tachDoan" data-i="${i}">✂ Đoạn văn riêng</button></div>`
      : `<div class="field"><label class="f">Đoạn văn <span class="faint">(đánh số chỗ trống bằng số câu: (${soCau(i)}) ____ ; các câu sau cùng dạng «Điền» tự dùng chung đoạn này)</span></label><textarea class="input" rows="4" data-in="doan" data-i="${i}">${esc(q.doan_van || "")}</textarea></div>`) : ""}
    ${TH_CO_NGHE.includes(q.loai) ? phanAmThanh(q, i) : ""}
    ${q.loai === "ghep" ? "" : `<div class="field"><label class="f">${q.loai === "dung_sai" ? "Tranh (bắt buộc)" : "Ảnh đề " + (q.loai === "hinh" ? "(bắt buộc)" : "(không bắt buộc)")}</label><div class="th-anh-o">${anhNut(q.anh, "de", i, -1, true)}</div></div>`}
    ${phanRieng(q, i)}
    <details class="box" style="margin-top:10px"><summary>🔊 Chữ cho nút đọc lệnh (không bắt buộc)</summary>
      <input class="input" data-in="qf" data-i="${i}" data-f="doc_lenh" value="${esc(q.doc_lenh || "")}" placeholder="Bỏ trống = đọc lệnh + câu hỏi" style="margin-top:6px"></details>
    <div class="field" style="margin-top:10px"><label class="f">Giải thích (học sinh thấy khi xem lại)</label><textarea class="input" rows="2" data-in="qf" data-i="${i}" data-f="explanation">${esc(q.explanation || "")}</textarea></div>
  </div>`;

  const soCauTong = () => E.qs.reduce((n, q) => n + (q.loai === "ghep" ? q.cap.length : 1), 0);
  const drawList = () => {
    document.getElementById("qlist").innerHTML = E.qs.map(qCard).join("") || '<div class="empty">Chưa có câu hỏi. Bấm một nút «+ …» ở dưới để thêm câu.</div>';
    document.getElementById("qcount").textContent = soCauTong();
  };
  const drawCard = (i) => { const el = document.getElementById("q" + i); if (el) el.outerHTML = qCard(E.qs[i], i); };
  const veNh = nh ? `#/t/nh?khoi=${nh.khoi}&unit=${encodeURIComponent(nh.unit || "")}&bo=${encodeURIComponent(nh.bo_sach || "")}` : "";
  app.querySelector("main").innerHTML = (nh ? `<a href="${veNh}" class="small">‹ Kho câu hỏi</a>
    <h1 style="margin-top:8px">📚 ${nh.id ? "Sửa câu trong kho" : "Thêm câu của cô vào kho"}</h1>
    <div style="max-width:820px">
    <p class="small muted">Khối ${esc(nh.khoi)} · Unit ${esc(nh.unit)}${nh.ten_unit ? " – " + esc(nh.ten_unit) : ""}${nh.bo_sach ? " · " + esc(nh.bo_sach) : ""}. Mỗi thẻ dưới đây là 1 câu trong kho (thẻ nối câu – tranh là cả nhóm cặp).${nh.id && nh.nguon !== "co" ? " Câu từ sách: sau khi cô sửa, phần mềm Chấm điểm đẩy lại sẽ <b>giữ bản của cô</b>." : ""} Âm thanh: dùng ô «máy đọc» (file nghe của kho do phần mềm Chấm điểm đẩy lên).</p>
    ${nh.loi ? '<div class="alert alert-warn small">🎲 Đây là câu «lõi»: mỗi lần tạo bài web tự chọn đáp án sai khác nhau. Các lựa chọn dưới đây là <b>một lần rút</b>; nếu cô lưu, câu sẽ <b>cố định</b> đúng các lựa chọn này.</div>' : ""}
    <div class="row between" style="margin:18px 0 8px"><h2 style="margin:0"><span id="qcount">0</span> câu hỏi</h2></div>` : `<a href="#/t/quizzes" class="small">‹ Kho đề</a>
    <h1 style="margin-top:8px">🧒 ${id ? "Sửa đề tiểu học" : "Soạn đề tiểu học"}</h1>
    <div style="max-width:820px">
    <p class="small muted">Học sinh làm trên điện thoại: chữ to, hình to, nút 🔊 đọc đề, chia chặng có pháo hoa, kết quả bằng sao. Chấm tự động, % đạt và giải thích từng câu như bài thường. Ảnh được nén nhỏ trước khi tải lên.</p>
    <div class="field"><label class="f">Tên đề</label><input class="input" id="title" data-in="title" value="${esc(E.title)}" placeholder="Ví dụ: Unit 2 – Lớp 3 – My family"></div>
    ${khoiDeHtml(E.khoi)}
    <div class="row between" style="margin:18px 0 8px"><h2 style="margin:0"><span id="qcount">0</span> câu hỏi</h2>
      <div class="row" style="gap:6px"><button type="button" class="btn btn-sm btn-gold" data-act="xemCa">👀 Xem thử cả bài như học sinh</button>
      <button type="button" class="btn btn-sm" data-act="nghe">🎧 File nghe của đề${E.am_thanh.length ? " (" + E.am_thanh.length + ")" : ""}</button></div></div>`) + `
    <div id="msg"></div>
    <div id="qlist"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">${Object.entries(TH_LOAI).map(([k, t]) => `<button type="button" class="btn" data-act="qadd" data-loai="${k}">+ ${t}</button>`).join("")}</div>
    ${nh ? "" : `<div class="field" style="margin-top:16px"><label class="f">🌈 Phiếu «I can…» cuối bài — mỗi dòng 1 mục tiêu <span class="faint">(bé chạm mặt cười tự đánh giá; không tính điểm; bỏ trống = không có phiếu)</span></label>
      <textarea class="input" rows="3" id="ican" data-in="ican" placeholder="I can say the letters a, b, c.&#10;I can read the words cat, dog.">${esc(E.i_can)}</textarea></div>`}
    <input type="file" id="thFile" accept="image/*" data-ch="thFile" hidden>
    <div class="savebar row" style="margin-top:16px;flex-wrap:nowrap"><button type="button" class="btn btn-primary btn-lg grow" data-act="save">💾 Lưu đề</button>
      ${nh ? "" : '<button type="button" class="btn btn-lg" data-act="saveassign">Lưu &amp; giao bài</button>'}</div>
    <p class="small muted" id="kho" style="margin-top:14px"></p>
    </div>`;
  drawList();
  const veKho = async () => {
    try {
      const k = await api("t_dung_luong_kho");
      document.getElementById("kho").innerHTML = `Kho ảnh + âm thanh: <b>${(k.dung / 1048576).toFixed(1)} MB</b> / ${Math.round(k.toi_da / 1048576)} MB (gói miễn phí) · ${k.anh} ảnh
        · <button type="button" class="btn btn-sm btn-ghost" data-act="donAnh">🧹 Dọn ảnh không còn dùng</button>`;
    } catch (e) { /* khong quan trong */ }
  };
  veKho();

  // --- anh: 1 o chon file dung chung; nho cho dang chon (loai cho: de | lc | cap | nhieu, the i, vi tri j)
  let dich = null;
  const datAnh = (k, i, j, dd) => {
    const q = E.qs[i];
    if (k === "de") q.anh = dd;
    else if (k === "lc") q.anh_lc[j] = dd;
    else if (k === "cap") q.cap[j].anh = dd;
    else if (k === "nhieu") { q.tranh_them = q.tranh_them || []; if (dd) q.tranh_them[j] = dd; else q.tranh_them.splice(j, 1); }
  };
  ACT.anhChon = (el) => { dich = { k: el.dataset.k, i: +el.dataset.i, j: +el.dataset.j, btn: el }; const f = document.getElementById("thFile"); f.value = ""; f.click(); };
  ACT["ch:thFile"] = async (el) => {
    const file = el.files[0], d = dich; dich = null;
    if (!file || !d) return;
    d.btn.disabled = true; d.btn.textContent = "⏳";
    try {
      datAnh(d.k, d.i, d.j, await thTaiAnh(file));
      mark(); drawCard(d.i); toast("Đã thêm ảnh"); veKho();
    } catch (e) { toast(e.message, 5000); drawCard(d.i); }
  };
  ACT.anhXoa = (el) => { datAnh(el.dataset.k, +el.dataset.i, +el.dataset.j, null); mark(); drawCard(+el.dataset.i); };
  ACT.donAnh = (b) => busy(b, async () => {
    if (E.dirty) { toast("Cô lưu đề trước rồi hãy dọn ảnh nhé (ảnh của đề chưa lưu có thể bị coi là không dùng).", 5000); return; }
    try {
      const r = await api("t_don_anh");
      if (r.xoa.length) await client().storage.from("anh_de").remove(r.xoa);
      toast(r.xoa.length ? `Đã dọn ${r.xoa.length} ảnh (${(r.byte / 1048576).toFixed(1)} MB)` : "Không có ảnh thừa (chỉ dọn ảnh cũ hơn 1 ngày).", 4000);
      veKho();
    } catch (e) { toast(e.message, 4000); }
  });

  // --- noi dung
  ACT["in:title"] = (el) => { E.title = el.value; mark(); };
  ACT["in:ican"] = (el) => { E.i_can = el.value; mark(); };
  ACT["in:qf"] = (el) => { E.qs[+el.dataset.i][el.dataset.f] = el.value; mark(); };
  ACT["in:qo"] = (el) => { E.qs[+el.dataset.i].options[+el.dataset.j] = el.value; mark(); };
  ACT["in:cap"] = (el) => { E.qs[+el.dataset.i].cap[+el.dataset.j].cau = el.value; mark(); };
  ACT["in:nd"] = (el) => { const q = E.qs[+el.dataset.i]; q.nghe_doan = Object.assign(q.nghe_doan || {}, { [el.dataset.f]: el.value === "" ? null : Number(el.value) }); mark(); };
  ACT["ch:ndTep"] = (el) => { const q = E.qs[+el.dataset.i]; q.nghe_doan = Object.assign(q.nghe_doan || {}, { tep: el.value }); mark(); drawCard(+el.dataset.i); };
  ["muc", "ky_nang", "chang", "muc_noi", "ghi", "chu_chay", "tu_chuyen_giay"].forEach((f) => { ACT["ch:" + f] = (el) => { E.qs[+el.dataset.i][f] = el.value === "" ? null : f === "chang" || f === "tu_chuyen_giay" ? Number(el.value) : el.value; mark(); if (f === "ky_nang" || f === "muc_noi") drawCard(+el.dataset.i); }; });
  ACT["ch:an_goi_y"] = (el) => { E.qs[+el.dataset.i].an_goi_y = el.checked; mark(); };
  ACT["in:luot"] = (el) => { E.qs[+el.dataset.i].luot[+el.dataset.j][el.dataset.f] = el.value; mark(); };
  ACT.luotThem = (b) => { const i = +b.dataset.i; E.qs[i].luot.push({ hoi: "", tra_loi_goi_y: "" }); mark(); drawCard(i); };
  ACT.luotXoa = (b) => { const i = +b.dataset.i; E.qs[i].luot.splice(+b.dataset.j, 1); mark(); drawCard(i); };
  // sua doan van o cau dau nhom -> ca nhom (cac cau «dien» lien sau dang dung chung) doi theo
  ACT["in:doan"] = (el) => {
    const i = +el.dataset.i, cu = E.qs[i].doan_van;
    // (cau sau con trong doan van cung tinh la dung chung: co them cau truoc khi go doan van)
    const doi = [];
    for (let k = i + 1; k < E.qs.length && E.qs[k].loai === "dien" && (E.qs[k].doan_van || "") === (cu || ""); k++) { E.qs[k].doan_van = el.value; doi.push(k); }
    E.qs[i].doan_van = el.value; mark();
    if (!cu || !el.value) doi.forEach(drawCard);  // vua chuyen trong <-> co chu: ve lai o cac cau dung chung
  };
  ACT.tachDoan = (el) => { const i = +el.dataset.i; E.qs[i].doan_van = ""; mark(); drawList(); };
  ACT["ch:cor"] = (el) => { E.qs[+el.dataset.i].correct = +el.dataset.j; mark(); };
  const theMoi = (loai, last) => {
    if (loai === "noi") return { loai, muc_noi: "tu", instruction: TH_LENH.noi, goi_y: "", van_ban_mau: "", gioi_han_giay: 60, ghi: "video", anh: null, ky_nang: "noi", muc: last ? last.muc : null, chang: last ? last.chang : null };
    const n = loai === "dung_sai" ? 2 : loai === "hinh" || loai === "nghe" || loai === "nghe_chu" ? 3 : 4;
    return { loai, instruction: last && last.loai === loai ? last.instruction : TH_LENH[loai], question: "", anh: null,
      options: loai === "dung_sai" ? ["Đúng", "Sai"] : Array(n).fill(""), anh_lc: Array(n).fill(null), correct: null, explanation: "", doc_lenh: "",
      doan_van: loai === "dien" && last && last.loai === "dien" ? last.doan_van : "", ky_nang: TH_KN[loai], muc: last ? last.muc : null, chang: last ? last.chang : null,
      cap: loai === "ghep" ? [{ cau: "", anh: null }, { cau: "", anh: null }, { cau: "", anh: null }] : undefined, nhom: loai === "ghep" ? "G" + Date.now().toString(36) : undefined };
  };
  ACT["ch:loai"] = (el) => {
    const i = +el.dataset.i, cu = E.qs[i], moi = theMoi(el.value, i > 0 ? E.qs[i - 1] : null);
    // giu phan dung chung duoc
    ["anh", "explanation", "muc", "chang", "loi_nghe", "nghe_doan"].forEach((f) => { if (cu[f] != null) moi[f] = cu[f]; });
    if (cu.instruction && !Object.values(TH_LENH).includes(cu.instruction)) moi.instruction = cu.instruction;
    if (cu.question && !["dung_sai", "dien_chu"].includes(el.value) === !["dung_sai", "dien_chu"].includes(cu.loai)) moi.question = cu.question;
    if (!["dung_sai", "ghep"].includes(el.value) && !["dung_sai", "ghep"].includes(cu.loai) && cu.options) { moi.options = cu.options; moi.anh_lc = cu.anh_lc; moi.correct = cu.correct; }
    E.qs[i] = moi; mark(); drawList();
  };
  ACT.up = (el) => { const i = +el.dataset.i; [E.qs[i - 1], E.qs[i]] = [E.qs[i], E.qs[i - 1]]; mark(); drawList(); };
  ACT.down = (el) => { const i = +el.dataset.i; [E.qs[i + 1], E.qs[i]] = [E.qs[i], E.qs[i + 1]]; mark(); drawList(); };
  ACT.qdel = (el) => { if (confirm(`Xoá ${nhanCau(+el.dataset.i)}?`)) { E.qs.splice(+el.dataset.i, 1); mark(); drawList(); } };
  ACT.oadd = (el) => { const q = E.qs[+el.dataset.i]; q.options.push(""); q.anh_lc.push(null); mark(); drawCard(+el.dataset.i); };
  ACT.odel = (el) => {
    const q = E.qs[+el.dataset.i], j = +el.dataset.j;
    q.options.splice(j, 1); q.anh_lc.splice(j, 1);
    if (q.correct === j) q.correct = null; else if (q.correct > j) q.correct--;
    mark(); drawCard(+el.dataset.i);
  };
  ACT.capThem = (el) => { E.qs[+el.dataset.i].cap.push({ cau: "", anh: null }); mark(); drawList(); };
  ACT.capXoa = (el) => { E.qs[+el.dataset.i].cap.splice(+el.dataset.j, 1); mark(); drawList(); };
  ACT.qadd = (b) => {
    E.qs.push(theMoi(b.dataset.loai, E.qs[E.qs.length - 1]));
    mark(); drawList();
    document.getElementById("q" + (E.qs.length - 1)).scrollIntoView({ behavior: "smooth" });
  };
  ACT.nghe = () => {
    if (!E.id) { toast("Cô bấm 💾 Lưu đề trước, rồi gắn file nghe.", 4000); return; }
    tBaiNghe(E.id, E.title || "Đề tiểu học");
    // tai / xoa file nghe xong -> cap nhat ghi chu «file nghe» o tung cau
    const tai = ACT.ngheTai, xoa = ACT.ngheXoa;
    const capNhat = async () => { try { E.am_thanh = (await api("t_get_quiz", { p_id: E.id })).am_thanh || []; drawList(); } catch (e) { /* bo */ } };
    ACT.ngheTai = (f) => Promise.resolve(tai(f)).then(capNhat);
    ACT.ngheXoa = (b) => Promise.resolve(xoa(b)).then(capNhat);
  };

  // --- dong goi cau gui len (hop dong muc 19) + kiem truoc khi luu. Tra mang cau (the ghep -> nhieu cau)
  const chung = (q) => {
    const c = { loai: q.loai, instruction: (q.instruction || "").trim(), explanation: (q.explanation || "").trim() };
    if (q.muc) c.muc = q.muc;
    if (q.ky_nang) c.ky_nang = q.ky_nang;
    if (q.chang) c.chang = q.chang;
    if ((q.doc_lenh || "").trim()) c.doc_lenh = q.doc_lenh.trim();
    if (TH_CO_NGHE.includes(q.loai)) {
      if ((q.loi_nghe || "").trim()) c.loi_nghe = q.loi_nghe.trim();
      const nd = q.nghe_doan || {};
      if (nd.tep && nd.tu_giay != null && nd.den_giay != null) c.nghe_doan = { tep: nd.tep, tu_giay: nd.tu_giay, den_giay: nd.den_giay, so_lan: nd.so_lan || null };
    }
    return c;
  };
  const goiThe = (q, i) => {
    if (q.loai === "noi") {
      const c = { loai: "noi", muc_noi: q.muc_noi || "tu", ghi: q.ghi || "video", gioi_han_giay: Number(q.gioi_han_giay) || 60 };
      ["instruction", "goi_y", "van_ban_mau"].forEach((f) => { if ((q[f] || "").trim()) c[f] = q[f].trim(); });
      if (q.anh) c.anh = q.anh;
      if (q.muc) c.muc = q.muc;
      if (q.chang) c.chang = q.chang;
      if (q.muc_noi === "hoi_dap") {
        delete c.goi_y; delete c.van_ban_mau;
        c.luot = (q.luot || []).filter((l) => (l.hoi || "").trim()).map((l) => Object.assign({}, l, { hoi: l.hoi.trim(), tra_loi_goi_y: (l.tra_loi_goi_y || "").trim() || undefined }));
        if (q.an_goi_y) c.an_goi_y = true;
        if (q.tu_chuyen_giay) c.tu_chuyen_giay = q.tu_chuyen_giay;
      } else if (TH_NOI_CHAY.includes(c.muc_noi) && q.chu_chay && q.chu_chay !== "cham") c.chu_chay = q.chu_chay;
      return [c];
    }
    const c = chung(q);
    if (q.loai === "ghep") {
      const tranh = q.cap.map((x) => x.anh).concat((q.tranh_them || []).filter(Boolean));
      return q.cap.map((x, k) => Object.assign({}, c, { nhom: q.nhom || "G" + i, question: (x.cau || "").trim(), options: tranh.map(() => ""), anh_lc: tranh, correct: k }, x.stt ? { stt: x.stt } : {}));
    }
    if (q.stt) c.stt = q.stt;
    if (q.anh) c.anh = q.anh;
    if (q.loai === "dung_sai") return [Object.assign(c, { question: (q.question || "").trim() || thCauMacDinh(q), options: ["Đúng", "Sai"], correct: q.correct })];
    if (q.loai === "dien_chu") {
      const tu = (q.dap_an_chu || "").trim().toLowerCase(), nhieu = (q.chu_nhieu || "").toLowerCase().replace(/[^a-z]/g, "").split("");
      return [Object.assign(c, { question: (q.question || "").trim(), dap_an_chu: tu, options: [tu, "—"], correct: 0 }, nhieu.length ? { o_chu: tu.split("").concat(nhieu) } : {})];
    }
    Object.assign(c, { question: (q.question || "").trim() || thCauMacDinh(q, soCau(i)), options: q.options.map((o) => String(o).trim()), correct: q.correct });
    if (q.anh_lc.some(Boolean)) c.anh_lc = q.options.map((_, j) => q.anh_lc[j] || null);
    if (q.loai === "dien" && (q.doan_van || "").trim()) c.doan_van = q.doan_van.trim();
    return [c];
  };
  const goi = () => E.qs.flatMap((q, i) => (q.loai === "noi" ? [] : goiThe(q, i)));   // phan trac nghiem
  const goiNoi = () => E.qs.flatMap((q, i) => (q.loai === "noi" ? goiThe(q, i) : []));   // phan noi (luu rieng)
  const kiem = () => {
    if (!nh && E.qs.length && E.qs.every((q) => q.loai === "noi")) return [0, "Đề cần ít nhất 1 câu trắc nghiệm ngoài phần nói."];
    for (let i = 0; i < E.qs.length; i++) {
      const q = E.qs[i], so = nhanCau(i);
      if (q.loai === "noi") {
        if (q.muc_noi === "hoi_dap") { if (!(q.luot || []).some((l) => (l.hoi || "").trim())) return [i, `${so} (đối đáp): cần ít nhất 1 câu hỏi.`]; continue; }
        if (!q.anh && !(q.goi_y || "").trim() && !(q.van_ban_mau || "").trim()) return [i, `${so}: cần tranh, gợi ý hoặc câu mẫu để bé biết nói gì.`];
        continue;
      }
      if (q.loai === "ghep") {
        if (q.cap.some((c) => !(c.cau || "").trim() || !c.anh)) return [i, `${so} (nối câu – tranh): cặp nào cũng cần câu và tranh.`];
        continue;
      }
      if (q.loai === "dien_chu") {
        const tu = (q.dap_an_chu || "").trim();
        if (!/^[A-Za-z]{1,12}$/.test(tu)) return [i, `${so} (điền chữ cái): ô «Các chữ cần điền» chỉ gồm chữ cái a–z.`];
        if ((q.question || "").split("_").length - 1 !== tu.length) return [i, `${so}: câu có ${(q.question || "").split("_").length - 1} dấu _ nhưng cần điền ${tu.length} chữ.`];
        continue;
      }
      if (q.correct === null || q.correct === undefined) return [i, `${so} chưa chọn đáp án đúng.`];
      if (q.loai === "dung_sai" && !q.anh) return [i, `${so} (Đúng / Sai) chưa có tranh.`];
      if (q.loai !== "dung_sai" && q.options.some((o, j) => !String(o).trim() && !q.anh_lc[j])) return [i, `${so} có lựa chọn chưa có chữ hoặc hình.`];
      if (q.loai === "hinh" && !q.anh) return [i, `${so} (nhìn hình) chưa có ảnh đề.`];
      if (q.loai === "dien" && !(q.doan_van || "").trim()) return [i, `${so} (điền) chưa có đoạn văn.`];
    }
    return null;
  };
  const canhBao = () => E.qs.map((q, i) => {
    if (q.loai === "dien" && q.doan_van && !q.doan_van.includes(`(${soCau(i)})`)) return `${nhanCau(i)}: đoạn văn chưa có chỗ trống (${soCau(i)}) — học sinh sẽ không thấy chỗ đang làm được tô vàng.`;
    if (TH_CO_NGHE.includes(q.loai) && canNghe(q) && !ngheCau(i).length && !(q.nghe_doan && q.nghe_doan.tep) && !q.loi_nghe) return `${nhanCau(i)}: chưa có âm thanh (file nghe hoặc chữ cho máy đọc).`;
    return "";
  }).filter(Boolean);
  // Xem thu: ve bang chinh cac ham lam bai cua app.js (dap an dung da duoc chon san)
  // dung bo cau (dap an dung chon san) cho cac the ds; moi the 1 nhom ghep rieng
  const boXem = (ds) => {
    const qs = [];
    ds.forEach((i) => goiThe(E.qs[i], i).forEach((c, j) => qs.push(Object.assign({}, c, { the: i, qi: qs.length, stt: soCau(i) + j, nhom: c.nhom ? "x" + i : c.nhom,
      options: c.options.map((t, k) => (c.anh_lc && c.anh_lc[k] ? { k, t, a: c.anh_lc[k] } : { k, t })) }))));
    const qz = { id: "xem", th: true, qs, answers: {}, chu: {}, am_thanh: E.am_thanh, doanTep: new Set() };
    qs.forEach((q) => { qz.answers[q.qi] = q.correct; });
    return qz;
  };
  const veXem = (qz, q, boDoan) => {
    const than = thThan(qz, q, (o) => (o.k === q.correct ? "sel" : ""), false)
      || `<div class="q-text">${fmtDe(q.question, q.stt)}</div><div class="${optsCls(q, "opts")}">${q.options.map((o, k) => `<div class="opt ${k === q.correct ? "sel" : ""}"><span class="L">${LETTERS[k]}</span><span>${optND(o)}</span></div>`).join("")}</div>`;
    return `${thLenh(q)}${q.loai === "nghe" ? (thNgheNut(qz, q) || '<div class="nghe"><button class="nghe-nut" type="button">▶</button><div class="grow small"><b>🎧 Bài nghe</b> (khi làm bài)</div></div>') : ""}${TH_CO_NGHE.includes(q.loai) && q.loai !== "nghe" ? thNgheNut(qz, q) : ""}${thTruoc(boDoan ? Object.assign({}, q, { doan_van: "" }) : q)}
      ${than}`;
  };
  ACT.xem = (el) => {
    if (E.qs[+el.dataset.i].loai === "noi") {
      const i = +el.dataset.i;
      return taiNoi(() => { openSheet(`<div class="th"><p class="small muted" style="margin:0 0 6px">👀 Học sinh thấy bài nói này như sau (sau phần trắc nghiệm):</p>${noiXemHtml(i)}</div>
        <button type="button" class="btn btn-block" data-act="closeSheet" style="margin-top:10px">Đóng</button>`); thGanNut(); });
    }
    const i = +el.dataset.i, qz = boXem([i]);
    openSheet(`<div class="th"><p class="small muted" style="margin:0 0 6px">👀 ${nhanCau(i)} — học sinh sẽ thấy như sau (bấm thử 🔊; đáp án đúng đã được chọn sẵn):</p>
      ${veXem(qz, qz.qs[0])}</div>
      <button type="button" class="btn btn-block" data-act="closeSheet" style="margin-top:10px">Đóng</button>`);
    thGanNut(qz);
  };
  // Xem thu ca bai: lan luot moi the (the ghep = 1 bang), theo chang
  // bai_noi.js (the bai noi dung chung voi trang HS) chi tai khi can
  const taiNoi = (chay) => { if (window.noiTheHtml) return chay(); const sc = document.createElement("script"); sc.src = "bai_noi.js?v=2"; sc.onload = chay; sc.onerror = () => toast("Không tải được phần xem thử. Kiểm tra mạng."); document.head.appendChild(sc); };
  const noiXemHtml = (i) => noiTheHtml(goiThe(E.qs[i], i)[0], soNoi(i) - 1, null, `<button type="button" class="btn btn-gold btn-block btn-lg" style="margin-top:10px" disabled>${E.qs[i].ghi === "am_thanh" ? "🔴 Bấm để ghi âm" : "🔴 Bấm để quay"}</button>`);
  ACT.xemCa = () => { if (E.qs.some((q) => q.loai === "noi") && !window.noiTheHtml) return taiNoi(ACT.xemCa);
    if (!E.qs.length) { toast("Đề chưa có câu nào."); return; }
    const qz = boXem(E.qs.map((_, i) => i).filter((i) => E.qs[i].loai !== "noi"));
    let chang = null, truoc = null;
    const html = E.qs.map((_, i) => { if (E.qs[i].loai === "noi") return noiXemHtml(i);
      const q = qz.qs.find((x) => x.the === i), c = q.chang || null;
      const dau = c !== chang && c ? `<h3 style="margin:14px 0 4px">🚩 Chặng ${c}</h3>` : "";
      chang = c;
      const boDoan = q.doan_van && q.doan_van === truoc; truoc = q.doan_van || null;
      return `${dau}<div class="card" style="margin:8px 0"><div class="small faint" style="margin-bottom:4px">${nhanCau(i)}</div>${veXem(qz, q, boDoan)}</div>`;
    }).join("");
    openSheet(`<div class="th"><h2 style="margin:0 0 4px">👀 Cả bài như học sinh thấy</h2>
      <p class="small muted" style="margin:0 0 6px">Đáp án đúng đã được chọn sẵn. Khi làm thật, học sinh làm từng câu một, có pháo hoa sau mỗi chặng.</p>${html}</div>
      <button type="button" class="btn btn-block" data-act="closeSheet" style="margin-top:10px">Đóng</button>`);
    thGanNut(qz);
  };
  const save = (btn, thenAssign) => busy(btn, async () => {
    const msg = document.getElementById("msg");
    if (!nh) E.title = document.getElementById("title").value;
    if (!E.qs.length) { msg.innerHTML = errBox("Đề chưa có câu hỏi nào."); return; }
    const loi = kiem();
    if (loi) { msg.innerHTML = errBox(loi[1]); document.getElementById("q" + loi[0]).scrollIntoView({ behavior: "smooth" }); return; }
    if (nh) {  // kho cau hoi: moi the = 1 muc (the dau cap nhat muc dang sua)
      try {
        await api("t_ngan_hang_luu", { p: { id: nh.id, khoi: nh.khoi, unit: nh.unit, ten_unit: nh.ten_unit, bo_sach: nh.bo_sach, ds: E.qs.map((q, i) => goiThe(q, i).map((c) => { const x = Object.assign({}, c); delete x.stt; return x; })) } });
        E.dirty = false; toast("Đã lưu vào kho"); go(veNh);
      } catch (e) { msg.innerHTML = errBox(e); msg.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return;
    }
    try {
      const r = await api("t_save_quiz", { p_id: E.id, p_title: E.title, p_questions: goi() });
      E.id = r.id;
      await api("t_dat_i_can", { p_quiz_id: r.id, p_ds: E.i_can.split("\n").map((t) => t.trim()).filter(Boolean) });
      await luuKhoiDe(r.id);
      const bn = await api("t_dat_bai_noi", { p_quiz_id: r.id, p_ds: goiNoi() });   // phan noi luu rieng (muc 22)
      if (bn && bn.error) throw new Error(bn.error);
      E.dirty = false;
      const cb = canhBao();
      msg.innerHTML = cb.length ? `<div class="alert alert-warn"><b>Đã lưu.</b> Cô xem lại:<ul style="margin:6px 0 0;padding-left:18px">${cb.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
      toast("Đã lưu đề");
      if (r.cham_lai && r.cham_lai.thay_doi) moDe(() => baoChamLai(r.cham_lai));
      if (thenAssign) go("#/t/new?quiz=" + r.id);
      else if (!id) { skipRoute = true; location.hash = "#/t/qth/" + r.id; prevHash = location.hash; }
    } catch (e) { msg.innerHTML = errBox(e); msg.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
  ACT.save = (btn) => save(btn, false);
  ACT.saveassign = (btn) => save(btn, true);
}
window.tEditorTH = tEditorTH;
