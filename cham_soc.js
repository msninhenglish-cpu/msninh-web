/* Trang GV "💌 Cham soc" (#/t/cham-soc): ⚠️ Can quan tam + 🎂 Sinh nhat · 📤 Gui phu huynh · 📊 Bao cao thang · ✉️ Mau tin.
 * Gui qua Zalo ca nhan cua trung tam (co chot 16/10/2026), BAN TU DONG: GV bam -> chep anh phieu / chep tin + mo zalo.me/<SDT>,
 * GV tu dan va bam Gui trong Zalo. Anh phieu ve bang canvas (phieu_anh.js). Nhat ky gui o bang gui_phu_huynh.
 * Tin co ten + hoc phi cua con -> chi mo dung SDT phu huynh cua em do. Chi tai file nay khi GV mo muc nay. */

const CS = { tab: "quan_tam", cls: "", thang: "", loai: "hoc_phi", han: "", mau: null };
const CS_LOAI = { hoc_phi: "Phiếu học phí tháng", nhan_xet_tuan: "Nhận xét tuần", bao_cao_thang: "Báo cáo tháng" };
const CS_LY_DO = { vang: "📅", diem_giam: "📉", chua_nop: "📝", no_hoc_phi: "💰", thai_do: "💪" };

function csCss() {
  if (document.getElementById("csCss")) return;
  const st = document.createElement("style");
  st.id = "csCss";
  st.textContent = `.cs-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 12px; } .cs-tabs .btn.on { background: var(--pri, #4f6df5); color: #fff; }
    .cs-ld { margin: 4px 0 0; padding-left: 0; list-style: none; } .cs-ld li { margin: 2px 0; }
    .cs-tin { width: 100%; min-height: 120px; font-size: 14px; }
    .cs-hang { border-left: 4px solid #dbe3f5; } .cs-hang.kt { border-left-color: #f5b301; } .cs-hang.mo { border-left-color: #22c55e; } .cs-hang.thieu { border-left-color: #ef4444; }
    @media print { .topbar, .tabs, .cs-tabs, .filters, .no-print, .pub-float { display: none !important; } .card { break-inside: avoid; box-shadow: none; border: 1px solid #ddd; } }`;
  document.head.appendChild(st);
}

