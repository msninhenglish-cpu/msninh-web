/* «📚 Kho câu hỏi» (giao vien) — chi tai khi mo #/t/nh (29/10/2026, hop dong muc 20).
 * Cay Khoi -> Unit, xem truoc / sua / an cau, «+ Them cau cua co», «⚡ Tao bai nhanh» (rut ngau nhien theo ky nang -> de tieu hoc).
 */
"use strict";

const NH_KN = [["nghe", "🎧 Nghe"], ["noi", "🗣 Nói"], ["doc", "📖 Đọc"], ["viet", "✏️ Viết"], ["khac", "🔤 Khác"]];
const NH_DANG = { hinh: "Nhìn hình", dien: "Điền đoạn văn", nghe: "Nghe chọn", chon: "Chọn", nghe_chu: "Nghe – chữ cái", dung_sai: "Đúng / Sai", ghep: "Nối câu – tranh", dien_chu: "Điền chữ cái" };
const NH_MUC = { nhan_biet: "Nhận biết", thong_hieu: "Thông hiểu", van_dung: "Vận dụng" };
const NH_NGUON = { sach: "📗 Sách", ai: "🤖 AI", co: "👩‍🏫 Cô" };
// Mac dinh «Tao bai nhanh» (~10 phut lop 2; uu tien nghe > noi > doc > viet). Noi = so bai noi (phan noi rieng, muc 22): lop 1-5 mac dinh 1
const nhMacDinh = (khoi) => (khoi <= 3 ? { nghe: 4, noi: 1, doc: 4, viet: 2 } : khoi <= 5 ? { nghe: 4, noi: 1, doc: 5, viet: 3 } : { nghe: 3, doc: 6, viet: 3 });
const nhKhoaUnit = (u) => u.bo_sach + "|" + u.unit;
const nhLink = (khoi, u) => `#/t/nh?khoi=${khoi}&unit=${encodeURIComponent(u.unit)}&bo=${encodeURIComponent(u.bo_sach || "")}`;
const nhLinkThem = (khoi, u) => `#/t/nhs/new?khoi=${khoi}&unit=${encodeURIComponent(u.unit)}&bo=${encodeURIComponent(u.bo_sach || "")}&ten=${encodeURIComponent(u.ten_unit || "")}`;

// Xem truoc 1 muc (dap an dung da chon san) bang cac ham lam bai cua app.js
function nhXem(item) {
  const qs = (item.cau_xem || item.cau).filter((c) => c.options).map((c, j) => Object.assign({}, c, { qi: j, stt: j + 1, options: c.options.map((t, k) => (c.anh_lc && c.anh_lc[k] ? { k, t, a: c.anh_lc[k] } : { k, t })) }));
  const qz = { id: "nh" + item.id, th: true, qs, answers: {}, chu: {}, am_thanh: [], doanTep: new Set() };
  qs.forEach((q) => { qz.answers[q.qi] = q.correct; });
  const q = qs[0];
  if (!q) return '<p class="small muted">Câu lõi chưa đủ đáp án sai để xem trước (kho cùng khối còn ít câu).</p>';
  const than = thThan(qz, q, (o) => (o.k === q.correct ? "sel" : ""), false)
    || `<div class="q-text">${fmtDe(q.question, q.stt)}</div><div class="${optsCls(q, "opts")}">${q.options.map((o, k) => `<div class="opt ${k === q.correct ? "sel" : ""}"><span class="L">${LETTERS[k]}</span><span>${optND(o)}</span></div>`).join("")}</div>`;
  return `<div class="th">${thLenh(q)}${q.loi_nghe || q.nghe_doan ? `<p class="small muted">🎧 ${q.nghe_doan ? "đoạn " + q.nghe_doan.tu_giay + "–" + q.nghe_doan.den_giay + " giây của «" + esc(q.nghe_doan.tep) + "»" : "máy đọc: «" + esc(q.loi_nghe) + "»"}</p>` : ""}${thTruoc(q)}${than}
    ${q.explanation ? `<div class="explain small">💡 ${fmt(q.explanation)}</div>` : ""}</div>`;
}

