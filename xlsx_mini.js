/* Doc / ghi file Excel .xlsx toi gian, KHONG dung thu vien ngoai (giu CSP chi 'self').
 * Ghi: zip kieu STORE (khong nen) + chuoi inline -> Excel / Google Sheets / LibreOffice mo duoc.
 * Doc: giai nen bang DecompressionStream('deflate-raw') co san trong trinh duyet, chi lay sheet dau tien.
 * Chi tai khi GV bam Nhap / Xuat Excel. */
(function () {
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  const enc = new TextEncoder();
  function xmlEsc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ""); }
  function cot(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

  function zipStore(files) {   // files: [{ten, du_lieu: Uint8Array}]
    const phan = [], tt = []; let off = 0;
    for (const f of files) {
      const ten = enc.encode(f.ten), d = f.du_lieu, c = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, ten.length, true);
      phan.push(new Uint8Array(h.buffer), ten, d);
      const g = new DataView(new ArrayBuffer(46));
      g.setUint32(0, 0x02014b50, true); g.setUint16(4, 20, true); g.setUint16(6, 20, true); g.setUint16(8, 0x0800, true);
      g.setUint32(16, c, true); g.setUint32(20, d.length, true); g.setUint32(24, d.length, true); g.setUint16(28, ten.length, true); g.setUint32(42, off, true);
      tt.push(new Uint8Array(g.buffer), ten);
      off += 30 + ten.length + d.length;
    }
    const cd = tt.reduce((n, x) => n + x.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cd, true); e.setUint32(16, off, true);
    return new Blob([...phan, ...tt, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  // rows: mang cac mang (dong dau = tieu de). Tat ca o la chuoi (giu so 0 dau ma HS, SDT).
  function taoXlsx(rows, tenSheet) {
    const dong = rows.map((r, i) => `<row r="${i + 1}">${r.map((v, j) => (v === null || v === undefined || v === "") ? "" :
      `<c r="${cot(j)}${i + 1}" t="inlineStr"${i === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`).join("")}</row>`).join("");
    const rong = (rows[0] || []).map((_, j) => Math.min(40, Math.max(8, ...rows.map((r) => String(r[j] ?? "").length + 2))));
    const f = (ten, s) => ({ ten, du_lieu: enc.encode(s) });
    return zipStore([
      f("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'),
      f("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      f("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEsc((tenSheet || "Sheet1").slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
      f("xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
      f("xl/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'),
      f("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${rong.map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${dong}</sheetData></worksheet>`),
    ]);
  }

  async function giaiNen(buf, kieu, kichThuoc) {
    if (kieu === 0) return buf;
    if (kieu !== 8) throw new Error("File Excel dùng kiểu nén không hỗ trợ.");
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(ds).arrayBuffer());
  }
  async function moZip(ab) {
    const v = new DataView(ab), u = new Uint8Array(ab), dec = new TextDecoder();
    let e = -1;
    for (let i = ab.byteLength - 22; i >= Math.max(0, ab.byteLength - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error("Không phải file Excel .xlsx (hoặc file bị hỏng).");
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const tep = {};
    for (let k = 0; k < n; k++) {
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const kieu = v.getUint16(p + 10, true), nen = v.getUint32(p + 20, true), goc = v.getUint32(p + 24, true);
      const lt = v.getUint16(p + 28, true), lx = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const ten = dec.decode(u.subarray(p + 46, p + 46 + lt));
      tep[ten] = { kieu, nen, goc, off };
      p += 46 + lt + lx + lc;
    }
    return async (ten) => {
      const t = tep[ten]; if (!t) return null;
      const lt = v.getUint16(t.off + 26, true), lx = v.getUint16(t.off + 28, true);
      const bd = t.off + 30 + lt + lx;
      return dec.decode(await giaiNen(u.slice(bd, bd + t.nen), t.kieu, t.goc));
    };
  }
  function soCot(ref) { const m = /^([A-Z]+)/.exec(ref || ""); if (!m) return -1; let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }

  // Tra ve mang cac mang (chuoi) cua sheet dau tien
  async function docXlsx(file) {
    const doc = await moZip(await file.arrayBuffer());
    const P = new DOMParser();
    const xml = async (ten) => { const s = await doc(ten); return s ? P.parseFromString(s, "application/xml") : null; };
    const ss = await xml("xl/sharedStrings.xml");
    const chuoi = ss ? [...ss.getElementsByTagName("si")].map((si) => [...si.getElementsByTagName("t")].map((t) => t.textContent).join("")) : [];
    let duong = "xl/worksheets/sheet1.xml";
    const wb = await xml("xl/workbook.xml"), rel = await xml("xl/_rels/workbook.xml.rels");
    if (wb && rel) {
      const s1 = wb.getElementsByTagName("sheet")[0];
      const rid = s1 && (s1.getAttribute("r:id") || s1.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
      const r = rid && [...rel.getElementsByTagName("Relationship")].find((x) => x.getAttribute("Id") === rid);
      if (r) { const tg = r.getAttribute("Target").replace(/^\//, ""); duong = tg.startsWith("xl/") ? tg : "xl/" + tg; }
    }
    const sh = await xml(duong);
    if (!sh) throw new Error("Không đọc được trang tính đầu tiên trong file.");
    const ra = [];
    for (const row of sh.getElementsByTagName("row")) {
      const dong = [];
      let tuDo = 0;
      for (const c of row.getElementsByTagName("c")) {
        let j = soCot(c.getAttribute("r")); if (j < 0) j = tuDo;
        tuDo = j + 1;
        const t = c.getAttribute("t"), vv = c.getElementsByTagName("v")[0];
        let val = "";
        if (t === "s") val = chuoi[Number(vv && vv.textContent)] ?? "";
        else if (t === "inlineStr") val = [...c.getElementsByTagName("t")].map((x) => x.textContent).join("");
        else if (t === "b") val = vv && vv.textContent === "1" ? "TRUE" : "FALSE";
        else val = vv ? vv.textContent : "";
        dong[j] = val;
      }
      ra.push(Array.from(dong, (x) => (x === undefined ? "" : String(x))));
    }
    return ra;
  }
  window.xlsxMini = { taoXlsx, docXlsx };
})();
