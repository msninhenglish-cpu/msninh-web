/* Trang GV "📅 Buoi hoc" (#/t/buoi-hoc): doi soat diem danh theo lop x thang.
 * Diem danh tren Cong la NGUON CHINH cua so buoi (hoc phi + phieu nhan xet tuan). Webcam day len; GV sua o,
 * them / xoa buoi, chot doi soat thang (khoa sua), xem lich su, dat don gia theo khoi.
 * Chi tai file nay khi giao vien mo muc nay. */

const BH = { cls: "", thang: "", loc: "", d: null };
const BH_THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function bhCss() {
  if (document.getElementById("bhCss")) return;
  const s = document.createElement("style");
  s.id = "bhCss";
  s.textContent = `
  .bh-bang { overflow: auto; max-height: calc(100vh - 260px); border-radius: 12px; background: #fff; box-shadow: 0 4px 16px rgba(40,60,130,.08); }
  .bh-bang table { border-collapse: separate; border-spacing: 0; font-size: 14px; min-width: 100%; }
  .bh-bang th, .bh-bang td { padding: 4px 6px; border-bottom: 1px solid #eef1f8; text-align: center; white-space: nowrap; background: #fff; }
  .bh-bang thead th { position: sticky; top: 0; z-index: 2; background: #f4f7ff; font-weight: 700; }
  .bh-bang .bh-ten { position: sticky; left: 0; z-index: 1; text-align: left; min-width: 150px; max-width: 190px; overflow: hidden; text-overflow: ellipsis; }
  .bh-bang thead .bh-ten { z-index: 3; }
  .bh-ngay { cursor: pointer; line-height: 1.15; } .bh-ngay small { display: block; font-weight: 400; color: var(--muted); }
  .bh-o { width: 34px; height: 34px; border-radius: 9px; border: 1px solid #dbe3f5; background: #f7f9ff; font-weight: 700; font-size: 16px; cursor: pointer; position: relative; }
  .bh-o.c { background: #e7f8ef; border-color: #9fdcbb; color: #11804b; }
  .bh-o.v { background: #fdecec; border-color: #f3b4b4; color: #c0392b; }
  .bh-o.s::after { content: ""; position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; }
  .bh-o:disabled { cursor: not-allowed; opacity: .75; }
  .bh-tong { font-weight: 700; color: var(--pri-d); }
  .bh-chot { background: #fff7e0; border: 1px solid #f5d27a; border-radius: 12px; padding: 10px 12px; margin: 8px 0; }
  .bh-chu-thich { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--muted); margin: 8px 0; align-items: center; }
  .bh-chu-thich .bh-o { width: 22px; height: 22px; font-size: 12px; cursor: default; }`;
  document.head.appendChild(s);
}

