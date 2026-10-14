/* Cong cu "Sua website" (trang giao vien, #/t/sua-web).
 * Co xem website y nhu khach (khung iframe), roi: sua chu tai cho, thay anh, an/hien + doi thu tu muc,
 * ghim ghi chu (kem anh mau) vao dung cho. Bam "Gui yeu cau" -> 1 phieu luu tren may chu (yeu_cau_web).
 * Website KHONG doi cho toi khi Claude doc phieu, sua code, chay thu va dua len.
 * Chi tai file nay khi giao vien mo muc nay (khong lam nang trang cong khai). */

const SW_NHAP = "kt_sua_web_nhap";
const SW_TRANG = [["trang-chu", "Trang chủ"], ["gioi-thieu", "Giới thiệu"], ["chuong-trinh", "Chương trình học"],
  ["hoat-dong", "Tin tức"], ["thanh-tich", "Thành tích"], ["lien-he", "Liên hệ"], ["dang-ky-tu-van", "Đăng ký tư vấn"], ["kiem-tra-thu", "Kiểm tra thử"]];
const SW_CHE_DO = [["xem", "👆 Xem", "Bấm link để đi tới các trang như khách"], ["chu", "✏️ Sửa chữ", "Bấm vào chữ để sửa ngay tại chỗ"],
  ["anh", "🖼 Thay ảnh", "Bấm vào ảnh để chọn ảnh mới"], ["muc", "🧱 Mục", "Bấm vào một mục để ẩn/hiện hoặc đổi thứ tự"],
  ["ghim", "📌 Ghim ý tưởng", "Bấm vào bất kỳ chỗ nào để ghi ý tưởng / dán ảnh mẫu"]];
const SW_ICON = { chu: "✏️", anh: "🖼", an: "🙈", hien: "👁", thu_tu: "↕️", ghim: "📌" };

const SW = { trang: "trang-chu", che_do: "xem", kho: "dt", thay_doi: [], ghi_chu_chung: "", anhTam: {}, dangSua: null };

function swNap() {
  const d = LS.get(SW_NHAP);
  if (d && Array.isArray(d.thay_doi)) { SW.thay_doi = d.thay_doi; SW.ghi_chu_chung = d.ghi_chu_chung || ""; }
}
function swLuu() { LS.set(SW_NHAP, { thay_doi: SW.thay_doi, ghi_chu_chung: SW.ghi_chu_chung }); }
function swTenTrang(k) { return (SW_TRANG.find((t) => t[0] === k) || [k, k])[1]; }

/* ---------- tim / dat ten phan tu trong khung xem truoc ---------- */
function swDuongDan(el) {
  const doc = el.ownerDocument, goc = doc.getElementById("app");
  const p = [];
  for (let n = el; n && n !== goc && n.nodeType === 1; n = n.parentElement) {
    let i = 1;
    for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
    p.unshift(`${n.tagName.toLowerCase()}:nth-of-type(${i})`);
  }
  return "#app > " + p.join(" > ");
}
function swTim(doc, chon) { try { return doc.querySelector(chon); } catch (e) { return null; } }
function swNhan(el) {
  // Mo ta de nguoi doc hieu: tieu de muc gan nhat + vai chu cua phan tu
  const sec = el.closest("section, header, footer, nav");
  const td = sec && (sec.querySelector(".sec-t h2, h1, h2, .pub-foot-name") || {}).textContent;
  const chu = (el.innerText || el.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 70);
  return { muc: (td || (sec ? sec.tagName.toLowerCase() : "")).replace(/\s+/g, " ").trim().slice(0, 60), chu };
}