async function tNganHang(query) {
  app.innerHTML = tShell("quizzes", spinner());
  ACT.retry = () => route();
  let cay;
  try { cay = await api("t_ngan_hang_cay"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const dsKhoi = [...new Set(cay.map((x) => x.khoi))].sort((a, b) => a - b);
  let khoi = Number(query.get("khoi")) || dsKhoi[0] || 2;
  const unitXem = query.get("unit"), boXem = query.get("bo") || "";
  const chon = new Set();
  let so = nhMacDinh(khoi);
  thGanNut();

  const units = () => cay.filter((x) => x.khoi === khoi);
  const coSan = (kn) => units().filter((u) => chon.has(nhKhoaUnit(u))).reduce((n, u) => n + (u.theo_ky_nang[kn] || 0), 0);
  const veTao = () => {
    const el = document.getElementById("taoNhanh"); if (!el) return;
    const ds = units().filter((u) => chon.has(nhKhoaUnit(u)));
    el.innerHTML = `<h2 style="margin-bottom:4px">⚡ Tạo bài nhanh</h2>
      <p class="small muted" style="margin-top:0">Tick các Unit ở trên, chọn số câu mỗi kỹ năng → web rút ngẫu nhiên → mở trình soạn để cô xem thử / sửa → «Lưu &amp; giao bài». Cả lớp làm cùng đề, thứ tự câu và đáp án tự xáo. Một bài nối câu – tranh tính là 1 câu. Câu «không còn trong sách» không được rút.</p>
      <div class="small" style="margin-bottom:8px">Đã chọn: ${ds.length ? ds.map((u) => `<b>Unit ${esc(u.unit)}</b>`).join(", ") : '<span class="muted">chưa chọn Unit nào</span>'}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">${NH_KN.map(([kn, ten]) => `<label class="small">${ten}${kn === "noi" ? " <span class=\"muted\">(bài)</span>" : ""} <input class="input" type="number" min="0" max="${kn === "noi" ? 10 : 30}" data-in="nhSo" data-kn="${kn}" value="${so[kn] || 0}" style="width:70px"> <span class="muted">(có ${coSan(kn)})</span></label>`).join("")}</div>
      ${coSan("noi") ? '<p class="small muted" style="margin:6px 0 0">🗣 Bài nói: học sinh quay video sau phần trắc nghiệm, cô chấm sao; không tính vào điểm tự chấm. Web rút xen kẽ các dạng (đối đáp, chant, từ…).</p>' : ""}
      <div class="field" style="margin-top:8px"><label class="f">Tên bài <span class="faint">(bỏ trống = «Ôn Unit … – Khối ${khoi}»)</span></label><input class="input" id="nhTen"></div>
      <button type="button" class="btn btn-gold btn-lg btn-block" data-act="nhTao" ${ds.length ? "" : "disabled"}>⚡ Tạo bài</button>`;
  };
  const ve = async () => {
    const ds = units();
    app.querySelector("main").innerHTML = `<a href="#/t/quizzes" class="small">‹ Kho đề</a>
      <div class="row between" style="margin-top:8px"><h1 style="margin:0">📚 Kho câu hỏi</h1><button type="button" class="btn" data-act="nhUnitMoi">+ Thêm Unit / câu của cô</button></div>
      <p class="small muted">Câu hỏi soạn sẵn theo Khối → Unit (phần mềm Chấm điểm đẩy lên từ sách; cô thêm câu của mình). Dùng «⚡ Tạo bài nhanh» để có bài ngay; chỉ cần soạn đề tay (🧒 + Đề tiểu học) khi có nhu cầu riêng.</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0">${(dsKhoi.length ? dsKhoi : [khoi]).map((k) => `<button type="button" class="btn btn-sm ${k === khoi ? "btn-primary" : ""}" data-act="nhKhoi" data-k="${k}">Khối ${k}</button>`).join("")}</div>
      ${ds.length ? ds.map((u) => `<div class="card row between" style="gap:10px">
        <label class="check" style="min-height:0"><input type="checkbox" data-ch="nhChon" data-u="${esc(nhKhoaUnit(u))}" ${chon.has(nhKhoaUnit(u)) ? "checked" : ""} aria-label="Chọn Unit ${esc(u.unit)} để tạo bài"></label>
        <div class="grow"><b>Unit ${esc(u.unit)}${u.ten_unit ? " – " + esc(u.ten_unit) : ""}</b>
          <div class="small muted">${u.bo_sach ? esc(u.bo_sach) + " · " : ""}${u.so_muc} mục (${u.so_cau} câu)${u.so_an ? ` · đã ẩn ${u.so_an}` : ""}${u.so_het_sach ? ` · 📕 ${u.so_het_sach} không còn trong sách` : ""} · ${NH_KN.filter(([kn]) => u.theo_ky_nang[kn]).map(([kn, ten]) => `${ten} ${u.theo_ky_nang[kn]}`).join(" · ")}</div></div>
        <div class="row"><a class="btn btn-sm" href="${nhLink(khoi, u)}">Xem câu</a><a class="btn btn-sm" href="${nhLinkThem(khoi, u)}">+ Thêm câu</a></div></div>`).join("")
        : `<div class="empty">Khối ${khoi} chưa có câu nào trong kho. Phần mềm Chấm điểm sẽ đẩy ngân hàng câu hỏi lên; cô cũng có thể bấm «+ Thêm Unit / câu của cô».</div>`}
      ${ds.length ? '<div class="card" id="taoNhanh"></div>' : ""}
      <div id="nhUnit"></div>`;
    veTao();
    if (unitXem) await veUnit();
  };
  // Danh sach cau cua 1 Unit
  const veUnit = async () => {
    const el = document.getElementById("nhUnit"), u = cay.find((x) => x.khoi === khoi && x.unit === unitXem && (x.bo_sach || "") === boXem) || { unit: unitXem, bo_sach: boXem };
    el.innerHTML = spinner();
    let ds;
    try { ds = await api("t_ngan_hang_ds", { p_khoi: khoi, p_unit: unitXem, p_bo_sach: boXem || null }); } catch (e) { el.innerHTML = errBox(e); return; }
    el.innerHTML = `<h2 style="margin-top:18px" id="nhDs">Unit ${esc(unitXem)}${u.ten_unit ? " – " + esc(u.ten_unit) : ""} · ${ds.length} mục</h2>
      <a class="btn btn-sm" href="${nhLinkThem(khoi, u)}" style="margin-bottom:8px">+ Thêm câu của cô vào Unit này</a>
      ${ds.map((it) => { const q = it.cau[0];
        return `<div class="card" style="${it.an ? "opacity:.55" : ""}"><div class="row between" style="gap:8px"><div class="grow">
          <b>${esc(NH_DANG[it.loai] || "Chọn")}${it.cau.length > 1 ? ` (${it.cau.length} cặp)` : ""}</b> <span class="small">${esc(plain(q.question)).slice(0, 80)}</span>
          <div class="small muted">${NH_NGUON[it.nguon] || ""}${it.trang ? " · trang " + esc(it.trang) : ""}${it.ky_nang ? " · " + (NH_KN.find(([k]) => k === it.ky_nang) || ["", it.ky_nang])[1] : ""}${it.muc ? " · " + NH_MUC[it.muc] : ""}${it.sua_tren_web ? " · ✏️ cô đã sửa" : ""}${it.an ? " · 🙈 đang ẩn" : ""}${it.loi ? " · 🎲 đáp án sai web tự chọn mỗi lần tạo bài" : ""}${it.het_sach ? ' · <b style="color:var(--bad)">📕 không còn trong sách</b>' : ""}</div></div>
          <div class="row" style="gap:4px"><a class="btn btn-sm" href="#/t/nhs/${it.id}">✏️ Sửa</a>
            <button type="button" class="btn btn-sm" data-act="nhAn" data-id="${it.id}" data-an="${it.an ? 0 : 1}">${it.an ? "👁 Hiện" : "🙈 Ẩn"}</button>
            ${it.het_sach ? `<button type="button" class="btn btn-sm" data-act="nhGiu" data-id="${it.id}">Giữ dùng tiếp</button>` : ""}
            ${it.nguon === "co" || it.het_sach ? `<button type="button" class="btn btn-sm btn-danger" data-act="nhXoa" data-id="${it.id}">Xoá</button>` : ""}</div></div>
          <details class="box" style="margin-top:8px"><summary>👀 Xem trước</summary>${nhXem(it)}</details></div>`; }).join("") || '<div class="empty">Unit này chưa có câu nào.</div>'}`;
    document.getElementById("nhDs").scrollIntoView({ behavior: "smooth" });
  };

  ACT.nhKhoi = (b) => { go("#/t/nh?khoi=" + b.dataset.k); };
  ACT["ch:nhChon"] = (el) => { if (el.checked) chon.add(el.dataset.u); else chon.delete(el.dataset.u); veTao(); };
  ACT["in:nhSo"] = (el) => { so[el.dataset.kn] = Math.max(0, Math.min(el.dataset.kn === "noi" ? 10 : 30, Number(el.value) || 0)); };
  ACT.nhTao = (b) => busy(b, async () => {
    const ds = units().filter((u) => chon.has(nhKhoaUnit(u)));
    const bo = [...new Set(ds.map((u) => u.bo_sach))];
    try {
      const r = await api("t_tao_bai_nhanh", { p: { khoi, units: ds.map((u) => u.unit), bo_sach: bo.length === 1 ? bo[0] : null, so: coSan("noi") ? so : Object.assign({}, so, { noi: 0 }), ten: document.getElementById("nhTen").value } });
      if (r.thieu && r.thieu.length) toast("Kho chưa đủ câu: " + r.thieu.map((t) => `${(NH_KN.find(([k]) => k === t.ky_nang) || ["", t.ky_nang])[1]} có ${t.co}/${t.can}`).join(", ") + ". Web lấy hết số có.", 6000);
      else if (r.lap_tu && r.lap_tu.length) toast(`Đã tạo bài ${r.so_cau} câu. Các Unit này chỉ có ${r.so_tu} từ nên ${r.lap_tu.map((x) => `«${x.tu}»`).join(", ")} xuất hiện ${r.lap_tu[0].lan} lần. Muốn đa dạng hơn: chọn thêm Unit hoặc bớt số câu.`, 8000);
      else toast(`Đã tạo bài ${r.so_cau} câu${r.so_noi ? ` + ${r.so_noi} bài nói` : ""}. Cô xem thử rồi «Lưu & giao bài».`, 4000);
      go("#/t/qth/" + r.quiz_id);
    } catch (e) { toast(e.message, 5000); }
  });
  ACT.nhAn = (b) => busy(b, async () => {
    try { await api("t_ngan_hang_an", { p_id: Number(b.dataset.id), p_an: b.dataset.an === "1" }); cay = await api("t_ngan_hang_cay"); await ve(); } catch (e) { toast(e.message); }
  });
  ACT.nhGiu = (b) => busy(b, async () => {
    try { await api("t_ngan_hang_giu", { p_id: Number(b.dataset.id) }); cay = await api("t_ngan_hang_cay"); await ve(); } catch (e) { toast(e.message); }
  });
  ACT.nhXoa = (b) => {
    if (!confirm("Xoá hẳn câu này khỏi kho?")) return;
    busy(b, async () => { try { await api("t_ngan_hang_xoa", { p_id: Number(b.dataset.id) }); cay = await api("t_ngan_hang_cay"); await ve(); } catch (e) { toast(e.message); } });
  };
  ACT.nhUnitMoi = () => {
    openSheet(`<h2>+ Thêm câu của cô</h2><form data-submit="nhUnitDi">
      <div class="grid2"><div class="field"><label class="f">Khối</label><input class="input" name="khoi" type="number" min="1" max="12" value="${khoi}" required></div>
        <div class="field"><label class="f">Unit <span class="faint">(vd 3, FT1, R1)</span></label><input class="input" name="unit" maxlength="20" required></div></div>
      <div class="field"><label class="f">Tên Unit</label><input class="input" name="ten" maxlength="120" placeholder="vd: At the zoo"></div>
      <div class="field"><label class="f">Bộ sách</label><input class="input" name="bo" maxlength="80" value="Global Success"></div>
      <button class="btn btn-primary btn-block">Tiếp tục ➜</button></form>`);
    ACT.nhUnitDi = (f) => { closeSheet(); go(`#/t/nhs/new?khoi=${Number(f.khoi.value)}&unit=${encodeURIComponent(f.unit.value.trim())}&bo=${encodeURIComponent(f.bo.value.trim())}&ten=${encodeURIComponent(f.ten.value.trim())}`); };
  };
  await ve();
}
window.tNganHang = tNganHang;
