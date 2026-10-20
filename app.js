/* Kiem tra online - Anh ngu Ms.Ninh
 * Trang web mot file: hoc sinh lam bai + giao vien quan ly.
 * Moi du lieu di qua cac ham rpc trong supabase/schema.sql.
 */
"use strict";

const CFG = window.APP_CONFIG || {};
const app = document.getElementById("app");
const LETTERS = "ABCDEFGH";
const NET_ERR = "Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.";

/* ================= tien ich ================= */
// Chong nhung trang vao web khac (clickjacking). Chi cho phep khung xem truoc cung nguon (Sua website).
(function () {
  if (window.top === window.self) return;
  let cungNguon = false;
  try { cungNguon = window.top.location.origin === location.origin; } catch (e) { cungNguon = false; }
  if (!cungNguon) { document.documentElement.style.display = "none"; try { window.top.location.href = location.href; } catch (e) { /* bi chan thi de trang trong */ } }
})();

const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bo qua */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* bo qua */ } },
};
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Giu lai the <b> <i> <u> <br> trong cau hoi, con lai hien nguyen chu
function fmt(s) {
  return esc(s).replace(/&lt;(\/?)(b|i|u|br)\s*\/?&gt;/gi, "<$1$2>").replace(/\n/g, "<br>");
}
function plain(s) { return String(s || "").replace(/<[^>]+>/g, ""); }
// Thang lay tu dia chi trang: chi nhan dung dang YYYY-MM (chong chen ma qua link)
function thangHopLe(t) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(t || "") ? t : thangNayVN(); }
function fmtScore(x) {
  if (x === null || x === undefined || x === "") return "–";
  return Number(x).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}
function scoreCls(x) { const v = Number(x); return v >= 8 ? "" : v >= 5 ? "mid" : "low"; }
function pad(n) { return String(n).padStart(2, "0"); }
const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
function fmtDT(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear() !== new Date().getFullYear() ? "/" + d.getFullYear() : "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}${y}`;
}
function remainText(iso) {
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return "đã hết hạn";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `còn ${m} phút`;
  if (m < 48 * 60) return `còn ${Math.floor(m / 60)} giờ`;
  return `còn ${Math.floor(m / 1440)} ngày`;
}
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v) { return v ? new Date(v).toISOString() : null; }
function spinner() { return '<div class="spinner"></div>'; }
let toastTimer = null;
function toast(msg, ms) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms || 2600);
}
async function busy(btn, fn) {
  if (!btn || btn.disabled) return;
  const old = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = "Đang xử lý…";
  try { return await fn(); } finally { if (btn.isConnected) { btn.disabled = false; btn.innerHTML = old; } }
}
function errBox(e) { return `<div class="alert alert-err">${esc(e && e.message ? e.message : e)}</div>`; }
function copyText(txt) {
  if (navigator.clipboard) return navigator.clipboard.writeText(txt).then(() => toast("Đã sao chép"), () => toast("Không sao chép được, hãy bôi đen rồi chép tay"));
  toast("Hãy bôi đen rồi chép tay");
}

/* ================= ket noi may chu ================= */
const S = { token: LS.get("kt_token"), user: LS.get("kt_user"), home: null, lastResult: null };
let sb = null;
// Thu vien ket noi Supabase (~100 KB): chi tai khi can (trang gioi thieu khong can) de trang chu nhe
// Tu luu ban co dinh (14/10/2026, doi chieu dung goi npm @supabase/supabase-js 2.117.0) -> khong phu thuoc CDN ngoai
const SB_URL = "vendor/supabase-2.117.0.js";
let sbLoading = null;
function taiThuVien() {
  if (window.supabase) return Promise.resolve();
  if (!sbLoading) {
    sbLoading = new Promise((ok, loi) => {
      const sc = document.createElement("script");
      sc.src = SB_URL; sc.async = true;
      sc.onload = () => ok();
      sc.onerror = () => { sbLoading = null; loi(new Error("Không tải được thư viện kết nối. Hãy kiểm tra mạng rồi tải lại trang.")); };
      document.head.appendChild(sc);
    });
  }
  return sbLoading;
}
function client() {
  if (!sb) {
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return sb;
}
async function api(fn, args, withToken) {
  args = args || {};
  if (withToken !== false) args = Object.assign({ p_token: S.token }, args);
  // Mang dien thoai chap chon: tu thu lai 1 lan (cac ham deu goi lai an toan)
  try { await taiThuVien(); } catch (e) { throw new Error(NET_ERR); }
  let res;
  for (let i = 0; i < 2; i++) {
    try { res = await client().rpc(fn, args); } catch (e) { res = { error: { message: String(e) } }; }
    const er = res.error;
    if (!er || (er.code && !/fetch|network/i.test(er.message || ""))) break;
    if (i === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  const { data, error } = res;
  if (error) {
    const msg = error.message || "";
    if (msg.startsWith("DOI_MK:")) {
      if (S.user) { S.user.default_password = true; LS.set("kt_user", S.user); }
      setTimeout(() => go("#/doi-mk"), 0);
      throw new Error(msg.slice(7).trim());
    }
    if (msg.startsWith("AUTH:")) {
      clearSession();
      S.flash = msg.slice(5).trim();
      setTimeout(() => go("#/login"), 0);
      throw new Error(msg.slice(5).trim());
    }
    if (!error.code || /fetch|network/i.test(msg)) throw new Error(NET_ERR);
    throw new Error(msg);
  }
  if (data && data.error) throw new Error(data.error);
  return data;
}
function setSession(token, user) { S.token = token; S.user = user; S.dash = null; S.home = null; S.lastResult = null; LS.set("kt_token", token); LS.set("kt_user", user); }
function clearSession() { S.token = null; S.user = null; S.home = null; S.dash = null; S.lastResult = null; LS.del("kt_token"); LS.del("kt_user"); }

/* ================= dieu huong ================= */
let ACT = {};
let cleanup = null;
let leaveGuard = null;
let prevHash = location.hash;
let skipRoute = false;

function go(h) { if (location.hash === h) route(); else location.hash = h; }
window.addEventListener("hashchange", () => {
  if (skipRoute) { skipRoute = false; return; }
  if (leaveGuard && !leaveGuard()) { skipRoute = true; location.hash = prevHash; return; }
  route();
});
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = ACT[el.dataset.act] || (el.dataset.act === "logout" ? doLogout : null);
  // "noop" chi de chan click trong khung bat len khoi dong khung; khong chan nut submit ben trong
  if (fn) { if (el.dataset.act !== "noop") e.preventDefault(); fn(el, e); }
});
document.addEventListener("submit", (e) => {
  const fn = ACT[e.target.dataset.submit];
  if (fn) { e.preventDefault(); fn(e.target); }
});
document.addEventListener("input", (e) => { const fn = ACT["in:" + (e.target.dataset.in || "")]; if (fn) fn(e.target); });
document.addEventListener("change", (e) => { const fn = ACT["ch:" + (e.target.dataset.ch || "")]; if (fn) fn(e.target); });

async function route() {
  if (cleanup) { try { cleanup(); } catch (e) { /* bo qua */ } cleanup = null; }
  leaveGuard = null;
  ACT = {};
  prevHash = location.hash;
  window.scrollTo(0, 0);
  const h = location.hash.slice(1) || "/";
  const [pathPart, qs] = h.split("?");
  const p = pathPart.split("/").filter(Boolean);
  const query = new URLSearchParams(qs || "");
  try {
    // Trang gioi thieu cong khai: chay ca khi chua tai duoc thu vien ket noi
    if (pubRoute(p[0])) return pubRoute(p[0])();
    if (!p[0] && (!S.token || !S.user)) return viewLanding();
    taiThuVien().catch(() => {}); // tai truoc trong luc ve trang
    if (p[0] === "setup") return viewSetup();
    if (!S.token || !S.user) return p[0] === "login" ? viewLogin() : viewLanding();
    if (S.user.role === "teacher") {
      if (p[0] !== "t") return go("#/t");
      switch (p[1]) {
        case undefined: return tHome();
        case "new": return tAssignForm(null, query.get("quiz"));
        case "a": return p[3] === "edit" ? tAssignForm(+p[2]) : tResults(+p[2]);
        case "at": return tAttempt(+p[2]);
        case "quizzes": return tQuizzes();
        case "q": return tEditor(p[2] === "new" ? null : +p[2]);
        case "classes": return tClasses();
        case "c": return p[3] === "print" ? tPrint(+p[2]) : p[3] === "tq" ? tTongQuan(+p[2], query) : tClass(+p[2]);
        case "hoc-phi": return tHocPhi(query);
        case "dang-ky": return tDangKy();
        case "sua-web": return moSuaWeb();
        case "buoi-hoc": return moBuoiHoc(query);
        case "hoc-sinh": return moHocSinh(() => tHocSinh(query));
        case "hs": return moHocSinh(() => tHoSo(+p[2]));
        case "nhan-xet": return moHocSinh(() => tNhanXet(query));
        case "cham-soc": return moChamSoc(query);
        case "account": return tAccount();
        default: return go("#/t");
      }
    }
    if (S.user.default_password) return viewDoiMk();
    switch (p[0]) {
      case undefined: return sHome();
      case "start": return sStart(+p[1]);
      case "quiz": return sQuiz(+p[1]);
      case "result": return sResult();
      case "review": return sReview(+p[1]);
      case "results": return sResults();
      case "tien-bo": return sTienBo();
      case "diem-danh": return sDiemDanh();
      case "hoc-phi": return sHocPhi();
      case "nhan-xet": return sNhanXet();
      case "account": return sAccount();
      default: return go("#/");
    }
  } catch (e) {
    app.innerHTML = `<div class="center-screen"><div class="login-box">${errBox(e)}<button class="btn btn-block" data-act="reload">Tải lại</button></div></div>`;
    ACT.reload = () => location.reload();
  }
}

// Bao loi trong cac trang dang tai
function pageError(e, back) {
  return `${errBox(e)}<div class="row"><button class="btn" data-act="retry">Thử lại</button>${back ? `<a class="btn btn-ghost" href="${back}">Quay lại</a>` : ""}</div>`;
}

/* ================= khung giao dien ================= */
const APP_TITLE = "Phần mềm kiểm tra & bài tập online";
const APP_VER = "v1.0";
// Dau trang giong phan mem kiem tra tu vung: logo + ANH NGU MS.NINH + ten phan mem
function topbar(right) {
  return `<div class="topbar"><img class="brand sm" src="logo-nen-trang.png" alt="ANH NGỮ MS.NINH">
    <div class="grow"><div class="brandname left">ANH NGỮ MS.NINH</div>
    <h1 class="apptitle left">${APP_TITLE} <span class="ver">${APP_VER}</span></h1></div>${right || ""}</div>`;
}
function brandBig(sub) {
  return `<img class="brand" src="logo-nen-trang.png" alt="ANH NGỮ MS.NINH">
    <div class="center brandname">ANH NGỮ MS.NINH</div>
    <h1 class="center apptitle one">${APP_TITLE} <span class="ver">${APP_VER}</span></h1>
    ${sub ? `<p class="muted center" style="margin:0 0 6px">${sub}</p>` : ""}`;
}
function backBtn(href) { return `<a href="${href}" class="btn btn-sm" style="margin-bottom:12px">← Quay lại</a>`; }

function sShell(tab, inner, opts) {
  opts = opts || {};
  const u = S.user || {};
  const nav = [["home", "#/", "📝 Bài tập"], ["results", "#/results", "🏆 Kết quả"], ["tienbo", "#/tien-bo", "📈 Tiến bộ"], ["diemdanh", "#/diem-danh", "📅 Điểm danh"], ["hocphi", "#/hoc-phi", "💰 Học phí"], ["nhanxet", "#/nhan-xet", "📝 Nhận xét"], ["account", "#/account", "👤 Tài khoản"]];
  return `<div class="page">${topbar(opts.right)}
    <div class="whoami">👋 <b>${esc(u.name || "")}</b>${u.class_name ? " · " + (/^(lớp|khối)/i.test(u.class_name) ? "" : "lớp ") + esc(u.class_name) : ""} · mã <span class="code">${esc(u.code || "")}</span></div>
    <div class="tabs grid3">${nav.map((n) => `<a href="${n[1]}" class="${n[0] === tab ? "on" : ""}">${n[2]}</a>`).join("")}</div>
    ${opts.left || ""}<main>${inner}</main></div>`;
}
function tShell(tab, inner) {
  const nav = [["home", "#/t", "▶️ Bài đã giao"], ["quizzes", "#/t/quizzes", "📚 Kho đề"], ["classes", "#/t/classes", "🏫 Lớp & học sinh"], ["hocsinh", "#/t/hoc-sinh", "👩‍🎓 Học sinh"], ["chamsoc", "#/t/cham-soc", "💌 Chăm sóc"], ["nhanxettuan", "#/t/nhan-xet", "📝 Nhận xét tuần"], ["buoihoc", "#/t/buoi-hoc", "📅 Buổi học"], ["hocphi", "#/t/hoc-phi", "💰 Học phí"], ["dangky", "#/t/dang-ky", "📩 Phiếu đăng ký"], ["suaweb", "#/t/sua-web", "✏️ Sửa website"], ["account", "#/t/account", "⚙️ Tài khoản"]];
  return `<div class="page wide">${topbar('<button class="btn btn-sm hide-sm" data-act="logout">Đăng xuất</button>')}
    <div class="tabs grid3">${nav.map((n) => `<a href="${n[1]}" class="${n[0] === tab ? "on" : ""}">${n[2]}</a>`).join("")}</div>
    <main>${inner}</main></div>`;
}
// Trang "Cham soc" (can quan tam, tin mau, gui phu huynh, bao cao thang) nam o cham_soc.js, chi tai khi giao vien mo
function moChamSoc(query) {
  if (window.tChamSoc) return tChamSoc(query);
  app.innerHTML = tShell("chamsoc", spinner());
  const s = document.createElement("script");
  s.src = "cham_soc.js?v=3";
  s.onload = () => tChamSoc(query);
  s.onerror = () => { app.querySelector("main").innerHTML = errBox("Không tải được trang. Kiểm tra mạng rồi thử lại."); };
  document.head.appendChild(s);
}
// Trang "Hoc sinh", "Ho so", "Nhan xet tuan" (GV) nam o hoc_sinh.js, chi tai khi giao vien mo
function moHocSinh(chay) {
  if (window.tHocSinh) return chay();
  app.innerHTML = tShell("hocsinh", spinner());
  const s = document.createElement("script");
  s.src = "hoc_sinh.js?v=4";
  s.onload = () => chay();
  s.onerror = () => { app.querySelector("main").innerHTML = errBox("Không tải được trang. Kiểm tra mạng rồi thử lại."); };
  document.head.appendChild(s);
}
// Trang "Buoi hoc" (doi soat diem danh) nam o buoi_hoc.js, chi tai khi giao vien mo
function moBuoiHoc(query) {
  if (window.tBuoiHoc) return tBuoiHoc(query);
  app.innerHTML = tShell("buoihoc", spinner());
  const s = document.createElement("script");
  s.src = "buoi_hoc.js?v=1";
  s.onload = () => tBuoiHoc(query);
  s.onerror = () => { app.querySelector("main").innerHTML = errBox("Không tải được trang Buổi học. Kiểm tra mạng rồi thử lại."); };
  document.head.appendChild(s);
}
// Cong cu "Sua website" nam o sua_web.js, chi tai khi giao vien mo
function moSuaWeb() {
  if (window.tSuaWeb) return tSuaWeb();
  app.innerHTML = tShell("suaweb", spinner());
  const s = document.createElement("script");
  s.src = "sua_web.js?v=3";
  s.onload = () => tSuaWeb();
  s.onerror = () => { app.querySelector("main").innerHTML = errBox("Không tải được công cụ. Kiểm tra mạng rồi thử lại."); };
  document.head.appendChild(s);
}
async function doLogout() {
  try { await api("logout"); } catch (e) { /* van dang xuat tren may */ }
  clearSession(); go("#/login");
}

/* ================= trang chu msninh.vn ================= */
// Website gioi thieu (Trang chu, Gioi thieu, Chuong trinh hoc...) nam o cong_khai.js
function viewLanding() { pubHome(); }

/* ================= dang nhap ================= */
function viewLogin() {
  if (S.dnTen === undefined) { try { S.dnTen = localStorage.getItem("kt_dn_ten") === "1"; } catch (e) { S.dnTen = false; } }
  const notSet = !CFG.SUPABASE_URL || CFG.SUPABASE_URL.includes("XXXX");
  app.innerHTML = `<div class="center-screen"><div class="login-box">
    <form class="card" data-submit="login">
      ${brandBig("Đăng nhập để làm bài")}
      ${notSet ? '<div class="alert alert-warn">Trang web chưa được kết nối máy chủ (chưa điền <b>config.js</b>).</div>' : ""}
      <div id="err">${S.flash ? `<div class="alert alert-warn">${esc(S.flash)}</div>` : ""}</div>
      <div class="seg" role="tablist" style="margin-bottom:12px"><button type="button" class="seg-b ${S.dnTen ? "" : "on"}" data-act="dnKieu" data-k="ma">🔢 Bằng mã số</button><button type="button" class="seg-b ${S.dnTen ? "on" : ""}" data-act="dnKieu" data-k="ten">🙋 Bằng họ tên</button></div>
      ${S.dnTen ? `<div class="field"><label class="f" for="lop">Lớp của em</label>
        <select class="input" id="lop" name="lop" required><option value="">Đang tải danh sách lớp…</option></select></div>
      <div class="field"><label class="f" for="ten">Họ và tên đầy đủ</label>
        <input class="input" id="ten" name="ten" placeholder="Ví dụ: Nguyễn Thị Lan" autocomplete="name" maxlength="80" required>
        <div class="small muted" style="margin-top:6px">Gõ có dấu hay không dấu đều được.</div></div>`
      : `<div class="field"><label class="f" for="code">Mã học sinh</label>
        <input class="input" id="code" name="code" placeholder="Ví dụ: 057" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" required></div>`}
      <div class="field"><label class="f" for="pw">Mật khẩu</label>
        <div class="pwrow"><input class="input" id="pw" name="pw" type="password" placeholder="Mật khẩu của em" autocomplete="current-password" required>
        <button type="button" class="btn" data-act="eye" title="Hiện / ẩn mật khẩu">👁</button></div>
        <div class="small muted" style="margin-top:6px">Lần đầu: dùng mật khẩu trên phiếu cô phát, sau đó đặt mật khẩu mới.</div></div>
      <button class="btn btn-primary btn-block btn-lg" id="loginBtn">Đăng nhập</button>
      <p class="muted small center" style="margin:12px 0 0">Quên mật khẩu? Hãy nhờ cô đặt lại. · <a href="#/trang-chu">Trang chủ</a></p>
    </form>
  </div></div>`;
  S.flash = null;
  ACT.eye = () => { const pw = document.getElementById("pw"); pw.type = pw.type === "password" ? "text" : "password"; };
  ACT.dnKieu = (b) => { S.dnTen = b.dataset.k === "ten"; try { localStorage.setItem("kt_dn_ten", S.dnTen ? "1" : ""); } catch (e) { /* bo */ } viewLogin(); };
  if (S.dnTen) {
    api("public_ds_lop", {}, false).then((ds) => {
      const sel = document.getElementById("lop"); if (!sel) return;
      let nho = ""; try { nho = localStorage.getItem("kt_dn_lop") || ""; } catch (e) { /* bo */ }
      sel.innerHTML = '<option value="">— Chọn lớp —</option>' + ds.map((c) => `<option value="${c.id}" ${String(c.id) === nho ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    }, (e) => { document.getElementById("err").innerHTML = errBox(e); });
  }
  ACT.login = (f) => busy(document.getElementById("loginBtn"), async () => {
    try {
      let r;
      if (S.dnTen) {
        try { localStorage.setItem("kt_dn_lop", f.lop.value); } catch (e) { /* bo */ }
        r = await api("login_ten", { p_lop_id: Number(f.lop.value), p_ho_ten: f.ten.value, p_password: f.pw.value }, false);
      } else r = await api("login", { p_code: f.code.value, p_password: f.pw.value }, false);
      setSession(r.token, r.user);
      go(r.user.role === "teacher" ? "#/t" : r.user.default_password ? "#/doi-mk" : "#/");
    } catch (e) { document.getElementById("err").innerHTML = errBox(e); }
  });
}