/* ---------- khung chinh ---------- */
async function tSuaWeb() {
  swNap();
  app.innerHTML = tShell("suaweb", `<div class="sw-top">
      <div class="row between" style="gap:8px;flex-wrap:wrap">
        <h1 style="margin:0">✏️ Sửa website</h1>
        <div class="row" style="gap:6px"><select class="input sw-sel" id="swTrang">${SW_TRANG.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
          <button class="btn btn-sm" data-act="swKho" id="swKho"></button></div>
      </div>
      <div class="sw-modes" id="swModes"></div>
      <div class="small muted" id="swGoiY"></div>
    </div>
    <div class="sw-wrap">
      <div class="sw-stage" id="swStage"><iframe id="swFrame" title="Xem trước website"></iframe></div>
      <aside class="sw-panel" id="swPanel"></aside>
    </div>`);
  swCss();
  const sel = document.getElementById("swTrang");
  sel.value = SW.trang;
  sel.onchange = () => { SW.trang = sel.value; swMoTrang(); };
  ACT.swMode = (b) => { swDatCheDo(b.dataset.m); };
  ACT.swKho = () => { SW.kho = SW.kho === "dt" ? "mt" : "dt"; swKhung(); };
  ACT.swXoa = (b) => { SW.thay_doi.splice(Number(b.dataset.i), 1); swLuu(); swPanel(); swMoTrang(); };
  ACT.swDen = (b) => { const t = SW.thay_doi[Number(b.dataset.i)]; if (t.trang !== SW.trang) { SW.trang = t.trang; sel.value = t.trang; swMoTrang(t.chon); } else swCuon(t.chon); };
  ACT.swGui = (b) => swGui(b);
  ACT.swXoaHet = () => { if (confirm("Bỏ tất cả thay đổi đang soạn?")) { SW.thay_doi = []; SW.ghi_chu_chung = ""; swLuu(); swPanel(); swMoTrang(); } };
  ACT.swLichSu = () => swLichSu();
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = () => { closeSheet(); window.removeEventListener("resize", swKhung); };
  window.addEventListener("resize", swKhung);
  swDatCheDo(SW.che_do);
  swPanel();
  swMoTrang();
}

function swCss() {
  if (document.getElementById("swCss")) return;
  const s = document.createElement("style");
  s.id = "swCss";
  s.textContent = `
  .sw-top { position: sticky; top: 0; z-index: 20; background: var(--bg, #f4f7ff); padding: 4px 0 8px; }
  .sw-sel { width: auto; min-width: 150px; padding: 6px 10px; }
  .sw-modes { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 4px; }
  .sw-modes .btn.on { background: var(--pri, #4f6df5); color: #fff; border-color: transparent; }
  .sw-wrap { display: grid; grid-template-columns: 1fr 330px; gap: 14px; align-items: start; }
  .sw-stage { background: #dfe6f7; border-radius: 14px; overflow: hidden; height: calc(100vh - 210px); min-height: 420px; position: relative; display: flex; justify-content: center; }
  .sw-stage iframe { border: 0; background: #fff; transform-origin: top center; flex: none; }
  .sw-panel { background: #fff; border-radius: 14px; padding: 12px; box-shadow: 0 4px 16px rgba(40,60,130,.08); max-height: calc(100vh - 210px); overflow: auto; }
  .sw-item { display: flex; gap: 8px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #eef1f8; font-size: 14px; }
  .sw-item .grow { min-width: 0; } .sw-item .grow div { overflow-wrap: anywhere; }
  .sw-item img { width: 56px; height: 42px; object-fit: cover; border-radius: 6px; }
  .sw-cu { color: #9aa3b8; text-decoration: line-through; }
  .sw-num { background: #f59e0b; color: #fff; border-radius: 99px; min-width: 22px; height: 22px; display: inline-grid; place-items: center; font-size: 12px; font-weight: 700; }
  @media (max-width: 900px) { .sw-wrap { grid-template-columns: 1fr; } .sw-stage { height: 70vh; } .sw-panel { max-height: none; } }`;
  document.head.appendChild(s);
}

function swDatCheDo(m) {
  SW.che_do = m;
  if (SW.dangSua) swXongSua();
  document.getElementById("swModes").innerHTML = SW_CHE_DO.map(([k, t]) => `<button class="btn btn-sm ${k === m ? "on" : ""}" data-act="swMode" data-m="${k}">${t}</button>`).join("");
  document.getElementById("swGoiY").textContent = (SW_CHE_DO.find((x) => x[0] === m) || [])[2] || "";
  const d = swDoc();
  if (d) d.body.classList.toggle("sw-dang-sua", m !== "xem");
}

function swDoc() { const f = document.getElementById("swFrame"); try { return f && f.contentDocument; } catch (e) { return null; } }

