/* Trang chi tiet de (Kho de -> bam vao de): cac LAN CHAM bai giay (web cham tu lua chon tho cua may cham diem),
 * anh PNG ket qua ca lop (kieu giong phan mem cham diem), nhat ky sua de, TAI WORD (de cho HS / co dap an + giai thich).
 * Chi tai khi GV mo (27/10/2026). */

function ngayDu(iso) { const d = new Date(iso), p2 = (n) => String(n).padStart(2, "0"); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`; }

/* ---------- trang chi tiet de ---------- */
async function tDe(id) {
  app.innerHTML = tShell("quizzes", spinner());
  ACT.retry = () => route();
  let q, lan, ls;
  try { [q, lan, ls] = await Promise.all([api("t_get_quiz", { p_id: id }), api("t_lan_cham", { p_quiz_id: id }), api("t_lich_su_de", { p_quiz_id: id })]); }
  catch (e) { app.querySelector("main").innerHTML = pageError(e, "#/t/quizzes"); return; }
  if (!q) { app.querySelector("main").innerHTML = errBox("Không tìm thấy đề."); return; }
  const TRUONG = { dap_an: "Đáp án", cau_hoi: "Câu hỏi", lua_chon: "Lựa chọn", giai_thich: "Giải thích", huong_dan: "Hướng dẫn", cau: "Câu" };
  app.querySelector("main").innerHTML = `<a href="#/t/quizzes" class="small">‹ Kho đề</a>
    <div class="row between" style="margin:8px 0 4px;gap:8px;flex-wrap:wrap"><h1 style="margin:0">${esc(q.title)}</h1>
      <div class="row" style="gap:6px;flex-wrap:wrap"><a class="btn btn-sm" href="#/t/q/${id}">✏️ Sửa đề / đáp án</a><a class="btn btn-sm btn-primary" href="#/t/new?quiz=${id}">Giao bài</a>
      <button class="btn btn-sm" data-act="deWord">📄 Tải Word</button></div></div>
    <div class="small muted">${q.ma_de ? "Mã đề <b>" + esc(q.ma_de) + "</b> · " : ""}${q.questions.length} câu · phiên bản đáp án <b>${q.phien_ban || 1}</b></div>
    <div class="section-title">🧾 Các lần chấm bài giấy (${lan.length})</div>
    ${lan.length ? lan.map((l) => `<div class="card row between" style="gap:8px;flex-wrap:wrap">
        <div><b>Lần chấm ${String(l.so).padStart(2, "0")}</b><div class="small muted">${fmtDT(l.luc)} · ${l.so_phieu} phiếu${l.cham_lai_luc ? ` · <span style="color:#b26a00">đã chấm lại theo đáp án ngày ${ngayDu(l.cham_lai_luc)} (phiên bản ${l.phien_ban})</span>` : ""}</div></div>
        <button class="btn btn-sm btn-primary" data-act="deAnh" data-id="${l.id}">🖼 Ảnh kết quả</button></div>`).join("")
      : '<div class="empty small">Chưa có lần chấm nào. Phần mềm chấm điểm quét phiếu và gửi lên thì kết quả hiện ở đây.</div>'}
    <div class="section-title">📝 Nhật ký sửa đề</div>
    ${ls.length ? ls.map((h) => `<div class="card" style="padding:10px 12px"><div class="small"><b>Phiên bản ${h.phien_ban}</b> · ${fmtDT(h.luc)} · ${h.nguon === "web" ? "sửa trên web" : "phần mềm chấm điểm đăng lại"}${h.ai ? " · " + esc(h.ai) : ""}</div>
        <ul class="small" style="margin:6px 0 0;padding-left:18px">${h.thay_doi.slice(0, 30).map((t) => `<li>Câu ${esc(t.stt)} — ${TRUONG[t.truong] || esc(t.truong)}: <span class="muted">${esc(String(t.cu ?? "").slice(0, 80))}</span> → <b>${esc(String(t.moi ?? "").slice(0, 80))}</b></li>`).join("")}${h.thay_doi.length > 30 ? `<li>… và ${h.thay_doi.length - 30} thay đổi khác</li>` : ""}</ul></div>`).join("")
      : '<div class="empty small">Chưa sửa lần nào.</div>'}`;
  ACT.deWord = () => moWord(q);
  ACT.deAnh = (b) => moAnhLanCham(Number(b.dataset.id));
}

/* ---------- thong bao sau khi sua de (goi tu trang soan de) ---------- */
function baoChamLai(cl) {
  if (!cl || !cl.thay_doi) return;
  const ct = cl.chi_tiet || [];
  openSheet(`<h2 style="margin:0 40px 8px 0">✅ Đã lưu — phiên bản ${cl.phien_ban}</h2>
    <p>Đã sửa <b>${cl.thay_doi}</b> chỗ. ${cl.cham_lai ? `Đã chấm lại <b>${cl.cham_lai}</b> bài, <b>${cl.doi_diem}</b> em đổi điểm.` : "Không có bài nào cần chấm lại."}</p>
    ${ct.length ? `<div class="table-wrap" style="max-height:50vh;overflow:auto"><table class="t"><thead><tr><th>Mã</th><th>Họ tên</th><th>Bài</th><th>Điểm cũ → mới</th></tr></thead><tbody>
      ${ct.map((x) => `<tr><td>${esc(x.ma_hs)}</td><td class="wrap">${esc(x.ho_ten)}</td><td class="small">${x.nguon === "giay" ? "Giấy · lần " + String(x.lan_cham).padStart(2, "0") : "Online"}</td>
        <td>${fmtScore(x.cu)} → <b>${fmtScore(x.moi)}</b></td></tr>`).join("")}</tbody></table></div>` : ""}
    ${(cl.giu_de_cu || []).length ? `<div class="alert alert-warn small">${cl.giu_de_cu.map((g) => `Bài giao «${esc(g.title)}» đã có học sinh làm mà số câu / số lựa chọn thay đổi → giữ đề cũ.`).join("<br>")}</div>` : ""}
    <p class="small muted">Bài giấy cũ gửi lên trước khi có chấm trên web (không có lựa chọn từng câu) giữ nguyên điểm.</p>
    <button class="btn btn-primary btn-block" data-act="closeSheet">Đóng</button>`);
}

/* ---------- anh PNG ket qua 1 lan cham ---------- */
async function moAnhLanCham(lanId) {
  openSheet(`<h2 style="margin:0 40px 8px 0">🖼 Ảnh kết quả</h2><div id="anhLc">${spinner()}</div>`);
  try {
    const d = await api("t_ket_qua_lan_cham", { p_lan_id: lanId });
    const blob = await veAnhLanCham(d);
    const url = URL.createObjectURL(blob);
    const ten = `KQ ${d.ma_de || "de"} lan ${String(d.so).padStart(2, "0")} ${ngayDu(d.luc).replace(/\//g, "-")}.png`;
    const o = document.getElementById("anhLc"); if (!o) return;
    o.innerHTML = `<a class="btn btn-primary btn-block" href="${url}" download="${esc(ten)}">⬇ Tải ảnh PNG</a>
      <img src="${url}" alt="Kết quả lần chấm" style="width:100%;margin-top:10px;border-radius:10px;border:1px solid #e3e8f5">`;
  } catch (e) { const o = document.getElementById("anhLc"); if (o) o.innerHTML = errBox(e); }
}

function veAnhLanCham(d) {
  const W = 1920, M = 60, BG = "#f0f3ff", XANH = "#3f58d8", MUC = "#1b2340", XAM = "#6b7a99", ALT = "#f7f9ff";
  const TOT = "#178a5b", VUA = "#b7791f", KEM = "#d1343a", HUY = { 1: "#e6aa1e", 2: "#96a0b2", 3: "#b06c3e" };
  const F = (sz, dam) => `${dam === false ? 600 : 700} ${sz}px "Chakra Petch", "Be Vietnam Pro", sans-serif`;
  const rows = d.rows.map((r) => ({ ...r, diem: Number(r.diem), sai: r.cau_sai || [], trong: r.cau_trong || [] }));
  const n = rows.length, tb = n ? rows.reduce((a, r) => a + r.diem, 0) / n : 0, cao = n ? Math.max(...rows.map((r) => r.diem)) : 0;
  const dem = {}; rows.forEach((r) => r.sai.concat(r.trong).forEach((c) => { dem[c] = (dem[c] || 0) + 1; }));
  const kho = Object.entries(dem).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 5);
  // bang 1: theo lop -> ma HS; bang 2: theo diem giam dan (cung diem cung hang)
  const theoLop = {}; rows.forEach((r) => { (theoLop[r.lop || "—"] = theoLop[r.lop || "—"] || []).push(r); });
  const lops = Object.keys(theoLop).sort((a, b) => a.localeCompare(b, "vi"));
  const xep = rows.slice().sort((a, b) => b.diem - a.diem || String(a.ma_sap).localeCompare(String(b.ma_sap), "vi", { numeric: true }));
  let hang = 0, truoc = null; xep.forEach((r, i) => { if (r.diem !== truoc) { hang = i + 1; truoc = r.diem; } r.hang = hang; });
  const cv = document.createElement("canvas"), c = cv.getContext("2d");
  const X = { stt: M, ma: M + 140, ten: M + 310, diem: M + 830, sai: M + 1050 }, WSAI = W - M - X.sai;
  const CHIP = 44, GAP = 8, HMIN = 82;
  const dongChip = (r) => {
    c.font = F(26); const ds = r.sai.map((x) => [x, "sai"]).concat(r.trong.map((x) => [x, "trong"]));
    const lines = []; let cur = [], w = 0;
    ds.forEach(([x, k]) => { const ww = Math.max(58, c.measureText(String(x)).width + 34); if (cur.length && w + ww > WSAI) { lines.push(cur); cur = []; w = 0; } cur.push([x, k, ww]); w += ww + GAP; });
    if (cur.length) lines.push(cur); return lines;
  };
  const caoDong = (r) => Math.max(HMIN, Math.max(1, dongChip(r).length) * (CHIP + GAP) + 26);
  const HEAD = 190, TITLE2 = 90, COLH = 58, LOPH = 56, FOOT = 60;
  const tinhCao = () => {
    let h = HEAD + TITLE2 + COLH; lops.forEach((l) => { h += LOPH; theoLop[l].forEach((r) => { h += caoDong(r); }); });
    h += TITLE2 + COLH; xep.forEach((r) => { h += caoDong(r); }); return h + FOOT;
  };
  const vaoFont = document.fonts && document.fonts.load ? Promise.all([document.fonts.load(F(40)), document.fonts.load(F(26, false))]) : Promise.resolve();
  return vaoFont.then(() => {
    cv.width = W; c.font = F(26); cv.height = tinhCao();
    c.fillStyle = BG; c.fillRect(0, 0, W, cv.height);
    const txt = (t, x, y, f, mau, can) => { c.font = f; c.fillStyle = mau; c.textAlign = can || "left"; c.textBaseline = "middle"; c.fillText(t, x, y); };
    const vua = (t, f, maxw) => { c.font = f; if (c.measureText(t).width <= maxw) return t; while (t && c.measureText(t + "…").width > maxw) t = t.slice(0, -1); return t + "…"; };
    const tron = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // dau trang
    c.fillStyle = XANH; c.fillRect(0, 0, W, HEAD - 16);
    const luc = new Date(d.luc), gio = String(luc.getHours()).padStart(2, "0") + ":" + String(luc.getMinutes()).padStart(2, "0");
    txt(vua(`Lần chấm ${String(d.so).padStart(2, "0")} · ${ngayDu(d.luc)} · ${gio} · ${d.ten}${d.ma_de ? " (" + d.ma_de + ")" : ""}`, F(46), W - 2 * M), M, 52, F(46), "#fff");
    txt(`${n} bài · điểm trung bình ${tb.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")} · cao nhất ${String(cao).replace(".", ",")} · ${d.so_cau} câu`, M, 100, F(26, false), "#d6deff");
    const dong3 = [kho.length ? "Câu nhiều bạn sai nhất: " + kho.map(([cau, k]) => `Câu ${cau} (${k}/${n})`).join("  ·  ") : "",
      d.cham_lai_luc ? `Chấm lại theo đáp án ngày ${ngayDu(d.cham_lai_luc)} (phiên bản ${d.phien_ban})` : ""].filter(Boolean).join("   |   ");
    if (dong3) txt(vua(dong3, F(24, false), W - 2 * M), M, 138, F(24, false), "#ffe296");
    let y = HEAD;
    const tieuDe2 = (t) => { txt(t, M, y + TITLE2 / 2 + 6, F(34), XANH); y += TITLE2; };
    const dauCot = (cotDau) => {
      c.strokeStyle = "#c8d0e8"; c.lineWidth = 3; c.beginPath(); c.moveTo(M - 20, y + COLH); c.lineTo(W - M + 20, y + COLH); c.stroke();
      const cy = y + COLH / 2 - 2, f = F(26, false);
      txt(cotDau, X.stt + 34, cy, f, XAM, "center"); txt("Mã HS", X.ma + 75, cy, f, XAM, "center"); txt("Họ và tên", X.ten, cy, f, XAM);
      txt("Điểm", X.diem + 100, cy, f, XAM, "center"); txt("Các câu sai (đỏ) · chưa trả lời (xám)", X.sai, cy, f, XAM); y += COLH;
    };
    const veDong = (r, so, k, laHang) => {
      const h = caoDong(r), cy = y + h / 2;
      if (k % 2) { c.fillStyle = ALT; c.fillRect(M - 20, y, W - 2 * M + 40, h); }
      if (laHang && HUY[so]) { c.fillStyle = HUY[so]; c.beginPath(); c.arc(X.stt + 34, cy, 28, 0, 7); c.fill(); txt(String(so), X.stt + 34, cy + 2, F(36), "#fff", "center"); }
      else txt(String(so), X.stt + 34, cy + 2, F(36), MUC, "center");
      txt(String(r.ma_hs), X.ma + 75, cy + 2, F(34), XANH, "center");
      txt(vua(r.ho_ten || "—", F(32), 500), X.ten, cy - (r.lop ? 13 : 0), F(32), MUC);
      if (r.lop) txt(vua(r.lop, F(22, false), 500), X.ten, cy + 22, F(22, false), XAM);
      const mau = r.diem >= 8 ? TOT : r.diem >= 5 ? VUA : KEM;
      txt(String(r.diem).replace(".", ","), X.diem + 100, cy - 14, F(46), mau, "center");
      txt(`${r.dung}/${r.tong} câu`, X.diem + 100, cy + 27, F(22, false), XAM, "center");
      const lines = dongChip(r);
      if (!lines.length) txt("✔ Làm đúng hết", X.sai, cy, F(30), TOT);
      else {
        let yy = cy - (lines.length * (CHIP + GAP) - GAP) / 2;
        lines.forEach((ln) => { let x = X.sai; ln.forEach(([cau, kieu, w]) => {
          const [nen, chu, vien] = kieu === "sai" ? ["#fdecec", "#c23338", "#f5b5b8"] : ["#f0f2f8", "#6b7a99", "#b9c1d9"];
          tron(x, yy, w, CHIP, CHIP / 2); c.fillStyle = nen; c.fill(); c.strokeStyle = vien; c.lineWidth = 2; c.stroke();
          txt(String(cau), x + w / 2, yy + CHIP / 2 + 1, F(26), chu, "center"); x += w + GAP; }); yy += CHIP + GAP; });
      }
      y += h;
    };
    tieuDe2("BẢNG 1 — THEO MÃ HỌC SINH, TỪNG LỚP"); dauCot("STT");
    let stt = 0;
    lops.forEach((l) => {
      c.fillStyle = "#e3e8fb"; c.fillRect(M - 20, y + 6, W - 2 * M + 40, LOPH - 10);
      txt(`${l} · ${theoLop[l].length} em`, M, y + LOPH / 2 + 1, F(28), XANH); y += LOPH;
      theoLop[l].forEach((r, k) => { stt++; veDong(r, stt, k, false); });
    });
    tieuDe2("BẢNG 2 — XẾP THEO ĐIỂM"); dauCot("Hạng");
    xep.forEach((r, k) => veDong(r, r.hang, k, true));
    txt("ANH NGỮ MS.NINH · msninh.vn", W - M, cv.height - 30, F(22, false), XAM, "right");
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  });
}