async function tBuoiHoc(query) {
  bhCss();
  BH.thang = thangHopLe(query.get("thang") || BH.thang);
  app.innerHTML = tShell("buoihoc", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  if (!ov.classes.length) { app.querySelector("main").innerHTML = '<div class="empty">Chưa có lớp nào.</div>'; return; }
  BH.cls = query.get("lop") || BH.cls || String(ov.classes[0].id);
  app.querySelector("main").innerHTML = `<h1>📅 Buổi học</h1>
    <div class="filters">
      <select class="input" data-ch="bhLop" aria-label="Lớp">${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === BH.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      <input class="input" type="month" data-ch="bhThang" value="${esc(BH.thang)}" aria-label="Tháng">
      <input class="input" data-in="bhLoc" placeholder="Lọc tên / mã…" value="${esc(BH.loc)}" style="max-width:180px" aria-label="Lọc tên">
    </div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0">
      <button class="btn btn-sm" data-act="bhThem">＋ Thêm buổi</button>
      <button class="btn btn-sm" data-act="bhChot" id="bhNutChot">🔒 Chốt đối soát</button>
      <button class="btn btn-sm btn-ghost" data-act="bhLichSu">🗂 Lịch sử</button>
      <button class="btn btn-sm btn-ghost" data-act="bhGia">💲 Đơn giá theo khối</button>
    </div>
    <div class="bh-chu-thich"><span><button class="bh-o c" tabindex="-1">✓</button> có mặt</span><span><button class="bh-o v" tabindex="-1">✗</button> vắng</span>
      <span><button class="bh-o" tabindex="-1">·</button> chưa ghi</span><span><button class="bh-o c s" tabindex="-1">✓</button> cô đã sửa tay</span>
      <span>Bấm ô để đổi: trống → ✓ → ✗ → trống. Bấm ngày ở đầu cột để xoá buổi.</span></div>
    <div id="bhKhung">${spinner()}</div>`;
  ACT["ch:bhLop"] = (el) => { BH.cls = el.value; bhVe(); };
  ACT["ch:bhThang"] = (el) => { if (el.value) { BH.thang = el.value; bhVe(); } };
  ACT["in:bhLoc"] = (el) => { BH.loc = el.value; bhBang(); };
  ACT.bhO = (b) => bhDoiO(b);
  ACT.bhNgay = (b) => bhMenuNgay(b.dataset.n);
  ACT.bhThem = () => bhThemBuoi();
  ACT.bhChot = () => bhChot();
  ACT.bhLichSu = () => bhLichSu();
  ACT.bhGia = () => bhDonGia();
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
  await bhVe();
}

async function bhVe() {
  const k = document.getElementById("bhKhung");
  if (!k) return;
  k.innerHTML = spinner();
  try { BH.d = await api("t_buoi_hoc", { p: { class_id: Number(BH.cls), thang: BH.thang } }); }
  catch (e) { k.innerHTML = errBox(e); return; }
  bhBang();
}

function bhNgayNgan(n) { const d = new Date(n + "T00:00:00"); return { dm: pad(d.getDate()) + "/" + pad(d.getMonth() + 1), thu: BH_THU[d.getDay()] }; }

function bhBang() {
  const k = document.getElementById("bhKhung"), d = BH.d;
  if (!k || !d) return;
  const chot = d.chot && d.chot.chot;
  const nut = document.getElementById("bhNutChot");
  if (nut) nut.textContent = chot ? "🔓 Mở chốt" : "🔒 Chốt đối soát";
  const loc = boDau(BH.loc).toLowerCase().trim();
  const hs = d.hs.filter((h) => !loc || boDau(h.ho_ten || "").toLowerCase().includes(loc) || String(h.ma_hs).includes(loc));
  const demNgay = (n) => d.hs.filter((h) => h.o[n] && h.o[n].c).length;
  k.innerHTML = `${chot ? `<div class="bh-chot">🔒 <b>Tháng ${esc(BH.thang.slice(5))}/${esc(BH.thang.slice(0, 4))} đã chốt đối soát</b> (${esc(d.chot.chot_boi || "")}, ${fmtDT(d.chot.chot_luc)}). Không sửa được điểm danh tháng này — bấm «Mở chốt» nếu cần sửa.</div>` : ""}
    ${d.ngay.length ? "" : '<div class="alert alert-warn">Tháng này lớp chưa có buổi nào. Webcam chưa gửi điểm danh, hoặc bấm «＋ Thêm buổi».</div>'}
    <div class="bh-bang"><table><thead><tr><th class="bh-ten">Học sinh (${hs.length})</th>
      ${d.ngay.map((n) => { const x = bhNgayNgan(n); return `<th class="bh-ngay" data-act="bhNgay" data-n="${esc(n)}" title="Bấm để xoá buổi này">${x.dm}<small>${x.thu}</small></th>`; }).join("")}
      <th>Có mặt</th></tr></thead><tbody>
      ${hs.map((h) => `<tr><td class="bh-ten" title="${esc(h.ho_ten)}"><b>${esc(h.ma_hs)}</b> ${esc(h.ho_ten || "")}${h.dang_hoc ? "" : ' <span class="faint small">(đã chuyển lớp)</span>'}</td>
        ${d.ngay.map((n) => { const o = h.o[n]; const cls = o ? (o.c ? "c" : "v") : ""; return `<td><button class="bh-o ${cls} ${o && o.s ? "s" : ""}" data-act="bhO" data-u="${h.user_id}" data-n="${esc(n)}" ${chot ? "disabled" : ""}
            title="${o ? (o.c ? "Có mặt" : "Vắng") + (o.g ? " · đến " + esc(o.g) : "") + (o.s ? " · cô đã sửa tay" : "") : "Chưa ghi"}" aria-label="${esc(h.ma_hs)} ngày ${esc(n)}">${o ? (o.c ? "✓" : "✗") : "·"}</button></td>`; }).join("")}
        <td class="bh-tong">${h.co_mat}</td></tr>`).join("")}
      </tbody><tfoot><tr><th class="bh-ten">Số em có mặt</th>${d.ngay.map((n) => `<th>${demNgay(n)}</th>`).join("")}<th>${d.ngay.length} buổi</th></tr></tfoot></table></div>
    <p class="small muted">Số buổi học phí = số ngày có mặt trong tháng (tự tính). Ô có chấm cam là cô đã sửa tay — phần mềm điểm danh gửi lại cũng không ghi đè.</p>`;
}

async function bhDoiO(b) {
  const d = BH.d, h = d.hs.find((x) => String(x.user_id) === b.dataset.u), n = b.dataset.n, o = h.o[n];
  const moi = !o ? true : o.c ? false : null; // trong -> co mat -> vang -> trong
  b.disabled = true;
  try {
    const r = await api("t_sua_diem_danh", { p: { class_id: Number(BH.cls), user_id: h.user_id, ngay: n, co_mat: moi } });
    if (moi === null) delete h.o[n]; else h.o[n] = Object.assign({}, o || {}, { c: moi, s: true });
    h.co_mat = Object.values(h.o).filter((x) => x.c).length;
    bhBang();
    if (r.so_buoi_thang !== undefined) toast(`Đã lưu · ${h.ma_hs}: ${r.so_buoi_thang} buổi có mặt trong tháng`);
  } catch (e) { toast(e.message, 4500); b.disabled = false; }
}

function bhMenuNgay(n) {
  const x = bhNgayNgan(n), d = BH.d;
  const co = d.hs.filter((h) => h.o[n] && h.o[n].c).length, vang = d.hs.filter((h) => h.o[n] && !h.o[n].c).length;
  openSheet(`<div class="row between"><h2 style="margin:0">Buổi ${x.thu} ${x.dm}</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
    <p>${co} em có mặt · ${vang} em vắng.</p>
    ${d.chot && d.chot.chot ? '<div class="alert alert-warn">Tháng đã chốt — mở chốt trước khi xoá.</div>' : `<button class="btn btn-danger btn-block" data-act="bhXoa">🗑 Xoá buổi này (ghi nhầm)</button>
    <p class="small muted">Xoá toàn bộ điểm danh của lớp trong ngày này. Có ghi lịch sử (lưu lại danh sách cũ).</p>`}`);
  ACT.bhXoa = (b) => {
    if (!confirm(`Xoá buổi ${x.dm} của lớp? ${co + vang} ô điểm danh sẽ bị xoá.`)) return;
    busy(b, async () => {
      try { const r = await api("t_xoa_buoi", { p: { class_id: Number(BH.cls), ngay: n } }); closeSheet(); toast(`Đã xoá buổi ${x.dm} (${r.xoa} ô)`); bhVe(); }
      catch (e) { toast(e.message, 4500); }
    });
  };
}

function bhThemBuoi() {
  const homNay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const macDinh = homNay.slice(0, 7) === BH.thang ? homNay : BH.thang + "-01";
  openSheet(`<form data-submit="bhLuuBuoi"><div class="row between"><h2 style="margin:0">＋ Thêm buổi</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
    <p class="small muted">Dùng khi lớp có học nhưng phần mềm điểm danh chưa ghi. Thêm xong, cô bấm từng ô để đánh dấu có mặt / vắng.</p>
    <div class="field"><label class="f">Ngày học</label><input class="input" type="date" name="ngay" value="${macDinh}" required></div>
    <button class="btn btn-primary btn-block">Thêm buổi</button></form>`);
  ACT.bhLuuBuoi = (f) => busy(f.querySelector("button.btn-primary"), async () => {
    try {
      await api("t_them_buoi", { p: { class_id: Number(BH.cls), ngay: f.ngay.value } });
      closeSheet(); toast("Đã thêm buổi");
      if (f.ngay.value.slice(0, 7) !== BH.thang) { BH.thang = f.ngay.value.slice(0, 7); const m = app.querySelector('[data-ch="bhThang"]'); if (m) m.value = BH.thang; }
      bhVe();
    } catch (e) { toast(e.message, 4500); }
  });
}

async function bhChot() {
  const d = BH.d, dangChot = d && d.chot && d.chot.chot;
  const lop = app.querySelector('[data-ch="bhLop"] option:checked');
  const ten = (lop ? lop.textContent : "") + " tháng " + BH.thang.slice(5) + "/" + BH.thang.slice(0, 4);
  if (!confirm(dangChot ? `Mở chốt ${ten}? Sau khi mở, điểm danh tháng này sửa lại được.` : `Chốt đối soát ${ten}?\nSau khi chốt, cô và phần mềm điểm danh không sửa được điểm danh tháng này (mở chốt được).`)) return;
  try { await api("t_chot_thang", { p: { class_id: Number(BH.cls), thang: BH.thang, chot: !dangChot } }); toast(dangChot ? "Đã mở chốt" : "Đã chốt đối soát 🔒"); bhVe(); }
  catch (e) { toast(e.message, 4500); }
}

async function bhLichSu() {
  openSheet(`<div class="row between"><h2 style="margin:0">🗂 Lịch sử đối soát</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="bhLs">${spinner()}</div>`);
  const TEN = { sua: "✏️ Sửa ô", them_buoi: "＋ Thêm buổi", xoa_buoi: "🗑 Xoá buổi", chot: "🔒 Chốt", mo_chot: "🔓 Mở chốt", may_sua: "🤖 Máy đổi", don_gia_khoi: "💲 Giá khối", don_gia_hs: "💲 Giá riêng" };
  const gt = (v) => v === true ? "có mặt" : v === false ? "vắng" : v === null || v === undefined ? "trống" : typeof v === "object" ? (Array.isArray(v) ? v.length + " ô" : (v.khoi ? "khối " + v.khoi + ": " : "") + (v.don_gia == null ? "—" : tien(v.don_gia))) : (typeof v === "number" ? tien(v) : String(v));
  try {
    const ds = await api("t_lich_su_diem_danh", { p: { class_id: Number(BH.cls), thang: BH.thang } });
    document.getElementById("bhLs").innerHTML = ds.length ? ds.map((l) => `<div class="sw-item" style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #eef1f8">
        <div style="flex:1"><b>${TEN[l.thao_tac] || esc(l.thao_tac)}</b>${l.ngay ? " · " + esc(ngayVN(l.ngay)) : ""}${l.ma_hs ? " · " + esc(l.ma_hs) + " " + esc(l.ho_ten || "") : ""}
          ${l.thao_tac === "sua" || l.thao_tac === "may_sua" || l.thao_tac.startsWith("don_gia") ? `<div class="small">${esc(gt(l.tu))} → <b>${esc(gt(l.thanh))}</b></div>` : l.thao_tac === "xoa_buoi" ? `<div class="small">xoá ${esc(gt(l.tu))}</div>` : ""}
          <div class="small muted">${esc(l.boi)} · ${fmtDT(l.luc)}</div></div></div>`).join("") : '<div class="empty small">Chưa có thay đổi nào.</div>';
  } catch (e) { document.getElementById("bhLs").innerHTML = errBox(e); }
}

async function bhDonGia() {
  openSheet(`<div class="row between"><h2 style="margin:0">💲 Đơn giá theo khối</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="bhGia">${spinner()}</div>`);
  let ds;
  try { ds = await api("t_ds_don_gia_khoi"); } catch (e) { document.getElementById("bhGia").innerHTML = errBox(e); return; }
  const gia = {}; ds.forEach((x) => { gia[x.khoi] = x.don_gia; });
  document.getElementById("bhGia").innerHTML = `<form data-submit="bhLuuGia">
    <p class="small muted">Giá 1 buổi. Áp dụng cho tháng này trở đi, các tháng chưa đóng, em không có giá riêng. Để trống = chưa đặt (dùng giá phần mềm điểm danh gửi).</p>
    ${[2, 3, 4, 5, 6, 7, 8, 9].map((kh) => `<div class="row" style="gap:8px;align-items:center;margin:6px 0"><b style="width:70px">Khối ${kh}</b>
      <input class="input" type="number" min="0" step="1000" name="k${kh}" value="${gia[kh] ?? ""}" placeholder="vd 35000" style="max-width:160px"> <span class="small muted">đ/buổi</span></div>`).join("")}
    <button class="btn btn-primary btn-block">Lưu đơn giá</button></form>`;
  ACT.bhLuuGia = (f) => busy(f.querySelector("button.btn-primary"), async () => {
    try {
      let n = 0;
      for (const kh of [2, 3, 4, 5, 6, 7, 8, 9]) {
        const v = f["k" + kh].value.trim(), moi = v === "" ? null : Number(v);
        if (moi !== (gia[kh] ?? null)) { await api("t_dat_don_gia_khoi", { p_khoi: kh, p_don_gia: moi }); n++; }
      }
      closeSheet(); toast(n ? `Đã lưu ${n} khối` : "Không có thay đổi");
    } catch (e) { toast(e.message, 4500); }
  });
}