function swKhung() {
  const f = document.getElementById("swFrame"), st = document.getElementById("swStage"), nut = document.getElementById("swKho");
  if (!f || !st) return;
  const rong = SW.kho === "dt" ? 390 : 1280;
  const tl = Math.min(1, (st.clientWidth - 8) / rong);
  f.style.width = rong + "px";
  f.style.height = Math.round(st.clientHeight / tl) + "px";
  f.style.transform = `scale(${tl})`;
  if (nut) nut.textContent = SW.kho === "dt" ? "📱 Điện thoại" : "🖥 Máy tính";
}

function swMoTrang(denCho) {
  const f = document.getElementById("swFrame");
  swKhung();
  f.onload = () => {
    const d = swDoc();
    if (!d) return;
    swGanSuKien(d);
    const w = f.contentWindow;
    // trang trong khung tu ve sau khi load -> doi 1 nhip roi ap ban nhap
    setTimeout(() => { swApNhap(); if (denCho) swCuon(denCho); }, 120);
    w.addEventListener("hashchange", () => {
      const k = (w.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0]) || "trang-chu";
      if (SW_TRANG.some((t) => t[0] === k)) { SW.trang = k; const s = document.getElementById("swTrang"); if (s) s.value = k; }
      setTimeout(swApNhap, 120);
    });
  };
  f.src = location.pathname + "?xem_sua=" + Date.now() + "#/" + SW.trang;
}

function swCuon(chon) {
  const d = swDoc(), el = d && swTim(d, chon);
  if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("sw-nhay"); setTimeout(() => el.classList.remove("sw-nhay"), 1600); }
}

/* ---------- su kien trong khung xem truoc ---------- */
function swGanSuKien(d) {
  const st = d.createElement("style");
  st.textContent = `.pub .sec { content-visibility: visible !important; }
    body.sw-dang-sua a, body.sw-dang-sua button { cursor: default; }
    .sw-hover { outline: 2px dashed #f59e0b !important; outline-offset: 2px; cursor: pointer !important; }
    .sw-sua { outline: 2px solid #22c55e !important; outline-offset: 2px; background: rgba(255,247,214,.6) !important; }
    .sw-dang { outline: 3px solid #4f6df5 !important; outline-offset: 2px; background: #fff !important; color: #111 !important; }
    .sw-an { opacity: .28 !important; outline: 3px dashed #ef4444 !important; }
    .sw-nhay { animation: swNhay .5s 3; } @keyframes swNhay { 50% { outline: 4px solid #f59e0b; } }
    .sw-pin { position: absolute; z-index: 9999; transform: translate(-50%, -100%); background: #f59e0b; color: #fff; font: 700 13px system-ui;
      min-width: 26px; height: 26px; border-radius: 13px 13px 13px 2px; display: grid; place-items: center; box-shadow: 0 2px 6px rgba(0,0,0,.35); pointer-events: none; }`;
  d.head.appendChild(st);
  d.body.classList.toggle("sw-dang-sua", SW.che_do !== "xem");
  let truoc = null;
  d.addEventListener("mouseover", (e) => {
    if (SW.che_do === "xem") return;
    const el = swChonPhanTu(e.target);
    if (truoc && truoc !== el) truoc.classList.remove("sw-hover");
    if (el && el !== SW.dangSua) { el.classList.add("sw-hover"); truoc = el; }
  }, true);
  d.addEventListener("click", (e) => {
    if (SW.che_do === "xem") return;
    if (SW.dangSua && SW.dangSua.contains(e.target)) return; // dang go chu
    e.preventDefault(); e.stopPropagation();
    const el = swChonPhanTu(e.target);
    if (!el) { if (SW.che_do === "anh") toast("Hãy bấm đúng vào một ảnh."); return; }
    el.classList.remove("sw-hover");
    if (SW.che_do === "chu") swBatDauSua(el);
    else if (SW.che_do === "anh") swThayAnh(el);
    else if (SW.che_do === "muc") swMenuMuc(el);
    else if (SW.che_do === "ghim") swGhim(el, e);
  }, true);
  d.addEventListener("submit", (e) => { if (SW.che_do !== "xem") e.preventDefault(); }, true);
}