/* ---- dien mau tin ---- */
function csSdt(s) { let d = String(s || "").replace(/[^0-9+]/g, ""); if (d.startsWith("+84")) d = "0" + d.slice(3); if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2); return d.replace(/\D/g, ""); }
function csThang(t) { return t ? thangVN(t).toLowerCase() : ""; }
function csTomTatNx(n) {
  if (!n) return "(chưa có nhận xét tuần)";
  const d = n.noi_dung || {}, tk = d.thong_ke || {}, dong = [];
  if (d.thai_do) dong.push("• Thái độ: " + (d.thai_do === "tot" ? "tốt" : "cần cố gắng"));
  if (tk.tong_buoi !== undefined) dong.push(`• Đi học: ${tk.co_mat ?? "?"}/${tk.tong_buoi} buổi`);
  if (tk.online_giao !== undefined) dong.push(`• Bài online: làm ${(tk.online_giao || 0) - (tk.chua_lam || 0)}/${tk.online_giao}`);
  (d.ket_qua || []).slice(0, 3).forEach((k) => dong.push(`• ${k.ten || "Bài"}: ${k.diem ?? "—"} điểm`));
  if (d.nhan_xet) dong.push("• Cô nhắc: " + d.nhan_xet);
  return dong.join("\n") || "(phiếu trống)";
}
function csTomTatBc(b) {
  if (!b) return "";
  const dd = b.diem_danh || {}, hp = b.hoc_phi, dong = [];
  dong.push("• Điểm trung bình các bài: " + (b.diem_tb === null || b.diem_tb === undefined ? "chưa có" : fmtScore(b.diem_tb)));
  dong.push(`• Đi học: ${dd.co_mat || 0} buổi có mặt, ${dd.vang || 0} buổi vắng`);
  if (hp) dong.push("• Học phí: " + (hp.da_dong ? "đã đóng" : tien(hp.thanh_tien) + " (chưa đóng)"));
  if ((b.nhan_xet_tuan || []).length) dong.push(`• ${b.nhan_xet_tuan.length} phiếu nhận xét tuần`);
  return dong.join("\n");
}
function csDien(ma, r, them) {
  const mau = (CS.mau || []).find((m) => m.ma === ma);
  if (!mau) return "";
  them = them || {};
  const hp = r.hoc_phi || {}, nh = nganHang(hp.khoi || r.khoi) || {};
  const th = them.thang || CS.thang;
  const chuaNop = r.chua_nop || [];
  const v = {
    ten_hs: r.ho_ten, ma_hs: r.ma_hs, lop: r.lop || "", link: location.origin, thang: csThang(th),
    so_buoi: hp.so_buoi ?? "?", so_tien: hp.thanh_tien === null || hp.thanh_tien === undefined ? "?" : tien(hp.thanh_tien),
    ngan_hang: nh.ten || "", stk: nh.so || "", chu_tk: nh.chu || "",
    noi_dung_ck: `Hoc phi ${boDau(r.ho_ten)} - Thang ${Number(String(th).slice(5))}/${String(th).slice(0, 4)}`,
    han: them.han || CS.han || "", so_bai: chuaNop.length, ten_bai: chuaNop.map((b) => b.ten).join(", "),
    han_bai: chuaNop.length && chuaNop[0].han_nop ? ` (hạn sớm nhất ${ngayVN(chuaNop[0].han_nop)})` : "",
    ngay: r.vang_gan && r.vang_gan.length ? nxNgay(r.vang_gan[0]) + "/" + String(r.vang_gan[0]).slice(0, 4) : "",
    ky: r.nhan_xet ? `${nxNgay(r.nhan_xet.tuan_tu)} – ${nxNgay(r.nhan_xet.tuan_den)}` : "",
    tom_tat: ma === "nhan_xet_tuan" ? csTomTatNx(r.nhan_xet) : ma === "bao_cao_thang" ? csTomTatBc(r.bao_cao)
      : ma === "khen" && r.bao_cao && r.bao_cao.diem_tb !== null && r.bao_cao.diem_tb !== undefined ? ` (điểm trung bình ${csThang(th)}: ${fmtScore(r.bao_cao.diem_tb)})` : "",
  };
  return mau.noi_dung.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
}
async function csChep(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; } t.remove(); return ok;
  }
}
function csMoZalo(sdt) { const s = csSdt(sdt); if (s) window.open("https://zalo.me/" + s, "_blank", "noopener"); return !!s; }