function viewSetup() {
  app.innerHTML = `<div class="center-screen"><div class="login-box">
    <form class="card" data-submit="setup">${brandBig("Thiết lập lần đầu")}
      <p class="muted small">Tạo tài khoản giáo viên. Chỉ làm được <b>một lần</b>; sau đó trang này bị khoá.</p><div id="err"></div>
      <div class="field"><label class="f">Tên đăng nhập (không dấu, không trùng mã học sinh)</label><input class="input" name="code" value="msninh" required></div>
      <div class="field"><label class="f">Tên hiển thị</label><input class="input" name="name" value="Ms. Ninh"></div>
      <div class="field"><label class="f">Mật khẩu (từ 6 ký tự)</label><input class="input" name="pw" type="password" required></div>
      <div class="field"><label class="f">Nhập lại mật khẩu</label><input class="input" name="pw2" type="password" required></div>
      <button class="btn btn-primary btn-block btn-lg">Tạo tài khoản</button>
    </form></div></div>`;
  ACT.setup = (f) => busy(f.querySelector("button"), async () => {
    const err = document.getElementById("err");
    if (f.pw.value !== f.pw2.value) { err.innerHTML = errBox("Hai lần nhập mật khẩu không khớp."); return; }
    try {
      await api("setup_teacher", { p_code: f.code.value, p_name: f.name.value, p_password: f.pw.value }, false);
      toast("Đã tạo tài khoản giáo viên. Hãy đăng nhập.");
      go("#/login");
    } catch (e) { err.innerHTML = errBox(e); }
  });
}

// Mat khau qua de doan (giong kiem tra o may chu _mk_yeu)
function mkYeu(p, code) {
  const l = String(p).toLowerCase(), c = String(code || "").toLowerCase();
  return /^(.)\1+$/.test(l) || "01234567890123456789".includes(l) || "98765432109876543210".includes(l)
    || ["123123", "112233", "121212", "123321", "111222", "abcdef", "abc123", "qwerty", "asdfgh", "password", "matkhau", "iloveyou", "msninh", "ninh123"].includes(l)
    || [c, c + c].includes(l) || (/^[0-9]+$/.test(l) && l.replace(/^0+/, "") === c.replace(/^0+/, ""));
}
function viewDoiMk() {
  const u = S.user || {};
  app.innerHTML = `<div class="center-screen"><div class="login-box">
    <form class="card" data-submit="doimk">${brandBig("Đặt mật khẩu mới")}
      <p>Chào <b>${esc(u.name || "")}</b> (mã <b>${esc(u.code || "")}</b>)!</p>
      <p class="small muted">Em đang dùng mật khẩu trên phiếu cô phát. Hãy đặt mật khẩu riêng để giữ bài làm, điểm và học phí của em an toàn.
        Đặt xong mới vào được trang của em.</p>
      <div id="err"></div>
      <div class="field"><label class="f" for="nw">Mật khẩu mới (từ 6 ký tự)</label>
        <div class="pwrow"><input class="input" id="nw" name="nw" type="password" autocomplete="new-password" required minlength="6" maxlength="50">
        <button type="button" class="btn" data-act="eye" title="Hiện / ẩn mật khẩu">👁</button></div></div>
      <div class="field"><label class="f" for="nw2">Nhập lại mật khẩu mới</label>
        <input class="input" id="nw2" name="nw2" type="password" autocomplete="new-password" required></div>
      <p class="small muted" style="margin-top:0">Không dùng 000000, 123456, 111111 hay mã học sinh. Em nhớ ghi lại mật khẩu ở chỗ an toàn nhé.</p>
      <button class="btn btn-primary btn-block btn-lg">Lưu mật khẩu mới</button>
      <p class="center small" style="margin:12px 0 0"><a href="#" data-act="logout">Đăng xuất</a></p>
    </form></div></div>`;
  ACT.eye = () => { ["nw", "nw2"].forEach((k) => { const el = document.getElementById(k); el.type = el.type === "password" ? "text" : "password"; }); };
  ACT.logout = (el, e) => { if (e) e.preventDefault(); doLogout(); };
  ACT.doimk = (f) => busy(f.querySelector("button.btn-primary"), async () => {
    const box = document.getElementById("err"), nw = f.nw.value;
    const loi = nw.length < 6 ? "Mật khẩu mới phải có ít nhất 6 ký tự." : nw !== f.nw2.value ? "Hai lần nhập mật khẩu mới không khớp."
      : mkYeu(nw, u.code) ? "Mật khẩu này quá dễ đoán. Hãy chọn mật khẩu khác." : "";
    if (loi) { box.innerHTML = errBox(loi); return; }
    try {
      await api("change_password", { p_old: "", p_new: nw });
      S.user.default_password = false; LS.set("kt_user", S.user);
      toast("Đã lưu mật khẩu mới. Lần sau em đăng nhập bằng mật khẩu này nhé.", 4000);
      go("#/");
    } catch (e) { box.innerHTML = errBox(e); }
  });
}

function passwordForm() {
  return `<form class="card" data-submit="chpw"><h2>Đổi mật khẩu</h2><div id="pwmsg"></div>
    <div class="field"><label class="f">Mật khẩu hiện tại</label><input class="input" name="old" type="password" autocomplete="current-password" required></div>
    <div class="field"><label class="f">Mật khẩu mới (từ 6 ký tự)</label><input class="input" name="nw" type="password" autocomplete="new-password" required></div>
    <div class="field"><label class="f">Nhập lại mật khẩu mới</label><input class="input" name="nw2" type="password" autocomplete="new-password" required></div>
    <button class="btn btn-primary btn-block">Đổi mật khẩu</button></form>`;
}
function bindPasswordForm() {
  ACT.chpw = (f) => busy(f.querySelector("button"), async () => {
    const box = document.getElementById("pwmsg");
    if (f.nw.value !== f.nw2.value) { box.innerHTML = errBox("Hai lần nhập mật khẩu mới không khớp."); return; }
    try {
      await api("change_password", { p_old: f.old.value, p_new: f.nw.value });
      S.user.default_password = false; LS.set("kt_user", S.user);
      f.reset();
      box.innerHTML = '<div class="alert alert-ok">Đã đổi mật khẩu. Lần sau hãy đăng nhập bằng mật khẩu mới.</div>';
    } catch (e) { box.innerHTML = errBox(e); }
  });
  ACT.logout = doLogout;
}

/* ================================================================
 *                           HOC SINH
 * ================================================================ */
function asgStatus(a) {
  if (a.doing_id) return { key: "doing", html: '<span class="badge gold">Đang làm dở</span>' };
  if (a.used > 0) return { key: "done", html: `<span class="score ${scoreCls(a.best)}">${fmtScore(a.best)}</span>` };
  if (a.closed) return { key: "missed", html: '<span class="badge">Không làm</span>' };
  return { key: "todo", html: '<span class="badge gold">Chưa làm</span>' };
}
function asgMeta(a) {
  const bits = [`${a.n_questions} câu`];
  if (a.time_limit_min) bits.push(`${a.time_limit_min} phút`);
  if (a.max_attempts) bits.push(`làm ${a.used || 0}/${a.max_attempts} lần`);
  if (a.due_at) bits.push(`Hạn ${fmtDT(a.due_at)}${a.closed ? "" : " (" + remainText(a.due_at) + ")"}`);
  return bits.join(" · ");
}
function asgCard(a) {
  const st = asgStatus(a);
  return `<div class="card tap" data-act="open" data-id="${a.id}">
    <div class="row between"><span class="badge ${a.mode === "exam" ? "exam" : "hw"}">${a.mode === "exam" ? "Kiểm tra" : "Bài tập"}</span>${st.html}</div>
    <h3 style="margin:8px 0 2px">${esc(a.title)}</h3>
    <div class="small muted">${asgMeta(a)}</div></div>`;
}