const SW_THE_CHU = /^(H1|H2|H3|H4|H5|P|LI|SPAN|B|STRONG|SMALL|A|BUTTON|LABEL|TD|TH|BLOCKQUOTE|FIGCAPTION|I|EM|DIV|DT|DD)$/;
function swChonPhanTu(t) {
  if (!t || !t.closest) return null;
  if (SW.che_do === "anh") return t.closest("img");
  if (SW.che_do === "muc") return t.closest("section, header.pub-top, nav.pub-bar, footer") || null;
  if (SW.che_do === "ghim") return t.closest("#app *") || null;
  // sua chu: phan tu nho nhat co chu, khong chua anh / khoi lon
  for (let n = t; n && n.id !== "app"; n = n.parentElement) {
    if (n.tagName === "svg" || n.closest("svg")) continue;
    if (!SW_THE_CHU.test(n.tagName)) continue;
    const chu = (n.innerText || "").trim();
    if (!chu || n.querySelector("img, section, .card, .g2, .g3, ul, ol, table")) continue;
    if (n.tagName === "DIV" && n.children.length > 3) continue;
    return n;
  }
  return null;
}

/* ---------- ghi nhan thay doi ---------- */
function swGhi(td) {
  const i = SW.thay_doi.findIndex((x) => x.trang === td.trang && x.chon === td.chon && x.loai === td.loai && td.loai !== "ghim" && td.loai !== "thu_tu");
  if (i >= 0) SW.thay_doi[i] = Object.assign(SW.thay_doi[i], td);
  else SW.thay_doi.push(td);
  swLuu(); swPanel();
}

function swBatDauSua(el) {
  if (SW.dangSua) swXongSua();
  if (!el.dataset.swCu) { el.dataset.swCu = el.innerText; el.dataset.swViTri = JSON.stringify(swNhan(el)); }
  el.contentEditable = "true";
  el.classList.add("sw-dang");
  SW.dangSua = el;
  el.focus();
  const onKey = (e) => { if (e.key === "Escape") { el.innerText = el.dataset.swCu; swXongSua(); } };
  el.addEventListener("keydown", onKey);
  el.addEventListener("blur", () => { el.removeEventListener("keydown", onKey); swXongSua(); }, { once: true });
}
function swXongSua() {
  const el = SW.dangSua;
  if (!el) return;
  SW.dangSua = null;
  el.contentEditable = "false";
  el.classList.remove("sw-dang");
  const cu = el.dataset.swCu, moi = el.innerText;
  const chon = swDuongDan(el);
  if (moi.trim() === cu.trim()) {
    const i = SW.thay_doi.findIndex((x) => x.loai === "chu" && x.trang === SW.trang && x.chon === chon);
    if (i >= 0) { SW.thay_doi.splice(i, 1); swLuu(); swPanel(); }
    el.classList.remove("sw-sua");
    return;
  }
  el.classList.add("sw-sua");
  let vt; try { vt = JSON.parse(el.dataset.swViTri); } catch (e) { vt = swNhan(el); }
  swGhi({ loai: "chu", trang: SW.trang, chon, cu, moi, vi_tri: vt, kho: SW.kho });
}

async function swNenAnh(file, max) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi; i.src = url; });
    const tl = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * tl); c.height = Math.round(img.naturalHeight * tl);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return { dataUrl: c.toDataURL("image/jpeg", 0.86), rong: c.width, cao: c.height };
  } finally { URL.revokeObjectURL(url); }
}
async function swTaiAnh(file) {
  const a = await swNenAnh(file, 1600);
  const r = await api("t_tai_anh_yc", { p_mime: "image/jpeg", p_b64: a.dataUrl.split(",")[1] });
  const nho = (await swNenAnh(file, 240)).dataUrl;
  SW.anhTam[r.id] = a.dataUrl;
  return { id: r.id, nho, rong: a.rong, cao: a.cao };
}
function swChonFile(nhieu) {
  return new Promise((ok) => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; if (nhieu) inp.multiple = true;
    inp.onchange = () => ok([...inp.files]);
    inp.click();
  });
}