/* ---- hop tin cho 1 em (dung o Can quan tam, Sinh nhat, Ho so) ---- */
function csHanMacDinh(th) { const [y, m] = String(th).split("-").map(Number); const d = new Date(y, m, 10); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
async function csHopTin(userId, maMacDinh, thangRieng) {
  const thTin = thangRieng || CS.thang;
  openSheet(`<div class="row between"><h2 style="margin:0">✉️ Tin nhắn mẫu</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="csHop">${spinner()}</div>`);
  let r;
  try { r = (await api("t_du_lieu_tin", { p: { user_ids: [userId], thang: thTin } })).rows[0]; } catch (e) { document.getElementById("csHop").innerHTML = errBox(e); return; }
  if (!r) { document.getElementById("csHop").innerHTML = errBox("Không tìm thấy học sinh."); return; }
  const ve = (ma) => {
    document.getElementById("csHop").innerHTML = `<p><b>${esc(r.ma_hs)} ${esc(r.ho_ten)}</b> · ${esc(r.lop || "")} · ${r.sdt ? "📞 " + esc(r.sdt) : '<span style="color:var(--bad)">Chưa có SĐT phụ huynh — nhập ở hồ sơ</span>'}</p>
      <select class="input" data-ch="csMau">${CS.mau.map((m) => `<option value="${m.ma}" ${m.ma === ma ? "selected" : ""}>${esc(m.ten)}</option>`).join("")}</select>
      <textarea class="input cs-tin" id="csTin" style="margin-top:8px">${esc(csDien(ma, r, { thang: thTin, han: csHanMacDinh(thTin) }))}</textarea>
      <div class="row" style="gap:6px;margin-top:8px"><button class="btn btn-primary grow" data-act="csChep1">📋 Chép</button>
        <button class="btn grow" data-act="csZalo1" ${r.sdt ? "" : "disabled"}>💬 Chép + mở Zalo</button></div>
      <p class="small muted">Kiểm tra lại nội dung trước khi gửi. Zalo mở đúng số phụ huynh em này; cô dán tin rồi bấm gửi trong Zalo.</p>`;
  };
  ACT["ch:csMau"] = (el) => ve(el.value);
  ACT.csChep1 = async () => toast((await csChep(document.getElementById("csTin").value)) ? "Đã chép tin nhắn" : "Không chép được — cô bôi đen rồi chép tay nhé", 3000);
  ACT.csZalo1 = async () => {
    const tin = document.getElementById("csTin").value, ma = document.querySelector('[data-ch="csMau"]').value;
    await csChep(tin); csMoZalo(r.sdt);
    try { await api("t_ghi_gui", { p: { user_id: r.user_id, loai: ma, ky: ma === "nhan_xet_tuan" ? (r.nhan_xet ? r.nhan_xet.tuan_tu : "") : ["hoc_phi", "bao_cao_thang"].includes(ma) ? thTin : "", trang_thai: "da_mo_zalo", noi_dung: tin } }); } catch (e) { /* ghi nhat ky loi khong chan */ }
    toast("Đã chép tin và mở Zalo. Cô dán vào khung chat rồi bấm gửi.", 4000);
  };
  ve(maMacDinh || "hoc_phi");
}

/* ---- trang chinh ---- */
async function tChamSoc(query) {
  csCss(); nxCss();
  app.innerHTML = tShell("chamsoc", spinner());
  ACT.retry = () => route();
  let ov;
  try { [ov, CS.mau] = await Promise.all([api("t_overview"), api("t_ds_mau_tin")]); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  CS.thang = CS.thang || thangNayVN();
  if (query && query.get("tab")) CS.tab = query.get("tab");
  const main = app.querySelector("main");
  main.innerHTML = `<h1>💌 Chăm sóc học sinh & phụ huynh</h1>
    <div class="cs-tabs" id="csTabs"></div>
    <div class="filters no-print" id="csLoc">
      <select class="input" data-ch="csLop" aria-label="Lớp"><option value="">Tất cả lớp</option>${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === CS.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <input class="input" type="month" data-ch="csThang" value="${esc(CS.thang)}" aria-label="Tháng"></div>
    <div id="csNoi">${spinner()}</div>`;
  const tabs = [["quan_tam", "⚠️ Cần quan tâm"], ["gui", "📤 Gửi phụ huynh"], ["bao_cao", "📊 Báo cáo tháng"], ["mau", "✉️ Mẫu tin"]];
  const veTab = () => {
    document.getElementById("csTabs").innerHTML = tabs.map(([k, t]) => `<button class="btn btn-sm ${k === CS.tab ? "on" : ""}" data-act="csTab" data-k="${k}">${t}</button>`).join("");
    document.getElementById("csLoc").style.display = CS.tab === "mau" ? "none" : "";
    ({ quan_tam: csQuanTam, gui: csGui, bao_cao: csBaoCao, mau: csMau })[CS.tab]();
  };
  ACT.csTab = (b) => { CS.tab = b.dataset.k; veTab(); };
  ACT["ch:csLop"] = (el) => { CS.cls = el.value; veTab(); };
  ACT["ch:csThang"] = (el) => { if (el.value) { CS.thang = el.value; veTab(); } };
  ACT.csTin = (b) => csHopTin(Number(b.dataset.u), b.dataset.m, b.dataset.th || null);
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
  veTab();
  if (query && query.get("tin")) csHopTin(Number(query.get("tin")), query.get("mau") || "hoc_phi");
}

async function csQuanTam() {
  const k = document.getElementById("csNoi");
  k.innerHTML = spinner();
  let d;
  try { d = await api("t_cham_soc", { p: { class_id: CS.cls ? Number(CS.cls) : null } }); } catch (e) { k.innerHTML = errBox(e); return; }
  const mauCho = { vang: "vang", diem_giam: "khen", chua_nop: "nop_bai", no_hoc_phi: "hoc_phi", thai_do: "nhan_xet_tuan" };
  k.innerHTML = `${d.sinh_nhat.length ? `<div class="card" style="background:#fff7e8"><b>🎂 Sinh nhật trong tuần</b>
      ${d.sinh_nhat.map((s) => `<div class="row between" style="margin-top:6px;gap:6px;flex-wrap:wrap"><span><a href="#/t/hs/${s.user_id}">${esc(s.ma_hs)} ${esc(s.ho_ten)}</a> · ${esc(s.lop || "")} ·
        ${s.con_ngay === 0 ? "<b>hôm nay</b>" : "còn " + s.con_ngay + " ngày"} (${esc(nxNgay(s.ngay_sinh))}, ${s.tuoi} tuổi)</span>
        <button class="btn btn-sm" data-act="csTin" data-u="${s.user_id}" data-m="sinh_nhat">🎉 Tin chúc mừng</button></div>`).join("")}</div>` : ""}
    <p class="small muted">Tự liệt kê em: vắng 2 buổi liền gần nhất · điểm TB 2 tuần gần đây giảm từ 1,5 so với 4 tuần trước · chưa nộp từ 3 bài online · chưa đóng học phí tháng trước · thái độ «cần cố gắng» 2 tuần liền. Chỉ tính em đang học.</p>
    ${d.can_quan_tam.length ? d.can_quan_tam.map((r) => `<div class="card"><div class="row between" style="gap:6px;flex-wrap:wrap">
        <a href="#/t/hs/${r.user_id}"><b>${esc(r.ma_hs)} ${esc(r.ho_ten)}</b></a><span class="small muted">${esc(r.lop || "")}${r.co_sdt ? "" : ' · <span style="color:var(--bad)">chưa có SĐT PH</span>'}</span></div>
      <ul class="cs-ld">${r.ly_do.map((l) => `<li>${CS_LY_DO[l.loai] || "•"} ${esc(l.chi_tiet)} <button class="btn btn-sm btn-ghost" data-act="csTin" data-u="${r.user_id}" data-m="${mauCho[l.loai] || "khen"}"${l.thang ? ` data-th="${esc(l.thang)}"` : ""}>✉️ Tin mẫu</button></li>`).join("")}</ul></div>`).join("")
      : '<div class="empty">🎉 Không có em nào cần quan tâm đặc biệt.</div>'}`;
}

function csTaiPhieuAnh() {
  if (window.phieuAnh) return Promise.resolve();
  return new Promise((ok, loi) => { const s = document.createElement("script"); s.src = "phieu_anh.js?v=1"; s.onload = ok; s.onerror = () => loi(new Error("Không tải được bộ vẽ phiếu ảnh.")); document.head.appendChild(s); });
}
const CS_CO_CHEP_ANH = typeof ClipboardItem !== "undefined" && !!(navigator.clipboard && navigator.clipboard.write);
// Chep anh phieu vao clipboard (giu cu chi bam bang ClipboardItem nhan Promise). Khong ho tro -> tai anh xuong.
async function csChepAnh(r, ten) {
  const p = csTaiPhieuAnh().then(() => phieuAnh.vePhieu(CS.loai, r, CS.thang, CS.han));
  if (CS_CO_CHEP_ANH) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": p.then((b) => { if (!b) throw new Error("Chưa có dữ liệu để vẽ phiếu."); return b; }) })]);
      return "chep";
    } catch (e) { /* roi xuong tai anh */ }
  }
  const b = await p;
  if (!b) throw new Error("Chưa có dữ liệu để vẽ phiếu.");
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (ten || "phieu") + ".png";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return "tai";
}