/* ---------- Tai Word (.docx) tao ngay tren trinh duyet ---------- */
function moWord(q) {
  openSheet(`<h2 style="margin:0 40px 8px 0">📄 Tải Word</h2>
    <p class="small muted">Tạo từ bản đề <b>hiện hành</b> trên web (phiên bản ${q.phien_ban || 1}), giữ chữ đậm / gạch chân / nghiêng, đoạn văn chung in một lần.</p>
    <button class="btn btn-primary btn-block btn-lg" data-act="wordHs">📄 Đề cho học sinh (không đáp án)</button>
    <button class="btn btn-block btn-lg" style="margin-top:8px" data-act="wordDa">📗 Có đáp án + giải thích</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" data-act="closeSheet">Đóng</button>`);
  const tai = (coDa) => {
    const blob = taoDocx(q, coDa);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${(q.ma_de || q.title).replace(/[\\/:*?"<>|]/g, "-")}${coDa ? " - dap an" : ""}.docx`;
    document.body.appendChild(a); a.click(); a.remove();
    toast("Đã tạo file Word");
  };
  ACT.wordHs = () => tai(false);
  ACT.wordDa = () => tai(true);
}

const DOCX_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function docxZip(files) {
  const enc = new TextEncoder(), crc = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = DOCX_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const phan = [], tt = []; let off = 0;
  for (const f of files) {
    const ten = enc.encode(f.ten), d = enc.encode(f.noi_dung), c = crc(d);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, ten.length, true);
    phan.push(new Uint8Array(h.buffer), ten, d);
    const g = new DataView(new ArrayBuffer(46));
    g.setUint32(0, 0x02014b50, true); g.setUint16(4, 20, true); g.setUint16(6, 20, true); g.setUint16(8, 0x0800, true);
    g.setUint32(16, c, true); g.setUint32(20, d.length, true); g.setUint32(24, d.length, true); g.setUint16(28, ten.length, true); g.setUint32(42, off, true);
    tt.push(new Uint8Array(g.buffer), ten);
    off += 30 + ten.length + d.length;
  }
  const cd = tt.reduce((n, x) => n + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cd, true); e.setUint32(16, off, true);
  return new Blob([...phan, ...tt, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
// chu co the <b> <i> <u> <br> -> cac run Word
function docxRuns(s, them) {
  const xe = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
  const st = { b: 0, i: 0, u: 0 }; let out = "";
  const DOI = { strong: "b", em: "i" };
  String(s || "").replace(/\n/g, "<br>").split(/(<\/?(?:b|i|u|strong|em)>|<br\s*\/?>)/i).forEach((p) => {
    const m = /^<(\/?)(b|i|u|strong|em)>$/i.exec(p);
    if (m) { const k = m[2].toLowerCase(); st[DOI[k] || k] += m[1] ? -1 : 1; return; }
    if (/^<br/i.test(p)) { out += "<w:r><w:br/></w:r>"; return; }
    if (!p) return;
    const t = p.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(\s[^>]*)?\/?>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const rpr = (st.b > 0 || (them && them.b) ? "<w:b/>" : "") + (st.i > 0 || (them && them.i) ? "<w:i/>" : "") + (st.u > 0 ? '<w:u w:val="single"/>' : "") + (them && them.mau ? `<w:color w:val="${them.mau}"/>` : "");
    out += `<w:r>${rpr ? "<w:rPr>" + rpr + "</w:rPr>" : ""}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  });
  return out;
}
function docxP(runs, opt) {
  opt = opt || {};
  const ppr = (opt.giua ? '<w:jc w:val="center"/>' : opt.deu ? '<w:jc w:val="both"/>' : "") + (opt.thut ? `<w:ind w:left="${opt.thut}"/>` : "") + `<w:spacing w:after="${opt.sau ?? 60}"/>`;
  return `<w:p><w:pPr>${ppr}</w:pPr>${runs}</w:p>`;
}
function taoDocx(q, coDa) {
  const L = "ABCDEFGH";
  // tach doan nhu fmtDe: noi dong ngat vun, giu xuong dong truoc loi thoai «Tên:», gach dau dong, «a)»
  const doanCua = (s) => String(s || "").replace(/\r/g, "").split(/\n[ \t]*\n/).map((p) => p.split("\n").reduce((acc, line) => {
    const l = line.trim();
    if (!l) return acc;
    if (!acc) return l;
    if (/^([A-ZÀ-Ỹ][\wÀ-ỹ .'’-]{0,24}:\s|[-•*+–]\s|\(?[a-hA-H][).]\s|\d{1,2}[.)]\s)/.test(l) || /<br\s*\/?>$/i.test(acc)) return acc + "\n" + l;
    return acc + " " + l;
  }, "")).filter(Boolean);
  const chungDau = (a, b) => { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; };
  const qs = q.questions.slice().sort((a, b) => (a.stt || 0) - (b.stt || 0));
  let body = docxP(docxRuns(q.title, { b: 1 }).replace(/<w:rPr>/g, '<w:rPr><w:sz w:val="32"/>'), { giua: 1, sau: 80 });
  body += docxP(docxRuns(`${q.ma_de ? "Mã đề " + q.ma_de + " · " : ""}${qs.length} câu${coDa ? " · ĐÁP ÁN + GIẢI THÍCH (phiên bản " + (q.phien_ban || 1) + ")" : ""}`, { i: 1 }), { giua: 1, sau: 200 });
  if (!coDa) body += docxP(docxRuns("Họ và tên: ………………………………………   Lớp: …………   Mã HS: ……………"), { sau: 240 });
  let hdTruoc = null;
  const ds = qs.map((x) => doanCua(x.question));
  qs.forEach((x, k) => {
    const stt = x.stt || k + 1, d = ds[k];
    if (x.instruction && x.instruction !== hdTruoc) { body += docxP(docxRuns(x.instruction, { b: 1, i: 1 }), { sau: 100 }); }
    hdTruoc = x.instruction || hdTruoc;
    // doan van chung: phan dau trung voi cau truoc (da in) hoac cau sau (in mot lan o day)
    const kTruoc = k ? chungDau(ds[k - 1], d) : 0, kSau = k + 1 < qs.length ? chungDau(d, ds[k + 1]) : 0;
    let rieng;
    if (kTruoc) rieng = d.slice(kTruoc);
    else if (kSau) { d.slice(0, kSau).forEach((p) => { body += docxP(docxRuns(p), { deu: 1, sau: 100 }); }); rieng = d.slice(kSau); }
    else { d.slice(0, -1).forEach((p) => { body += docxP(docxRuns(p), { deu: 1, sau: 100 }); }); rieng = d.slice(-1); }
    body += docxP(`<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Câu ${stt}. </w:t></w:r>` + docxRuns(rieng[0] || ""), { sau: 40 });
    rieng.slice(1).forEach((p) => { body += docxP(docxRuns(p), { thut: 400, sau: 40 }); });
    x.options.forEach((o, j) => {
      const dung = coDa && j === x.correct;
      body += docxP(`<w:r><w:rPr><w:b/>${dung ? '<w:color w:val="178A5B"/>' : ""}</w:rPr><w:t xml:space="preserve">${L[j]}. </w:t></w:r>` + docxRuns(o, dung ? { b: 1, mau: "178A5B" } : null), { thut: 400, sau: 20 });
    });
    if (coDa) {
      body += docxP(`<w:r><w:rPr><w:b/><w:color w:val="178A5B"/></w:rPr><w:t xml:space="preserve">→ Đáp án: ${L[x.correct]}</w:t></w:r>`, { thut: 400, sau: 20 });
      if (x.explanation) body += docxP(`<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">Giải thích: </w:t></w:r>` + docxRuns(x.explanation, { i: 1 }), { thut: 400, sau: 20 });
    }
    body += docxP("", { sau: 80 });
  });
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1100" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;
  return docxZip([
    { ten: "[Content_Types].xml", noi_dung: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>' },
    { ten: "_rels/.rels", noi_dung: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { ten: "word/_rels/document.xml.rels", noi_dung: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { ten: "word/document.xml", noi_dung: doc },
    { ten: "word/styles.xml", noi_dung: styles },
  ]);
}
window.tDe = tDe; window.baoChamLai = baoChamLai; window.taoDocx = taoDocx; window.veAnhLanCham = veAnhLanCham;