async function swThayAnh(el) {
  const files = await swChonFile(false);
  if (!files.length) return;
  toast("Đang tải ảnh lên…", 2500);
  try {
    const a = await swTaiAnh(files[0]);
    if (!el.dataset.swCuSrc) el.dataset.swCuSrc = el.getAttribute("src");
    el.removeAttribute("srcset"); el.src = SW.anhTam[a.id]; el.classList.add("sw-sua");
    swGhi({ loai: "anh", trang: SW.trang, chon: swDuongDan(el), cu: el.dataset.swCuSrc, anh_id: a.id, anh_nho: a.nho,
      kich_thuoc: a.rong + "×" + a.cao, vi_tri: swNhan(el), kho: SW.kho });
    toast("Đã thay ảnh (chỉ trong bản xem trước).");
  } catch (e) { toast(e.message, 4000); }
}

function swMenuMuc(el) {
  const chon = swDuongDan(el), nhan = swNhan(el);
  const an = SW.thay_doi.some((x) => x.loai === "an" && x.trang === SW.trang && x.chon === chon);
  openSheet(`<div class="row between"><h2 style="margin:0">Mục: ${esc(nhan.muc || "(không tên)")}</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
    <p class="small muted">${esc(nhan.chu)}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button class="btn" data-act="swAn">${an ? "👁 Hiện lại mục này" : "🙈 Ẩn mục này"}</button>
      <button class="btn" data-act="swLen">⬆️ Đưa lên trên</button><button class="btn" data-act="swXuong">⬇️ Đưa xuống dưới</button></div>`);
  ACT.swAn = () => {
    closeSheet();
    if (an) { SW.thay_doi = SW.thay_doi.filter((x) => !(x.loai === "an" && x.trang === SW.trang && x.chon === chon)); swLuu(); swPanel(); el.classList.remove("sw-an"); }
    else { el.classList.add("sw-an"); swGhi({ loai: "an", trang: SW.trang, chon, vi_tri: nhan, kho: SW.kho }); }
  };
  const doi = (len) => {
    closeSheet();
    const ke = len ? el.previousElementSibling : el.nextElementSibling;
    if (!ke) { toast(len ? "Mục này đã ở trên cùng." : "Mục này đã ở dưới cùng."); return; }
    swGhi({ loai: "thu_tu", trang: SW.trang, chon, huong: len ? "len" : "xuong", vi_tri: nhan, voi: swNhan(ke), kho: SW.kho });
    if (len) ke.before(el); else ke.after(el);
    el.scrollIntoView({ block: "center" });
  };
  ACT.swLen = () => doi(true);
  ACT.swXuong = () => doi(false);
}

function swGhim(el, e) {
  const r = el.getBoundingClientRect();
  const x = Math.round(((e.clientX - r.left) / Math.max(r.width, 1)) * 100), y = Math.round(((e.clientY - r.top) / Math.max(r.height, 1)) * 100);
  const nhan = swNhan(el), chon = swDuongDan(el);
  let anh = [];
  openSheet(`<form data-submit="swLuuGhim"><div class="row between"><h2 style="margin:0">📌 Ghim ý tưởng</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
    <p class="small muted">Tại: ${esc(nhan.muc)}${nhan.chu ? " · «" + esc(nhan.chu) + "»" : ""} (${swTenTrang(SW.trang)}, ${SW.kho === "dt" ? "điện thoại" : "máy tính"})</p>
    <textarea class="input" name="nd" rows="5" placeholder="Cô muốn gì ở chỗ này? Ví dụ: thêm nút gọi Zalo ở đây; đổi màu nền sang vàng; thêm mục học phí theo khối như ảnh mẫu…" required></textarea>
    <div class="row" style="gap:8px;margin:8px 0;flex-wrap:wrap"><button type="button" class="btn btn-sm" data-act="swAnhMau">🖼 Thêm ảnh mẫu</button><span id="swAnhMau" class="row" style="gap:6px"></span></div>
    <button class="btn btn-primary btn-block">Lưu ghi chú</button></form>`);
  ACT.swAnhMau = async (b) => {
    const files = await swChonFile(true);
    for (const f of files.slice(0, 4)) {
      try { b.disabled = true; const a = await swTaiAnh(f); anh.push(a); document.getElementById("swAnhMau").insertAdjacentHTML("beforeend", `<img src="${a.nho}" style="width:56px;height:42px;object-fit:cover;border-radius:6px">`); }
      catch (er) { toast(er.message, 4000); } finally { b.disabled = false; }
    }
  };
  ACT.swLuuGhim = (f) => {
    closeSheet();
    swGhi({ loai: "ghim", trang: SW.trang, chon, x, y, noi_dung: f.nd.value.trim(), anh_ids: anh.map((a) => a.id), anh_nho: anh.map((a) => a.nho), vi_tri: nhan, kho: SW.kho });
    swApNhap();
  };
}

