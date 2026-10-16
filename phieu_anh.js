/* Ve phieu anh PNG (canvas) gui phu huynh qua Zalo — phong cach phieu tuan cua phan mem webcam:
 * bang vang tren (may tim, cham trang), logo net den tren nen vang, chu giua, the ten vien vang, o mau pastel,
 * muc bo goc co bieu tuong, chan trang vang. KHONG co thanh MS.NINH TV. Chi tai cung trang "Cham soc". */
(function () {
  const W = 1080, NAU = "rgb(110,38,24)", NAU_NHAT = "rgb(150,80,50)", CHU = "rgb(55,45,40)", VANG = "rgb(247,215,110)";
  const MAU = ["rgb(255,236,179)", "rgb(220,237,255)", "rgb(226,247,233)", "rgb(255,228,236)", "rgb(237,231,255)", "rgb(255,240,220)"];
  const F = (co, dam) => `${dam === false ? 400 : 700} ${co}px "Be Vietnam Pro", Arial, sans-serif`;
  let logoDen = null;
  const tai = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  async function chuanBi() {
    try { await Promise.all([document.fonts.load(F(40)), document.fonts.load(F(40, false))]); } catch (e) { /* dung font du phong */ }
    if (!logoDen) {
      const lg = await tai("logo-nen-trang.png");
      if (lg) {   // logo net den tren nen vang: diem toi -> den, con lai trong suot (giong webcam)
        const c = document.createElement("canvas"); c.width = c.height = 170;
        const x = c.getContext("2d"); x.drawImage(lg, 0, 0, 170, 170);
        const d = x.getImageData(0, 0, 170, 170);
        for (let i = 0; i < d.data.length; i += 4) {
          const sang = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
          const den = d.data[i + 3] > 0 && sang < 140;
          d.data[i] = d.data[i + 1] = d.data[i + 2] = 20; d.data[i + 3] = den ? 255 : 0;
        }
        x.putImageData(d, 0, 0); logoDen = c;
      }
    }
  }
  function rr(x, X, y, w, h, r, fill, vien, day) {
    x.beginPath(); x.roundRect(X, y, w, h, r);
    if (fill) { x.fillStyle = fill; x.fill(); }
    if (vien) { x.lineWidth = day || 4; x.strokeStyle = vien; x.stroke(); }
  }
  function xuongDong(x, chu, font, rong) {
    x.font = font; const ra = [];
    for (const doan of String(chu || "").split("\n")) {
      let dong = "";
      for (const tu of doan.split(/\s+/)) {
        const thu = dong ? dong + " " + tu : tu;
        if (x.measureText(thu).width > rong && dong) { ra.push(dong); dong = tu; } else dong = thu;
      }
      ra.push(dong);
    }
    return ra;
  }
  function khung(tieuDe) {
    const c = document.createElement("canvas"); c.width = W; c.height = 6000;
    const x = c.getContext("2d");
    x.fillStyle = "rgb(255,248,230)"; x.fillRect(0, 0, W, 6000);
    x.fillStyle = "rgb(240,232,250)";
    for (let j = 0, y = 330; y < 6000; j++, y += 110) for (let X = j % 2 ? 0 : 55; X < W + 55; X += 110) { x.beginPath(); x.arc(X, y, 10, 0, 7); x.fill(); }
    // bang vang + may tim + cham trang
    x.fillStyle = VANG; x.fillRect(0, 0, W, 300);
    x.fillStyle = "rgb(178,180,226)";
    for (let i = 0, X = -40; X < W + 120; i++, X += 150) { const h = 190 + (i % 2) * 20; x.beginPath(); x.ellipse(X + 95, -90 + h / 2, 95, h / 2, 0, 0, 7); x.fill(); }
    x.fillStyle = "white";
    for (const [X, y, r] of [[60, 18, 10], [210, 40, 16], [380, 15, 9], [520, 50, 14], [700, 22, 18], [860, 45, 10], [1010, 20, 12]]) { x.beginPath(); x.arc(X, y, r, 0, 7); x.fill(); }
    if (logoDen) x.drawImage(logoDen, 50, 112);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = F(44); x.fillStyle = NAU_NHAT; x.fillText("ANH NGỮ MS.NINH", W / 2, 165);
    let co = 66; x.font = F(co); while (x.measureText(tieuDe).width > W - 500 && co > 44) { co -= 2; x.font = F(co); }
    x.lineWidth = 12; x.strokeStyle = "white"; x.lineJoin = "round"; x.strokeText(tieuDe, W / 2, 232);
    x.fillStyle = NAU; x.fillText(tieuDe, W / 2, 232);
    return { c, x };
  }
  function theTen(x, y, ten, phu) {
    rr(x, 50, y, W - 100, 210, 48, "white", "rgb(255,214,102)", 8);
    let co = 70; x.font = F(co); while (x.measureText(ten).width > W - 220 && co > 40) { co -= 4; x.font = F(co); }
    x.textAlign = "center"; x.fillStyle = NAU; x.fillText(ten, W / 2, y + 75);
    x.font = F(40, false); x.fillStyle = NAU_NHAT; x.fillText(phu, W / 2, y + 155);
    return y + 250;
  }
  function hangO(x, y, o, cao) {
    cao = cao || 190; const rong = (W - 100 - 20 * (o.length - 1)) / o.length;
    o.forEach(([nhan, gt, mau], i) => {
      const X = 50 + i * (rong + 20);
      rr(x, X, y, rong, cao, 34, mau);
      x.textAlign = "center"; x.font = F(o.length > 3 ? 30 : 34, false); x.fillStyle = NAU_NHAT; x.fillText(nhan, X + rong / 2, y + 46);
      const so = String(gt); x.font = F(so.length <= 5 ? 60 : so.length <= 9 ? 46 : 38); x.fillStyle = NAU; x.fillText(so, X + rong / 2, y + cao / 2 + 32);
    });
    return y + cao + 20;
  }
  function muc(x, y, bieuTuong, tieuDe, dong, mau) {
    const cac = [];
    dong.forEach((s) => { const nho = Array.isArray(s); (xuongDong(x, nho ? s[0] : s, F(nho ? 32 : 38, false), W - (nho ? 300 : 260)) || [""]).forEach((c) => cac.push([c, nho])); });
    const cao = 112 + cac.reduce((n, [, nho]) => n + (nho ? 44 : 52), 0) + 20;
    rr(x, 50, y, W - 100, cao, 40, mau);
    x.fillStyle = "white"; x.beginPath(); x.arc(115, y + 58, 40, 0, 7); x.fill();
    x.textAlign = "center"; x.font = `50px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; x.fillStyle = CHU; x.fillText(bieuTuong, 115, y + 60);
    x.textAlign = "left"; x.font = F(44); x.fillStyle = NAU; x.fillText(tieuDe, 180, y + 58);
    let yy = y + 112;
    cac.forEach(([c, nho]) => { x.font = F(nho ? 32 : 38, false); x.fillStyle = nho ? "rgb(105,90,80)" : CHU; x.fillText(c, nho ? 150 : 110, yy); yy += nho ? 44 : 52; });
    return y + cao + 24;
  }
  function anhGiua(x, y, img, kich, ghiChu) {
    rr(x, (W - kich - 40) / 2, y, kich + 40, kich + (ghiChu ? 90 : 40), 32, "white", "rgb(255,214,102)", 6);
    x.drawImage(img, (W - kich) / 2, y + 20, kich, kich);
    if (ghiChu) { x.textAlign = "center"; x.font = F(32, false); x.fillStyle = NAU_NHAT; x.fillText(ghiChu, W / 2, y + kich + 60); }
    return y + kich + (ghiChu ? 90 : 40) + 24;
  }
  function chanTrang(c, y) {
    const cao = y + 10 + 120, ra = document.createElement("canvas"); ra.width = W; ra.height = cao;
    const x = ra.getContext("2d"); x.drawImage(c, 0, 0);
    x.fillStyle = VANG; x.fillRect(0, cao - 120, W, 120);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = F(40); x.fillStyle = NAU; x.fillText("ANH NGỮ MS.NINH  ·  Học tốt, điểm tốt", W / 2, cao - 78);
    x.font = F(32, false); x.fillStyle = NAU_NHAT; x.fillText("msninh.vn  ·  0837 168 222", W / 2, cao - 34);
    return new Promise((ok) => ra.toBlob(ok, "image/png"));
  }
  const so = (v) => (v === null || v === undefined || v === "" ? "—" : fmtScore(v));
  const lopTen = (l) => (!l ? "" : /^(lớp|khối)/i.test(l) ? l : "Lớp " + l);

  // loai: hoc_phi | nhan_xet_tuan | bao_cao_thang ; r: 1 dong cua t_du_lieu_tin ; th: thang 'YYYY-MM' ; han: chuoi
  async function vePhieu(loai, r, th, han) {
    await chuanBi();
    const thang = thangVN(th);
    if (loai === "hoc_phi") {
      const { c, x } = khung("Thông báo học phí");
      const hp = r.hoc_phi || {}, nh = nganHang(hp.khoi || r.khoi) || {};
      let y = theTen(x, 330, r.ho_ten, `${lopTen(r.lop)}  ·  ${thang}`);
      y = hangO(x, y, [["Số buổi học", (hp.so_buoi ?? "—") + " buổi", MAU[1]], ["Đơn giá", hp.don_gia ? tien(hp.don_gia) : "—", MAU[2]], ["Thành tiền", hp.thanh_tien === null || hp.thanh_tien === undefined ? "—" : tien(hp.thanh_tien), MAU[0]]]);
      if (hp.da_dong) y = muc(x, y, "✅", "Đã đóng học phí", ["Trung tâm đã nhận học phí " + thang.toLowerCase() + ". Cảm ơn ba mẹ!"], MAU[2]);
      else {
        y = muc(x, y, "💳", "Thông tin chuyển khoản", [`Ngân hàng: ${nh.ten || ""}`, `Số tài khoản: ${nh.so || ""}`, `Chủ tài khoản: ${nh.chu || ""}`,
          `Nội dung: Hoc phi ${boDau(r.ho_ten)} - Thang ${Number(String(th).slice(5))}/${String(th).slice(0, 4)}`].concat(han ? [`Hạn đóng: trước ${han}`] : []), MAU[5]);
        const qr = nh.qr ? await tai(nh.qr) : null;
        if (qr) y = anhGiua(x, y, qr, 420, "Quét mã để chuyển khoản");
      }
      y = muc(x, y, "📱", "Xem chi tiết trên điện thoại", [`msninh.vn → đăng nhập bằng mã ${r.ma_hs} → mục «Học phí»`], MAU[4]);
      return chanTrang(c, y);
    }
    if (loai === "nhan_xet_tuan") {
      const n = r.nhan_xet; if (!n) return null;
      const d = n.noi_dung || {}, tk = d.thong_ke || {}, di = d.diem || {};
      const { c, x } = khung("Nhận xét tuần");
      const td = String(n.tuan_den || "");
      let y = theTen(x, 330, r.ho_ten, `${lopTen(r.lop)}  ·  Tuần ${nxNgay(n.tuan_tu)} – ${nxNgay(n.tuan_den)}/${td.slice(0, 4)}`);
      y = hangO(x, y, [["Thái độ học tập", di.thai_do !== undefined ? so(di.thai_do) + "/10" : d.thai_do === "can_co_gang" ? "Cần cố gắng" : "Tốt", MAU[0]],
        ["Chuyên cần trên lớp", di.chuyen_can !== undefined ? so(di.chuyen_can) + "/10" : "—", MAU[1]], ["Bài tập online", di.bt_online !== undefined ? so(di.bt_online) + "/10" : "—", MAU[2]]]);
      const o2 = [];
      if (tk.tong_buoi !== undefined) o2.push(["Đi học", `${tk.co_mat ?? 0}/${tk.tong_buoi} buổi`, MAU[3]]);
      o2.push(["Bài làm trên lớp", `${tk.tren_lop || 0} bài`, MAU[4]]);
      if (tk.online_giao) { o2.push(["Bài online đã làm", `${tk.online_giao - (tk.chua_lam || 0)}/${tk.online_giao}`, MAU[2]]); o2.push(["Chưa làm", `${tk.chua_lam || 0} bài`, tk.chua_lam ? "rgb(255,220,214)" : "rgb(240,240,240)"]); }
      y = hangO(x, y, o2, 160);
      const kt = [];
      (d.ket_qua || []).forEach((k) => { kt.push(`• ${k.chuyen_de ? "[" + k.chuyen_de + "] " : ""}${k.ten || "Bài"}: ${so(k.diem)} điểm${k.tong ? ` (${k.dung ?? "?"}/${k.tong})` : ""}`);
        if ((k.phan || []).length) kt.push(["   " + k.phan.map((p) => `${p.ten} ${p.dung}/${p.tong}`).join("  ·  ")]); });
      y = muc(x, y, "🏆", "Kết quả kiểm tra trong tuần", kt.length ? kt : ["• Tuần này con chưa có bài kiểm tra."], MAU[1]);
      if ((d.gop_y_thai_do || []).length) y = muc(x, y, "🌱", "Cô góp ý về thái độ học tập", d.gop_y_thai_do.map((s) => "• " + s), MAU[0]);
      if ((d.kien_thuc || []).length) y = muc(x, y, "📚", "Kiến thức tuần này", d.kien_thuc.map((s) => "• " + s), MAU[2]);
      if ((d.bai_tap || []).length) y = muc(x, y, "✏️", "Bài tập đã giao", d.bai_tap.map((s) => "• " + s), MAU[4]);
      if (d.nhan_xet) y = muc(x, y, "💌", "Cô nhắc nhở", [d.nhan_xet], MAU[5]);
      return chanTrang(c, y);
    }
    if (loai === "bao_cao_thang") {
      const b = r.bao_cao || {}; const dd = b.diem_danh || {}, hp = b.hoc_phi;
      const { c, x } = khung("Báo cáo " + thang.toLowerCase());
      let y = theTen(x, 330, r.ho_ten, `${lopTen(r.lop)}  ·  ${thang}`);
      y = hangO(x, y, [["Điểm TB các bài", so(b.diem_tb), MAU[0]], ["Có mặt", `${dd.co_mat || 0} buổi`, MAU[2]], ["Vắng", `${dd.vang || 0} buổi`, MAU[3]]]
        .concat(hp ? [["Học phí", hp.da_dong ? "Đã đóng" : tien(hp.thanh_tien), MAU[1]]] : []));
      const NG = { omr: "Phiếu chấm", tu_vung: "Từ vựng", online: "Bài online", mieng: "Kiểm tra nói" };
      const diem = Object.entries(b.diem || {});
      y = muc(x, y, "🏆", "Điểm theo loại bài", diem.length ? diem.map(([k, v]) => `• ${NG[k] || k}: ${k === "mieng" ? so(v.tb) + " sao" : so(v.tb) + " điểm"} (${v.so_bai} bài)`) : ["• Tháng này con chưa có bài làm."], MAU[1]);
      const nx = (b.nhan_xet_tuan || []).filter((n) => n.cong_khai !== false);
      if (nx.length) y = muc(x, y, "💌", "Nhận xét các tuần", nx.flatMap((n) => [`• Tuần ${nxNgay(n.tuan_tu)}: ${n.noi_dung && n.noi_dung.thai_do === "can_co_gang" ? "cần cố gắng" : "thái độ tốt"}`].concat(n.noi_dung && n.noi_dung.nhan_xet ? [["   " + n.noi_dung.nhan_xet]] : [])), MAU[5]);
      y = muc(x, y, "📱", "Xem đầy đủ trên điện thoại", [`msninh.vn → đăng nhập bằng mã ${r.ma_hs} → mục «Nhận xét»`], MAU[4]);
      return chanTrang(c, y);
    }
    return null;
  }
  window.phieuAnh = { vePhieu };
})();