async function csGui() {
  const k = document.getElementById("csNoi");
  if (!CS.cls) { k.innerHTML = '<div class="alert alert-warn">Chọn một lớp để gửi phụ huynh.</div>'; return; }
  if (!CS.han || CS.hanThang !== CS.thang) { CS.han = csHanMacDinh(CS.thang); CS.hanThang = CS.thang; }
  k.innerHTML = spinner();
  let d;
  try { d = await api("t_du_lieu_tin", { p: { class_id: Number(CS.cls), thang: CS.thang } }); } catch (e) { k.innerHTML = errBox(e); return; }
  csTaiPhieuAnh().catch(() => {});   // tai truoc bo ve phieu
  const ky = CS.loai === "nhan_xet_tuan" ? (d.tuan_tu || "") : CS.thang;
  const rows = d.rows.map((r) => {
    const gui = (r.da_gui || {})[CS.loai + "|" + ky];
    let canhBao = "";
    if (CS.loai === "hoc_phi" && (!r.hoc_phi || r.hoc_phi.thanh_tien === null || r.hoc_phi.thanh_tien === undefined)) canhBao = "Chưa có học phí tháng này";
    else if (CS.loai === "hoc_phi" && r.hoc_phi.da_dong) canhBao = "Đã đóng học phí";
    else if (CS.loai === "nhan_xet_tuan" && !r.nhan_xet) canhBao = "Chưa có nhận xét tuần";
    return Object.assign(r, { tin: csDien(CS.loai, r), gui, canhBao, kiemTra: gui && ["da_kiem_tra", "da_mo_zalo", "da_gui"].includes(gui.trang_thai) });
  });
  CS.buoc = null;   // gui lan luot: {i, buoc: 'anh' | 'tin'}
  const tt = (r) => (r.gui ? r.gui.trang_thai : "");
  const tenTep = (r) => `${CS.loai}_${r.ma_hs}_${boDau(r.ho_ten).replace(/\s+/g, "_")}`;
  const nutLon = () => {
    const b = CS.buoc;
    if (b) { const r = rows[b.i]; return b.buoc === "anh" ? `▶ Bước 1/2 · ${esc(r.ho_ten)}: chép ẢNH + mở Zalo` : `▶ Bước 2/2 · ${esc(r.ho_ten)}: chép TIN nhắn`; }
    return "▶ Gửi lần lượt (em tiếp theo)";
  };
  const ve = () => {
    const coSdt = rows.filter((r) => r.sdt), xong = rows.filter((r) => tt(r) === "da_gui").length;
    k.innerHTML = `<div class="filters"><select class="input" data-ch="csLoai">${Object.entries(CS_LOAI).map(([v, t]) => `<option value="${v}" ${v === CS.loai ? "selected" : ""}>${t}</option>`).join("")}</select>
        ${CS.loai === "hoc_phi" ? `<label class="small">Hạn đóng <input class="input" data-ch="csHan" value="${esc(CS.han)}" style="width:120px;display:inline-block"></label>` : ""}</div>
      <p class="small muted">${CS.loai === "nhan_xet_tuan" ? `Tuần từ ${d.tuan_tu ? esc(ngayVN(d.tuan_tu)) : "—"} · ` : ""}${rows.length} em · ${coSdt.length} có SĐT · ${rows.filter((r) => r.kiemTra).length} đã kiểm tra · ${xong} đã gửi.
        Cô xem lại tin + ảnh (👁), tích «Đã kiểm tra». Rồi bấm nút lớn: <b>bước 1</b> chép ẢNH phiếu và mở Zalo đúng phụ huynh → cô dán (Ctrl+V) ảnh vào khung chat; <b>bước 2</b> chép TIN → cô dán tin rồi bấm Gửi trong Zalo.
        ${CS_CO_CHEP_ANH ? "" : "<br>⚠️ Trình duyệt này không chép được ảnh: ảnh sẽ được tải xuống, cô gửi ảnh từ thư mục Tải về."}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="btn btn-sm" data-act="csKtHet">✅ Kiểm tra xong tất cả</button>
        <button class="btn btn-gold" data-act="csTiep" style="font-size:16px">${nutLon()}</button>${CS.buoc ? '<button class="btn btn-sm btn-ghost" data-act="csBoQua">Bỏ qua em này</button>' : ""}
        <button class="btn btn-sm btn-ghost" data-act="csNhatKy">🗂 Nhật ký gửi</button></div>
      ${rows.map((r, i) => `<div class="card cs-hang ${!r.sdt ? "thieu" : tt(r) === "da_gui" || tt(r) === "da_mo_zalo" ? "mo" : r.kiemTra ? "kt" : ""}" id="csH${i}" ${CS.buoc && CS.buoc.i === i ? 'style="outline:3px solid #f5b301"' : ""}>
        <div class="row between" style="gap:6px;flex-wrap:wrap"><span><b>${esc(r.ma_hs)} ${esc(r.ho_ten)}</b> · ${r.sdt ? "📞 " + esc(r.sdt) : '<a href="#/t/hs/' + r.user_id + '" style="color:var(--bad)">⚠️ Thiếu SĐT — nhập ở hồ sơ</a>'}</span>
          <span class="small">${tt(r) === "da_gui" ? `✅ Đã gửi · ${esc(r.gui.boi || "")} ${fmtDT(r.gui.cap_nhat)}` : tt(r) === "da_mo_zalo" ? "📨 Đã gửi ảnh, chưa gửi tin" : r.kiemTra ? "☑️ Đã kiểm tra" : "Chưa kiểm tra"}</span></div>
        ${r.canhBao ? `<div class="small" style="color:#b45309">⚠️ ${esc(r.canhBao)}</div>` : ""}
        <textarea class="input cs-tin" data-i="${i}" data-in="csSuaTin">${esc(r.tin)}</textarea>
        <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><label class="check"><input type="checkbox" data-ch="csKt" data-i="${i}" ${r.kiemTra ? "checked" : ""}> Đã kiểm tra</label>
          <button class="btn btn-sm" data-act="csXemAnh" data-i="${i}">👁 Xem ảnh</button>
          <button class="btn btn-sm" data-act="csChepI" data-i="${i}">📋 Chép tin</button>
          <button class="btn btn-sm" data-act="csAnhI" data-i="${i}">🖼 ${CS_CO_CHEP_ANH ? "Chép ảnh" : "Tải ảnh"}</button>
          <button class="btn btn-sm" data-act="csZaloI" data-i="${i}" ${r.sdt ? "" : "disabled"}>💬 Mở Zalo</button></div></div>`).join("")}`;
  };
  const ghi = async (r, trangThai) => {
    try { const g = await api("t_ghi_gui", { p: { user_id: r.user_id, loai: CS.loai, ky, trang_thai: trangThai, noi_dung: r.tin } }); r.gui = { trang_thai: g.trang_thai, so_lan_mo: g.so_lan_mo, cap_nhat: g.cap_nhat, boi: S.user && S.user.code }; r.kiemTra = true; }
    catch (e) { toast(e.message, 4000); }
  };
  const cuon = (i) => { const el = document.getElementById("csH" + i); if (el) el.scrollIntoView({ block: "center" }); };
  ACT["ch:csLoai"] = (el) => { CS.loai = el.value; csGui(); };
  ACT["ch:csHan"] = (el) => { CS.han = el.value; rows.forEach((r) => { r.tin = csDien(CS.loai, r); }); ve(); };
  ACT["in:csSuaTin"] = (el) => { rows[Number(el.dataset.i)].tin = el.value; };
  ACT["ch:csKt"] = async (el) => { const r = rows[Number(el.dataset.i)]; if (el.checked) { await ghi(r, "da_kiem_tra"); } else { r.kiemTra = false; } ve(); };
  ACT.csKtHet = async (b) => busy(b, async () => { for (const r of rows) if (!r.kiemTra && r.sdt && !r.canhBao) await ghi(r, "da_kiem_tra"); ve(); toast("Đã đánh dấu kiểm tra các em có SĐT (bỏ qua em có cảnh báo)."); });
  ACT.csChepI = async (b) => toast((await csChep(rows[Number(b.dataset.i)].tin)) ? "Đã chép tin" : "Không chép được", 2500);
  ACT.csAnhI = async (b) => { try { const kq = await csChepAnh(rows[Number(b.dataset.i)], tenTep(rows[Number(b.dataset.i)])); toast(kq === "chep" ? "Đã chép ảnh phiếu — dán (Ctrl+V) vào Zalo" : "Đã tải ảnh phiếu xuống", 3000); } catch (e) { toast(e.message, 4000); } };
  ACT.csZaloI = (b) => { if (!csMoZalo(rows[Number(b.dataset.i)].sdt)) toast("Em này chưa có SĐT phụ huynh."); };
  ACT.csXemAnh = async (b) => {
    const r = rows[Number(b.dataset.i)];
    openSheet(`<div class="row between"><h2 style="margin:0">👁 Ảnh phiếu · ${esc(r.ho_ten)}</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="csXem">${spinner()}</div>`);
    try {
      await csTaiPhieuAnh(); const bl = await phieuAnh.vePhieu(CS.loai, r, CS.thang, CS.han);
      document.getElementById("csXem").innerHTML = bl ? `<img src="${URL.createObjectURL(bl)}" alt="Ảnh phiếu" style="width:100%;border-radius:12px">` : errBox("Chưa có dữ liệu để vẽ phiếu (ví dụ chưa có nhận xét tuần).");
    } catch (e) { document.getElementById("csXem").innerHTML = errBox(e); }
  };
  ACT.csBoQua = () => { CS.buoc = null; ve(); };
  ACT.csTiep = async () => {
    if (!CS.buoc) {
      const i = rows.findIndex((r) => r.sdt && r.kiemTra && tt(r) !== "da_gui");
      if (i < 0) { toast(rows.some((r) => r.sdt && !r.kiemTra) ? "Còn em chưa tích «Đã kiểm tra»." : "🎉 Đã gửi xong tất cả em đã kiểm tra.", 4000); return; }
      CS.buoc = { i, buoc: "anh" };
    }
    const r = rows[CS.buoc.i];
    if (CS.buoc.buoc === "anh") {
      try {
        const kq = await csChepAnh(r, tenTep(r));
        csMoZalo(r.sdt); await ghi(r, "da_mo_zalo");
        CS.buoc.buoc = "tin"; ve(); cuon(CS.buoc.i);
        toast(kq === "chep" ? `Đã chép ẢNH phiếu của ${r.ho_ten} và mở Zalo. Dán ảnh (Ctrl+V) vào khung chat rồi bấm bước 2.` : `Đã tải ảnh phiếu và mở Zalo. Gửi ảnh vừa tải rồi bấm bước 2.`, 6000);
      } catch (e) { toast(e.message, 4500); }
    } else {
      await csChep(r.tin); await ghi(r, "da_gui");
      CS.buoc = null; ve(); cuon(rows.indexOf(r));
      toast(`Đã chép TIN của ${r.ho_ten}. Dán vào Zalo rồi bấm Gửi. Bấm nút lớn để sang em tiếp theo.`, 6000);
    }
  };
  ACT.csNhatKy = async () => {
    openSheet(`<div class="row between"><h2 style="margin:0">🗂 Nhật ký gửi</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="csNk">${spinner()}</div>`);
    try {
      const nk = await api("t_nhat_ky_gui", { p: { class_id: Number(CS.cls) } });
      const TT = { cho: "Chờ", da_kiem_tra: "Đã kiểm tra", da_mo_zalo: "Đã gửi ảnh", da_gui: "Đã gửi ảnh + tin", loi: "Lỗi" };
      document.getElementById("csNk").innerHTML = nk.length ? nk.map((g) => `<div style="padding:6px 0;border-bottom:1px solid #eef1f8"><b>${esc(g.ma_hs)} ${esc(g.ho_ten)}</b> · ${esc((CS_LOAI[g.loai] || (CS.mau.find((m) => m.ma === g.loai) || {}).ten || g.loai))}${g.ky ? " · " + esc(g.ky) : ""}
        <div class="small muted">${esc(TT[g.trang_thai] || g.trang_thai)}${g.so_lan_mo > 1 ? " (mở Zalo " + g.so_lan_mo + " lần)" : ""} · ${esc(g.boi || "")} · ${fmtDT(g.cap_nhat)}</div></div>`).join("") : '<div class="empty small">Chưa gửi lần nào.</div>';
    } catch (e) { document.getElementById("csNk").innerHTML = errBox(e); }
  };
  ve();
}