/* ---------- ap ban nhap len khung xem truoc ---------- */
function swApNhap() {
  const d = swDoc();
  if (!d || !d.getElementById("app")) return;
  d.querySelectorAll(".sw-pin").forEach((p) => p.remove());
  SW.thay_doi.forEach((t, i) => {
    if (t.trang !== SW.trang) return;
    const el = swTim(d, t.chon);
    if (!el) return;
    if (t.loai === "chu" && !el.dataset.swCu) { el.dataset.swCu = el.innerText; el.innerText = t.moi; el.classList.add("sw-sua"); }
    else if (t.loai === "anh" && !el.dataset.swCuSrc) { el.dataset.swCuSrc = el.getAttribute("src"); el.removeAttribute("srcset"); el.src = SW.anhTam[t.anh_id] || t.anh_nho; el.classList.add("sw-sua"); }
    else if (t.loai === "an") el.classList.add("sw-an");
    else if (t.loai === "ghim") {
      const r = el.getBoundingClientRect(), w = d.defaultView;
      const p = d.createElement("div");
      p.className = "sw-pin"; p.textContent = i + 1;
      p.style.left = (r.left + w.scrollX + (r.width * t.x) / 100) + "px";
      p.style.top = (r.top + w.scrollY + (r.height * t.y) / 100) + "px";
      d.body.appendChild(p);
    }
  });
}

/* ---------- bang ben phai: danh sach thay doi + gui ---------- */
function swMoTa(t) {
  if (t.loai === "chu") return `<div class="sw-cu">${esc(t.cu.slice(0, 120))}</div><div>→ <b>${esc(t.moi.slice(0, 200))}</b></div>`;
  if (t.loai === "anh") return `<div>Thay ảnh ${esc(t.vi_tri.chu ? "«" + t.vi_tri.chu + "»" : "")}</div>`;
  if (t.loai === "an") return `<div>Ẩn mục <b>${esc(t.vi_tri.muc || "")}</b></div>`;
  if (t.loai === "thu_tu") return `<div>Đưa mục <b>${esc(t.vi_tri.muc || "")}</b> ${t.huong === "len" ? "lên trên" : "xuống dưới"}</div>`;
  if (t.loai === "ghim") return `<div>${esc(t.noi_dung.slice(0, 220))}</div>${(t.anh_nho || []).map((s) => `<img src="${s}" alt="">`).join(" ")}`;
  return "";
}
function swPanel() {
  const p = document.getElementById("swPanel");
  if (!p) return;
  const n = SW.thay_doi.length;
  p.innerHTML = `<div class="row between"><b>Phiếu đang soạn (${n})</b><button class="btn btn-sm btn-ghost" data-act="swLichSu">🗂 Phiếu đã gửi</button></div>
    <p class="small muted" style="margin:4px 0 6px">Tự lưu trên máy này. Website chưa đổi cho tới khi Claude cập nhật.</p>
    ${SW.thay_doi.map((t, i) => `<div class="sw-item"><span class="sw-num">${i + 1}</span>
      <div class="grow"><div class="small muted">${SW_ICON[t.loai] || ""} ${esc(swTenTrang(t.trang))}${t.vi_tri && t.vi_tri.muc ? " · " + esc(t.vi_tri.muc) : ""} · ${t.kho === "dt" ? "📱" : "🖥"}</div>${swMoTa(t)}</div>
      <div style="display:flex;flex-direction:column;gap:4px"><button class="btn btn-sm" data-act="swDen" data-i="${i}" title="Xem chỗ này">🔍</button><button class="btn btn-sm" data-act="swXoa" data-i="${i}" title="Bỏ">✕</button></div></div>`).join("")
      || '<div class="empty small">Chưa có thay đổi. Chọn một chế độ ở trên rồi bấm vào trang.</div>'}
    <label class="f" style="margin-top:10px">Ghi chú chung (ý tưởng lớn, chức năng mới…)</label>
    <textarea class="input" id="swChung" rows="4" placeholder="Ví dụ: thêm trang Học phí cho phụ huynh xem bảng giá theo khối; đổi màu chủ đạo sang xanh lá…">${esc(SW.ghi_chu_chung)}</textarea>
    <button class="btn btn-gold btn-block" style="margin-top:10px" data-act="swGui" ${n || SW.ghi_chu_chung.trim() ? "" : "disabled"}>📨 Gửi yêu cầu cho Claude</button>
    ${n ? '<button class="btn btn-sm btn-ghost btn-block" style="margin-top:6px" data-act="swXoaHet">Bỏ hết, làm lại</button>' : ""}`;
  const ta = document.getElementById("swChung");
  ta.oninput = () => { SW.ghi_chu_chung = ta.value; swLuu(); const b = p.querySelector('[data-act="swGui"]'); if (b) b.disabled = !(SW.thay_doi.length || ta.value.trim()); };
}