async function sHome() {
  const refresh = '<button class="btn btn-sm" data-act="refresh" title="Tải lại" aria-label="Tải lại" style="font-size:18px">↻</button>';
  app.innerHTML = sShell("home", spinner(), { right: refresh });
  ACT.refresh = () => route();
  ACT.retry = () => route();
  ACT.open = (el) => go("#/start/" + el.dataset.id);
  let d;
  try { d = await api("student_home"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  S.home = d.assignments; S.user = d.user; LS.set("kt_user", d.user);
  const groups = { doing: [], todo: [], done: [], missed: [] };
  d.assignments.forEach((a) => groups[asgStatus(a).key].push(a));
  groups.todo.sort((a, b) => (a.due_at ? Date.parse(a.due_at) : 9e15) - (b.due_at ? Date.parse(b.due_at) : 9e15));
  let html = "";
  if (d.user.default_password) {
    html += `<div class="alert alert-warn">Em đang dùng mật khẩu cô phát. <a href="#/account">Đổi mật khẩu riêng</a> để giữ tài khoản an toàn nhé.</div>`;
  }
  if (!d.user.class_id) html += '<div class="alert alert-warn">Tài khoản của em chưa được xếp lớp. Hãy báo cô.</div>';
  const sec = (t, list) => (list.length ? `<div class="section-title">${t} (${list.length})</div>` + list.map(asgCard).join("") : "");
  html += sec("Đang làm dở", groups.doing) + sec("Cần làm", groups.todo) + sec("Đã làm", groups.done) + sec("Đã hết hạn", groups.missed);
  if (!d.assignments.length) html += '<div class="empty">🎉 Hiện chưa có bài nào được giao.</div>';
  app.innerHTML = sShell("home", html, { right: refresh });
}

async function sStart(aid) {
  app.innerHTML = sShell("home", spinner(), { left: backBtn("#/") });
  ACT.retry = () => route();
  let a, past;
  try {
    if (!S.home) S.home = (await api("student_home")).assignments;
    a = S.home.find((x) => x.id === aid);
    if (!a) throw new Error("Không tìm thấy bài này.");
    past = (await api("my_results")).filter((r) => r.assignment_id === aid);
  } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/"); return; }
  const left = a.max_attempts ? a.max_attempts - (a.used || 0) : null;
  const canStart = a.doing_id || (!a.closed && (left === null || left > 0));
  let rules = `<li>Bài có <b>${a.n_questions} câu</b> trắc nghiệm.</li>`;
  if (a.time_limit_min) rules += `<li>Thời gian: <b>${a.time_limit_min} phút</b>, tính từ lúc bấm bắt đầu. Hết giờ bài <b>tự nộp</b>.</li>`;
  if (a.due_at) rules += `<li>Hạn nộp: <b>${fmtDT(a.due_at)}</b> (${remainText(a.due_at)}).</li>`;
  rules += `<li>Số lần làm: <b>${a.max_attempts ? a.max_attempts + " lần" : "không giới hạn"}</b>${a.used ? ` (đã làm ${a.used})` : ""}${a.mode === "homework" && a.max_attempts !== 1 ? ", lấy điểm cao nhất" : ""}.</li>`;
  rules += "<li>Bài làm được lưu liên tục. Nếu mất mạng hay tắt máy, em vào lại sẽ làm tiếp được.</li>";
  if (a.mode === "exam") rules += "<li><b>Không thoát ra khỏi trang</b> khi đang làm. Mỗi lần thoát ra, cô sẽ thấy.</li>";
  let btn;
  if (a.doing_id) btn = '<button class="btn btn-gold btn-block btn-lg" data-act="go">Làm tiếp bài đang dở</button>';
  else if (canStart) btn = `<button class="btn btn-primary btn-block btn-lg" data-act="go">${a.used ? "Làm lại" : "Bắt đầu làm bài"}</button>`;
  else btn = `<div class="alert alert-warn">${a.closed ? "Bài đã hết hạn nộp." : "Em đã dùng hết số lần làm bài này."}</div>`;
  const pastHtml = past.length ? '<div class="section-title">Các lần đã làm</div>' + past.map((r, i) => `
    <div class="card tap row between" data-act="rv" data-id="${r.id}" data-ok="${r.can_review ? 1 : 0}">
      <div><b>Lần ${past.length - i}</b><div class="small muted">${fmtDT(r.submitted_at)} · đúng ${r.correct_count}/${r.total}</div></div>
      <span class="score ${scoreCls(r.score)}">${fmtScore(r.score)}</span></div>`).join("") : "";
  app.innerHTML = sShell("home", `
    <span class="badge ${a.mode === "exam" ? "exam" : "hw"}">${a.mode === "exam" ? "Kiểm tra" : "Bài tập về nhà"}</span>
    <h1 style="margin-top:8px">${esc(a.title)}</h1>
    <div class="card"><ul style="margin:0;padding-left:20px" class="stack">${rules}</ul></div>
    ${btn}${pastHtml}`, { left: backBtn("#/") });
  ACT.go = () => go("#/quiz/" + aid);
  ACT.rv = (el) => { if (el.dataset.ok === "1") go("#/review/" + el.dataset.id); else toast("Cô chưa mở đáp án bài này."); };
}

/* ---------------- lam bai ---------------- */
let Q = null;
async function sQuiz(aid) {
  app.innerHTML = `<div class="center-screen"><div>${spinner()}<p class="muted">Đang mở bài…</p></div></div>`;
  ACT.retry = () => route();
  let d;
  try { d = await api("start_attempt", { p_assignment_id: aid }); } catch (e) {
    app.innerHTML = `<div class="center-screen"><div class="login-box">${pageError(e, "#/start/" + aid)}</div></div>`;
    return;
  }
  const key = "kt_att_" + d.attempt_id;
  const local = LS.get(key);
  const serverT = d.saved_at ? Date.parse(d.saved_at) : 0;
  const useLocal = local && local.t > serverT;
  Q = {
    aid, id: d.attempt_id, title: d.title, mode: d.mode, qs: d.questions, key,
    answers: Object.assign({}, d.answers || {}, useLocal ? local.answers : {}),
    leave: Math.max(d.leave_count || 0, (local && local.leave) || 0),
    idx: Math.min((local && local.idx) || 0, d.questions.length - 1),
    deadline: d.deadline_at ? Date.parse(d.deadline_at) : null,
    offset: Date.parse(d.server_now) - Date.now(),
    dirty: !!useLocal, submitting: false, done: false,
  };
  const qz = Q;
  const tick = setInterval(() => quizTick(qz), 1000);
  const autosave = setInterval(() => quizSave(qz), 20000);
  const onVis = () => {
    if (qz.done) return;
    if (document.visibilityState === "hidden") {
      if (qz.mode === "exam") { qz.leave++; qz.dirty = true; quizLocal(qz); }
      quizSave(qz);
    } else if (qz.mode === "exam" && qz.leave > 0) {
      toast(`Em vừa rời khỏi trang làm bài (lần ${qz.leave}). Cô sẽ thấy số lần này.`, 4000);
    }
  };
  const onUnload = (e) => { if (!qz.done) { quizLocal(qz); e.preventDefault(); e.returnValue = ""; } };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("beforeunload", onUnload);
  cleanup = () => {
    clearInterval(tick); clearInterval(autosave);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("beforeunload", onUnload);
    if (!qz.done) quizSave(qz);
    closeSheet();
  };
  ACT.pick = (el) => {
    const q = qz.qs[qz.idx];
    qz.answers[q.qi] = Number(el.dataset.k);
    qz.dirty = true; quizLocal(qz);
    app.querySelectorAll(".opt").forEach((b) => b.classList.toggle("sel", b === el));
    quizCounters(qz);
  };
  ACT.prev = () => { if (qz.idx > 0) { qz.idx--; quizDraw(qz); window.scrollTo(0, 0); } };
  ACT.next = () => { if (qz.idx < qz.qs.length - 1) { qz.idx++; quizDraw(qz); window.scrollTo(0, 0); } };
  ACT.jump = (el) => { closeSheet(); qz.idx = Number(el.dataset.i); quizDraw(qz); window.scrollTo(0, 0); };
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  ACT.askSubmit = () => quizAskSubmit(qz);
  ACT.doSubmit = () => { closeSheet(); quizSubmit(qz, false); };
  quizDraw(qz);
}
function quizLocal(qz) { LS.set(qz.key, { answers: qz.answers, leave: qz.leave, idx: qz.idx, t: Date.now() }); }
function quizRemain(qz) { return qz.deadline ? qz.deadline - (Date.now() + qz.offset) : null; }
function quizAnswered(qz) { return qz.qs.filter((q) => qz.answers[q.qi] !== undefined).length; }
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(x);
}
function quizShowTimer(qz) {
  const r = quizRemain(qz);
  return r !== null && (qz.mode === "exam" || r < 3600e3);
}
function quizDraw(qz) {
  const q = qz.qs[qz.idx], n = qz.qs.length, last = qz.idx === n - 1;
  app.innerHTML = `<div class="page">
  <div class="sticky-top">
    <div class="top"><span class="ttl">${qz.mode === "exam" ? "📝" : "📘"} ${esc(qz.title)}</span>
      ${quizShowTimer(qz) ? '<span class="timer" id="timer">⏱ --:--</span>' : ""}</div>
    <div class="bar" style="margin-bottom:14px"><i id="prog"></i></div>
  </div>
  <div class="card">
    <div class="muted small"><span class="badge ${qz.mode === "exam" ? "exam" : "hw"}" style="margin-right:6px">${qz.mode === "exam" ? "Kiểm tra" : "Bài tập"}</span>Câu ${qz.idx + 1} / ${n} · <span id="cnt"></span></div>
    ${q.instruction ? `<div class="q-instr" style="margin-top:10px">${fmt(q.instruction)}</div>` : ""}
    <div class="q-text">${fmt(q.question)}</div>
    <div class="opts">${q.options.map((o, i) => `<button class="opt ${qz.answers[q.qi] === o.k ? "sel" : ""}" data-act="pick" data-k="${o.k}"><span class="L">${LETTERS[i]}</span><span>${fmt(o.t)}</span></button>`).join("")}</div>
    <div class="nav">
      <button class="btn" data-act="prev" ${qz.idx === 0 ? "disabled" : ""}>← Câu trước</button>
      ${last ? '<button class="btn btn-gold" data-act="askSubmit">Nộp bài ✔</button>' : '<button class="btn btn-primary" data-act="next">Câu sau →</button>'}
    </div>
    <div class="dots">${qz.qs.map((x, i) => `<button class="${qz.answers[x.qi] !== undefined ? "done" : ""} ${i === qz.idx ? "cur" : ""}" data-act="jump" data-i="${i}">${i + 1}</button>`).join("")}</div>
  </div>
  ${last ? "" : '<button class="btn btn-gold btn-block" data-act="askSubmit">Nộp bài ✔</button>'}
  </div>`;
  quizCounters(qz);
  quizTick(qz);
}
function quizCounters(qz) {
  const a = quizAnswered(qz), n = qz.qs.length;
  const c = document.getElementById("cnt"), p = document.getElementById("prog");
  if (c) c.textContent = `đã làm ${a}/${n}`;
  if (p) p.style.width = (a / n) * 100 + "%";
  const dot = app.querySelectorAll(".dots button")[qz.idx];
  if (dot) dot.classList.toggle("done", qz.answers[qz.qs[qz.idx].qi] !== undefined);
}
function quizTick(qz) {
  if (qz.done) return;
  const r = quizRemain(qz);
  if (r === null) return;
  const el = document.getElementById("timer");
  if (el) { el.textContent = "⏱ " + fmtClock(r); el.classList.toggle("warn", r < 60e3); }
  if (r <= 0 && !qz.submitting) {
    closeSheet();
    toast("Hết giờ! Bài được nộp tự động.", 4000);
    quizSubmit(qz, true);
  }
}
async function quizSave(qz) {
  if (!qz.dirty || qz.submitting || qz.done || qz.saving) return;
  qz.saving = true;
  try {
    const r = await api("save_progress", { p_attempt_id: qz.id, p_answers: qz.answers, p_leave_count: qz.leave });
    qz.dirty = false;
    if (r.submitted) quizSubmit(qz, true);
  } catch (e) { /* lan sau luu tiep; da co ban luu tren may */ } finally { qz.saving = false; }
}
function openSheet(html) {
  closeSheet();
  const div = document.createElement("div");
  div.className = "sheet-bg"; div.id = "sheet"; div.dataset.act = "closeSheet";
  div.innerHTML = `<div class="sheet" data-act="noop">${html}</div>`;
  document.body.appendChild(div);
  return div;
}
function closeSheet() { const s = document.getElementById("sheet"); if (s) s.remove(); }
function quizAskSubmit(qz) {
  const miss = qz.qs.length - quizAnswered(qz);
  openSheet(`<h2>Nộp bài?</h2>
    ${miss ? `<div class="alert alert-warn">Em còn <b>${miss} câu</b> chưa làm.</div>` : '<p class="muted">Em đã làm hết tất cả các câu.</p>'}
    <p class="small muted">Sau khi nộp sẽ không sửa được nữa.</p>
    <div class="row" style="flex-wrap:nowrap"><button class="btn grow" data-act="closeSheet">Làm tiếp</button>
    <button class="btn btn-gold grow" data-act="doSubmit">Nộp bài</button></div>`);
}
async function quizSubmit(qz, auto) {
  if (qz.submitting || qz.done) return;
  qz.submitting = true;
  quizLocal(qz);
  openSheet(`<div style="text-align:center">${spinner()}<p>Đang nộp bài…</p></div>`);
  try {
    const r = await api("submit_attempt", { p_attempt_id: qz.id, p_answers: qz.answers, p_leave_count: qz.leave });
    qz.done = true;
    LS.del(qz.key);
    r.auto = !!auto;
    S.lastResult = r; S.home = null;
    closeSheet();
    go("#/result");
  } catch (e) {
    qz.submitting = false;
    openSheet(`<h2>Chưa nộp được bài</h2>${errBox(e)}
      <p class="small muted">Bài làm của em vẫn được lưu trên máy này. Hãy kiểm tra mạng rồi bấm nộp lại.</p>
      <button class="btn btn-gold btn-block btn-lg" data-act="doSubmit">Nộp lại</button>`);
    if (auto) setTimeout(() => { if (!qz.done && !qz.submitting) quizSubmit(qz, true); }, 10000);
  }
}

function sResult() {
  const r = S.lastResult;
  if (!r) return go("#/");
  const v = Number(r.score);
  const msg = v >= 9 ? "Xuất sắc! 🌟" : v >= 8 ? "Giỏi lắm! 👏" : v >= 6.5 ? "Khá tốt, cố gắng thêm nhé!" : v >= 5 ? "Đạt. Em xem lại các câu sai nhé." : "Em cần ôn lại bài này.";
  app.innerHTML = sShell("home", `<div class="card center">
      ${r.auto ? '<p><span class="badge gold">⏰ Hết giờ, bài đã được nộp tự động</span></p>' : ""}
      <div class="logo-emoji">${v >= 8 ? "🏆" : v >= 5 ? "👍" : "📚"}</div>
      <div class="muted">${esc(r.title)}</div>
      <div class="big-score ${scoreCls(v)}" style="margin:12px 0 4px">${fmtScore(v)}</div>
      <div class="muted">điểm</div>
      <p><b>Đúng ${r.correct}/${r.total} câu</b></p>
      <h2 style="margin-bottom:0">${msg}</h2></div>
    ${r.can_review ? `<a class="btn btn-primary btn-block btn-lg" href="#/review/${r.attempt_id}">📖 Xem lại bài làm ➜</a>` : '<div class="alert alert-ok">Cô sẽ mở đáp án sau. Em xem lại ở mục <b>📊 Kết quả</b> nhé.</div>'}
    ${r.can_retry ? `<a class="btn btn-block btn-lg" href="#/start/${r.assignment_id}" style="margin-top:12px">🔁 Làm lại</a>` : ""}
    <a class="btn btn-ghost btn-block" href="#/" style="margin-top:12px">Về trang chủ</a>`);
}

function reviewHtml(d, onlyWrong) {
  return d.questions.map((q, i) => {
    const ok = q.chosen === q.correct;
    if (onlyWrong && ok) return "";
    return `<div class="card review ${ok ? "" : "wrong"}">
      <div class="row between" style="margin-bottom:6px"><b>Câu ${i + 1}</b>${ok ? '<span class="badge hw">Đúng</span>' : q.chosen === null || q.chosen === undefined ? '<span class="badge exam">Bỏ trống</span>' : '<span class="badge exam">Sai</span>'}</div>
      ${q.instruction ? `<div class="q-instr">${fmt(q.instruction)}</div>` : ""}
      <div class="q-text" style="font-size:17px">${fmt(q.question)}</div>
      <div class="review-opts">${q.options.map((o, j) => `<div class="opt static ${o.k === q.correct ? "right" : o.k === q.chosen ? "wrong" : ""}"><span class="L">${LETTERS[j]}</span><span>${fmt(o.t)}${o.k === q.chosen ? " <i class='small'>(đã chọn)</i>" : ""}</span></div>`).join("")}</div>
      ${ok ? (q.explanation ? `<details class="explain-mo"><summary>💡 Giải thích</summary><div class="explain">${fmt(q.explanation)}</div></details>` : "")
        : `<div class="explain"><div class="small" style="margin-bottom:4px">${q.chosen === null || q.chosen === undefined ? "Em <b>bỏ trống</b> câu này" : `Em chọn: <b class="sai">${LETTERS[q.options.findIndex((o) => o.k === q.chosen)]}. ${fmt(q.options.find((o) => o.k === q.chosen).t)}</b>`}
          · Đáp án đúng: <b class="dung">${LETTERS[q.options.findIndex((o) => o.k === q.correct)]}. ${fmt(q.options.find((o) => o.k === q.correct).t)}</b></div>
          ${q.explanation ? `<b>💡 Giải thích</b><div>${fmt(q.explanation)}</div>` : '<span class="small muted">Cô chưa thêm giải thích cho câu này.</span>'}</div>`}</div>`;
  }).join("");
}
async function sReview(id) {
  app.innerHTML = sShell("results", spinner(), { left: backBtn("#/results") });
  ACT.retry = () => route();
  let d;
  try { d = await api("attempt_review", { p_attempt_id: id }); } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/results"); return; }
  let onlyWrong = false;
  const draw = () => {
    app.querySelector("main").innerHTML = `<div class="card center"><div class="logo-emoji">📖</div><h1>${esc(d.title)}</h1>
      <div class="big-score ${scoreCls(d.score)}" style="font-size:52px;margin:8px 0">${fmtScore(d.score)}</div>
      <div class="muted">Đúng ${d.correct}/${d.total} câu · nộp lúc ${fmtDT(d.submitted_at)}</div></div>
      <label class="check"><input type="checkbox" data-ch="ow" ${onlyWrong ? "checked" : ""}> Chỉ xem câu sai</label>
      ${reviewHtml(d, onlyWrong) || '<div class="empty">Không có câu sai nào. Tuyệt vời!</div>'}`;
  };
  ACT["ch:ow"] = (el) => { onlyWrong = el.checked; draw(); };
  draw();
}

/* ---------------- cong hoc sinh: ket qua, tien bo, diem danh, hoc phi ---------------- */
const NGUON = {
  omr: { icon: "📄", nhan: "Phiếu chấm", mau: "#4f6df5" },
  tu_vung: { icon: "🔤", nhan: "Từ vựng", mau: "#1fa971" },
  online: { icon: "💻", nhan: "Online", mau: "#f59e0b" },
  mieng: { icon: "🎤", nhan: "Kiểm tra miệng", mau: "#e5487f" },
};
// Tai khoan nhan hoc phi theo khoi (co duyet 11/10/2026)
const NGAN_HANG = {
  nho: { ten: "BIDV", so: "8600010261", chu: "HKD ANH NGU MS NINH", qr: "qr_bidv.jpg" },
  lon: { ten: "Vietcombank", so: "3976743002", chu: "TRAN HOAI NGOC", qr: "qr_vcb.jpg" },
};
function nganHang(khoi) { return khoi ? (khoi <= 6 ? NGAN_HANG.nho : NGAN_HANG.lon) : null; }
function boDau(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
function tien(n) { return n === null || n === undefined ? "—" : Number(n).toLocaleString("vi-VN") + "đ"; }
function thangVN(t) { const [y, m] = String(t).split("-"); return `Tháng ${Number(m)}/${y}`; }
function ngayVN(iso) { const d = new Date(iso); return `${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; }
function ngayDate(s) { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); }
function diemHien(r) { return r.nguon === "mieng" ? `${fmtScore(r.diem10)}<small>★</small>` : fmtScore(r.diem10); }

async function layDash(force) {
  if (!force && S.dash && Date.now() - S.dashAt < 60000) return S.dash;
  S.dash = await api("student_dashboard");
  S.dashAt = Date.now();
  S.user = S.dash.user; LS.set("kt_user", S.user);
  return S.dash;
}
// Khung chung cho 4 tab moi: tai du lieu 1 lan, nut tai lai
async function sDashPage(tab, draw) {
  const refresh = '<button class="btn btn-sm" data-act="refresh" title="Tải lại" aria-label="Tải lại" style="font-size:18px">↻</button>';
  app.innerHTML = sShell(tab, spinner(), { right: refresh });
  ACT.retry = () => route();
  ACT.refresh = async () => { S.dash = null; route(); };
  let d;
  try { d = await layDash(); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  draw(d, app.querySelector("main"));
}

function sResults() {
  let loc = "";
  return sDashPage("results", (d, main) => {
    const ve = () => {
      const all = d.ket_qua;
      const list = loc ? all.filter((r) => r.nguon === loc) : all;
      const tb = list.length ? list.reduce((s, r) => s + Number(r.diem10), 0) / list.length : null;
      const co = Object.keys(NGUON).filter((k) => all.some((r) => r.nguon === k));
      main.innerHTML = `<h1>🏆 Kết quả của em</h1>
        <div class="tiles"><div class="tile"><b>${list.length}</b><span>bài ${loc ? NGUON[loc].nhan.toLowerCase() : "đã làm"}</span></div>
          <div class="tile"><b>${tb === null ? "–" : fmtScore(Math.round(tb * 100) / 100)}</b><span>điểm trung bình (thang 10)</span></div></div>
        ${co.length > 1 ? `<div class="chips"><button class="chip ${loc ? "" : "on"}" data-act="loc" data-k="">Tất cả</button>${co.map((k) =>
          `<button class="chip ${loc === k ? "on" : ""}" data-act="loc" data-k="${k}">${NGUON[k].icon} ${NGUON[k].nhan}</button>`).join("")}</div>` : ""}
        ${list.map((r) => {
          const n = NGUON[r.nguon];
          const tap = r.nguon === "online" ? `data-act="rv" data-id="${r.attempt_id}" data-ok="${r.xem_lai ? 1 : 0}"` : "";
          const meta = [n.nhan + (r.ghi_chu && r.nguon === "online" ? " · " + r.ghi_chu : ""), ngayVN(r.ngay)];
          if (r.tong) meta.push(`đúng ${r.dung ?? "?"}/${r.tong}`);
          return `<div class="card kq ${tap ? "tap" : ""}" ${tap}>
            <span class="kq-ic" style="background:${n.mau}1f">${n.icon}</span>
            <div class="grow"><b>${esc(r.ten)}</b><div class="small muted">${meta.join(" · ")}</div>
              ${r.nguon === "mieng" && r.ghi_chu ? `<div class="quote">“${esc(r.ghi_chu)}”</div>` : ""}</div>
            <span class="score ${scoreCls(r.diem10)}">${diemHien(r)}</span></div>`;
        }).join("") || '<div class="empty">🌱 Chưa có kết quả nào. Làm bài xong điểm sẽ hiện ở đây.</div>'}`;
    };
    ACT.loc = (el) => { loc = el.dataset.k; ve(); };
    ACT.rv = (el) => { if (el.dataset.ok === "1") go("#/review/" + el.dataset.id); else toast("Cô chưa mở đáp án bài này."); };
    ve();
  });
}

// Bieu do duong SVG tu ve: diem (thang 10) theo thoi gian, cham mau theo nguon
function bieuDo(list) {
  const W = 340, H = 190, L = 26, R = 10, T = 12, B = 26;
  const pts = list.slice(-20);
  if (pts.length < 2) return "";
  const x = (i) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v) => T + ((10 - Number(v)) * (H - T - B)) / 10;
  const grid = [0, 5, 8, 10].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 6}" y="${y(v) + 4}" class="gt" text-anchor="end">${v}</text>`).join("");
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.diem10).toFixed(1)}`).join(" ");
  const area = `${L},${y(0)} ${line} ${x(pts.length - 1).toFixed(1)},${y(0)}`;
  const dots = pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.diem10).toFixed(1)}" r="5" fill="${NGUON[p.nguon].mau}" stroke="#fff" stroke-width="2"><title>${esc(p.ten)}: ${fmtScore(p.diem10)}</title></circle>`).join("");
  const nhan = [0, pts.length - 1].map((i) => `<text x="${x(i)}" y="${H - 6}" class="gt" text-anchor="${i ? "end" : "start"}">${ngayVN(pts[i].ngay).slice(3)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Biểu đồ điểm theo thời gian">
    <defs><linearGradient id="gA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4f6df5" stop-opacity=".25"/><stop offset="1" stop-color="#4f6df5" stop-opacity="0"/></linearGradient></defs>
    ${grid}<polygon points="${area}" fill="url(#gA)"/><polyline points="${line}" fill="none" stroke="#4f6df5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${nhan}</svg>`;
}
function sTienBo() {
  return sDashPage("tienbo", (d, main) => {
    const list = d.ket_qua.slice().sort((a, b) => new Date(a.ngay) - new Date(b.ngay));
    const avg = (a) => (a.length ? a.reduce((s, r) => s + Number(r.diem10), 0) / a.length : null);
    const thang = (r) => String(r.ngay).slice(0, 7);
    const thangNay = d.thang_nay;
    const [y, m] = thangNay.split("-").map(Number);
    const thangTruoc = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
    const a1 = avg(list.filter((r) => thang(r) === thangNay)), a0 = avg(list.filter((r) => thang(r) === thangTruoc));
    const xu = a1 !== null && a0 !== null ? a1 - a0 : null;
    const loai = Object.keys(NGUON).map((k) => ({ k, a: avg(list.filter((r) => r.nguon === k)), n: list.filter((r) => r.nguon === k).length })).filter((o) => o.n);
    const tot = list.length ? list.reduce((b, r) => (Number(r.diem10) > Number(b.diem10) ? r : b)) : null;
    main.innerHTML = `<h1>📈 Tiến bộ của em</h1>
      ${list.length < 2 ? '<div class="empty">🌱 Cần ít nhất 2 bài để vẽ biểu đồ. Cố lên nhé!</div>' : `
      <div class="tiles">
        <div class="tile"><b>${a1 === null ? "–" : fmtScore(Math.round(a1 * 10) / 10)}</b><span>điểm TB ${thangVN(thangNay).toLowerCase()}</span></div>
        <div class="tile"><b class="${xu === null ? "" : xu >= 0 ? "up" : "down"}">${xu === null ? "–" : (xu >= 0 ? "▲ " : "▼ ") + fmtScore(Math.abs(Math.round(xu * 10) / 10))}</b><span>so với tháng trước</span></div>
      </div>
      <div class="card"><h3 style="margin-top:0">Điểm 20 bài gần nhất</h3>${bieuDo(list)}
        <div class="legend">${loai.map((o) => `<span><i style="background:${NGUON[o.k].mau}"></i>${NGUON[o.k].nhan}</span>`).join("")}</div></div>
      <div class="card"><h3 style="margin-top:0">Điểm trung bình từng loại</h3>
        ${loai.map((o) => `<div class="hbar"><span class="hl">${NGUON[o.k].icon} ${NGUON[o.k].nhan} <small class="muted">(${o.n} bài)</small></span>
          <div class="bar"><i style="width:${o.a * 10}%;background:${NGUON[o.k].mau}"></i></div><b>${fmtScore(Math.round(o.a * 10) / 10)}</b></div>`).join("")}</div>
      ${tot ? `<div class="card cheer">🌟 Bài tốt nhất: <b>${esc(tot.ten)}</b> — <b>${diemHien(tot)}</b> điểm (${ngayVN(tot.ngay)})</div>` : ""}`}`;
  });
}

