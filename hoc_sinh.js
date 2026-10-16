/* Trang GV: "👩‍🎓 Hoc sinh" (#/t/hoc-sinh), "Ho so" 1 em (#/t/hs/<id>), "📝 Nhan xet tuan" (#/t/nhan-xet).
 * Cong la nguon chinh cua danh sach HS; khong xoa cung (trang thai dang hoc / bao luu / nghi hoc). Moi thay doi ghi lich su.
 * SDT phu huynh chi hien o trang GV. Chi tai file nay khi giao vien mo cac muc tren. */

const HS_TT = { dang_hoc: ["Đang học", "hw"], bao_luu: ["Bảo lưu", "gold"], nghi_hoc: ["Nghỉ học", "exam"] };
const HS = { cls: "", tt: "dang_hoc", tim: "" };
function hsTT(t) { const x = HS_TT[t] || [t, ""]; return `<span class="badge ${x[1]}">${esc(x[0])}</span>`; }
function hsHomNay() { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); }

async function tHocSinh(query) {
  app.innerHTML = tShell("hocsinh", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  if (query && query.get("lop")) HS.cls = query.get("lop");
  const main = app.querySelector("main");
  main.innerHTML = `<div class="row between" style="margin-bottom:8px;gap:6px;flex-wrap:wrap"><h1 style="margin:0">👩‍🎓 Học sinh</h1><div class="row" style="gap:6px;flex-wrap:wrap">
      <button class="btn btn-sm" data-act="hsXuat">📤 Xuất Excel</button><button class="btn btn-sm" data-act="hsNhap">📥 Nhập Excel</button><button class="btn btn-primary" data-act="hsThem">＋ Thêm học sinh</button></div></div>
    <div class="filters">
      <select class="input" data-ch="hsLop" aria-label="Lớp"><option value="">Tất cả lớp</option>${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === HS.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <select class="input" data-ch="hsTT" aria-label="Trạng thái">${[["dang_hoc", "Đang học"], ["bao_luu", "Bảo lưu"], ["nghi_hoc", "Nghỉ học"], ["tat_ca", "Tất cả"]].map(([k, t]) => `<option value="${k}" ${k === HS.tt ? "selected" : ""}>${t}</option>`).join("")}</select>
      <input class="input" data-in="hsTim" placeholder="Tìm tên / mã…" value="${esc(HS.tim)}" style="max-width:200px" aria-label="Tìm">
    </div><div id="hsDs">${spinner()}</div>`;
  let hen = null, ds = null;
  const ve = async () => {
    const k = document.getElementById("hsDs");
    try { ds = await api("t_ds_hoc_sinh", { p: { class_id: HS.cls ? Number(HS.cls) : null, trang_thai: HS.tt } }); } catch (e) { k.innerHTML = errBox(e); return; }
    loc();
  };
  const loc = () => {
    const k = document.getElementById("hsDs"); if (!k || !ds) return;
    const q = boDau(HS.tim).toLowerCase().trim();
    const rows = ds.rows.filter((r) => !q || boDau(r.ho_ten || "").toLowerCase().includes(q) || String(r.ma_hs).toLowerCase().startsWith(q));
    const dem = ds.dem || {};
    k.innerHTML = `<p class="small muted">Đang học ${dem.dang_hoc || 0} · Bảo lưu ${dem.bao_luu || 0} · Nghỉ học ${dem.nghi_hoc || 0} · Hiện ${rows.length} em. Bấm vào một em để xem hồ sơ.</p>
      ${rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Mã</th><th>Họ và tên</th><th>Lớp</th><th>Trạng thái</th><th class="hide-sm">Nhập học</th><th class="hide-sm">Đăng nhập gần nhất</th></tr></thead><tbody>
        ${rows.map((r) => `<tr class="tap" data-act="hsMo" data-id="${r.id}" style="cursor:pointer"><td><b>${esc(r.ma_hs)}</b></td><td class="wrap">${esc(r.ho_ten)}</td><td>${esc(r.lop || "—")}</td>
          <td>${hsTT(r.trang_thai)}</td><td class="small hide-sm">${r.ngay_nhap_hoc ? esc(ngayVN(r.ngay_nhap_hoc)) : ""}</td><td class="small hide-sm">${r.last_login ? fmtDT(r.last_login) : '<span class="faint">Chưa</span>'}</td></tr>`).join("")}
      </tbody></table></div>` : '<div class="empty">Không có học sinh phù hợp.</div>'}`;
  };
  ACT["ch:hsLop"] = (el) => { HS.cls = el.value; ve(); };
  ACT["ch:hsTT"] = (el) => { HS.tt = el.value; ve(); };
  ACT["in:hsTim"] = (el) => { HS.tim = el.value; clearTimeout(hen); hen = setTimeout(loc, 150); };
  ACT.hsMo = (el) => go("#/t/hs/" + el.dataset.id);
  ACT.hsThem = () => hsFormThem(ov, ds ? ds.ma_goi_y : "");
  ACT.hsXuat = (b) => busy(b, () => hsXuatExcel());
  ACT.hsNhap = () => hsNhapExcel();
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
  ve();
}

function hsFormThem(ov, goiY) {
  openSheet(`<form data-submit="hsLuuThem"><div class="row between"><h2 style="margin:0">＋ Thêm học sinh</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
    <div class="field"><label class="f">Mã học sinh</label><input class="input" name="ma" placeholder="Để trống = ${esc(goiY)} (số tiếp theo)" maxlength="20"></div>
    <div class="field"><label class="f">Họ và tên *</label><input class="input" name="ten" required maxlength="120"></div>
    <div class="field"><label class="f">Lớp</label><select class="input" name="lop"><option value="">— Chưa xếp lớp —</option>${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === HS.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
    <div class="field"><label class="f">Ngày sinh</label><input class="input" type="date" name="ns"></div>
    <div class="field"><label class="f">Ngày nhập học</label><input class="input" type="date" name="ngay" value="${hsHomNay()}"></div>
    <div class="field"><label class="f">SĐT / Zalo phụ huynh (không bắt buộc, chỉ cô xem)</label><input class="input" name="sdt" inputmode="tel" maxlength="30"></div>
    <div class="field"><label class="f">Tên phụ huynh (vd: Chị Lan – mẹ)</label><input class="input" name="tph" maxlength="80"></div>
    <div class="field"><label class="f">Ghi chú</label><textarea class="input" name="gc" rows="2" maxlength="500"></textarea></div>
    <div id="hsLoi"></div><button class="btn btn-primary btn-block">Thêm học sinh</button></form>`);
  ACT.hsLuuThem = (f) => busy(f.querySelector("button.btn-primary"), async () => {
    try {
      const r = await api("t_them_hoc_sinh", { p: { ma_hs: f.ma.value.trim(), ho_ten: f.ten.value, class_id: f.lop.value ? Number(f.lop.value) : null, ngay_sinh: f.ns.value || null, ngay_nhap_hoc: f.ngay.value, sdt_phu_huynh: f.sdt.value, ten_phu_huynh: f.tph.value, ghi_chu: f.gc.value } });
      closeSheet();
      alert(`Đã thêm ${f.ten.value.trim()}\nMã học sinh: ${r.ma_hs}\nMật khẩu lần đầu: ${r.pin}\n(Em đăng nhập lần đầu sẽ phải đặt mật khẩu riêng.)`);
      route();
    } catch (e) { document.getElementById("hsLoi").innerHTML = errBox(e); }
  });
}

/* ---------------- Ho so 1 em ---------------- */
const HS_TRUONG = { tao: "Tạo hồ sơ", ten_phu_huynh: "Tên phụ huynh", ngay_sinh: "Ngày sinh", ho_ten: "Họ tên", lop: "Lớp", trang_thai: "Trạng thái", ngay_nhap_hoc: "Ngày nhập học", sdt_phu_huynh: "SĐT phụ huynh", ghi_chu: "Ghi chú", dat_lai_mk: "Đặt lại mật khẩu" };
function hsGiaTri(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    if (v.trang_thai) return (HS_TT[v.trang_thai] || [v.trang_thai])[0] + (v.ngay_hieu_luc ? " (từ " + ngayVN(v.ngay_hieu_luc) + ")" : "");
    if ("lop" in v) return (v.lop || "—") + (v.ngay_hieu_luc ? " (từ " + ngayVN(v.ngay_hieu_luc) + ")" : "") + (v.ma_hs ? " · mã " + v.ma_hs : "") + (v.ho_ten ? " · " + v.ho_ten : "");
    return JSON.stringify(v);
  }
  if (HS_TT[v]) return HS_TT[v][0];
  return String(v);
}

async function tHoSo(id) {
  nxCss();
  app.innerHTML = tShell("hocsinh", spinner());
  ACT.retry = () => route();
  let d, ov;
  try { [d, ov] = await Promise.all([api("t_ho_so_hoc_sinh", { p_user_id: id }), api("t_overview")]); } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/hoc-sinh"); return; }
  const h = d.hoc_sinh;
  const ttDiemDanh = d.diem_danh.slice(0, 40);
  app.querySelector("main").innerHTML = `<a href="#/t/hoc-sinh" class="small">‹ Danh sách học sinh</a>
    <div class="card" style="margin-top:8px">
      <div class="row between" style="gap:8px;flex-wrap:wrap"><h1 style="margin:0">${esc(h.ho_ten)}</h1>${hsTT(h.trang_thai)}</div>
      <p style="margin:6px 0">Mã <b>${esc(h.ma_hs)}</b> · ${esc(h.lop || "Chưa xếp lớp")}${h.ngay_sinh ? " · 🎂 " + esc(hsNgay(h.ngay_sinh)) : ""}${h.ngay_nhap_hoc ? " · nhập học " + esc(hsNgay(h.ngay_nhap_hoc)) : ""}</p>
      <p class="small muted" style="margin:4px 0">📞 Phụ huynh${h.ten_phu_huynh ? " (" + esc(h.ten_phu_huynh) + ")" : ""}: ${h.sdt_phu_huynh ? `<a href="tel:${esc(h.sdt_phu_huynh.replace(/[^0-9+]/g, ""))}">${esc(h.sdt_phu_huynh)}</a> · <a href="https://zalo.me/${esc(h.sdt_phu_huynh.replace(/[^0-9]/g, ""))}" target="_blank" rel="noopener">Zalo</a>` : "chưa có"}
        ${h.ghi_chu ? "<br>📝 " + esc(h.ghi_chu) : ""}<br>🔑 ${h.initial_pin ? "Chưa đặt mật khẩu riêng (mã lần đầu: <code>" + esc(h.initial_pin) + "</code>)" : "Em đã đặt mật khẩu riêng"} · đăng nhập gần nhất: ${h.last_login ? fmtDT(h.last_login) : "chưa"}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-sm" data-act="hsSua">✏️ Sửa thông tin</button><button class="btn btn-sm" data-act="hsLop">🏫 Chuyển lớp</button>
        <button class="btn btn-sm" data-act="hsTrangThai">🔁 Trạng thái</button><button class="btn btn-sm" data-act="hsMk">🔑 Đặt lại mật khẩu</button><a class="btn btn-sm" href="#/t/cham-soc?tin=${h.id}">✉️ Tin nhắn phụ huynh</a></div>
    </div>
    <h2>📝 Nhận xét tuần</h2>${d.nhan_xet_tuan.length ? d.nhan_xet_tuan.slice(0, 8).map((n) => nxTheHtml(n)).join("") + (d.nhan_xet_tuan.length > 8 ? `<p class="small muted">… và ${d.nhan_xet_tuan.length - 8} tuần trước.</p>` : "") : '<div class="empty small">Chưa có nhận xét tuần.</div>'}
    <h2>🏆 Kết quả gần đây</h2>${d.ket_qua.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Ngày</th><th>Nguồn</th><th>Bài</th><th>Điểm</th></tr></thead><tbody>
      ${d.ket_qua.slice(0, 30).map((k) => `<tr><td class="small">${fmtDT(k.ngay)}</td><td>${esc((NGUON[k.nguon] || { nhan: k.nguon }).nhan)}</td><td class="wrap">${esc(k.ten)}</td>
        <td><b class="score ${scoreCls(k.diem10)}">${fmtScore(k.diem10)}</b>${k.tong ? ` <span class="small muted">${k.dung ?? "?"}/${k.tong}</span>` : ""}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty small">Chưa có kết quả.</div>'}
    <h2>📅 Điểm danh gần đây</h2>${ttDiemDanh.length ? `<p>${ttDiemDanh.map((a) => `<span class="badge ${a.co_mat ? "hw" : "exam"}" title="${esc(a.lop)}${a.sua_boi ? " · cô đã sửa" : ""}" style="margin:2px">${a.co_mat ? "✓" : "✗"} ${esc(ngayVN(a.ngay))}</span>`).join("")}</p>` : '<div class="empty small">Chưa có điểm danh.</div>'}
    <h2>💰 Học phí</h2>${d.hoc_phi.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Tháng</th><th>Số buổi</th><th>Thành tiền</th><th>Trạng thái</th></tr></thead><tbody>
      ${d.hoc_phi.map((f) => `<tr><td>${esc(thangVN(f.thang))}</td><td>${f.so_buoi ?? "—"}</td><td>${f.thanh_tien === null ? "—" : tien(f.thanh_tien)}</td>
        <td>${f.da_dong ? `<span class="badge hw">✓ Đã đóng ${f.ngay_dong ? esc(ngayVN(f.ngay_dong)) : ""}</span>` : '<span class="badge exam">Chưa đóng</span>'}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty small">Chưa có học phí.</div>'}
    <h2>🗂 Lịch sử thay đổi</h2>${d.lich_su.length ? d.lich_su.map((l) => `<div style="padding:6px 0;border-bottom:1px solid #eef1f8"><b>${esc(HS_TRUONG[l.truong] || l.truong)}</b>
      ${l.truong === "tao" || l.truong === "dat_lai_mk" ? (l.thanh ? ": " + esc(hsGiaTri(l.thanh)) : "") : `: ${esc(hsGiaTri(l.tu))} → <b>${esc(hsGiaTri(l.thanh))}</b>`}
      <div class="small muted">${esc(l.boi)} · ${fmtDT(l.luc)}</div></div>`).join("") : '<div class="empty small">Chưa có thay đổi.</div>'}`;
  const luu = async (btn, p) => {
    try { await api("t_sua_hoc_sinh", { p_user_id: id, p }); closeSheet(); toast("Đã lưu"); route(); }
    catch (e) { toast(e.message, 4500); }
  };
  ACT.hsSua = () => {
    openSheet(`<form data-submit="hsLuuSua"><div class="row between"><h2 style="margin:0">✏️ Sửa thông tin</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
      <div class="field"><label class="f">Họ và tên</label><input class="input" name="ten" value="${esc(h.ho_ten)}" required maxlength="120"></div>
      <div class="field"><label class="f">Ngày sinh</label><input class="input" type="date" name="ns" value="${esc(h.ngay_sinh || "")}"></div>
      <div class="field"><label class="f">Ngày nhập học</label><input class="input" type="date" name="ngay" value="${esc(h.ngay_nhap_hoc || "")}"></div>
      <div class="field"><label class="f">SĐT / Zalo phụ huynh (chỉ cô xem)</label><input class="input" name="sdt" inputmode="tel" value="${esc(h.sdt_phu_huynh || "")}" maxlength="30"></div>
      <div class="field"><label class="f">Tên phụ huynh</label><input class="input" name="tph" value="${esc(h.ten_phu_huynh || "")}" maxlength="80"></div>
      <div class="field"><label class="f">Ghi chú</label><textarea class="input" name="gc" rows="2" maxlength="500">${esc(h.ghi_chu || "")}</textarea></div>
      <button class="btn btn-primary btn-block">Lưu</button></form>`);
    ACT.hsLuuSua = (f) => busy(f.querySelector("button.btn-primary"), () => luu(null, { ho_ten: f.ten.value, ngay_sinh: f.ns.value || null, ngay_nhap_hoc: f.ngay.value || null, sdt_phu_huynh: f.sdt.value, ten_phu_huynh: f.tph.value, ghi_chu: f.gc.value }));
  };
  ACT.hsLop = () => {
    openSheet(`<form data-submit="hsLuuLop"><div class="row between"><h2 style="margin:0">🏫 Chuyển lớp</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
      <p class="small muted">Lớp hiện tại: <b>${esc(h.lop || "chưa xếp")}</b>. Điểm, điểm danh, học phí cũ giữ nguyên.</p>
      <div class="field"><label class="f">Lớp mới</label><select class="input" name="lop"><option value="">— Chưa xếp lớp —</option>${ov.classes.map((c) => `<option value="${c.id}" ${c.id === h.class_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      <div class="field"><label class="f">Ngày hiệu lực</label><input class="input" type="date" name="ngay" value="${hsHomNay()}"></div>
      <button class="btn btn-primary btn-block">Chuyển lớp</button></form>`);
    ACT.hsLuuLop = (f) => busy(f.querySelector("button.btn-primary"), () => luu(null, { class_id: f.lop.value ? Number(f.lop.value) : null, ngay_hieu_luc: f.ngay.value }));
  };
  ACT.hsTrangThai = () => {
    openSheet(`<form data-submit="hsLuuTT"><div class="row between"><h2 style="margin:0">🔁 Trạng thái</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
      ${Object.entries(HS_TT).map(([k, [t]]) => `<label class="check" style="display:block;margin:6px 0"><input type="radio" name="tt" value="${k}" ${k === h.trang_thai ? "checked" : ""}> ${t}</label>`).join("")}
      <p class="small muted">«Nghỉ học»: em không đăng nhập được và ẩn khỏi danh sách mặc định. Không xoá dữ liệu — chuyển lại «Đang học» là dùng tiếp.</p>
      <div class="field"><label class="f">Ngày hiệu lực</label><input class="input" type="date" name="ngay" value="${hsHomNay()}"></div>
      <button class="btn btn-primary btn-block">Lưu</button></form>`);
    ACT.hsLuuTT = (f) => busy(f.querySelector("button.btn-primary"), () => luu(null, { trang_thai: f.querySelector("input[name=tt]:checked").value, ngay_hieu_luc: f.ngay.value }));
  };
  ACT.hsMk = (b) => {
    if (!confirm(`Đặt lại mật khẩu cho ${h.ho_ten}?\nEm đăng nhập bằng mật khẩu 6 số mới rồi phải đặt mật khẩu riêng ngay.`)) return;
    busy(b, async () => { try { const r = await api("t_reset_password", { p_user_id: id }); alert(`Mật khẩu mới của ${h.ho_ten}: ${r.pin}`); route(); } catch (e) { toast(e.message); } });
  };
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
}

/* ---------------- Nhan xet tuan theo lop ---------------- */
async function tNhanXet(query) {
  nxCss();
  app.innerHTML = tShell("nhanxettuan", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const st = { cls: (query && query.get("lop")) || "", tuan: "" };
  const main = app.querySelector("main");
  const ve = async () => {
    main.innerHTML = `<h1>📝 Nhận xét tuần</h1><div id="nxKhung">${spinner()}</div>`;
    let d;
    try { d = await api("t_nhan_xet_tuan", { p: { class_id: st.cls ? Number(st.cls) : null, tuan_tu: st.tuan || null } }); }
    catch (e) { document.getElementById("nxKhung").innerHTML = errBox(e); return; }
    st.tuan = d.tuan_tu || "";
    document.getElementById("nxKhung").innerHTML = `<div class="filters">
        <select class="input" data-ch="nxLop" aria-label="Lớp"><option value="">Tất cả lớp</option>${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === st.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <select class="input" data-ch="nxTuan" aria-label="Tuần">${d.cac_tuan.length ? d.cac_tuan.map((t) => `<option value="${esc(t)}" ${t === d.tuan_tu ? "selected" : ""}>Tuần từ ${esc(ngayVN(t))}</option>`).join("") : "<option>Chưa có tuần nào</option>"}</select></div>
      <p class="small muted">Phiếu do phần mềm điểm danh (webcam) gửi lên mỗi khi xuất phiếu tuần. «Nháp» = phụ huynh / học sinh chưa thấy. Bấm tên em để mở hồ sơ.</p>
      ${d.rows.length ? d.rows.map((r) => `<div><a href="#/t/hs/${r.user_id}" class="small"><b>${esc(r.ma_hs)}</b> ${esc(r.ho_ten)}</a>${nxTheHtml(r, r.lop)}</div>`).join("") : '<div class="empty">Chưa có nhận xét tuần cho lựa chọn này.</div>'}`;
  };
  ACT["ch:nxLop"] = (el) => { st.cls = el.value; st.tuan = ""; ve(); };
  ACT["ch:nxTuan"] = (el) => { st.tuan = el.value; ve(); };
  ve();
}

/* ---------------- Nhap / xuat Excel danh sach HS ---------------- */
function hsNgay(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; }
const HS_COT = [["ma_hs", "Mã học sinh"], ["ho_ten", "Họ và tên"], ["lop", "Lớp"], ["ngay_sinh", "Ngày sinh"], ["ngay_nhap_hoc", "Ngày nhập học"],
  ["sdt_phu_huynh", "SĐT phụ huynh"], ["ten_phu_huynh", "Tên phụ huynh"], ["ghi_chu", "Ghi chú"], ["trang_thai", "Trạng thái"]];
function hsTaiXlsx() {
  if (window.xlsxMini) return Promise.resolve();
  return new Promise((ok, loi) => { const s = document.createElement("script"); s.src = "xlsx_mini.js?v=2"; s.onload = ok; s.onerror = () => loi(new Error("Không tải được bộ đọc Excel.")); document.head.appendChild(s); });
}
async function hsXuatExcel() {
  try {
    await hsTaiXlsx();
    const d = await api("t_ds_hoc_sinh", { p: { trang_thai: "tat_ca" } });
    const rows = [HS_COT.map((c) => c[1])].concat(d.rows.map((r) => [r.ma_hs, r.ho_ten, r.lop || "", hsNgay(r.ngay_sinh), hsNgay(r.ngay_nhap_hoc), r.sdt_phu_huynh || "", r.ten_phu_huynh || "", r.ghi_chu || "", (HS_TT[r.trang_thai] || [r.trang_thai])[0]]));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(xlsxMini.taoXlsx(rows, "Học sinh"));
    a.download = `danh_sach_hoc_sinh_${hsHomNay()}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(`Đã xuất ${d.rows.length} học sinh. File có SĐT phụ huynh — cô giữ kín, không gửi lên nhóm.`, 5000);
  } catch (e) { toast(e.message, 4500); }
}
// Chuan hoa ngay: so serial Excel / dd/mm/yyyy / yyyy-mm-dd -> yyyy-mm-dd ("" neu trong)
function hsChuanNgay(v) {
  v = String(v || "").trim(); if (!v) return "";
  if (/^\d{4,5}(\.\d+)?$/.test(v)) { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 864e5); return d.toISOString().slice(0, 10); }
  let m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(v); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v); if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return v;  // de may chu bao loi dinh dang
}
function hsNhapExcel() {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    openSheet(`<div class="row between"><h2 style="margin:0">📥 Nhập Excel</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="hsNk">${spinner()}<p class="small muted">Đang đọc ${esc(f.name)}…</p></div>`);
    const k = () => document.getElementById("hsNk");
    try {
      await hsTaiXlsx();
      const bang = (await xlsxMini.docXlsx(f)).filter((r) => r.some((x) => String(x).trim() !== ""));
      if (bang.length < 2) throw new Error("File không có dòng dữ liệu nào.");
      const tieuDe = bang[0].map((x) => boDau(x).toLowerCase().trim());
      const viTri = {};
      HS_COT.forEach(([key, ten]) => {
        const t = boDau(ten).toLowerCase();
        const j = tieuDe.findIndex((h) => h === t || (key === "ma_hs" && /^ma\b/.test(h)) || (key === "ho_ten" && /ho.*ten/.test(h)) || (key === "sdt_phu_huynh" && /sdt|dien thoai|zalo/.test(h)) || (key === "ten_phu_huynh" && /ten.*phu huynh|ten ph\b/.test(h)));
        if (j >= 0) viTri[key] = j;
      });
      if (viTri.ma_hs === undefined) throw new Error("Không thấy cột «Mã học sinh» ở dòng đầu. Cô dùng file «📤 Xuất Excel» làm mẫu nhé.");
      const rows = bang.slice(1).map((r) => {
        const o = {};
        HS_COT.forEach(([key]) => { if (viTri[key] !== undefined) o[key] = String(r[viTri[key]] ?? "").trim(); });
        if ("ngay_sinh" in o) o.ngay_sinh = hsChuanNgay(o.ngay_sinh);
        if ("ngay_nhap_hoc" in o) o.ngay_nhap_hoc = hsChuanNgay(o.ngay_nhap_hoc);
        return o;
      });
      const xt = await api("t_nhap_hoc_sinh", { p_rows: rows, p_ghi: false });
      const TEN = { ten_phu_huynh: "tên PH", ho_ten: "tên", lop: "lớp", ngay_sinh: "ngày sinh", ngay_nhap_hoc: "nhập học", sdt_phu_huynh: "SĐT", ghi_chu: "ghi chú", trang_thai: "trạng thái" };
      const nhom = (loai) => xt.rows.filter((r) => r.loai === loai);
      k().innerHTML = `<p><b>${esc(f.name)}</b>: ${rows.length} dòng · <span class="badge hw">＋ ${xt.them} thêm</span> <span class="badge gold">✏️ ${xt.sua} sửa</span> <span class="badge">${xt.giu} giữ nguyên</span> <span class="badge exam">⚠️ ${xt.loi} lỗi</span></p>
        <p class="small muted">Chưa ghi gì. Cô xem lại rồi bấm «Ghi vào hệ thống». Dòng lỗi sẽ bị bỏ qua. Ô để trống / cột không có trong file thì giữ nguyên dữ liệu cũ.</p>
        ${nhom("loi").length ? `<div class="section-title">⚠️ Lỗi (bỏ qua)</div>${nhom("loi").map((r) => `<div class="small">Dòng ${r.index + 2} · ${esc(r.ma_hs || "(trống)")}: ${esc(r.ly_do)}</div>`).join("")}` : ""}
        ${nhom("them").length ? `<div class="section-title">＋ Thêm mới</div>${nhom("them").map((r) => `<div class="small">${esc(r.ma_hs)} ${esc(r.ho_ten)}${r.lop_moi ? ' <span class="badge gold">tạo lớp mới</span>' : ""}</div>`).join("")}` : ""}
        ${nhom("sua").length ? `<div class="section-title">✏️ Sửa</div>${nhom("sua").map((r) => `<div class="small"><b>${esc(r.ma_hs)} ${esc(r.ho_ten)}</b>: ${Object.entries(r.doi).map(([key, v]) => `${TEN[key] || key} ${esc(hsGiaTri(v[0]))} → <b>${esc(hsGiaTri(v[1]))}</b>`).join("; ")}${r.lop_moi ? ' <span class="badge gold">tạo lớp mới</span>' : ""}</div>`).join("")}` : ""}
        ${xt.them + xt.sua ? `<button class="btn btn-primary btn-block" style="margin-top:12px" data-act="hsGhiNhap">Ghi vào hệ thống (${xt.them} thêm, ${xt.sua} sửa)</button>` : '<p class="center">Không có gì cần ghi.</p>'}`;
      ACT.hsGhiNhap = (b) => busy(b, async () => {
        try { const g = await api("t_nhap_hoc_sinh", { p_rows: rows, p_ghi: true }); closeSheet(); toast(`Đã ghi: ${g.them} thêm, ${g.sua} sửa. Em mới có mật khẩu lần đầu ở phiếu in của lớp.`, 5000); route(); }
        catch (e) { toast(e.message, 4500); }
      });
    } catch (e) { k().innerHTML = errBox(e); }
  };
  inp.click();
}