async function swGui(btn) {
  if (SW.dangSua) swXongSua();
  if (!confirm(`Gửi phiếu gồm ${SW.thay_doi.length} thay đổi cho Claude?`)) return;
  const anh_ids = [];
  SW.thay_doi.forEach((t) => { if (t.anh_id) anh_ids.push(t.anh_id); (t.anh_ids || []).forEach((x) => anh_ids.push(x)); });
  const goi = { phien_ban: 1, gui_luc: new Date().toISOString(), trang_web: location.origin,
    thay_doi: SW.thay_doi.map((t) => Object.assign({}, t, { anh_nho: undefined })), ghi_chu_chung: SW.ghi_chu_chung.trim(), anh_ids };
  busy(btn, async () => {
    try {
      const r = await api("t_gui_yeu_cau_web", { p: goi });
      SW.thay_doi = []; SW.ghi_chu_chung = ""; swLuu(); swPanel(); swMoTrang();
      const tin = `Có yêu cầu sửa web mới, mã ${r.ma}`;
      openSheet(`<h2>✅ Đã gửi phiếu ${esc(r.ma)}</h2>
        <p>Cô nhắn cho Claude câu sau (bấm để chép):</p>
        <div class="card center" style="font-size:18px"><b>${esc(tin)}</b></div>
        <button class="btn btn-primary btn-block" data-act="swChep">📋 Chép câu này</button>
        <button class="btn btn-block" style="margin-top:8px" data-act="closeSheet">Đóng</button>`);
      ACT.swChep = () => { try { navigator.clipboard.writeText(tin); toast("Đã chép. Cô dán vào khung chat với Claude."); } catch (e) { toast(tin, 6000); } };
    } catch (e) { toast(e.message, 4500); }
  });
}

async function swLichSu() {
  openSheet(`<div class="row between"><h2 style="margin:0">🗂 Phiếu đã gửi</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div><div id="swLs">${spinner()}</div>`);
  const TT = { moi: "🆕 Mới gửi", dang_lam: "🛠 Đang làm", xong: "✅ Đã xong", huy: "✖️ Đã huỷ" };
  try {
    const ds = await api("t_ds_yeu_cau_web");
    document.getElementById("swLs").innerHTML = ds.map((y) => `<div class="sw-item"><div class="grow">
        <b>${esc(y.ma)}</b> · <span class="small">${TT[y.trang_thai] || y.trang_thai}</span>
        <div class="small muted">${fmtDT(y.tao_luc)} · ${y.so_muc} thay đổi${y.ghi_chu_chung ? " · " + esc(y.ghi_chu_chung) : ""}</div></div>
        ${y.trang_thai === "xong" || y.trang_thai === "huy" ? "" : `<button class="btn btn-sm" data-act="swDanhDau" data-ma="${esc(y.ma)}">✅ Xong</button>`}</div>`).join("")
      || '<div class="empty small">Chưa gửi phiếu nào.</div>';
    ACT.swDanhDau = (b) => busy(b, async () => { try { await api("t_dat_trang_thai_yc", { p_ma: b.dataset.ma, p_trang_thai: "xong" }); swLichSu(); } catch (e) { toast(e.message); } });
  } catch (e) { document.getElementById("swLs").innerHTML = errBox(e); }
}