/* ---- Phieu nhan xet tuan (dung chung: HS xem, GV xem lich su / ho so). Du lieu do webcam gui, moi truong co the thieu ---- */
function nxNgay(d) { return d ? String(d).slice(8, 10) + "/" + String(d).slice(5, 7) : ""; }
function nxTheHtml(n, tieuDe) {
  const d = n.noi_dung || {}, tk = d.thong_ke || {}, di = d.diem || {};
  const ds = (a) => (Array.isArray(a) ? a.filter((x) => x !== null && x !== undefined && String(x).trim() !== "") : []);
  const so = (v) => (v === null || v === undefined || v === "" ? "—" : esc(v));
  const kq = ds(d.ket_qua);
  return `<div class="card nx">
    <div class="row between" style="gap:8px;flex-wrap:wrap"><h3 style="margin:0">${tieuDe ? esc(tieuDe) + " · " : ""}Tuần ${nxNgay(n.tuan_tu)} – ${nxNgay(n.tuan_den)}/${String(n.tuan_den || "").slice(0, 4)}</h3>
      <span>${d.thai_do === "tot" ? '<span class="badge hw">😊 Thái độ tốt</span>' : d.thai_do === "can_co_gang" ? '<span class="badge gold">💪 Cần cố gắng</span>' : ""}${n.cong_khai === false ? ' <span class="badge">Nháp (HS chưa thấy)</span>' : ""}</span></div>
    ${Object.keys(tk).length ? `<div class="nx-so">
      ${tk.tong_buoi !== undefined ? `<div><b>${so(tk.co_mat)}/${so(tk.tong_buoi)}</b><span>buổi có mặt</span></div>` : ""}
      ${tk.online_giao !== undefined ? `<div><b>${so(tk.online_giao - (tk.chua_lam || 0))}/${so(tk.online_giao)}</b><span>bài online đã làm</span></div>` : ""}
      ${tk.tren_lop !== undefined ? `<div><b>${so(tk.tren_lop)}</b><span>bài trên lớp</span></div>` : ""}
      ${di.chuyen_can !== undefined ? `<div><b>${so(di.chuyen_can)}</b><span>điểm chuyên cần</span></div>` : ""}
      ${di.bt_online !== undefined ? `<div><b>${so(di.bt_online)}</b><span>điểm BT online</span></div>` : ""}
      ${di.thai_do !== undefined ? `<div><b>${so(di.thai_do)}</b><span>điểm thái độ</span></div>` : ""}</div>` : ""}
    ${kq.length ? `<div class="section-title" style="margin-top:10px">Kết quả trong tuần</div>${kq.map((k) => `<div class="nx-kq"><div class="row between"><span><b>${esc(k.ten || "")}</b>${k.chuyen_de ? ` <span class="small muted">· ${esc(k.chuyen_de)}</span>` : ""}</span>
        <b class="score ${scoreCls(k.diem)}">${k.diem === null || k.diem === undefined ? "—" : fmtScore(k.diem)}</b></div>
        ${k.tong ? `<div class="small muted">Đúng ${so(k.dung)}/${so(k.tong)}${ds(k.phan).length ? " · " + ds(k.phan).map((x) => `${esc(x.ten || "")} ${so(x.dung)}/${so(x.tong)}`).join(" · ") : ""}</div>` : ""}</div>`).join("")}` : ""}
    ${ds(d.kien_thuc).length ? `<div class="section-title" style="margin-top:10px">Kiến thức đã học</div><ul class="nx-ds">${ds(d.kien_thuc).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${ds(d.bai_tap).length ? `<div class="section-title" style="margin-top:10px">Bài tập về nhà</div><ul class="nx-ds">${ds(d.bai_tap).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${ds(d.gop_y_thai_do).length ? `<div class="section-title" style="margin-top:10px">Góp ý thái độ</div><ul class="nx-ds">${ds(d.gop_y_thai_do).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${d.nhan_xet ? `<div class="explain" style="margin-top:10px">💬 <b>Cô nhắc nhở:</b> ${esc(d.nhan_xet).replace(/\n/g, "<br>")}</div>` : ""}
  </div>`;
}
function nxCss() {
  if (document.getElementById("nxCss")) return;
  const st = document.createElement("style");
  st.id = "nxCss";
  st.textContent = `.nx-so { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-top: 10px; }
    .nx-so div { background: #f4f7ff; border-radius: 12px; padding: 8px; text-align: center; } .nx-so b { display: block; font-size: 20px; color: var(--pri-d); } .nx-so span { font-size: 12.5px; color: var(--muted); }
    .nx-kq { padding: 6px 0; border-bottom: 1px solid #eef1f8; } .nx-ds { margin: 4px 0 0; padding-left: 20px; }`;
  document.head.appendChild(st);
}
// Bao cao thang (dung chung: HS xem, GV xem / in). b = ket qua _bao_cao_thang
function bcTheHtml(b, tieuDe) {
  const NG = { omr: "Phiếu chấm", tu_vung: "Từ vựng", online: "Online", mieng: "Kiểm tra miệng" };
  const dd = b.diem_danh || {}, hp = b.hoc_phi, diem = b.diem || {};
  return `<div class="card nx bc">
    <h3 style="margin:0">${tieuDe ? esc(tieuDe) + " · " : ""}Báo cáo ${esc(thangVN(b.thang).toLowerCase())}</h3>
    <div class="nx-so">
      <div><b class="score ${b.diem_tb === null || b.diem_tb === undefined ? "" : scoreCls(b.diem_tb)}">${b.diem_tb === null || b.diem_tb === undefined ? "—" : fmtScore(b.diem_tb)}</b><span>điểm TB các bài</span></div>
      <div><b>${dd.co_mat || 0}</b><span>buổi có mặt</span></div>
      <div><b style="${dd.vang ? "color:var(--bad)" : ""}">${dd.vang || 0}</b><span>buổi vắng</span></div>
      ${hp ? `<div><b style="font-size:16px">${hp.da_dong ? "✓ Đã đóng" : tien(hp.thanh_tien)}</b><span>học phí${hp.so_buoi !== null && hp.so_buoi !== undefined ? " · " + hp.so_buoi + " buổi" : ""}</span></div>` : ""}</div>
    ${Object.keys(diem).length ? `<div class="section-title" style="margin-top:10px">Điểm theo loại bài</div>${Object.entries(diem).map(([k, v]) => `<div class="row between nx-kq"><span>${esc(NG[k] || k)} <span class="small muted">(${v.so_bai} bài)</span></span><b>${k === "mieng" ? fmtScore(v.tb) + "★" : fmtScore(v.tb)}</b></div>`).join("")}` : '<p class="small muted">Chưa có bài làm trong tháng.</p>'}
    ${dd.ngay_vang && dd.ngay_vang.length ? `<p class="small muted">Vắng: ${dd.ngay_vang.map((n) => esc(nxNgay(n))).join(", ")}</p>` : ""}
    ${(b.nhan_xet_tuan || []).length ? `<div class="section-title" style="margin-top:10px">Nhận xét các tuần</div>${b.nhan_xet_tuan.map((n) => `<div class="nx-kq"><b>Tuần ${nxNgay(n.tuan_tu)} – ${nxNgay(n.tuan_den)}</b>
        ${n.noi_dung && n.noi_dung.thai_do === "tot" ? ' <span class="badge hw">Thái độ tốt</span>' : n.noi_dung && n.noi_dung.thai_do === "can_co_gang" ? ' <span class="badge gold">Cần cố gắng</span>' : ""}${n.cong_khai === false ? ' <span class="badge">Nháp</span>' : ""}
        ${n.noi_dung && n.noi_dung.nhan_xet ? `<div class="small">💬 ${esc(n.noi_dung.nhan_xet)}</div>` : ""}</div>`).join("")}` : ""}
  </div>`;
}
function sNhanXet() {
  nxCss();
  let th = null;
  return sDashPage("nhanxet", (d, main) => {
    const ds = d.nhan_xet_tuan || [];
    th = th || d.thang_nay;
    main.innerHTML = `<h1 style="margin-top:0">📝 Nhận xét</h1>
      <div class="section-title">Báo cáo tháng</div>
      <div class="filters"><input class="input" type="month" data-ch="bcThang" value="${esc(th)}" aria-label="Tháng"></div><div id="bcKhung">${spinner()}</div>
      <div class="section-title" style="margin-top:14px">Nhận xét theo tuần</div>
      ${ds.length ? ds.map((n) => nxTheHtml(n)).join("") : '<div class="empty">Chưa có nhận xét tuần nào. Cô sẽ gửi nhận xét sau mỗi tuần học.</div>'}`;
    const veBc = async () => {
      const k = document.getElementById("bcKhung");
      try { k.innerHTML = bcTheHtml(await api("my_bao_cao_thang", { p_thang: th })); } catch (e) { k.innerHTML = errBox(e); }
    };
    ACT["ch:bcThang"] = (el) => { if (el.value) { th = el.value; veBc(); } };
    veBc();
  });
}

function sDiemDanh() {
  let th = null;
  return sDashPage("diemdanh", (d, main) => {
    th = th || d.thang_nay;
    const ve = () => {
      const buoi = d.diem_danh.filter((b) => String(b.ngay).startsWith(th));
      const coMat = buoi.filter((b) => b.co_mat).length, vang = buoi.length - coMat;
      const [y, m] = th.split("-").map(Number);
      const dau = new Date(y, m - 1, 1), soNgay = new Date(y, m, 0).getDate();
      const lech = (dau.getDay() + 6) % 7; // T2 dau tuan
      const theoNgay = {};
      buoi.forEach((b) => { theoNgay[Number(String(b.ngay).slice(8, 10))] = b; });
      let o = '<div class="cal">' + ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((t) => `<div class="cal-h">${t}</div>`).join("");
      for (let i = 0; i < lech; i++) o += "<div></div>";
      for (let n = 1; n <= soNgay; n++) {
        const b = theoNgay[n];
        o += `<div class="cal-d ${b ? (b.co_mat ? "co" : "vang") : ""}">${n}${b ? `<i>${b.co_mat ? "✓" : "✗"}</i>` : ""}</div>`;
      }
      o += "</div>";
      const cach = { qr: "quét QR", tay: "cô điểm danh", khuon_mat: "nhận diện" };
      main.innerHTML = `<h1>📅 Điểm danh</h1>
        <div class="monthnav"><button class="btn btn-sm" data-act="th" data-d="-1">‹</button><b>${thangVN(th)}</b><button class="btn btn-sm" data-act="th" data-d="1">›</button></div>
        <div class="tiles"><div class="tile"><b style="color:var(--ok)">${coMat}</b><span>buổi có mặt</span></div>
          <div class="tile"><b style="color:${vang ? "var(--bad)" : "var(--pri-d)"}">${vang}</b><span>buổi vắng</span></div></div>
        <div class="card">${o}</div>
        ${buoi.length ? `<div class="card" style="padding:8px 16px">${buoi.slice().sort((a, b) => (a.ngay < b.ngay ? -1 : 1)).map((b) => `
          <div class="dd-row"><span>${b.co_mat ? "✅" : "❌"} <b>${ngayVN(b.ngay)}</b>${b.lop && b.lop !== d.user.class_name ? ` <span class="muted small">${esc(b.lop)}</span>` : ""}</span>
          <span class="small muted">${b.co_mat ? (b.gio_den ? "đến " + esc(b.gio_den) : "") + (b.cach ? " · " + (cach[b.cach] || esc(b.cach)) : "") : "vắng"}</span></div>`).join("")}</div>`
          : '<div class="empty">Chưa có buổi học nào được ghi trong tháng này.</div>'}`;
    };
    ACT.th = (el) => {
      let [y, m] = th.split("-").map(Number);
      m += Number(el.dataset.d);
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      th = `${y}-${pad(m)}`; ve();
    };
    ve();
  });
}

function sHocPhi() {
  return sDashPage("hocphi", (d, main) => {
    const ds = d.hoc_phi;
    const cur = ds.find((f) => f.thang === d.thang_nay) || ds[0];
    let html = "<h1>💰 Học phí</h1>";
    if (!cur) {
      main.innerHTML = html + '<div class="empty">Chưa có thông tin học phí.</div>';
      return;
    }
    const nh = nganHang(cur.khoi || d.khoi);
    const noiDung = `Hoc phi ${boDau(d.user.name)} - Thang ${Number(cur.thang.slice(5))}/${cur.thang.slice(0, 4)}`;
    html += `<div class="card fee ${cur.da_dong ? "paid" : ""}">
      <div class="row between"><h2 style="margin:0">${thangVN(cur.thang)}</h2>
        ${cur.da_dong ? '<span class="badge hw">✓ Đã đóng</span>' : '<span class="badge exam">Chưa đóng</span>'}</div>
      ${cur.so_buoi !== null ? `<div class="fee-calc"><span>${cur.so_buoi} buổi</span><span>×</span><span>${tien(cur.don_gia)}</span></div>
      <div class="fee-total">${tien(cur.thanh_tien)}</div>` : '<p class="muted">Cô chưa cập nhật số buổi tháng này.</p>'}
      ${cur.da_dong ? `<p class="center muted small" style="margin:0">Cảm ơn ba mẹ! Cô đã nhận học phí${cur.ngay_dong ? " ngày " + ngayVN(cur.ngay_dong) : ""} 💙</p>` : ""}
      ${cur.ghi_chu ? `<p class="small muted">Ghi chú: ${esc(cur.ghi_chu)}</p>` : ""}</div>`;
    if (!cur.da_dong && cur.thanh_tien > 0) {
      html += nh ? `<div class="card pay">
        <h3 style="margin-top:0">Chuyển khoản</h3>
        <img class="qr" src="${nh.qr}" alt="Mã QR ${nh.ten}">
        <div class="pay-row"><span>Ngân hàng</span><b>${nh.ten}</b></div>
        <div class="pay-row"><span>Số tài khoản</span><b>${nh.so}</b><button class="btn btn-sm" data-act="cp" data-v="${nh.so}">Chép</button></div>
        <div class="pay-row"><span>Chủ tài khoản</span><b>${nh.chu}</b></div>
        <div class="pay-row"><span>Số tiền</span><b>${tien(cur.thanh_tien)}</b><button class="btn btn-sm" data-act="cp" data-v="${cur.thanh_tien}">Chép</button></div>
        <div class="pay-row"><span>Nội dung</span><b>${esc(noiDung)}</b><button class="btn btn-sm" data-act="cp" data-v="${esc(noiDung)}">Chép</button></div>
        <p class="small muted" style="margin-bottom:0">Quét mã QR bằng ứng dụng ngân hàng, nhập đúng số tiền và nội dung. Cô sẽ xác nhận trong 1–2 ngày.</p></div>`
        : '<div class="alert alert-warn">Chưa xác định được khối lớp của em. Ba mẹ vui lòng liên hệ cô để biết tài khoản nhận học phí.</div>';
    }
    const cu = ds.filter((f) => f !== cur);
    if (cu.length) {
      html += `<div class="section-title">Các tháng trước</div><div class="card" style="padding:8px 16px">${cu.map((f) => `
        <div class="dd-row"><span><b>${thangVN(f.thang)}</b> <span class="small muted">${f.so_buoi ?? "?"} buổi</span></span>
        <span>${tien(f.thanh_tien)} ${f.da_dong ? '<span class="badge hw">✓</span>' : '<span class="badge exam">chưa</span>'}</span></div>`).join("")}</div>`;
    }
    main.innerHTML = html;
    ACT.cp = (el) => copyText(el.dataset.v);
  });
}

function sAccount() {
  const u = S.user;
  app.innerHTML = sShell("account", `<h1>Tài khoản</h1>
    <div class="card"><div class="muted small">Họ và tên</div><b style="font-size:18px">${esc(u.name || "")}</b>
      <div class="grid2" style="margin-top:10px"><div><div class="muted small">Mã học sinh</div><b>${esc(u.code)}</b></div>
      <div><div class="muted small">Lớp</div><b>${esc(u.class_name || "—")}</b></div></div></div>
    ${u.default_password ? '<div class="alert alert-warn">Em đang dùng mật khẩu cô phát. Hãy đổi sang mật khẩu riêng mà em dễ nhớ.</div>' : ""}
    ${passwordForm()}
    <button class="btn btn-danger btn-block" data-act="logout">Đăng xuất</button>`);
  bindPasswordForm();
}

/* ================================================================
 *                           GIAO VIEN
 * ================================================================ */
const SHOW_LABEL = { after_submit: "Ngay sau khi nộp", after_due: "Sau khi hết hạn", never: "Không cho xem" };

async function tHome() {
  app.innerHTML = tShell("home", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  S.ov = ov;
  const active = ov.assignments.filter((a) => !a.archived), arch = ov.assignments.filter((a) => a.archived);
  const card = (a) => {
    const pct = a.n_target ? Math.round((a.n_done / a.n_target) * 100) : 0;
    return `<a class="card tap" href="#/t/a/${a.id}" style="display:block;text-decoration:none;color:inherit">
      <div class="row between"><span class="badge ${a.mode === "exam" ? "exam" : "hw"}">${a.mode === "exam" ? "Kiểm tra" : "Bài tập"}</span>
        <span class="small muted">${esc(a.class_names || "")}</span></div>
      <h3 style="margin:8px 0 4px">${esc(a.title)}</h3>
      <div class="small muted">${a.n_questions} câu${a.time_limit_min ? " · " + a.time_limit_min + " phút" : ""}${a.due_at ? " · Hạn " + fmtDT(a.due_at) + (Date.parse(a.due_at) < Date.now() ? " (đã hết)" : "") : ""}${Date.parse(a.open_at) > Date.now() ? " · Mở lúc " + fmtDT(a.open_at) : ""}</div>
      <div class="row" style="margin-top:8px;flex-wrap:nowrap"><div class="bar grow"><i style="width:${pct}%"></i></div><span class="small"><b>${a.n_done}</b>/${a.n_target} đã nộp</span></div></a>`;
  };
  let html = `<div class="row between" style="margin-bottom:12px"><h1 style="margin:0">Bài đã giao</h1><a class="btn btn-primary" href="#/t/new">+ Giao bài mới</a></div>`;
  if (!ov.classes.length || !ov.quizzes.length) {
    html += `<div class="card"><h2>Bắt đầu</h2><ol style="margin:0;padding-left:20px" class="stack">
      <li>${ov.classes.length ? "✅" : ""} <a href="#/t/classes">Tạo lớp và nhập danh sách học sinh</a></li>
      <li>${ov.quizzes.length ? "✅" : ""} <a href="#/t/q/new">Soạn đề đầu tiên</a></li>
      <li>Giao bài cho lớp</li></ol></div>`;
  }
  html += active.map(card).join("") || '<div class="empty">Chưa giao bài nào.</div>';
  if (arch.length) html += `<details class="box"><summary>Đã lưu trữ (${arch.length})</summary><div style="margin-top:12px">${arch.map(card).join("")}</div></details>`;
  app.querySelector("main").innerHTML = html;
}

/* ---------------- giao bai / sua bai giao ---------------- */
async function tAssignForm(id, quizId) {
  app.innerHTML = tShell("home", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const a = id ? ov.assignments.find((x) => x.id === id) : null;
  if (id && !a) { app.querySelector("main").innerHTML = errBox("Không tìm thấy bài giao."); return; }
  if (!id && !ov.quizzes.length) { app.querySelector("main").innerHTML = `<div class="alert alert-warn">Chưa có đề nào. <a href="#/t/q/new">Soạn đề trước</a>.</div>`; return; }
  if (!ov.classes.length) { app.querySelector("main").innerHTML = `<div class="alert alert-warn">Chưa có lớp nào. <a href="#/t/classes">Tạo lớp trước</a>.</div>`; return; }
  const v = a || { mode: "homework", time_limit_min: null, max_attempts: null, shuffle_questions: true, shuffle_options: true, show_answers: "after_submit", class_ids: [], open_at: new Date().toISOString(), due_at: null };
  const cls = v.class_ids || [];
  app.querySelector("main").innerHTML = `
    <a href="${id ? "#/t/a/" + id : "#/t"}" class="small">‹ Quay lại</a>
    <h1 style="margin-top:8px">${id ? "Sửa cài đặt bài giao" : "Giao bài mới"}</h1>
    <form data-submit="save" style="max-width:640px"><div id="err"></div>
      ${id ? "" : `<div class="field"><label class="f">Đề</label><select class="input" name="quiz" data-ch="quiz">
        ${ov.quizzes.map((q) => `<option value="${q.id}" ${String(q.id) === String(quizId) ? "selected" : ""}>${esc(q.title)} (${q.n_questions} câu)</option>`).join("")}</select></div>`}
      <div class="field"><label class="f">Tên bài (học sinh sẽ thấy)</label><input class="input" name="title" value="${esc(a ? a.title : "")}" placeholder="Để trống = dùng tên đề"></div>
      <div class="field"><label class="f">Chuyên đề (không bắt buộc)</label><input class="input" name="cd" maxlength="120" value="${esc(a && a.chuyen_de ? a.chuyen_de : "")}" placeholder="Ví dụ: Thì hiện tại hoàn thành; Unit 3 – Từ vựng"><div class="small muted">Hiện trên phiếu nhận xét tuần gửi phụ huynh.</div></div>
      ${id ? "" : `<div class="field"><label class="f">Hình thức</label><div class="seg">
        <label><input type="radio" name="mode" value="homework" data-ch="mode" checked>Bài tập về nhà</label>
        <label><input type="radio" name="mode" value="exam" data-ch="mode">Kiểm tra</label></div></div>`}
      <div class="field"><label class="f">Giao cho lớp</label><div class="row">
        ${ov.classes.map((c) => `<label class="check" style="margin-right:12px"><input type="checkbox" name="cls" value="${c.id}" ${cls.includes(c.id) ? "checked" : ""}>${esc(c.name)} <span class="faint small">(${c.n_students})</span></label>`).join("")}</div></div>
      <div class="grid2">
        <div class="field"><label class="f">Mở lúc</label><input class="input" type="datetime-local" name="open" value="${toLocalInput(v.open_at)}"></div>
        <div class="field"><label class="f">Hạn nộp (để trống = không hạn)</label><input class="input" type="datetime-local" name="due" value="${toLocalInput(v.due_at)}"></div>
        <div class="field"><label class="f">Thời gian làm (phút, 0 = không giới hạn)</label><input class="input" type="number" min="0" max="600" name="time" value="${v.time_limit_min || 0}"></div>
        <div class="field"><label class="f">Số lần được làm (0 = không giới hạn)</label><input class="input" type="number" min="0" max="50" name="att" value="${v.max_attempts || 0}"></div>
      </div>
      <div class="field"><label class="f">Cho học sinh xem đáp án &amp; giải thích</label><select class="input" name="show">
        ${Object.entries(SHOW_LABEL).map(([k, t]) => `<option value="${k}" ${v.show_answers === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      ${id ? `<label class="check"><input type="checkbox" name="arch" ${a.archived ? "checked" : ""}> Lưu trữ (ẩn khỏi học sinh)</label>` : `
      <label class="check"><input type="checkbox" name="shq" ${v.shuffle_questions ? "checked" : ""}> Xáo trộn thứ tự câu hỏi</label>
      <label class="check"><input type="checkbox" name="sho" ${v.shuffle_options ? "checked" : ""}> Xáo trộn thứ tự đáp án A/B/C/D</label>`}
      <div class="savebar"><button class="btn btn-primary btn-lg btn-block">${id ? "Lưu thay đổi" : "Giao bài"}</button></div>
    </form>`;
  const f = app.querySelector("form");
  ACT["ch:mode"] = (el) => {
    if (el.value === "exam") { f.time.value = f.time.value === "0" ? 15 : f.time.value; f.att.value = 1; f.show.value = "after_due"; }
    else { f.time.value = 0; f.att.value = 0; f.show.value = "after_submit"; }
  };
  ACT.save = (form) => busy(form.querySelector(".savebar button"), async () => {
    const p = {
      title: form.title.value,
      chuyen_de: form.cd.value.trim(),
      class_ids: [...form.querySelectorAll("input[name=cls]:checked")].map((x) => Number(x.value)),
      open_at: fromLocalInput(form.open.value),
      due_at: fromLocalInput(form.due.value),
      time_limit_min: Number(form.time.value) || 0,
      max_attempts: Number(form.att.value) || 0,
      show_answers: form.show.value,
    };
    try {
      if (!p.class_ids.length) throw new Error("Chưa chọn lớp nào.");
      if (p.due_at && p.open_at && p.due_at <= p.open_at) throw new Error("Hạn nộp phải sau giờ mở bài.");
      if (id) {
        p.archived = form.arch.checked;
        await api("t_update_assignment", { p_id: id, p });
        toast("Đã lưu"); go("#/t/a/" + id);
      } else {
        p.quiz_id = Number(form.quiz.value);
        p.mode = form.querySelector("input[name=mode]:checked").value;
        p.shuffle_questions = form.shq.checked; p.shuffle_options = form.sho.checked;
        const r = await api("t_create_assignment", { p });
        toast("Đã giao bài"); go("#/t/a/" + r.id);
      }
    } catch (e) { document.getElementById("err").innerHTML = errBox(e); window.scrollTo(0, 0); }
  });
}

/* ---------------- bang diem ---------------- */
async function tResults(id) {
  app.innerHTML = tShell("home", spinner());
  ACT.retry = () => route();
  let R;
  try { R = await api("t_results", { p_id: id }); } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t"); return; }
  const A = R.assignment;
  const classes = [...new Set(R.students.map((s) => s.class_name || "—"))];
  let tab = "students", cls = "", sortQ = false;
  const draw = () => {
    const list = R.students.filter((s) => !cls || (s.class_name || "—") === cls);
    const done = list.filter((s) => s.used > 0);
    const bests = done.map((s) => Number(s.best));
    const avg = bests.length ? bests.reduce((a, b) => a + b, 0) / bests.length : null;
    let body;
    if (tab === "students") {
      body = `<div class="table-wrap"><table class="t"><thead><tr><th>#</th><th>Mã</th><th>Họ tên</th><th>Lớp</th><th>Điểm cao nhất</th><th>Lần làm</th><th>Nộp gần nhất</th>${A.mode === "exam" ? "<th>Rời trang</th>" : ""}</tr></thead><tbody>
        ${list.map((s, i) => `<tr class="click" data-act="stu" data-id="${s.id}">
          <td>${i + 1}</td><td>${esc(s.code)}</td><td class="wrap">${esc(s.name)}</td><td>${esc(s.class_name || "")}</td>
          <td>${s.used ? `<span class="score ${scoreCls(s.best)}" style="font-size:16px">${fmtScore(s.best)}</span>` : s.doing ? '<span class="badge gold">Đang làm</span>' : '<span class="badge">Chưa nộp</span>'}</td>
          <td>${s.used || 0}${s.doing && s.used ? " <span class='faint small'>(+1 đang làm)</span>" : ""}</td>
          <td class="small">${s.last_at ? fmtDT(s.last_at) : ""}</td>
          ${A.mode === "exam" ? `<td>${s.leaves ? `<b style="color:var(--bad)">${s.leaves}</b>` : s.used ? "0" : ""}</td>` : ""}</tr>`).join("")}
        </tbody></table></div>`;
    } else {
      const qs = R.questions.slice();
      if (sortQ) qs.sort((a, b) => (a.n ? a.n_right / a.n : 1) - (b.n ? b.n_right / b.n : 1));
      body = `<p class="small muted">Tính theo <b>lần làm đầu tiên</b> của mỗi học sinh (tất cả các lớp). <label class="check" style="display:inline-flex;min-height:0"><input type="checkbox" data-ch="sortq" ${sortQ ? "checked" : ""}> Câu sai nhiều lên đầu</label></p>`
        + qs.map((q) => {
          const pct = q.n ? Math.round((q.n_right / q.n) * 100) : 0;
          return `<div class="card"><div class="row between" style="flex-wrap:nowrap"><b>Câu ${q.qi + 1}</b>
            <span class="score ${pct >= 80 ? "" : pct >= 50 ? "mid" : "low"}" style="font-size:16px">${q.n ? pct + "% đúng" : "chưa có bài"}</span></div>
            <div style="margin:6px 0">${fmt(q.question)}</div>
            ${q.options.map((o, j) => `<div class="row small" style="flex-wrap:nowrap;margin-bottom:4px"><span style="width:18px;font-weight:700;${j === q.correct ? "color:var(--ok)" : ""}">${LETTERS[j]}</span>
              <span class="grow" style="${j === q.correct ? "color:var(--ok);font-weight:600" : ""}">${fmt(o)}${j === q.correct ? " ✓" : ""}</span>
              <span class="faint">${q.dist[j]} HS</span></div>`).join("")}</div>`;
        }).join("");
    }
    app.querySelector("main").innerHTML = `
      <a href="#/t" class="small">‹ Bài đã giao</a>
      <div class="row between" style="margin:8px 0 4px"><h1 style="margin:0">${esc(A.title)}</h1>
        <span class="badge ${A.mode === "exam" ? "exam" : "hw"}">${A.mode === "exam" ? "Kiểm tra" : "Bài tập"}</span></div>
      <div class="small muted">${A.n_questions} câu${A.time_limit_min ? " · " + A.time_limit_min + " phút" : ""} · ${A.max_attempts ? A.max_attempts + " lần" : "không giới hạn số lần"}${A.due_at ? " · Hạn " + fmtDT(A.due_at) : ""} · Xem đáp án: ${SHOW_LABEL[A.show_answers]}${A.archived ? " · <b>Đã lưu trữ</b>" : ""}</div>
      <div class="row no-print" style="margin:12px 0">
        <button class="btn btn-sm" data-act="retry">↻ Làm mới</button>
        <a class="btn btn-sm" href="#/t/a/${id}/edit">⚙ Cài đặt</a>
        ${A.show_answers !== "after_submit" ? '<button class="btn btn-sm" data-act="reveal">🔓 Mở đáp án cho HS</button>' : ""}
        <button class="btn btn-sm" data-act="xls">⬇ Xuất Excel</button>
        <button class="btn btn-sm btn-danger" data-act="del">Xoá bài giao</button></div>
      <div class="tiles">
        <div class="tile"><b>${done.length}/${list.length}</b><span>đã nộp</span></div>
        <div class="tile"><b>${fmtScore(avg === null ? null : Math.round(avg * 100) / 100)}</b><span>điểm TB (cao nhất mỗi em)</span></div>
        <div class="tile"><b>${bests.length ? fmtScore(Math.max(...bests)) : "–"}</b><span>cao nhất</span></div>
        <div class="tile"><b>${bests.length ? fmtScore(Math.min(...bests)) : "–"}</b><span>thấp nhất</span></div></div>
      <div class="row" style="margin-bottom:12px">
        <div class="seg" style="flex:1;max-width:360px"><label><input type="radio" name="tab" value="students" data-ch="tab" ${tab === "students" ? "checked" : ""}>Học sinh</label><label><input type="radio" name="tab" value="questions" data-ch="tab" ${tab === "questions" ? "checked" : ""}>Từng câu</label></div>
        ${classes.length > 1 && tab === "students" ? `<select class="input" style="width:auto" data-ch="cls"><option value="">Tất cả lớp</option>${classes.map((c) => `<option ${c === cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>` : ""}
      </div>${body}`;
  };
  ACT["ch:tab"] = (el) => { tab = el.value; draw(); };
  ACT["ch:cls"] = (el) => { cls = el.value; draw(); };
  ACT["ch:sortq"] = (el) => { sortQ = el.checked; draw(); };
  ACT.reveal = (btn) => busy(btn, async () => {
    try { await api("t_update_assignment", { p_id: id, p: { show_answers: "after_submit" } }); toast("Học sinh đã xem được đáp án"); route(); } catch (e) { toast(e.message); }
  });
  ACT.del = (btn) => {
    const done = R.students.filter((s) => s.used > 0).length;
    if (!confirm(`Xoá bài giao "${A.title}"?${done ? `\n\nSẽ mất luôn bài làm của ${done} học sinh. Không khôi phục được.` : ""}\n\nNếu chỉ muốn ẩn đi, hãy dùng "Cài đặt" > Lưu trữ.`)) return;
    busy(btn, async () => { try { await api("t_delete_assignment", { p_id: id }); toast("Đã xoá"); go("#/t"); } catch (e) { toast(e.message); } });
  };
  ACT.xls = () => exportResults(R);
  ACT.stu = async (el) => {
    const s = R.students.find((x) => String(x.id) === el.dataset.id);
    openSheet(spinner());
    try {
      const list = await api("t_student_attempts", { p_user_id: s.id, p_assignment_id: id });
      openSheet(`<div class="row between"><h2 style="margin:0">${esc(s.name)}</h2><button class="icon-btn" data-act="closeSheet">✕</button></div>
        <p class="small muted">Mã ${esc(s.code)} · Lớp ${esc(s.class_name || "")}</p>
        ${list.map((t, i) => `<div class="card"><div class="row between"><b>Lần ${list.length - i}</b>${t.submitted_at ? `<span class="score ${scoreCls(t.score)}">${fmtScore(t.score)}</span>` : '<span class="badge gold">Đang làm</span>'}</div>
          <div class="small muted">Bắt đầu ${fmtDT(t.started_at)}${t.submitted_at ? " · nộp " + fmtDT(t.submitted_at) + " · đúng " + t.correct_count + "/" + t.total : ""}${A.mode === "exam" ? " · rời trang " + t.leave_count + " lần" : ""}</div>
          <div class="row" style="margin-top:8px">${t.submitted_at ? `<a class="btn btn-sm" href="#/t/at/${t.id}">Xem bài làm</a>` : ""}
          <button class="btn btn-sm btn-danger" data-act="delat" data-id="${t.id}">Xoá lần này (cho làm lại)</button></div></div>`).join("") || '<div class="empty">Học sinh chưa làm bài này.</div>'}`);
    } catch (e) { openSheet(errBox(e)); }
  };
  ACT.delat = (btn) => {
    if (!confirm("Xoá lần làm này? Học sinh sẽ được làm lại. Điểm của lần này sẽ mất.")) return;
    busy(btn, async () => { try { await api("t_delete_attempt", { p_attempt_id: Number(btn.dataset.id) }); closeSheet(); toast("Đã xoá"); route(); } catch (e) { toast(e.message); } });
  };
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
  draw();
}

// Xuat file Excel (UTF-16 + tab: Excel mo dung tieng Viet o moi may)
function exportResults(R) {
  const A = R.assignment;
  const num = (x) => (x === null || x === undefined ? "" : Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const rows = [[A.title], [], ["STT", "Mã học sinh", "Họ và tên", "Lớp", "Điểm cao nhất", "Điểm lần cuối", "Số lần làm", "Nộp gần nhất", "Rời trang (lần)"]];
  // ="0201" de Excel giu so 0 o dau ma
  R.students.forEach((s, i) => rows.push([i + 1, `="${String(s.code).replace(/"/g, "")}"`, s.name, s.class_name || "", num(s.best), num(s.last_score), s.used || 0, s.last_at ? fmtDT(s.last_at) : "", s.leaves || 0]));
  const txt = rows.map((r) => r.map((c) => String(c).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\r\n");
  const buf = new Uint16Array(txt.length + 1);
  buf[0] = 0xFEFF;
  for (let i = 0; i < txt.length; i++) buf[i + 1] = txt.charCodeAt(i);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([buf], { type: "text/csv;charset=utf-16le" }));
  a.download = `bang_diem_${A.title.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

async function tAttempt(id) {
  app.innerHTML = tShell("home", spinner());
  ACT.retry = () => route();
  let d;
  try { d = await api("t_attempt_detail", { p_attempt_id: id }); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  app.querySelector("main").innerHTML = `<a href="javascript:history.back()" class="small">‹ Quay lại</a>
    <h1 style="margin-top:8px">${esc(d.student.name)} — ${esc(d.title)}</h1>
    <div class="card row between"><div><b>Đúng ${d.correct}/${d.total}</b><div class="small muted">Mã ${esc(d.student.code)} · Lớp ${esc(d.student.class_name || "")} · nộp ${fmtDT(d.submitted_at)} · rời trang ${d.leave_count} lần</div></div>
    <span class="score ${scoreCls(d.score)}" style="font-size:28px">${fmtScore(d.score)}</span></div>
    <div style="max-width:760px">${reviewHtml(d, false)}</div>`;
}

/* ---------------- kho de ---------------- */
async function tQuizzes() {
  app.innerHTML = tShell("quizzes", spinner());
  ACT.retry = () => route();
  let ov, bt;
  try { [ov, bt] = await Promise.all([api("t_overview"), api("t_ds_bai_thu")]); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  app.querySelector("main").innerHTML = `<div class="row between" style="margin-bottom:12px"><h1 style="margin:0">Kho đề</h1><a class="btn btn-primary" href="#/t/q/new">+ Soạn đề mới</a></div>
    ${baiThuHtml(ov.quizzes, bt)}
    ${ov.quizzes.map((q) => `<div class="card row between">
      <div class="grow"><b>${esc(q.title)}</b>${q.nguon === "may_cham" ? ` <span class="badge" title="Đăng từ phần mềm chấm điểm">📥 Mã đề ${esc(q.ma_de)}</span>` : ""}${q.nguon === "he_cu" ? ' <span class="badge" title="Chuyển từ hệ ôn tập cũ (Apps Script)">🗂 Hệ cũ</span>' : ""}<div class="small muted">${q.n_questions} câu${q.chuyen_de ? " · " + esc(q.chuyen_de) : ""} · 💡 ${q.n_giai_thich}/${q.n_questions} câu có giải thích · sửa lần cuối ${fmtDT(q.updated_at)}</div></div>
      <div class="row"><a class="btn btn-sm" href="#/t/q/${q.id}">Sửa</a><a class="btn btn-sm btn-primary" href="#/t/new?quiz=${q.id}">Giao bài</a>
      <button class="btn btn-sm btn-danger" data-act="del" data-id="${q.id}" data-t="${esc(q.title)}">Xoá</button></div></div>`).join("") || '<div class="empty">Chưa có đề nào.</div>'}
    <p class="small muted">Sửa đề không ảnh hưởng tới các bài đã giao trước đó (mỗi bài giao giữ bản sao của đề lúc giao) — riêng <b>giải thích</b> được cập nhật luôn cho bài đã giao. Đề «📥 Mã đề» đăng từ phần mềm chấm điểm: đăng lại từ phần mềm sẽ ghi đè phần sửa trên web.</p>`;
  ACT.luuThu = (btn) => {
    const k = btn.dataset.khoi, sel = app.querySelector(`[data-thu-de="${k}"]`), sc = app.querySelector(`[data-thu-so="${k}"]`);
    busy(btn, async () => {
      try { await api("t_dat_bai_thu", { p_khoi: k, p_quiz_id: sel.value ? Number(sel.value) : null, p_so_cau: Number(sc.value) || 15 }); toast("Đã lưu bài kiểm tra thử"); route(); } catch (e) { toast(e.message); }
    });
  };
  ACT.del = (btn) => {
    if (!confirm(`Xoá đề "${btn.dataset.t}"?\n(Các bài đã giao từ đề này vẫn giữ nguyên.)`)) return;
    busy(btn, async () => { try { await api("t_delete_quiz", { p_id: Number(btn.dataset.id) }); toast("Đã xoá"); route(); } catch (e) { toast(e.message); } });
  };
}

// The "Kiem tra thu tren website": moi khoi chon 1 de trong kho
function baiThuHtml(quizzes, bt) {
  const ten = { tieu_hoc: "Tiểu học (lớp 2–5)", thcs: "THCS (lớp 6–9)" };
  return `<div class="card"><b>🌐 Bài kiểm tra thử trên website</b>
    <div class="small muted" style="margin-bottom:8px">Khách chưa có tài khoản làm thử ở trang «Kiểm tra thử». Mỗi lần làm lấy ngẫu nhiên số câu dưới đây từ đề cô chọn, đảo đáp án, chấm và hiện đáp án ngay.</div>
    ${Object.entries(ten).map(([k, t]) => {
      const b = (bt.bai || []).find((x) => x.khoi === k) || {}, l = (bt.luot || {})[k];
      return `<div class="row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <b style="min-width:150px">${t}</b>
        <select data-thu-de="${k}" style="flex:1;min-width:180px"><option value="">— Tắt (chưa mở) —</option>${quizzes.map((q) => `<option value="${q.id}" ${q.id === b.quiz_id ? "selected" : ""}>${esc(q.title)} (${q.n_questions} câu)</option>`).join("")}</select>
        <label class="small">Số câu <input type="number" data-thu-so="${k}" min="5" max="40" value="${b.so_cau || 15}" style="width:64px"></label>
        <button class="btn btn-sm btn-primary" data-act="luuThu" data-khoi="${k}">Lưu</button></div>
        <div class="small muted">${l ? `30 ngày qua: ${l.so} lượt làm thử · điểm trung bình ${l.tb}` : "Chưa có lượt làm thử."}</div>`;
    }).join("")}</div>`;
}

/* ---- doc cau hoi tu chu dan vao ---- */
function letterIndex(x) {
  if (typeof x === "number") return x;
  const s = String(x || "").trim().toUpperCase();
  if (/^\d+$/.test(s)) return Number(s);
  const i = LETTERS.indexOf(s.charAt(0));
  return i >= 0 ? i : null;
}
// Ho tro: {"questions":[...]} hoac [...]; options la mang hoac {"A":..}; dap an la so hoac chu cai
function parseJsonQuestions(raw) {
  let clean = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed = null;
  const s1 = clean.search(/[[{]/);
  if (s1 > 0) clean = clean.slice(s1);
  try { parsed = JSON.parse(clean); } catch (e) {
    // Cuu cac cau hoi con nguyen ven neu JSON bi cat ngang
    const objs = []; let depth = 0, start = -1;
    const body = clean.slice(clean.indexOf("[") + 1);
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === "{") { if (depth === 0) start = i; depth++; } else if (c === "}") { depth--; if (depth === 0 && start >= 0) { objs.push(body.slice(start, i + 1)); start = -1; } }
    }
    const rec = []; objs.forEach((o) => { try { rec.push(JSON.parse(o)); } catch (e2) { /* bo */ } });
    if (rec.length) parsed = rec;
  }
  if (!parsed) throw new Error("Không đọc được nội dung. Hãy dán đúng nguyên văn phần JSON Claude trả lời.");
  const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
  return arr.map((q) => {
    let opts = q.options || q.choices || [];
    if (!Array.isArray(opts)) opts = LETTERS.split("").map((L) => opts[L]).filter((x) => x !== undefined && x !== null && x !== "");
    let cor = q.correct;
    if (cor === undefined) cor = q.correctIndex;
    if (cor === undefined) cor = q.answer;
    return {
      question: String(q.question || q.q || q.text || q.stem || ""), options: opts.map(String),
      correct: letterIndex(cor), explanation: String(q.explanation || ""), instruction: String(q.instruction || ""),
    };
  }).filter((q) => q.question && q.options.length >= 2);
}
// Dang chu: "1. cau hoi" + cac dong "A. ..." ; danh dau dap an dung bang * (vd "*B. goes" hoac "B. goes*")
// hoac dong "Đáp án: B". Dong khac nam ngoai cau hoi = dong huong dan cua muc.
function parseTextQuestions(txt) {
  const lines = String(txt).replace(/\r/g, "").split("\n");
  const out = []; let cur = null; let instr = ""; let instrOpen = true;
  const qRe = /^\s*(?:câu|cau|question|q)?\s*(\d{1,3})\s*[.):]\s*(.*)$/i;
  const optRe = /^\s*(\*?)\s*([A-Ha-h])\s*[.)]\s+(.*)$/;
  const ansRe = /^\s*(?:đáp án|dap an|answer|key)\s*[:：]?\s*([A-Ha-h])\b/i;
  const expRe = /^\s*(?:giải thích|giai thich|explanation)\s*[:：]\s*(.*)$/i;
  const addOpt = (raw) => {
    let t = raw.trim(); let star = false;
    if (t.startsWith("*")) { star = true; t = t.slice(1).trim(); }
    if (t.endsWith("*")) { star = true; t = t.slice(0, -1).trim(); }
    if (star) cur.correct = cur.options.length;
    cur.options.push(t);
  };
  // "A. go   B. goes   C. went" tren cung mot dong
  const splitInline = (line) => {
    const re = /(^|\s)(\*?)([A-H])[.)]\s+/g; const marks = []; let m;
    while ((m = re.exec(line))) marks.push({ at: m.index + m[1].length, len: m[0].length - m[1].length, L: m[3], star: m[2] });
    if (marks.length < 2 || marks[0].L !== "A" || marks[0].at > 1) return null;
    for (let i = 0; i < marks.length; i++) if (marks[i].L !== LETTERS[i]) return null;
    return marks.map((mk, i) => mk.star + line.slice(mk.at + mk.len, i + 1 < marks.length ? marks[i + 1].at : undefined).trim());
  };
  for (const line of lines) {
    if (!line.trim()) continue;
    let m;
    const inl = cur ? splitInline(line.trim()) : null;
    if (inl) { inl.forEach(addOpt); continue; }
    if (cur && (m = line.match(optRe))) { addOpt(m[1] + m[3]); continue; }
    if (cur && (m = line.match(ansRe))) { cur.correct = letterIndex(m[1]); continue; }
    if (cur && (m = line.match(expRe))) { cur.explanation = m[1].trim(); continue; }
    if ((m = line.match(qRe))) {
      if (cur) out.push(cur);
      cur = { question: m[2].trim(), options: [], correct: null, explanation: "", instruction: instr };
      instrOpen = false;
      continue;
    }
    if (cur && !cur.options.length) { cur.question += "\n" + line.trim(); continue; }
    // dong huong dan moi cho cac cau phia sau
    instr = instrOpen ? (instr ? instr + "\n" : "") + line.trim() : line.trim();
    instrOpen = true;
    if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter((q) => q.question);
}
function buildPrompt(o) {
  let t = `Bạn là giáo viên tiếng Anh THCS/THPT tại Việt Nam. Hãy soạn đúng ${o.n} câu hỏi trắc nghiệm tiếng Anh`;
  t += o.grade ? ` cho học sinh ${o.grade}` : "";
  t += o.topic ? `, chủ đề: ${o.topic}` : "";
  t += ".\n";
  if (o.passage) t += `Bám sát nội dung sau, không bịa thông tin ngoài:\n"""\n${o.passage}\n"""\n`;
  if (o.kinds) t += `Dạng câu hỏi cần có: ${o.kinds}.\n`;
  t += "Yêu cầu:\n- Câu hỏi và các lựa chọn viết bằng TIẾNG ANH; mỗi câu 4 lựa chọn (có thể 2-6 nếu cần).\n";
  t += "- \"instruction\": dòng hướng dẫn của dạng bài (vd: Choose the word whose underlined part is pronounced differently.). Từ cần gạch chân đặt trong <u>...</u>.\n";
  t += "- \"correct\": chỉ số đáp án đúng, bắt đầu từ 0.\n- \"explanation\": giải thích ngắn bằng TIẾNG VIỆT.\n- Đáp án nhiễu hợp lý, không đoán mò được; vị trí đáp án đúng phân bổ đều.\n";
  t += 'CHỈ trả lời bằng một JSON hợp lệ, không thêm chữ nào khác, theo cấu trúc:\n{"questions":[{"instruction":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}';
  return t;
}

/* ---- trang soan de ---- */
async function tEditor(id) {
  app.innerHTML = tShell("quizzes", spinner());
  ACT.retry = () => route();
  const E = { id, title: "", qs: [], dirty: false };
  if (id) {
    try {
      const q = await api("t_get_quiz", { p_id: id });
      if (!q) throw new Error("Không tìm thấy đề.");
      E.title = q.title; E.qs = q.questions;
    } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/quizzes"); return; }
  }
  leaveGuard = () => !E.dirty || confirm("Đề chưa lưu. Rời trang và bỏ các thay đổi?");
  const onUnload = (e) => { if (E.dirty) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", onUnload);
  cleanup = () => window.removeEventListener("beforeunload", onUnload);
  const mark = () => { E.dirty = true; };

  const qCard = (q, i) => `<div class="card qedit" id="q${i}">
    <div class="row between"><b>Câu ${i + 1}</b><div class="row" style="gap:2px">
      <button type="button" class="icon-btn" data-act="up" data-i="${i}" title="Lên" ${i === 0 ? "disabled" : ""}>↑</button>
      <button type="button" class="icon-btn" data-act="down" data-i="${i}" title="Xuống" ${i === E.qs.length - 1 ? "disabled" : ""}>↓</button>
      <button type="button" class="icon-btn" data-act="qdel" data-i="${i}" title="Xoá câu" style="color:var(--bad)">🗑</button></div></div>
    <div class="field"><label class="f">Hướng dẫn của dạng bài (không bắt buộc)</label><input class="input" data-in="qf" data-i="${i}" data-f="instruction" value="${esc(q.instruction || "")}"></div>
    <div class="field"><label class="f">Câu hỏi <span class="faint">(dùng &lt;b&gt; &lt;u&gt; &lt;i&gt; để in đậm, gạch chân, in nghiêng)</span></label><textarea class="input" rows="2" data-in="qf" data-i="${i}" data-f="question">${esc(q.question || "")}</textarea></div>
    <label class="f">Các lựa chọn — bấm ◉ để chọn đáp án đúng</label>
    ${q.options.map((o, j) => `<div class="opt-row"><input type="radio" name="c${i}" data-ch="cor" data-i="${i}" data-j="${j}" ${q.correct === j ? "checked" : ""} aria-label="Đáp án đúng ${LETTERS[j]}">
      <span class="L">${LETTERS[j]}</span><input class="input" data-in="qo" data-i="${i}" data-j="${j}" value="${esc(o)}">
      <button type="button" class="icon-btn" data-act="odel" data-i="${i}" data-j="${j}" title="Xoá lựa chọn" ${q.options.length <= 2 ? "disabled" : ""}>✕</button></div>`).join("")}
    ${q.options.length < 8 ? `<button type="button" class="btn btn-sm" data-act="oadd" data-i="${i}">+ Thêm lựa chọn</button>` : ""}
    <div class="field" style="margin-top:10px"><label class="f">Giải thích (học sinh thấy khi xem lại)</label><textarea class="input" rows="2" data-in="qf" data-i="${i}" data-f="explanation">${esc(q.explanation || "")}</textarea></div>
  </div>`;

  const drawList = () => {
    document.getElementById("qlist").innerHTML = E.qs.map(qCard).join("") || '<div class="empty">Chưa có câu hỏi. Dùng một trong các cách ở trên, hoặc bấm "+ Thêm câu hỏi".</div>';
    document.getElementById("qcount").textContent = E.qs.length;
  };
  app.querySelector("main").innerHTML = `<a href="#/t/quizzes" class="small">‹ Kho đề</a>
    <h1 style="margin-top:8px">${id ? "Sửa đề" : "Soạn đề mới"}</h1>
    <div style="max-width:820px">
    <div class="field"><label class="f">Tên đề</label><input class="input" id="title" data-in="title" value="${esc(E.title)}" placeholder="Ví dụ: Unit 3 – Grade 8 – Vocabulary"></div>
    <details class="box"><summary>📋 Cách 1: Dán câu hỏi dạng chữ</summary>
      <p class="small muted">Mỗi câu bắt đầu bằng số (<b>1.</b> hoặc <b>Câu 1:</b>), các lựa chọn bắt đầu bằng <b>A.</b> <b>B.</b> … (một dòng hoặc nhiều dòng). Đánh dấu đáp án đúng bằng dấu <b>*</b> trước chữ cái (vd <b>*B. goes</b>) hoặc thêm dòng <b>Đáp án: B</b>. Dòng không đánh số được coi là hướng dẫn cho các câu sau nó.</p>
      <pre class="prompt">Choose the best answer.
1. She ___ to school every day.
A. go    *B. goes    C. going    D. gone
2. They ___ football yesterday.
A. play
B. plays
C. played
D. playing
Đáp án: C</pre>
      <textarea class="input" id="txtin" rows="8" placeholder="Dán câu hỏi vào đây…"></textarea>
      <button type="button" class="btn btn-primary" data-act="addtxt" style="margin-top:8px">Thêm vào đề</button></details>
    <details class="box"><summary>✨ Cách 2: Nhờ Claude soạn câu hỏi</summary>
      <div class="grid2" style="margin-top:10px">
        <div class="field"><label class="f">Lớp / trình độ</label><input class="input" id="pgrade" placeholder="lớp 8"></div>
        <div class="field"><label class="f">Số câu</label><input class="input" id="pn" type="number" value="20" min="1" max="100"></div></div>
      <div class="field"><label class="f">Chủ đề</label><input class="input" id="ptopic" placeholder="Unit 3 – Teenagers"></div>
      <div class="field"><label class="f">Dạng câu hỏi (không bắt buộc)</label><input class="input" id="pkinds" placeholder="phát âm, trọng âm, từ vựng, ngữ pháp, tìm lỗi sai, đọc hiểu"></div>
      <div class="field"><label class="f">Nội dung / bài đọc / danh sách từ vựng (không bắt buộc)</label><textarea class="input" id="ppass" rows="4"></textarea></div>
      <button type="button" class="btn" data-act="mkprompt">1. Tạo lời nhắn cho Claude</button>
      <div id="promptbox"></div>
      <div class="field" style="margin-top:12px"><label class="f">3. Dán câu trả lời của Claude (JSON) vào đây</label><textarea class="input" id="jsonin" rows="5"></textarea></div>
      <button type="button" class="btn btn-primary" data-act="addjson">Thêm vào đề</button></details>
    <div class="row between" style="margin:18px 0 8px"><h2 style="margin:0"><span id="qcount">0</span> câu hỏi</h2>
      <button type="button" class="btn btn-sm btn-danger" data-act="clear">Xoá hết câu</button></div>
    <div id="msg"></div>
    <div id="qlist"></div>
    <button type="button" class="btn btn-block" data-act="qadd">+ Thêm câu hỏi</button>
    <div class="savebar row" style="margin-top:16px;flex-wrap:nowrap"><button type="button" class="btn btn-primary btn-lg grow" data-act="save">💾 Lưu đề</button>
      <button type="button" class="btn btn-lg" data-act="saveassign">Lưu &amp; giao bài</button></div>
    </div>`;
  drawList();

  const addQs = (qs, srcBox) => {
    if (!qs.length) { toast("Không tìm thấy câu hỏi nào. Hãy kiểm tra lại định dạng."); return; }
    const noAns = qs.filter((q) => q.correct === null || q.correct === undefined || q.correct >= q.options.length).length;
    qs.forEach((q) => { if (q.correct === null || q.correct === undefined || q.correct >= q.options.length) q.correct = null; });
    E.qs = E.qs.concat(qs); mark(); drawList();
    if (srcBox) srcBox.value = "";
    document.getElementById("msg").innerHTML = `<div class="alert ${noAns ? "alert-warn" : "alert-ok"}">Đã thêm ${qs.length} câu.${noAns ? ` <b>${noAns} câu chưa có đáp án đúng</b> — hãy chọn ◉ trước khi lưu.` : ""}</div>`;
    document.getElementById("msg").scrollIntoView({ behavior: "smooth", block: "center" });
  };
  ACT["in:title"] = (el) => { E.title = el.value; mark(); };
  ACT["in:qf"] = (el) => { E.qs[+el.dataset.i][el.dataset.f] = el.value; mark(); };
  ACT["in:qo"] = (el) => { E.qs[+el.dataset.i].options[+el.dataset.j] = el.value; mark(); };
  ACT["ch:cor"] = (el) => { E.qs[+el.dataset.i].correct = +el.dataset.j; mark(); };
  ACT.up = (el) => { const i = +el.dataset.i; [E.qs[i - 1], E.qs[i]] = [E.qs[i], E.qs[i - 1]]; mark(); drawList(); };
  ACT.down = (el) => { const i = +el.dataset.i; [E.qs[i + 1], E.qs[i]] = [E.qs[i], E.qs[i + 1]]; mark(); drawList(); };
  ACT.qdel = (el) => { if (confirm(`Xoá câu ${+el.dataset.i + 1}?`)) { E.qs.splice(+el.dataset.i, 1); mark(); drawList(); } };
  ACT.oadd = (el) => { E.qs[+el.dataset.i].options.push(""); mark(); drawList(); };
  ACT.odel = (el) => {
    const q = E.qs[+el.dataset.i], j = +el.dataset.j;
    q.options.splice(j, 1);
    if (q.correct === j) q.correct = null; else if (q.correct > j) q.correct--;
    mark(); drawList();
  };
  ACT.qadd = () => {
    const last = E.qs[E.qs.length - 1];
    E.qs.push({ question: "", options: ["", "", "", ""], correct: null, explanation: "", instruction: last ? last.instruction || "" : "" });
    mark(); drawList();
    document.getElementById("q" + (E.qs.length - 1)).scrollIntoView({ behavior: "smooth" });
  };
  ACT.clear = () => { if (E.qs.length && confirm("Xoá hết câu hỏi trong đề này?")) { E.qs = []; mark(); drawList(); } };
  ACT.addtxt = () => { const box = document.getElementById("txtin"); addQs(parseTextQuestions(box.value), box); };
  ACT.addjson = () => {
    const box = document.getElementById("jsonin");
    try { addQs(parseJsonQuestions(box.value), box); } catch (e) { toast(e.message, 4000); }
  };
  ACT.mkprompt = () => {
    const t = buildPrompt({
      n: Number(document.getElementById("pn").value) || 20, grade: document.getElementById("pgrade").value.trim(),
      topic: document.getElementById("ptopic").value.trim(), kinds: document.getElementById("pkinds").value.trim(),
      passage: document.getElementById("ppass").value.trim(),
    });
    document.getElementById("promptbox").innerHTML = `<pre class="prompt" style="margin-top:10px">${esc(t)}</pre>
      <button type="button" class="btn btn-sm" data-act="cp">📋 Sao chép</button>
      <span class="small muted">2. Dán vào claude.ai, đợi Claude trả lời, rồi sao chép toàn bộ câu trả lời.</span>`;
    ACT.cp = () => copyText(t);
  };
  const save = async (btn, thenAssign) => busy(btn, async () => {
    const msg = document.getElementById("msg");
    E.title = document.getElementById("title").value;
    const bad = E.qs.findIndex((q) => q.correct === null || q.correct === undefined);
    if (bad >= 0) {
      msg.innerHTML = errBox(`Câu ${bad + 1} chưa chọn đáp án đúng.`);
      document.getElementById("q" + bad).scrollIntoView({ behavior: "smooth" });
      return;
    }
    try {
      const qs = E.qs.map((q) => ({ stt: q.stt, question: q.question.trim(), options: q.options.map((o) => String(o).trim()), correct: q.correct, explanation: (q.explanation || "").trim(), instruction: (q.instruction || "").trim() }));
      const r = await api("t_save_quiz", { p_id: E.id, p_title: E.title, p_questions: qs });
      E.id = r.id; E.dirty = false;
      msg.innerHTML = "";
      toast("Đã lưu đề");
      if (thenAssign) go("#/t/new?quiz=" + r.id);
      else if (!id) { skipRoute = true; location.hash = "#/t/q/" + r.id; prevHash = location.hash; }
    } catch (e) { msg.innerHTML = errBox(e); msg.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
  ACT.save = (btn) => save(btn, false);
  ACT.saveassign = (btn) => save(btn, true);
}

/* ---------------- lop & hoc sinh ---------------- */
async function tClasses() {
  app.innerHTML = tShell("classes", spinner());
  ACT.retry = () => route();
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  app.querySelector("main").innerHTML = `<h1>Lớp &amp; học sinh</h1>
    <form class="card row" data-submit="add" style="max-width:520px;flex-wrap:nowrap"><input class="input grow" name="name" placeholder="Tên lớp mới, vd 8A1" required>
      <button class="btn btn-primary">+ Thêm lớp</button></form>
    ${ov.classes.map((c) => `<a class="card tap row between" href="#/t/c/${c.id}" style="text-decoration:none;color:inherit;max-width:520px"><b>Lớp ${esc(c.name)}</b><span class="muted">${c.n_students} học sinh ›</span></a>`).join("") || '<div class="empty">Chưa có lớp nào.</div>'}`;
  ACT.add = (f) => busy(f.querySelector("button"), async () => {
    try { await api("t_save_class", { p_id: null, p_name: f.name.value }); toast("Đã thêm lớp"); route(); } catch (e) { toast(e.message); }
  });
}

// Doc danh sach dan tu Excel: "ma <tab> ho ten" hoac "ma, ho ten" hoac "ma ho ten"
function parseRoster(txt) {
  const rows = [];
  String(txt).replace(/\r/g, "").split("\n").forEach((line) => {
    if (!line.trim()) return;
    let parts = line.includes("\t") ? line.split("\t") : /[,;]/.test(line) ? line.split(/[,;]/) : null;
    if (!parts) { const m = line.trim().match(/^(\S+)\s+(.*)$/); parts = m ? [m[1], m[2]] : [line.trim(), ""]; }
    parts = parts.map((x) => x.trim()).filter((x, i) => x || i > 0);
    // Bo cot STT neu dong bat dau bang "so thu tu" roi moi den ma
    if (parts.length >= 3 && /^\d{1,3}$/.test(parts[0]) && /\d/.test(parts[1])) parts = parts.slice(1);
    const code = parts[0] || "", name = parts.slice(1).filter(Boolean).join(" ");
    if (/^(mã|ma|stt|mã học sinh|mã hs)/i.test(code)) return; // dong tieu de
    if (code) rows.push({ code, name });
  });
  return rows;
}

async function tClass(id) {
  app.innerHTML = tShell("classes", spinner());
  ACT.retry = () => route();
  let ov, list;
  try {
    [ov, list] = await Promise.all([api("t_overview"), api("t_list_students", { p_class_id: id })]);
  } catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/classes"); return; }
  const c = ov.classes.find((x) => x.id === id);
  if (!c) { app.querySelector("main").innerHTML = errBox("Không tìm thấy lớp."); return; }
  app.querySelector("main").innerHTML = `<a href="#/t/classes" class="small">‹ Lớp &amp; học sinh</a>
    <div class="row between" style="margin:8px 0"><h1 style="margin:0">Lớp ${esc(c.name)} <span class="muted" style="font-size:16px;font-weight:400">· ${list.length} học sinh</span></h1>
      <div class="row"><a class="btn btn-sm btn-primary" href="#/t/c/${id}/tq">📋 Tổng quan lớp</a><a class="btn btn-sm" href="#/t/c/${id}/print">🖨 In phiếu tài khoản</a>
      <button class="btn btn-sm" data-act="rename">Đổi tên lớp</button>
      ${list.length ? "" : '<button class="btn btn-sm btn-danger" data-act="delclass">Xoá lớp</button>'}</div></div>
    <details class="box" ${list.length ? "" : "open"}><summary>➕ Nhập danh sách học sinh</summary>
      <p class="small muted">Sao chép 2 cột <b>Mã học sinh</b> và <b>Họ và tên</b> từ Excel / Google Sheet rồi dán vào đây (mỗi em một dòng).
      Em nào đã có mã sẽ được cập nhật tên và chuyển vào lớp này, <b>giữ nguyên mật khẩu</b>. Em mới được mật khẩu 6 số (in trên phiếu); lần đầu đăng nhập em phải tự đặt mật khẩu mới.</p>
      <textarea class="input" id="roster" rows="8" placeholder="057&#9;Nguyễn Văn An&#10;058&#9;Trần Thị Bình"></textarea>
      <div id="rprev" class="small muted" style="margin:6px 0"></div>
      <button class="btn btn-primary" data-act="import">Nhập vào lớp ${esc(c.name)}</button></details>
    ${list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Mã</th><th>Họ và tên</th><th>Mật khẩu ban đầu</th><th>Đăng nhập gần nhất</th><th></th></tr></thead><tbody>
      ${list.map((s) => `<tr${s.active ? "" : ' style="opacity:.5"'}><td>${esc(s.code)}</td><td class="wrap">${esc(s.name)}${s.active ? "" : " <span class='badge'>Đã khoá</span>"}${s.locked ? " <span class='badge exam'>Tạm khoá do nhập sai</span>" : ""}</td>
        <td>${s.initial_pin ? `<code style="font-size:15px">${esc(s.initial_pin)}</code> <span class="small faint">chưa đổi</span>` : '<span class="faint small">Em đã tự đặt</span>'}</td>
        <td class="small">${s.last_login ? fmtDT(s.last_login) : '<span class="faint">Chưa</span>'}</td>
        <td><button class="btn btn-sm" data-act="reset" data-id="${s.id}" data-n="${esc(s.name)}">Đặt lại MK</button>
        <button class="btn btn-sm" data-act="edit" data-id="${s.id}">Sửa</button></td></tr>`).join("")}
      </tbody></table></div>` : ""}`;
  ACT["in:roster"] = () => {};
  document.getElementById("roster").addEventListener("input", (e) => {
    const r = parseRoster(e.target.value);
    document.getElementById("rprev").textContent = r.length ? `Đọc được ${r.length} học sinh. Ví dụ: ${r.slice(0, 3).map((x) => x.code + " – " + (x.name || "(chưa có tên)")).join("; ")}` : "";
  });
  ACT.import = (btn) => busy(btn, async () => {
    const rows = parseRoster(document.getElementById("roster").value);
    if (!rows.length) { toast("Chưa có dòng nào hợp lệ."); return; }
    try {
      const r = await api("t_import_students", { p_class_id: id, p_rows: rows });
      toast(`Thêm mới ${r.added}, cập nhật ${r.updated}${r.skipped.length ? `, bỏ qua ${r.skipped.length} (trùng tài khoản giáo viên)` : ""}`, 4500);
      route();
    } catch (e) { toast(e.message, 4000); }
  });
  ACT.reset = (btn) => {
    if (!confirm(`Đặt lại mật khẩu cho ${btn.dataset.n}?\nEm đăng nhập bằng mật khẩu 6 số mới rồi phải đặt mật khẩu riêng ngay.`)) return;
    busy(btn, async () => {
      try { const r = await api("t_reset_password", { p_user_id: Number(btn.dataset.id) }); alert(`Mật khẩu mới của ${btn.dataset.n}: ${r.pin}\n(Lần đăng nhập đầu em sẽ phải đặt mật khẩu riêng.)`); route(); } catch (e) { toast(e.message); }
    });
  };
  ACT.edit = (btn) => {
    const s = list.find((x) => String(x.id) === btn.dataset.id);
    openSheet(`<form data-submit="saveStu"><div class="row between"><h2 style="margin:0">Sửa học sinh</h2><button type="button" class="icon-btn" data-act="closeSheet">✕</button></div>
      <p class="muted small">Mã ${esc(s.code)}</p>
      <div class="field"><label class="f">Họ và tên</label><input class="input" name="name" value="${esc(s.name)}"></div>
      <div class="field"><label class="f">Lớp</label><select class="input" name="cls">${ov.classes.map((x) => `<option value="${x.id}" ${x.id === id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>
      <label class="check"><input type="checkbox" name="active" ${s.active ? "checked" : ""}> Cho phép đăng nhập</label>
      <button class="btn btn-primary btn-block" style="margin-top:10px">Lưu</button></form>`);
    ACT.saveStu = (f) => busy(f.querySelector("button.btn-primary"), async () => {
      try {
        await api("t_update_student", { p_user_id: s.id, p_name: f.name.value, p_class_id: Number(f.cls.value), p_active: f.active.checked });
        closeSheet(); toast("Đã lưu"); route();
      } catch (e) { toast(e.message); }
    });
  };
  ACT.rename = () => {
    const nm = prompt("Tên lớp mới:", c.name);
    if (!nm) return;
    api("t_save_class", { p_id: id, p_name: nm }).then(() => route(), (e) => toast(e.message));
  };
  ACT.delclass = () => {
    if (!confirm(`Xoá lớp ${c.name}?`)) return;
    api("t_delete_class", { p_id: id }).then(() => go("#/t/classes"), (e) => toast(e.message));
  };
  ACT.closeSheet = () => closeSheet();
  ACT.noop = () => {};
  cleanup = closeSheet;
}

async function tPrint(id) {
  app.innerHTML = tShell("classes", spinner());
  ACT.retry = () => route();
  let ov, list;
  try { [ov, list] = await Promise.all([api("t_overview"), api("t_list_students", { p_class_id: id })]); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const c = ov.classes.find((x) => x.id === id) || { name: "" };
  const site = location.origin + location.pathname;
  list = list.filter((s) => s.active);
  app.querySelector("main").innerHTML = `<div class="no-print"><a href="#/t/c/${id}" class="small">‹ Lớp ${esc(c.name)}</a>
    <div class="row between" style="margin:8px 0 12px"><h1 style="margin:0">Phiếu tài khoản lớp ${esc(c.name)}</h1><button class="btn btn-primary" data-act="print">🖨 In</button></div>
    <p class="small muted">Cắt theo đường nét đứt và phát cho từng em. Em nào đã tự đặt mật khẩu thì phiếu không ghi mật khẩu.</p></div>
    <div class="slips">${list.map((s) => `<div class="slip"><div class="slip-brand">ANH NGỮ MS.NINH</div><div class="small muted">Kiểm tra &amp; bài tập online</div>
      <b>${esc(s.name)}</b> <span class="small">· Lớp ${esc(c.name)}</span>
      <div style="margin-top:6px">Mã học sinh: <b>${esc(s.code)}</b></div>
      <div>Mật khẩu lần đầu: ${s.initial_pin ? `<span class="pw">${esc(s.initial_pin)}</span>` : "<i>(em đã tự đặt)</i>"}</div>
      <div class="small">Đăng nhập lần đầu xong em phải đặt mật khẩu riêng.</div>
      <div class="small" style="margin-top:4px;word-break:break-all">${esc(site)}</div></div>`).join("")}</div>`;
  ACT.print = () => window.print();
}

// "Ma ket noi": 1 chuoi gom dia chi may chu + khoa cong khai + khoa may, phan mem tren may chi can dan 1 o
function maKetNoi(khoa) {
  const json = JSON.stringify({ v: 1, u: new URL(CFG.SUPABASE_URL, location.href).href.replace(/\/$/, ""), k: CFG.SUPABASE_KEY, m: khoa });
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return "MSNINH1." + b64;
}
function tAccount() {
  app.innerHTML = tShell("account", `<div style="max-width:640px"><h1>Tài khoản giáo viên</h1>
    <div class="card"><div class="muted small">Tên đăng nhập</div><b>${esc(S.user.code)}</b></div>
    <div class="card"><h2>🔑 Khoá máy cho phần mềm trên máy cô</h2>
      <p class="small muted">Phần mềm chấm điểm và webcam cần «mã kết nối» để gửi điểm, điểm danh, học phí lên đây. Mỗi máy / phần mềm nên có một khoá riêng; máy mất hoặc bán thì bấm «Thu hồi».</p>
      <form class="row" data-submit="taoKhoa" style="flex-wrap:nowrap"><input class="input grow" name="ten" placeholder="Tên khoá, vd: Máy chấm điểm phòng 1" required>
        <button class="btn btn-primary">+ Tạo khoá</button></form>
      <div id="makn"></div>
      <div id="khoamay" style="margin-top:12px">${spinner()}</div></div>
    ${passwordForm()}
    <button class="btn btn-danger btn-block" data-act="logout">Đăng xuất</button></div>`);
  bindPasswordForm();
  ACT.taoKhoa = (f) => busy(f.querySelector("button"), async () => {
    try {
      const r = await api("t_tao_khoa_may", { p_ten: f.ten.value });
      const ma = maKetNoi(r.khoa);
      f.reset();
      document.getElementById("makn").innerHTML = `<div class="alert alert-ok" style="margin-top:12px">
        <b>Mã kết nối</b> — sao chép rồi dán vào ô «Mã kết nối» trong Cài đặt của phần mềm.<br>
        <b style="color:var(--bad)">Mã chỉ hiện MỘT lần</b>, đóng trang là không xem lại được (khi cần thì tạo khoá mới).
        <textarea class="input mono" readonly rows="3" style="margin-top:8px">${esc(ma)}</textarea>
        <button class="btn btn-primary btn-sm" data-act="cpMa" style="margin-top:6px">📋 Sao chép mã kết nối</button></div>`;
      ACT.cpMa = () => copyText(ma);
      veKhoaMay();
    } catch (e) { toast(e.message, 4000); }
  });
  ACT["ch:khoaSaoLuu"] = async (el) => {
    const bat = el.checked;
    if (bat && !confirm(`Cho phép khoá «${el.dataset.t}» tải TOÀN BỘ dữ liệu (tên, điểm, học phí, SĐT phụ huynh, mật khẩu đã mã hoá) để sao lưu?
Chỉ bật cho phần mềm trên máy của cô (vd webcam sao lưu mỗi ngày). Mỗi lần sao lưu đều được ghi lại.`)) { el.checked = false; return; }
    el.disabled = true;
    try { await api("t_dat_quyen_sao_luu", { p_id: Number(el.dataset.id), p_bat: bat }); toast(bat ? "Đã cho phép sao lưu" : "Đã tắt quyền sao lưu"); veKhoaMay(); }
    catch (e) { el.checked = !bat; toast(e.message, 4000); } finally { el.disabled = false; }
  };
  ACT["ch:khoaSdt"] = async (el) => {
    const bat = el.checked;
    if (bat && !confirm(`Cho phép khoá «${el.dataset.t}» đọc SĐT phụ huynh?\nChỉ bật cho phần mềm trên máy của cô (vd phần mềm điểm danh gửi Zalo). Mỗi lần đọc đều được ghi lại.`)) { el.checked = false; return; }
    el.disabled = true;
    try { await api("t_dat_quyen_khoa", { p_id: Number(el.dataset.id), p_doc_sdt: bat }); toast(bat ? "Đã cho phép đọc SĐT" : "Đã tắt quyền đọc SĐT"); veKhoaMay(); }
    catch (e) { el.checked = !bat; toast(e.message, 4000); } finally { el.disabled = false; }
  };
  ACT.thuhoi = (btn) => {
    if (!confirm(`Thu hồi khoá «${btn.dataset.t}»? Phần mềm đang dùng khoá này sẽ không gửi được dữ liệu nữa.`)) return;
    busy(btn, async () => { try { await api("t_thu_hoi_khoa_may", { p_id: Number(btn.dataset.id) }); toast("Đã thu hồi"); veKhoaMay(); } catch (e) { toast(e.message); } });
  };
  veKhoaMay();
}

/* ---------------- giao vien: hoc phi, tong quan lop, khoa may ---------------- */
function thangNayVN() { return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 7); }

async function tHocPhi(query) {
  app.innerHTML = tShell("hocphi", spinner());
  ACT.retry = () => route();
  const st = { thang: thangHopLe(query.get("thang")), cls: query.get("lop") || "", chua: query.get("chua") === "1" };
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const main = app.querySelector("main");
  const ve = async () => {
    main.innerHTML = `<h1>💰 Học phí</h1>
      <div class="filters">
        <input class="input" type="month" data-ch="thang" value="${esc(st.thang)}" aria-label="Tháng">
        <select class="input" data-ch="lop" aria-label="Lớp"><option value="">Tất cả lớp</option>${ov.classes.map((c) => `<option value="${c.id}" ${String(c.id) === st.cls ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <label class="check"><input type="checkbox" data-ch="chua" ${st.chua ? "checked" : ""}> Chỉ em chưa đóng</label>
      </div><div id="hp">${spinner()}</div>`;
    let d;
    try { d = await api("t_hoc_phi", { p: { thang: st.thang, class_id: st.cls ? Number(st.cls) : null, chua_dong: st.chua } }); }
    catch (e) { document.getElementById("hp").innerHTML = errBox(e); return; }
    const t = d.tong;
    document.getElementById("hp").innerHTML = `<div class="tiles">
        <div class="tile"><b>${t.so_da_dong}/${t.co_hoc_phi}</b><span>em đã đóng (có học phí)</span></div>
        <div class="tile"><b>${tien(t.phai_thu)}</b><span>phải thu</span></div>
        <div class="tile"><b style="color:var(--ok)">${tien(t.da_thu)}</b><span>đã thu</span></div>
        <div class="tile"><b style="color:var(--bad)">${tien(t.phai_thu - t.da_thu)}</b><span>còn lại</span></div></div>
      ${d.rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Đã đóng</th><th>Mã</th><th>Họ tên</th><th>Lớp</th><th>Số buổi</th><th>Đơn giá</th><th>Thành tiền</th><th>Ngày đóng</th></tr></thead><tbody>
        ${d.rows.map((r) => `<tr class="${r.da_dong ? "row-ok" : ""}">
          <td><label class="tick"><input type="checkbox" data-ch="dong" data-u="${r.user_id}" ${r.da_dong ? "checked" : ""} aria-label="Đã đóng học phí ${esc(r.ho_ten)}"><span></span></label></td>
          <td>${esc(r.ma_hs)}</td><td class="wrap">${esc(r.ho_ten)}</td><td>${esc(r.lop || "")}</td>
          <td>${r.so_buoi ?? '<span class="faint">—</span>'}${r.so_buoi_nguon === "may_gui" ? ' <span class="faint small" title="Tháng này chưa có điểm danh, dùng số buổi máy gửi">(máy gửi)</span>' : ""}</td>
          <td><button class="btn btn-sm btn-ghost" data-act="hpGia" data-u="${r.user_id}" data-n="${esc(r.ho_ten)}" data-g="${r.don_gia_rieng ? r.don_gia : ""}" title="Sửa đơn giá riêng em này">${r.don_gia === null ? "—" : tien(r.don_gia)}${r.don_gia_rieng ? " ✱" : ""}</button></td>
          <td><b>${r.thanh_tien === null ? '<span class="faint">—</span>' : tien(r.thanh_tien)}</b></td>
          <td class="small" id="nd${r.user_id}">${r.ngay_dong ? ngayVN(r.ngay_dong) : ""}</td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty">${st.chua ? "🎉 Tất cả đã đóng học phí." : "Không có học sinh."}</div>`}
      <p class="small muted">Số buổi = số ngày có mặt trong tháng, tự tính từ điểm danh (đối soát ở mục <a href="#/t/buoi-hoc?thang=${esc(st.thang)}${st.cls ? "&lop=" + esc(st.cls) : ""}">📅 Buổi học</a>). Đơn giá theo khối đặt ở mục Buổi học; bấm vào đơn giá một em để đặt giá riêng (✱). Tích ô «Đã đóng» là lưu ngay.</p>`;
  };
  ACT["ch:thang"] = (el) => { if (el.value) { st.thang = el.value; ve(); } };
  ACT["ch:lop"] = (el) => { st.cls = el.value; ve(); };
  ACT["ch:chua"] = (el) => { st.chua = el.checked; ve(); };
  ACT.hpGia = (b) => {
    const v = prompt(`Đơn giá riêng 1 buổi của ${b.dataset.n} (tháng ${st.thang}).
Để trống = dùng giá theo khối.`, b.dataset.g);
    if (v === null) return;
    const so = v.replace(/[^0-9]/g, "");
    busy(b, async () => {
      try { await api("t_dat_don_gia_hs", { p_user_id: Number(b.dataset.u), p_thang: st.thang, p_don_gia: so === "" ? null : Number(so) }); toast("Đã lưu đơn giá"); ve(); }
      catch (e) { toast(e.message, 4500); }
    });
  };
  ACT["ch:dong"] = async (el) => {
    const want = el.checked;
    el.disabled = true;
    try {
      const r = await api("t_dat_da_dong", { p_user_id: Number(el.dataset.u), p_thang: st.thang, p_da_dong: want });
      el.closest("tr").classList.toggle("row-ok", r.da_dong);
      const nd = document.getElementById("nd" + el.dataset.u);
      if (nd) nd.textContent = r.ngay_dong ? ngayVN(r.ngay_dong) : "";
      toast(want ? "Đã ghi: đã đóng học phí ✓" : "Đã bỏ đánh dấu");
    } catch (e) { el.checked = !want; toast(e.message, 4000); }
    finally { el.disabled = false; }
  };
  ve();
}

async function tTongQuan(id, query) {
  app.innerHTML = tShell("classes", spinner());
  ACT.retry = () => route();
  let thang = thangHopLe(query.get("thang"));
  let ov;
  try { ov = await api("t_overview"); } catch (e) { app.querySelector("main").innerHTML = pageError(e); return; }
  const c = ov.classes.find((x) => x.id === id) || { name: "" };
  const main = app.querySelector("main");
  const ve = async () => {
    main.innerHTML = `<a href="#/t/c/${id}" class="small">‹ Lớp ${esc(c.name)}</a>
      <div class="row between" style="margin:8px 0"><h1 style="margin:0">📋 Tổng quan lớp ${esc(c.name)}</h1>
      <input class="input" type="month" data-ch="thang" value="${esc(thang)}" style="width:auto" aria-label="Tháng"></div><div id="tq">${spinner()}</div>`;
    let d;
    try { d = await api("t_tong_quan_lop", { p: { class_id: id, thang } }); } catch (e) { document.getElementById("tq").innerHTML = errBox(e); return; }
    const s = (v) => (v === null || v === undefined ? '<span class="faint">—</span>' : `<span class="score ${scoreCls(v)}" style="font-size:15px">${fmtScore(v)}</span>`);
    document.getElementById("tq").innerHTML = d.rows.length ? `<div class="table-wrap"><table class="t"><thead><tr>
        <th>Mã</th><th>Họ tên</th><th>📄 Phiếu chấm TB</th><th>Bài gần nhất</th><th>🔤 Từ vựng</th><th>💻 Online</th><th>🎤 Miệng</th><th>Có mặt / vắng</th><th>Học phí</th></tr></thead><tbody>
      ${d.rows.map((r) => `<tr><td>${esc(r.ma_hs)}</td><td class="wrap">${esc(r.ho_ten)}</td>
        <td>${s(r.omr_tb)} <span class="faint small">${r.omr_so_bai ? "(" + r.omr_so_bai + " bài)" : ""}</span></td><td>${s(r.omr_gan_nhat)}</td>
        <td>${s(r.tu_vung_tb)}</td><td>${s(r.online_tb)}</td><td>${r.mieng_tb === null ? '<span class="faint">—</span>' : fmtScore(r.mieng_tb) + "★"}</td>
        <td><b style="color:var(--ok)">${r.co_mat}</b> / <b style="color:${r.vang ? "var(--bad)" : "inherit"}">${r.vang}</b></td>
        <td>${r.hoc_phi === null ? '<span class="faint">—</span>' : tien(r.hoc_phi) + (r.da_dong ? ' <span class="badge hw">✓</span>' : ' <span class="badge exam">chưa</span>')}</td></tr>`).join("")}
      </tbody></table></div><p class="small muted">Điểm quy về thang 10. Có mặt / vắng và học phí tính trong ${thangVN(thang).toLowerCase()}.</p>`
      : '<div class="empty">Lớp chưa có học sinh.</div>';
  };
  ACT["ch:thang"] = (el) => { if (el.value) { thang = el.value; ve(); } };
  ve();
}

async function veKhoaMay() {
  const box = document.getElementById("khoamay");
  if (!box) return;
  let ds;
  try { ds = await api("t_ds_khoa_may"); } catch (e) { box.innerHTML = errBox(e); return; }
  box.innerHTML = ds.length ? ds.map((k) => `<div class="dd-row">
      <span><b>${esc(k.ten)}</b><br><span class="small muted"><span class="code">${esc(k.key_prefix)}…</span> · tạo ${ngayVN(k.created_at)}${k.last_used_at ? " · dùng lần cuối " + fmtDT(k.last_used_at) : " · chưa dùng"}</span></span>
      ${k.revoked_at ? "" : `<br><label class="check small" style="margin-top:4px"><input type="checkbox" data-ch="khoaSdt" data-id="${k.id}" data-t="${esc(k.ten)}" ${k.doc_sdt ? "checked" : ""}> 📞 Cho phép đọc SĐT phụ huynh</label>
        ${Number(k.doc_sdt_lan) ? `<span class="small muted"> · đã đọc ${k.doc_sdt_lan} lần, gần nhất ${fmtDT(k.doc_sdt_luc)}</span>` : ""}
        <br><label class="check small" style="margin-top:4px"><input type="checkbox" data-ch="khoaSaoLuu" data-id="${k.id}" data-t="${esc(k.ten)}" ${k.sao_luu ? "checked" : ""}> 💾 Cho phép sao lưu toàn bộ dữ liệu</label>
        ${Number(k.sao_luu_lan) ? `<span class="small muted"> · đã sao lưu ${k.sao_luu_lan} lần, gần nhất ${fmtDT(k.sao_luu_luc)}</span>` : ""}`}</span>
      ${k.revoked_at ? '<span class="badge">Đã thu hồi</span>' : `<button class="btn btn-sm btn-danger" data-act="thuhoi" data-id="${k.id}" data-t="${esc(k.ten)}">Thu hồi</button>`}</div>`).join("")
    : '<p class="muted small">Chưa có khoá nào.</p>';
}

/* ---------------- phieu dang ky tu van (tu website) ---------------- */
async function tDangKy() {
  app.innerHTML = tShell("dangky", spinner());
  ACT.retry = () => route();
  let chua = true;
  const main = app.querySelector("main");
  const ve = async () => {
    main.innerHTML = `<div class="row between" style="margin-bottom:10px"><h1 style="margin:0">📩 Phiếu đăng ký tư vấn</h1>
      <label class="check"><input type="checkbox" data-ch="chua" ${chua ? "checked" : ""}> Chỉ phiếu chưa xử lý</label></div>
      <p class="small muted">Phụ huynh gửi từ website msninh.vn. Phiếu tự xoá sau 12 tháng. Số điện thoại chỉ dùng để tư vấn.</p><div id="ds">${spinner()}</div>`;
    let ds;
    try { ds = await api("t_ds_dang_ky", { p: { chua_xu_ly: chua } }); } catch (e) { document.getElementById("ds").innerHTML = pageError(e); return; }
    document.getElementById("ds").innerHTML = ds.length ? ds.map((r) => `<div class="card dk-card ${r.da_xu_ly ? "dk-xong" : ""}">
        <div class="row between"><div><b style="font-size:17px">${esc(r.ten_phu_huynh)}</b> <span class="badge">${esc(r.khoi)}</span></div>
          <span class="small muted">${fmtDT(r.created_at)}</span></div>
        <div style="margin:6px 0"><a class="btn btn-sm btn-gold" href="tel:${esc(r.sdt)}">📞 ${esc(r.sdt)}</a>
          <a class="btn btn-sm" href="https://zalo.me/${esc(r.sdt)}" target="_blank" rel="noopener">Zalo</a></div>
        ${r.loi_nhan ? `<p class="quote" style="color:var(--ink);background:#f5f7ff">“${esc(r.loi_nhan)}”</p>` : ""}
        <div class="row" style="flex-wrap:nowrap"><label class="tick"><input type="checkbox" data-ch="xl" data-id="${r.id}" ${r.da_xu_ly ? "checked" : ""}><span></span></label>
          <span class="small">Đã gọi / đã xử lý</span>
          <input class="input grow" data-ch="gc" data-id="${r.id}" value="${esc(r.ghi_chu_gv || "")}" placeholder="Ghi chú (vd: hẹn học thử thứ 7)" maxlength="300" style="min-height:38px;padding:6px 10px"></div>
      </div>`).join("") : `<div class="empty">${chua ? "🎉 Không còn phiếu nào chưa xử lý." : "Chưa có phiếu đăng ký nào."}</div>`;
  };
  const luu = async (id, p) => {
    try { await api("t_xu_ly_dang_ky", { p_id: id, p_da_xu_ly: p.xl, p_ghi_chu: p.gc }); toast("Đã lưu"); }
    catch (e) { toast(e.message, 4000); }
  };
  ACT["ch:chua"] = (el) => { chua = el.checked; ve(); };
  ACT["ch:xl"] = (el) => { el.closest(".dk-card").classList.toggle("dk-xong", el.checked); luu(Number(el.dataset.id), { xl: el.checked, gc: null }); };
  ACT["ch:gc"] = (el) => luu(Number(el.dataset.id), { xl: null, gc: el.value });
  ve();
}

/* ================= khoi dong ================= */
route();