async function csBaoCao() {
  const k = document.getElementById("csNoi");
  if (!CS.cls) { k.innerHTML = '<div class="alert alert-warn">Chọn một lớp để xem báo cáo tháng.</div>'; return; }
  k.innerHTML = spinner();
  let d;
  try { d = await api("t_bao_cao_thang", { p: { class_id: Number(CS.cls), thang: CS.thang } }); } catch (e) { k.innerHTML = errBox(e); return; }
  k.innerHTML = `<div class="row between no-print" style="margin-bottom:8px"><p class="small muted" style="margin:0">${esc(d.lop || "")} · ${esc(thangVN(d.thang))} · ${d.rows.length} em. Học sinh / phụ huynh xem báo cáo của con ở tab «📝 Nhận xét» (chỉ nhận xét đã công khai).</p>
      <button class="btn btn-sm" data-act="csIn">🖨 In / lưu PDF</button></div>
    ${d.rows.map((r) => `<div><a href="#/t/hs/${r.user_id}" class="small no-print"><b>${esc(r.ma_hs)}</b> ${esc(r.ho_ten)}</a>${bcTheHtml(r.bao_cao, r.ma_hs + " " + r.ho_ten)}</div>`).join("") || '<div class="empty">Lớp chưa có học sinh.</div>'}`;
  ACT.csIn = () => window.print();
}

function csMau() {
  const k = document.getElementById("csNoi");
  const BIEN = ["{ten_hs}", "{ma_hs}", "{lop}", "{thang}", "{so_buoi}", "{so_tien}", "{ngan_hang}", "{stk}", "{chu_tk}", "{noi_dung_ck}", "{han}", "{so_bai}", "{ten_bai}", "{han_bai}", "{ngay}", "{ky}", "{tom_tat}", "{link}"];
  k.innerHTML = `<div class="card"><b>📱 QR Zalo trung tâm</b><div class="small muted">Ảnh mã QR Zalo của trung tâm — in kèm phiếu / đưa phụ huynh quét để kết bạn trước (Zalo cá nhân nhắn người lạ dễ bị chặn).</div>
      <div id="csQr" style="margin-top:8px">${spinner()}</div></div>
    <p class="small muted">Chữ trong ngoặc nhọn được điền tự động theo từng em: ${BIEN.map((b) => `<code>${b}</code>`).join(" ")}</p>
    ${CS.mau.map((m) => `<div class="card"><div class="row between"><b>${esc(m.ten)}</b>${m.da_sua ? '<span class="badge gold">Đã sửa</span>' : '<span class="badge">Mặc định</span>'}</div>
      <textarea class="input cs-tin" id="csM_${m.ma}" maxlength="2000">${esc(m.noi_dung)}</textarea>
      <div class="row" style="gap:6px;margin-top:6px"><button class="btn btn-sm btn-primary" data-act="csLuuMau" data-m="${m.ma}">Lưu</button>
        ${m.da_sua ? `<button class="btn btn-sm btn-ghost" data-act="csGocMau" data-m="${m.ma}">Khôi phục mặc định</button>` : ""}</div></div>`).join("")}`;
  const tai = async () => { CS.mau = await api("t_ds_mau_tin"); csMau(); };
  const veQr = async () => {
    const q = document.getElementById("csQr"); if (!q) return;
    try {
      const a = await api("t_doc_anh_trung_tam", { p_ma: "qr_zalo" });
      const src = a.co ? `data:${a.mime};base64,${a.b64}` : "";
      q.innerHTML = `${src ? `<img src="${src}" alt="QR Zalo trung tâm" style="width:180px;height:180px;object-fit:contain;border:1px solid #eef1f8;border-radius:12px;background:#fff">` : '<p class="small">Chưa có ảnh QR.</p>'}
        <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn btn-sm btn-primary" data-act="csQrTai">⬆ ${src ? "Đổi ảnh" : "Tải ảnh QR lên"}</button>
        ${src ? `<a class="btn btn-sm" href="${src}" download="qr_zalo_ms_ninh.${a.mime === "image/png" ? "png" : "jpg"}">⬇ Tải về để in</a><button class="btn btn-sm btn-ghost" data-act="csQrXoa">Xoá</button>` : ""}</div>`;
    } catch (e) { q.innerHTML = errBox(e); }
  };
  ACT.csQrTai = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/jpeg,image/webp";
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 2 * 1024 * 1024) { toast("Ảnh quá lớn (tối đa 2 MB)."); return; }
      const b64 = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.readAsDataURL(f); });
      try { await api("t_luu_anh_trung_tam", { p_ma: "qr_zalo", p_mime: f.type || "image/png", p_b64: b64 }); toast("Đã lưu ảnh QR Zalo"); veQr(); } catch (e) { toast(e.message, 4000); }
    };
    inp.click();
  };
  ACT.csQrXoa = () => { if (confirm("Xoá ảnh QR Zalo?")) api("t_luu_anh_trung_tam", { p_ma: "qr_zalo", p_mime: null, p_b64: null }).then(veQr, (e) => toast(e.message)); };
  veQr();
  ACT.csLuuMau = (b) => busy(b, async () => { try { await api("t_luu_mau_tin", { p_ma: b.dataset.m, p_noi_dung: document.getElementById("csM_" + b.dataset.m).value }); toast("Đã lưu mẫu"); await tai(); } catch (e) { toast(e.message, 4000); } });
  ACT.csGocMau = (b) => { if (confirm("Khôi phục mẫu mặc định?")) busy(b, async () => { try { await api("t_luu_mau_tin", { p_ma: b.dataset.m, p_noi_dung: null }); await tai(); } catch (e) { toast(e.message); } }); };
}
