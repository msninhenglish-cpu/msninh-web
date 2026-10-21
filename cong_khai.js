/* Website gioi thieu msninh.vn (trang cong khai) — Anh ngu Ms.Ninh — ban 5 (noi dung that tu fanpage, bo cuc kieu Ocean Edu, nhe)
 * MOI NOI DUNG CHU / ANH NAM O PHAN "NOI DUNG" NGAY DUOI DAY: sua o day, khong can dong vao code ben duoi.
 * BAN_NHAP = true : hien cac o "cho noi dung" de co duyet.  false: an het (ban chinh thuc).
 * Quy tac: KHONG bia so lieu, giai thuong, tieu su, chung chi, ten giao vien, ten phuong phap, cam ket cua trang khac.
 * Anh/ten hoc sinh chi dang khi co giay dong y phu huynh. Bo cuc tham khao ocean.edu.vn, anhngumshoa.com, langmaster.edu.vn
 * (chi hoc bo cuc, khong chep chu/anh). Nhe: khong thu vien, bieu tuong SVG noi tuyen, 1 font tu host.
 */
"use strict";

const BAN_NHAP = false; // ban chinh thuc (12/10/2026); doi true de xem cac o "cho noi dung"
const DANG_KY_BAT = true;       // phieu dang ky tu van — co duyet bat 11/10/2026
const KIEM_TRA_THU_BAT = true; // bai kiem tra thu cho khach (co bat 12/10/2026); de thu chon trong Kho de cua giao vien

/* ============================== NOI DUNG ============================== */
// Nguon: D:\Cac du an cua Claude\Anh website msninh.vn\NOI_DUNG_TU_FANPAGE.md (Hana tong hop tu fanpage 11/10/2026, co cho phep)
// + nhung gi co da chot truoc. KHONG them thong tin ngoai 2 nguon nay.
const LIEN_HE = {
  dia_chi: "Số nhà 433 đường Cách Mạng Tháng 8, phường Sông Công, T. Thái Nguyên",
  ghi_chu_dia_chi: "đối diện cổng phụ KĐT Hồng Vũ",
  sdt: "0837 168 222",      // hotline chinh
  sdt2: "0394 302 605",
  email: "msninhenglish@gmail.com",
  facebook: "https://www.facebook.com/msninhenglish/",
  ten_facebook: "Anh Ngữ Ms.Ninh (Tiếng Anh cô Ninh)",
  youtube: "",  // co chot 12/10/2026: chua co, chi dung Facebook + Zalo
  tiktok: "",
  gio_lam_viec: "07h00 – 21h30 hằng ngày", // co chot 11/10/2026
};

const KHAU_HIEU = "Học tốt, điểm tốt";
const GIOI_THIEU_NGAN = "Trung tâm tiếng Anh cho học sinh tiểu học và THCS tại Sông Công - Cam kết cải thiện điểm số.";
const LOI_KEU_GOI = "Đăng ký kiểm tra năng lực miễn phí"; // loi keu goi chinh (bai tuyen sinh 2026–2027)

// Anh banner (WebP <= 150 KB, 800/1600). Ca 2 anh tu bai "Tong ket Trung thu 2026".
const BANNER_ANH = [
  { anh800: "anh/banner_1_800.webp", anh1600: "anh/banner_1_1600.webp", alt: "Học sinh Ms.Ninh English vui Tổng kết Trung thu 2026 tại lớp" },
  { anh800: "anh/banner_2_800.webp", anh1600: "anh/banner_2_1600.webp", alt: "Học sinh tiểu học hào hứng giơ tay trong buổi Tổng kết Trung thu 2026" },
];

// So tren banner (co chot)
const SO_LIEU = [
  { icon: "cap", so: "2018", chu: "Bắt đầu tại Hà Nội" },
  { icon: "pin", so: "Sông Công 2023", chu: "Chính thức có mặt" },
  { icon: "laptop", so: "Triển khai hệ thống dữ liệu điện tử tại Msninh.vn", chu: "Học sinh đăng nhập làm bài kiểm tra, bài tập về nhà, điểm danh buổi học và học phí", rong: true },
];
// 4 con so that (fanpage) — khoi Thanh tich
const SO_LIEU_LON = [
  { so: "2018", chu: "Ms.Ninh English ra đời" },
  { so: "2023", chu: "Có mặt tại Sông Công" },
  { so: "100%", chu: "học sinh lớp 9 vượt mục tiêu vào 10 (2026)" },
  { so: "9,2K", chu: "người theo dõi fanpage" },
];

// Ly do chon (co chot 11/10/2026)
const LY_DO = [
  { icon: "users", tieu_de: "Chất lượng luôn bảo đảm, cô kèm sát từng em" },
  { icon: "layers", tieu_de: "Buổi học đủ kỹ năng, học sinh\nđạt chuẩn mới được ra về" },
  { icon: "trend", tieu_de: "Cam kết cải thiện điểm số, theo dõi bằng dữ liệu trực quan" },
  { icon: "tag", tieu_de: "Học phí ưu đãi từ 35.000đ/buổi (280.000đ/tháng)" },
];

// Gioi thieu (co chot 11/10/2026, chu nguyen van)
const GIOI_THIEU = {
  tieu_de: "Ms.Ninh English – Tiếng Anh kết hợp khoa học công nghệ",
  doan: [
    "Trung tâm Anh ngữ Ms.Ninh English ra đời năm 2018 tại Hà Nội và chính thức có mặt tại Sông Công từ tháng 01 năm 2023. Hơn 3 năm học qua, hàng nghìn học sinh Sông Công đã học và tiến bộ cùng Ms Ninh — kết quả đó là minh chứng rõ nhất cho hiệu quả phương pháp giảng dạy của trung tâm.",
    "Hôm nay, Ms.Ninh English đang nghiên cứu và phát triển để trở thành hệ thống giáo dục tiếng Anh kết hợp khoa học công nghệ hàng đầu tại Thái Nguyên: mỗi em có hồ sơ học tập riêng, bài tập và điểm số được theo dõi liên tục, phụ huynh nắm được tình hình học của con mọi lúc.",
  ],
};

// Co so hoc tap (fanpage)
const CO_SO = {
  anh: { nho: "anh/co_so_mat_tien_2026b_400.webp", lon: "anh/co_so_mat_tien_2026b_600.webp", alt: "Mặt tiền Anh ngữ Ms.Ninh, số 433 Cách Mạng Tháng 8, biển hiệu Anh ngữ Ms.Ninh – Học tốt, điểm tốt" },
  y: ["Môi trường học tập thân thiện", "Trang thiết bị học tập đầy đủ, hiện đại"],
};

// Hoc cung cong nghe (co chot). sap_co = true -> nhan "Sắp có"
const CONG_NGHE = [
  { icon: "laptop", tieu_de: "Bài tập về nhà online", chu: "Cô giao bài, em làm trên điện thoại, có kết quả ngay.", sap_co: false },
  { icon: "zap", tieu_de: "Chấm điểm tự động", chu: "Phiếu trả lời được chấm bằng phần mềm, nhanh và chính xác.", sap_co: false },
  { icon: "msg", tieu_de: "Nhận xét theo tuần", chu: "Gửi riêng từng phụ huynh, xem lại trên điện thoại.", sap_co: false },
  { icon: "db", tieu_de: "Dữ liệu học tập riêng", chu: "Hồ sơ điểm, tiến bộ, điểm danh, học phí của từng em ở một nơi.", sap_co: false },
];

const CAU_CHUYEN = [
  { nam: "2018", tieu_de: "Những học sinh đầu tiên", chu: "Ms Ninh bắt đầu dạy những học sinh đầu tiên tại Hà Nội." },
  { nam: "2023", tieu_de: "Có mặt tại Sông Công", chu: "Trung tâm chính thức có mặt tại số 475 CMT8, TP. Sông Công, T. Thái Nguyên." },
  { nam: "2025", tieu_de: "Cơ sở 433 Cách Mạng Tháng 8", chu: "Từ 07/04/2025, lớp học chuyển về số nhà 433 đường Cách Mạng Tháng 8, phường Sông Công, T. Thái Nguyên." },
  { nam: "2026", tieu_de: "Cổng học sinh online", chu: "Triển khai cổng điện tử tại Msninh.vn. Học sinh làm bài tập online; ba mẹ theo dõi điểm số, tiến độ học tập, điểm danh và học phí ngay trên điện thoại." },
];

const CAM_KET = ["Luôn dẫn đầu về chất lượng chuyên môn!"];

// Phuong phap giang day (co chot)
const PHUONG_PHAP = [
  { ten: "Một buổi học trọn vẹn — học thật, đạt mới về",
    mo_ta: "Mỗi buổi học, học sinh được rèn cả 04 kỹ năng nghe, nói, đọc, viết; được làm bài tập kiểm tra hằng ngày, giao bài kiểm tra online và chỉ kết thúc buổi học khi đạt yêu cầu.",
    buoc: ["Nghe – Nói – Đọc – Viết", "Làm bài kiểm tra tại lớp", "Kiểm tra miệng tại lớp", "Giao bài tập về nhà online", "Đạt yêu cầu mới kết thúc buổi học"] },
];

// Doi ngu (co chot 11/10/2026: chi ghi "Co Ninh", khong ghi bang cap/kinh nghiem). Trung tam chi day Tieng Anh.
const GIAO_VIEN = [
  { ten: "Ms Ninh", vai_tro: "Quản lý chất lượng, trực tiếp giảng dạy", anh: "anh/co_ninh_tot_nghiep_300.webp", anh_2x: "anh/co_ninh_tot_nghiep_600.webp", gioi_thieu: "", bat: true },
];

// Chuong trinh hoc (bai tuyen sinh 2026–2027 + co chot gia)
const TIEU_CHI = [
  "Nội dung bám sát chương trình học – luyện thi chuẩn của Bộ GD&ĐT",
  "Kiểm tra định kỳ hằng ngày, hằng tuần",
  "Chương trình bồi dưỡng riêng cho học sinh mới, học sinh mất gốc",
];
const CHUONG_TRINH = [
  { id: "tieu-hoc", nhan: "TIỂU HỌC", icon: "smile", mau: "xanh", ten: "Tiểu học", khoi: "Lớp 2 – Lớp 5", gia: "35.000đ", ghi_chu_gia: "≈ 280.000đ/tháng/môn",
    anh: { nho: "anh/lop_tieu_hoc_2026_480.webp", lon: "anh/lop_tieu_hoc_2026_800.webp", alt: "Học sinh tiểu học trong lớp học tại Anh ngữ Ms.Ninh" },
    y: ["Học Phonics", "Nâng cao từ vựng và khả năng giao tiếp", "Bám sát chương trình Bộ GD&ĐT", "Kiểm tra định kỳ hằng ngày, hằng tuần"] },
  { id: "thcs", nhan: "THCS", icon: "book", mau: "tim", ten: "Trung học cơ sở", khoi: "Lớp 6 – Lớp 9", gia: "40.000đ", ghi_chu_gia: "",
    anh: { nho: "anh/the_thcs_480.webp", lon: "anh/the_thcs_800.webp", alt: "Học sinh THCS nhận khen thưởng trước bảng lớp" },
    y: ["Chương trình nâng cao từ vựng và ngữ pháp", "Bám sát chương trình – luyện thi chuẩn Bộ GD&ĐT", "Kiểm tra định kỳ hằng ngày, hằng tuần", "Bồi dưỡng riêng học sinh mới, mất gốc"] },
  { id: "on-thi-10", nhan: "ÔN THI VÀO 10", icon: "target", mau: "cam", ten: "Ôn thi vào lớp 10 THPT", khoi: "Học sinh lớp 9", gia: "40.000đ", ghi_chu_gia: "",
    anh: { nho: "anh/tt_diem9_vao10_2025_480.webp", lon: "anh/tt_diem9_vao10_2025_800.webp", alt: "Ms Ninh và hai học sinh đạt điểm 9 Tiếng Anh thi vào 10 năm 2025" },
    y: ["Luyện thi vào lớp 10 chất lượng cao cho học sinh khá, giỏi", "Luyện đề tiếng Anh sát kỳ thi", "2026: 100% học sinh lớp 9 vượt mục tiêu ban đầu"] },
];
// Lo trinh theo chang: CHO CO. Moi chang: { ten: "...", mo_ta: "..." }
const LO_TRINH = { "tieu-hoc": [], thcs: [], "on-thi-10": [] };

// Danh gia that tren fanpage (2 danh gia "de xuat"). Khong ghi ten tai khoan.
const DANH_GIA = [
  { trich: "Cô không dạy lan man, dạy rất dễ hiểu, yếu ở đâu cô dạy ở đó.", them: "Học 2 năm, từ mất gốc đến đạt điểm số mơ ước." },
  { trich: "Cô dễ tính, đáng yêu, dạy dễ hiểu, luôn động viên học sinh, thân thiện, giảng dạy chuyên sâu. Giá cả hợp lý…", them: "" },
];

// Tin tuc & hoat dong (fanpage). anh: [{nho, lon, alt}] — anh dau la anh dai dien
const HOAT_DONG = [
  { tieu_de: "Tổng kết Trung thu 2026", ngay: "2026-09-26",
    mo_ta: "Trung thu hằng năm là truyền thống của lớp. «Một đứa trẻ hạnh phúc sẽ học tốt hơn bất kỳ phương pháp nào.»",
    anh: [
      { nho: "anh/banner_1_800.webp", lon: "", alt: "Học sinh vui Tổng kết Trung thu 2026" },
      { nho: "anh/hd_lop_tieu_hoc_480.webp", lon: "anh/hd_lop_tieu_hoc_800.webp", alt: "Các bạn tiểu học trong buổi Tổng kết Trung thu 2026" },
      { nho: "anh/the_tieu_hoc_480.webp", lon: "anh/the_tieu_hoc_800.webp", alt: "Học sinh tiểu học giơ tay vui Trung thu 2026" },
      { nho: "anh/banner_2_800.webp", lon: "", alt: "Lớp tiểu học vui Trung thu 2026" },
      { nho: "anh/hd_gio_hoc_480.webp", lon: "", alt: "Các bạn nhỏ vui Trung thu 2026" },
    ] },
  { tieu_de: "Mưa điểm tốt – Bão quà tặng", ngay: "",
    mo_ta: "Học sinh tích sticker chăm ngoan, đạt điểm tốt được đổi quà, mở hộp quà bí mật, vòng quay may mắn. Quà nhỏ – động lực lớn.",
    anh: [
      { nho: "anh/hd_vong_quay_480.webp", lon: "anh/hd_vong_quay_800.webp", alt: "Học sinh quay vòng quay may mắn đổi quà" },
      { nho: "anh/hd_mua_diem_tot_480.webp", lon: "anh/hd_mua_diem_tot_800.webp", alt: "Niềm vui khi đạt điểm tốt – quà nhỏ, động lực lớn" },
    ] },
  { tieu_de: "Khai giảng lớp hè 2025", ngay: "2025-06-08", mo_ta: "Khai giảng lớp hè cho học sinh cấp 1 và cấp 2.", anh: [] },
];

// Thanh tich (fanpage, cong khai). Anh dau = anh dai dien.
const THANH_TICH_KHOI = [
  { tieu_de: "Thi vào 10 năm 2026: 100% học sinh vượt mục tiêu",
    mo_ta: "100% học sinh lớp 9 vượt mục tiêu đặt ra ban đầu; nhiều em từng hổng kiến thức, mất gốc đạt 7, 8 điểm. Khối 9 nhận thưởng thành tích cao kỳ tuyển sinh vào 10 năm học 2026–2027.",
    anh: [{ nho: "anh/khen_thuong_thcs_800.webp", lon: "anh/khen_thuong_thcs_1600.webp", alt: "Học sinh khối 9 nhận thưởng thành tích cao kỳ tuyển sinh vào 10 năm học 2026–2027" }] },
  { tieu_de: "Thi vào 10 năm 2025: 2 em điểm 9, nhiều em điểm 8",
    mo_ta: "Hai học sinh đạt điểm 9 Tiếng Anh thi vào 10 năm 2025; nhiều em khác đạt điểm 8.",
    anh: [{ nho: "anh/tt_diem9_vao10_2025_480.webp", lon: "anh/tt_diem9_vao10_2025_800.webp", alt: "Hai học sinh đạt điểm 9 Tiếng Anh thi vào 10 năm 2025 cùng Ms Ninh" },
          { nho: "anh/tt_diem8_vao10_2025_480.webp", lon: "anh/tt_diem8_vao10_2025_800.webp", alt: "Học sinh đạt điểm 8 Tiếng Anh thi vào 10 năm 2025" }] },
  { tieu_de: "Điểm thi học kỳ II – Khối 6, năm học 2025–2026",
    mo_ta: "Khen thưởng học sinh đạt điểm tốt các khối 6, 7, 8, 9 năm học 2025–2026.",
    anh: [{ nho: "anh/bang_diem_hk2_khoi6_800.webp", lon: "anh/bang_diem_hk2_khoi6_1200.webp", alt: "Bảng điểm thi học kỳ II khối 6 năm học 2025–2026" }] },
  { tieu_de: "Vinh danh học sinh học kỳ II năm học 2024–2025",
    mo_ta: "Vinh danh học sinh đạt kết quả tốt học kỳ II năm học 2024–2025.",
    anh: [{ nho: "anh/tt_vinh_danh_hk2_2024_400.webp", lon: "anh/tt_vinh_danh_hk2_2024_600.webp", alt: "Anh ngữ Ms.Ninh vinh danh học sinh đạt kết quả tốt học kỳ II năm học 2024–2025" }] },
];
// Guong mat tung em (ten + anh rieng): chi em co_dong_y. Hien chua dung (co thanh tich dang khoi o tren).
const THANH_TICH = [];

/* ============================== BIEU TUONG SVG (1 bo, net tron) ============================== */
const IC = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  phone: '<path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/><path d="M9 9.5l2 2 4-4"/>',
  chart: '<path d="M4 20h16"/><rect x="5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="7" width="3" height="10" rx="1"/><rect x="16" y="4" width="3" height="13" rx="1"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8.5 15l2 2 4-4"/>',
  pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.4-3.5 2.8-6 6-6s5.6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.4.2 4.2 2.6 4.5 5.5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.6"/>',
  zap: '<path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z"/>',
  msg: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M12 13s-3-1.7-3-3.4a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8C15 11.3 12 13 12 13z"/>',
  db: '<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.2 4.2 0 0 0 7 0"/><circle cx="9" cy="9.8" r=".6"/><circle cx="15" cy="9.8" r=".6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4 3.8-7 8-7s7.4 3 8 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  chat: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 10.5h8"/>',
  yt: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
  tt: '<path d="M14 3v11a4 4 0 1 1-4-4"/><path d="M14 3c.5 2.5 2.5 4.5 5 5"/>',
  news: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 8.5h10M7 12.5h10M7 16.5h6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="2"/><path d="M2.5 9h19v3.5h-19zM12 9v11"/><path d="M12 9C9 9 7 7.5 8 6s3 0 4 3c1-3 3-4.5 4-3s-1 3-4 3"/>',
};
function ic(name, cls) {
  return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || ""}</svg>`;
}

/* ============================== GIAO DIEN ============================== */
const PUB_MENU = [
  ["trang-chu", "Trang chủ"], ["gioi-thieu", "Giới thiệu"], ["chuong-trinh", "Chương trình học"],
  ["hoat-dong", "Tin tức"], ["thanh-tich", "Thành tích"], ["lien-he", "Liên hệ"],
];
function cho(noi_dung) { return BAN_NHAP ? `<div class="cho">🕓 <b>Chờ nội dung:</b> ${noi_dung}</div>` : ""; }
function soDT(s) { return String(s || LIEN_HE.sdt).replace(/\s/g, ""); }
function ngayVNs(s) { return s ? String(s).slice(0, 10).split("-").reverse().join("/") : ""; }
function secT(t, sub) { return `<div class="sec-t"><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div>`; }
const CTA_TU_VAN = `<a class="btn btn-lg pub-btn-yellow" href="#/dang-ky-tu-van">${ic("pen")} ${LOI_KEU_GOI}</a>`;
const SIZES_THE = "(min-width: 960px) 360px, (min-width: 600px) 50vw, 100vw";

function pubShell(active, title, inner) {
  document.title = (title ? title + " · " : "") + "Anh ngữ Ms.Ninh – " + KHAU_HIEU;
  const vao = S.token && S.user ? (S.user.role === "teacher" ? "#/t" : "#/") : "#/login";
  const so = soDT();
  app.innerHTML = `<div class="pub">
    <header class="pub-top"><div class="pub-in pub-top-in">
      <a class="pub-brand" href="#/trang-chu"><img src="logo-nho.webp" width="112" height="87" alt=""><span class="pub-brand-t"><b>ANH NGỮ MS.NINH</b><small>HỌC TỐT, ĐIỂM TỐT</small></span></a>
      <div class="pub-top-hot"><a href="tel:${so}">${ic("phone")}<b>${esc(LIEN_HE.sdt)}</b></a><small>${LIEN_HE.sdt2 ? esc(LIEN_HE.sdt2) + " · " : ""}${esc(LIEN_HE.email)}</small></div>
      <a class="pub-m-call" href="tel:${so}" aria-label="Gọi cô">${ic("phone")}</a>
      <button class="pub-burger" data-act="menu" aria-label="Mở menu" aria-expanded="false">${ic("menu")}</button>
    </div></header>
    <nav class="pub-bar"><div class="pub-in pub-bar-in" id="pubLinks">
      ${PUB_MENU.map(([k, t]) => `<a href="#/${k}" class="${k === active ? "on" : ""}">${k === "trang-chu" ? ic("home") : ""}${t}</a>`).join("")}
      <a class="pub-bar-login" href="${vao}">${ic("user")}${S.token ? "Vào cổng học sinh" : "Đăng nhập"}</a>
    </div></nav>
    <main class="pub-main">${inner}</main>
    <footer class="pub-foot"><div class="pub-in pub-foot-grid">
      <div><div class="pub-foot-name">ANH NGỮ MS.NINH</div><p>${esc(GIOI_THIEU_NGAN)}</p>${mangXaHoi(true)}</div>
      <div><b class="pub-foot-h">Liên hệ</b>${lienHeHtml(false)}</div>
      <div class="pub-foot-menu"><b class="pub-foot-h">Danh mục</b>${PUB_MENU.map(([k, t]) => `<a href="#/${k}">${t}</a>`).join("")}
        <a href="#/dang-ky-tu-van">${LOI_KEU_GOI}</a><a href="#/login">Đăng nhập học sinh</a></div>
    </div><p class="pub-copy">© 2018–${new Date().getFullYear()} Anh ngữ Ms.Ninh · msninh.vn</p></footer>
    <a class="pub-float" href="#/dang-ky-tu-van">ĐĂNG KÝ HỌC</a>
    <div class="pub-mbar"><a href="tel:${so}">${ic("phone")}Gọi</a><a href="https://zalo.me/${so}" target="_blank" rel="noopener">${ic("chat")}Zalo</a><a class="dk" href="#/dang-ky-tu-van">${ic("pen")}Đăng ký</a></div>
  </div>`;
  ACT.menu = (b) => {
    const l = document.getElementById("pubLinks");
    const mo = l.classList.toggle("open");
    b.setAttribute("aria-expanded", mo); b.innerHTML = ic(mo ? "close" : "menu");
  };
  ACT.dangKy = guiDangKy;
  ACT.slide = (el) => { const t = document.getElementById("bnTrack"); if (t) t.scrollTo({ left: t.clientWidth * Number(el.dataset.i), behavior: "smooth" }); };
  const tr = document.getElementById("bnTrack"); // chi trang chu co banner
  if (tr && BANNER_ANH.length > 1) {
    let i = 0, dung = false;
    tr.addEventListener("pointerdown", () => { dung = true; }, { once: true });
    const t = setInterval(() => { if (!tr.isConnected) return clearInterval(t); if (dung) return; i = (i + 1) % BANNER_ANH.length; tr.scrollTo({ left: tr.clientWidth * i, behavior: "smooth" }); }, 5000);
    cleanup = () => clearInterval(t);
  }
}

function lienHeHtml(day_du) {
  const map = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(LIEN_HE.dia_chi);
  const tel = (s) => `<a href="tel:${esc(soDT(s))}"><b>${esc(s)}</b></a>`;
  return [
    LIEN_HE.dia_chi && `<div class="lh">${ic("pin")}<div>${esc(LIEN_HE.dia_chi)}${LIEN_HE.ghi_chu_dia_chi ? ` <span class="nhat">(${esc(LIEN_HE.ghi_chu_dia_chi)})</span>` : ""} · <a href="${map}" target="_blank" rel="noopener">Xem bản đồ</a></div></div>`,
    LIEN_HE.sdt && `<div class="lh">${ic("phone")}<div>Hotline / Zalo: ${tel(LIEN_HE.sdt)}${LIEN_HE.sdt2 ? " – " + tel(LIEN_HE.sdt2) : ""}</div></div>`,
    LIEN_HE.email && `<div class="lh">${ic("mail")}<div><a href="mailto:${esc(LIEN_HE.email)}">${esc(LIEN_HE.email)}</a></div></div>`,
    day_du && LIEN_HE.facebook && `<div class="lh">${ic("fb")}<div><a href="${esc(LIEN_HE.facebook)}" target="_blank" rel="noopener">${esc(LIEN_HE.ten_facebook || "Fanpage")}</a></div></div>`,
    LIEN_HE.gio_lam_viec && `<div class="lh">${ic("clock")}<div>Giờ làm việc: ${esc(LIEN_HE.gio_lam_viec)}</div></div>`,
  ].filter(Boolean).join("");
}

function mangXaHoi(nho) {
  const so = soDT();
  const ds = [
    LIEN_HE.facebook && { ic: "fb", ten: "Fanpage", url: LIEN_HE.facebook, cls: "fb" },
    LIEN_HE.sdt && { ic: "chat", ten: "Zalo", url: "https://zalo.me/" + so, cls: "zl" },
    LIEN_HE.youtube && { ic: "yt", ten: "YouTube", url: LIEN_HE.youtube, cls: "yt" },
    LIEN_HE.tiktok && { ic: "tt", ten: "TikTok", url: LIEN_HE.tiktok, cls: "tt" },
  ].filter(Boolean);
  if (nho) return `<div class="pub-social">${ds.map((d) => `<a class="${d.cls}" href="${esc(d.url)}" target="_blank" rel="noopener" aria-label="${d.ten}">${ic(d.ic)}</a>`).join("")}</div>`;
  return `<div class="pub-connect">${ds.map((d) => `<a class="pub-conn ${d.cls}" href="${esc(d.url)}" target="_blank" rel="noopener"><span>${ic(d.ic)}</span><b>${d.ten}</b></a>`).join("")}</div>`;
}

/* ---- form dang ky (kiem tra nang luc mien phi / tu van) ---- */
function formTuVan(gon) {
  const n = gon ? 1 : 2;
  return `<form class="card pub-form" data-submit="dangKy" novalidate>
    <h3>${LOI_KEU_GOI}</h3>
    <p class="small muted">Cô gọi lại hẹn lịch kiểm tra năng lực và tư vấn lộ trình phù hợp cho con.</p>
    <div id="dkMsg"></div>
    <div class="field"><label class="f" for="dkTen${n}">Họ tên phụ huynh</label><input class="input" id="dkTen${n}" name="ten" maxlength="80" autocomplete="name" required></div>
    <div class="field"><label class="f" for="dkSdt${n}">Số điện thoại / Zalo</label><input class="input" id="dkSdt${n}" name="sdt" type="tel" inputmode="tel" maxlength="15" autocomplete="tel" required placeholder="vd 09xx xxx xxx"></div>
    <div class="field"><label class="f" for="dkKhoi${n}">Con đang học lớp</label><select class="input" id="dkKhoi${n}" name="khoi" required><option value="">— Chọn lớp —</option>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<option>Lớp ${k}</option>`).join("")}<option>Khác</option></select></div>
    ${gon ? "" : '<div class="field"><label class="f" for="dkNhan">Lời nhắn (không bắt buộc)</label><textarea class="input" id="dkNhan" name="loi_nhan" maxlength="500" rows="3" placeholder="vd: con mất gốc ngữ pháp, muốn học buổi tối…"></textarea></div>'}
    <input type="text" name="web" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
    <label class="check small"><input type="checkbox" name="dongy"> Tôi đồng ý để trung tâm dùng số điện thoại này chỉ để liên hệ tư vấn.</label>
    <button class="btn btn-primary btn-block btn-lg" ${DANG_KY_BAT ? "" : "disabled"}>Gửi đăng ký</button>
    ${DANG_KY_BAT ? "" : `<p class="small muted center">Phiếu online đang chuẩn bị — ba mẹ gọi <a href="tel:${soDT()}"><b>${esc(LIEN_HE.sdt)}</b></a> nhé.</p>`}
  </form>`;
}
async function guiDangKy(f) {
  const box = f.querySelector("#dkMsg"), btn = f.querySelector("button");
  const p = { ten: f.ten.value.trim(), sdt: f.sdt.value.trim(), khoi: f.khoi.value, loi_nhan: f.loi_nhan ? f.loi_nhan.value.trim() : "", dong_y: f.dongy.checked, web: f.web.value };
  const loi = !p.ten ? "Ba mẹ vui lòng nhập họ tên." : !/^(\+?84|0)\d{9}$/.test(p.sdt.replace(/[\s.\-()]/g, "")) ? "Số điện thoại chưa đúng (10 số, bắt đầu bằng 0)."
    : !p.khoi ? "Ba mẹ vui lòng chọn lớp của con." : !p.dong_y ? "Ba mẹ vui lòng tích ô đồng ý để cô liên hệ." : "";
  if (loi) { box.innerHTML = errBox(loi); return; }
  btn.disabled = true; btn.textContent = "Đang gửi…";
  try {
    await api("public_dang_ky_hoc_thu", { p }, false);
    f.innerHTML = `<div class="pub-ok">${ic("check")}<h3>Cảm ơn ba mẹ!</h3><p>Trung tâm đã nhận phiếu. Cô sẽ gọi lại hẹn lịch kiểm tra năng lực cho con sớm nhất.</p>
      <p class="small muted">Cần gấp, ba mẹ gọi <a href="tel:${soDT()}"><b>${esc(LIEN_HE.sdt)}</b></a>.</p></div>`;
  } catch (e) {
    box.innerHTML = errBox(e); btn.disabled = false; btn.textContent = "Gửi đăng ký";
  }
}

/* ---- khoi dung chung ---- */
function anhThe(a, rong, cao, sizes) {
  if (!a) return "";
  const set = a.lon ? ` srcset="${esc(a.nho)} 480w, ${esc(a.lon)} 800w" sizes="${sizes}"` : "";
  return `<img src="${esc(a.nho)}"${set} alt="${esc(a.alt || "")}" loading="lazy" decoding="async" width="${rong}" height="${cao}">`;
}
function hoatDongThe(h) {
  const a = (h.anh || [])[0];
  return `<article class="pub-news"><div class="pub-news-pic">${a ? anhThe(a, 480, 360, SIZES_THE) : `<div class="pub-news-img">${ic("camera")}</div>`}
      ${(h.anh || []).length > 1 ? `<span class="pub-more">+${h.anh.length - 1} ảnh</span>` : ""}</div>
    <div class="pub-news-body">${h.ngay ? `<span class="pub-date">${esc(ngayVNs(h.ngay))}</span>` : ""}<b>${esc(h.tieu_de)}</b>${h.mo_ta ? `<p>${esc(h.mo_ta)}</p>` : ""}</div></article>`;
}
function hoatDongLuoi(gioi_han) {
  const ds = gioi_han ? HOAT_DONG.slice(0, gioi_han) : HOAT_DONG;
  return ds.length ? `<div class="g3">${ds.map(hoatDongThe).join("")}</div>` : (BAN_NHAP ? cho("ảnh và bài viết hoạt động.") : "");
}
function chuongTrinhThe(c) {
  return `<article class="pub-prog" id="ct-${c.id}">
    <div class="pub-prog-art ${c.mau}">${c.anh ? anhThe(c.anh, 480, 288, SIZES_THE) : ic(c.icon, "big")}<span class="ribbon">${esc(c.nhan)}</span></div>
    <div class="pub-prog-body"><h3>${esc(c.ten)}</h3><div class="muted small">${esc(c.khoi)}</div>
      <ul class="ticks">${c.y.map((y) => `<li>${ic("check")}${esc(y)}</li>`).join("")}</ul>
      <div class="pub-price"><b>${esc(c.gia)}</b>/buổi${c.ghi_chu_gia ? `<small>${esc(c.ghi_chu_gia)}</small>` : ""}</div>
      <a class="btn btn-primary btn-block" href="#/dang-ky-tu-van">Kiểm tra năng lực miễn phí ${ic("arrow")}</a></div></article>`;
}
function tieuChiHtml() {
  return `<ul class="pub-criteria">${TIEU_CHI.map((t) => `<li>${ic("check")}${esc(t)}</li>`).join("")}</ul>`;
}
function phuongPhapHtml() {
  if (!PHUONG_PHAP.length) return cho("tên và nội dung phương pháp giảng dạy (cô cung cấp).");
  return PHUONG_PHAP.map((m) => `<div class="pub-method"><h3>${esc(m.ten)}</h3>${m.mo_ta ? `<p class="muted">${esc(m.mo_ta)}</p>` : ""}
    <ol class="pub-steps">${(m.buoc || []).map((b, i) => `<li><span>${i + 1}</span><b>${esc(b)}</b></li>`).join("")}</ol></div>`).join("");
}
function congNgheHtml() {
  return `<div class="g4">${CONG_NGHE.map((c) => `<div class="pub-feat"><span class="pub-ic">${ic(c.icon)}</span>
    <b>${esc(c.tieu_de)}${c.sap_co ? ' <em class="sap-co">Sắp có</em>' : ""}</b><p>${esc(c.chu)}</p></div>`).join("")}</div>`;
}
function lyDoHtml() {
  return `<div class="g4">${LY_DO.map((l) => `<div class="pub-feat center"><span class="pub-ic">${ic(l.icon)}</span><b>${esc(l.tieu_de)}</b></div>`).join("")}</div>`;
}
function giaoVienHtml() {
  const ds = GIAO_VIEN.filter((g) => g.bat);
  if (!ds.length) return BAN_NHAP ? cho("đội ngũ giáo viên do cô cung cấp.") : "";
  return `<div class="g3 pub-team">${ds.map((g) => `<div class="pub-face">${g.anh ? `<img src="${esc(g.anh)}"${g.anh_2x ? ` srcset="${esc(g.anh)} 1x, ${esc(g.anh_2x)} 2x"` : ""} alt="${esc(g.ten)}" loading="lazy" decoding="async" width="150" height="150">` : `<div class="pub-face-img">${ic("user")}</div>`}
      <b>${esc(g.ten)}</b><small>${esc(g.vai_tro || "")}</small>${g.gioi_thieu ? `<p>${esc(g.gioi_thieu)}</p>` : ""}</div>`).join("")}</div>`;
}
function soLieuLonHtml() {
  return `<div class="pub-nums">${SO_LIEU_LON.map((s) => `<div><b>${esc(s.so)}</b><span>${esc(s.chu)}</span></div>`).join("")}</div>`;
}
function thanhTichKhoi(k) {
  const [a, ...con] = k.anh || [];
  return `<article class="pub-award">${a ? `<a class="pub-award-pic" href="${esc(a.lon || a.nho)}" target="_blank" rel="noopener">${anhThe(a, 800, 500, "(min-width: 960px) 540px, 100vw")}</a>` : ""}
    <div class="pub-award-body"><h3>${ic("star")} ${esc(k.tieu_de)}</h3><p>${esc(k.mo_ta)}</p>
      ${con.length ? `<div class="pub-award-more">${con.map((x) => `<a href="${esc(x.lon || x.nho)}" target="_blank" rel="noopener">${anhThe(x, 480, 300, "240px")}</a>`).join("")}</div>` : ""}</div></article>`;
}
function thanhTichHtml(gioi_han) {
  const ds = gioi_han ? THANH_TICH_KHOI.slice(0, gioi_han) : THANH_TICH_KHOI;
  return ds.length ? `<div class="pub-awards">${ds.map(thanhTichKhoi).join("")}</div>` : (BAN_NHAP ? cho("thành tích học sinh.") : "");
}
function danhGiaHtml() {
  return `<div class="g2">${DANH_GIA.map((d) => `<figure class="pub-quote"><span class="pub-quote-mark">“</span>
    <blockquote>${esc(d.trich)}</blockquote>${d.them ? `<p class="muted small">${esc(d.them)}</p>` : ""}
    <figcaption><span class="pub-stars">${ic("star")}${ic("star")}${ic("star")}${ic("star")}${ic("star")}</span>Học sinh – đánh giá trên Facebook</figcaption></figure>`).join("")}</div>`;
}
function coSoHtml() {
  return `<div class="pub-campus">${anhThe(CO_SO.anh, 400, 225, "(min-width: 760px) 320px, 100vw")}
    <div><h3>Cơ sở Sông Công</h3>${lienHeHtml(false)}<ul class="ticks">${CO_SO.y.map((y) => `<li>${ic("check")}${esc(y)}</li>`).join("")}</ul>
    <div class="pub-cta"><a class="btn btn-gold" href="tel:${soDT()}">${ic("phone")} Gọi cô</a><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LIEN_HE.dia_chi)}" target="_blank" rel="noopener">${ic("pin")} Xem bản đồ</a></div></div></div>`;
}

/* ---------------- trang chu ---------------- */
function bannerHtml() {
  const so = SO_LIEU.filter((s) => s.so).slice(0, 3);
  const noi_dung = `<div class="pub-in bn-text">
      <h1>ANH NGỮ MS.NINH</h1>
      <div class="bn-slogan">${esc(KHAU_HIEU)}</div>
      <p>${esc(GIOI_THIEU_NGAN)}</p>
      <div class="bn-stats">${so.map((s) => `<div${s.rong ? ' class="bn-stat-rong"' : ""}>${ic(s.icon)}<b>${esc(s.so)}</b><small>${esc(s.chu)}</small></div>`).join("")}</div>
      <div class="pub-cta">${CTA_TU_VAN}<a class="btn btn-lg pub-btn-white" href="#/login">${ic("user")} Đăng nhập học sinh</a></div>
    </div>`;
  if (!BANNER_ANH.length) {
    return `<section class="bn bn-art">
      <svg class="bn-deco" viewBox="0 0 600 400" aria-hidden="true">
        <circle cx="470" cy="190" r="150" fill="#fff" opacity=".08"/><circle cx="560" cy="60" r="70" fill="#ffd34d" opacity=".25"/>
        <g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".9" transform="translate(395 120)">
          <path d="M80 30c-20-16-50-20-85-15v120c35-5 65-1 85 15 20-16 50-20 85-15V15c-35-5-65-1-85 15z" fill="#ffffff22"/><path d="M80 30v120"/></g>
        <path d="M330 90l9 18 20 3-14 14 3 20-18-9-18 9 3-20-14-14 20-3z" fill="#ffd34d"/></svg>${noi_dung}</section>`;
  }
  return `<section class="bn bn-art bn-photo"><div class="bn-split">
    <div class="bn-pics"><div class="bn-track" id="bnTrack">${BANNER_ANH.map((b, i) => `<div class="bn-slide">
      <img src="${esc(b.anh800)}" srcset="${esc(b.anh800)} 800w, ${esc(b.anh1600)} 1600w" sizes="(min-width: 900px) 58vw, 100vw" alt="${esc(b.alt || "")}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" width="1600" height="640"></div>`).join("")}</div>
      ${BANNER_ANH.length > 1 ? `<div class="bn-dots">${BANNER_ANH.map((_, i) => `<button data-act="slide" data-i="${i}" aria-label="Xem ảnh ${i + 1}"></button>`).join("")}</div>` : ""}</div>
    <div class="bn-col">${noi_dung}</div></div></section>`;
}
function pubHome() {
  pubShell("trang-chu", "", `
    ${bannerHtml()}
    <section class="pub-in pub-quick">
      <a href="#/login"><span class="pub-ic c1">${ic("laptop")}</span><b>Bài tập online</b><small>Làm bài, có điểm ngay</small></a>
      <a href="#/login"><span class="pub-ic c2">${ic("chart")}</span><b>Kết quả học tập</b><small>Điểm & biểu đồ tiến bộ</small></a>
      <a href="#/login"><span class="pub-ic c3">${ic("cal")}</span><b>Học phí & điểm danh</b><small>Xem từng buổi, mã QR</small></a>
      <a href="#/dang-ky-tu-van"><span class="pub-ic c4">${ic("target")}</span><b>Kiểm tra năng lực</b><small>Miễn phí khi đăng ký</small></a>
    </section>
    <section class="pub-in sec">${secT("Về Ms.Ninh English", esc(GIOI_THIEU.tieu_de))}
      <p class="pub-lead-c">${esc(GIOI_THIEU.doan[0])}</p>${lyDoHtml()}
      <p class="center"><a class="btn" href="#/gioi-thieu">Tìm hiểu thêm ${ic("arrow")}</a></p></section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Chương trình học", "Từ lớp 2 đến lớp 9 và ôn thi vào lớp 10 THPT — cam kết cải thiện điểm số")}
      ${tieuChiHtml()}<div class="g3">${CHUONG_TRINH.map(chuongTrinhThe).join("")}</div></div></section>
    <section class="pub-in sec">${secT("Phương pháp giảng dạy")}${phuongPhapHtml()}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Thành tích nổi bật")}${soLieuLonHtml()}${thanhTichHtml(2)}
      <p class="center"><a class="btn" href="#/thanh-tich">Xem tất cả thành tích ${ic("arrow")}</a></p></div></section>
    <section class="pub-in sec">${secT("Học cùng công nghệ", "Ba mẹ theo dõi điểm, điểm danh và học phí của con ngay trên điện thoại")}${congNgheHtml()}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Phụ huynh & học sinh nói gì")}${danhGiaHtml()}</div></section>
    <section class="pub-in sec">${secT("Tin tức & hoạt động")}${hoatDongLuoi(3)}
      <p class="center"><a class="btn" href="#/hoat-dong">Xem tất cả ${ic("arrow")}</a></p></section>
    <section class="sec sec-tint"><div class="pub-in">${secT(LOI_KEU_GOI, "Để lại thông tin, cô gọi lại hẹn lịch kiểm tra và tư vấn lộ trình cho con")}
      <div class="g2 pub-contact">${formTuVan(true)}<div class="card">${lienHeHtml(true)}<div class="pub-cta" style="margin-top:12px">
        <a class="btn btn-gold" href="tel:${soDT()}">${ic("phone")} Gọi cô</a><a class="btn" href="https://zalo.me/${soDT()}" target="_blank" rel="noopener">${ic("chat")} Nhắn Zalo</a></div>
        <h4 class="pub-conn-h">Kết nối với Ms.Ninh</h4>${mangXaHoi(false)}</div></div></div></section>`);
}

/* ---------------- trang con ---------------- */
function pubHead(t, sub) { return `<section class="pub-head"><div class="pub-in"><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ""}</div></section>`; }

function pubAbout() {
  pubShell("gioi-thieu", "Giới thiệu", `${pubHead("Giới thiệu", "Ms.Ninh - Hành trình của sự tâm huyết với sự nghiệp giáo dục tiếng Anh")}
    <section class="pub-in sec"><div class="card pub-intro"><h2>${esc(GIOI_THIEU.tieu_de)}</h2>${GIOI_THIEU.doan.map((d) => `<p>${esc(d)}</p>`).join("")}
      ${CAM_KET.map((c) => `<p class="pub-commit">${ic("check")}<b>${esc(c)}</b></p>`).join("")}</div></section>
    <section class="pub-in sec">${secT("Hành trình")}<div class="pub-timeline">${CAU_CHUYEN.map((c) => `<div class="pub-tl"><div class="pub-tl-y">${esc(c.nam)}</div><div class="card"><b>${esc(c.tieu_de)}</b><p>${esc(c.chu)}</p></div></div>`).join("")}</div></section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Đội ngũ giáo viên")}${giaoVienHtml()}</div></section>
    <section class="pub-in sec">${secT("Cơ sở học tập")}${coSoHtml()}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Vì sao chọn Ms.Ninh")}${lyDoHtml()}</div></section>
    <section class="pub-in sec">${secT("Phương pháp giảng dạy")}${phuongPhapHtml()}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Học cùng công nghệ")}${congNgheHtml()}</div></section>
    <section class="pub-in sec center">${CTA_TU_VAN}</section>`);
}

function loTrinhHtml(id) {
  const ds = LO_TRINH[id] || [];
  if (ds.length) return `<div class="pub-route">${ds.map((c, i) => `<div class="pub-step"><span>Chặng ${i + 1}</span><b>${esc(c.ten)}</b><p>${esc(c.mo_ta || "")}</p></div>`).join(`<div class="pub-arrow">${ic("arrow")}</div>`)}</div>`;
  if (!BAN_NHAP) return "";
  return `<div class="pub-route">${[1, 2, 3].map((i) => `<div class="pub-step cho-the"><span>Chặng ${i}</span><b>Chờ cô đặt tên</b><p>mục tiêu, thời gian</p></div>`).join(`<div class="pub-arrow">${ic("arrow")}</div>`)}</div>`;
}
function pubProgram() {
  pubShell("chuong-trinh", "Chương trình học", `${pubHead("Chương trình học", "Từ lớp 2 đến lớp 9 và ôn thi vào lớp 10 THPT. Mục tiêu: học tốt và cải thiện điểm số.")}
    <section class="pub-in sec">${secT("Cam kết cải thiện điểm số")}${tieuChiHtml()}<div class="g3">${CHUONG_TRINH.map(chuongTrinhThe).join("")}</div>
      <p class="center pub-free">${ic("gift")} <b>Kiểm tra năng lực miễn phí</b> khi đăng ký</p></section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Phương pháp giảng dạy")}${phuongPhapHtml()}</div></section>
    ${CHUONG_TRINH.some((c) => (LO_TRINH[c.id] || []).length) || BAN_NHAP ? `<section class="pub-in sec">${secT("Lộ trình theo chặng")}
      ${CHUONG_TRINH.map((c) => `<h3 class="pub-h3">${esc(c.ten)}</h3>${loTrinhHtml(c.id)}`).join("")}${cho("lộ trình từng chặng, lịch học từng lớp, sĩ số tối đa.")}</section>` : ""}
    <section class="pub-in sec center">${CTA_TU_VAN}</section>`);
}

function pubActivities() {
  pubShell("hoat-dong", "Tin tức & Hoạt động", `${pubHead("Tin tức & Hoạt động", "Quà nhỏ – động lực lớn. Một đứa trẻ hạnh phúc sẽ học tốt hơn bất kỳ phương pháp nào.")}
    <section class="pub-in sec">${HOAT_DONG.map((h) => `<article class="card pub-post">
        <div class="pub-post-hd">${h.ngay ? `<span class="pub-date">${esc(ngayVNs(h.ngay))}</span>` : ""}<h2>${esc(h.tieu_de)}</h2></div>
        ${h.mo_ta ? `<p>${esc(h.mo_ta)}</p>` : ""}
        ${(h.anh || []).length ? `<div class="pub-gallery">${h.anh.map((a) => anhThe(a, 480, 360, "(min-width: 960px) 260px, 50vw")).join("")}</div>` : ""}</article>`).join("")
      || '<div class="empty">Sắp có tin mới.</div>'}
      <p class="center"><a class="btn" href="${esc(LIEN_HE.facebook)}" target="_blank" rel="noopener">${ic("fb")} Xem thêm trên fanpage</a></p></section>`);
}

function pubAwards() {
  pubShell("thanh-tich", "Thành tích", `${pubHead("Thành tích học sinh", "Kết quả công khai trên fanpage Anh Ngữ Ms.Ninh.")}
    <section class="pub-in sec">${soLieuLonHtml()}${thanhTichHtml(0)}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Phụ huynh & học sinh nói gì")}${danhGiaHtml()}</div></section>
    <section class="pub-in sec center">${CTA_TU_VAN}</section>`);
}

function pubContact() {
  pubShell("lien-he", "Liên hệ", `${pubHead("Liên hệ", "Đến trực tiếp, gọi điện, nhắn Zalo/SMS (họ tên, lớp, số điện thoại) hoặc nhắn fanpage.")}
    <section class="pub-in sec g2 pub-contact"><div class="card">${lienHeHtml(true)}
        <div class="pub-cta" style="margin-top:12px"><a class="btn btn-gold" href="tel:${soDT()}">${ic("phone")} Gọi cô</a>
        <a class="btn" href="https://zalo.me/${soDT()}" target="_blank" rel="noopener">${ic("chat")} Nhắn Zalo</a></div></div>
      ${formTuVan(true)}</section>
    <section class="sec sec-tint"><div class="pub-in">${secT("Cơ sở học tập")}${coSoHtml()}</div></section>
    <section class="pub-in sec">${secT("Kết nối với Ms.Ninh")}${mangXaHoi(false)}</section>`);
}

function pubTrial() {
  pubShell("", LOI_KEU_GOI, `${pubHead(LOI_KEU_GOI, "Ba mẹ điền vài thông tin, cô sẽ gọi lại hẹn lịch kiểm tra năng lực và tư vấn lộ trình cho con.")}
    <section class="pub-in sec" style="max-width:640px">${formTuVan(false)}</section>`);
}

const KHOI_THU = { tieu_hoc: ["smile", "Tiểu học", "Lớp 2 – Lớp 5"], thcs: ["book", "THCS", "Lớp 6 – Lớp 9"] };
function pubTest() {
  pubShell("", "Kiểm tra thử online", `${pubHead("Kiểm tra thử online", "Bài ngắn khoảng 10–15 phút, làm ngay trên điện thoại, có điểm và đáp án ngay sau khi nộp.")}
    <section class="pub-in sec" style="max-width:780px" id="thuKhung">${thuChonKhoi()}</section>`);
  ACT.thuBat = (el) => thuBatDau(el.dataset.khoi);
}
function thuChonKhoi() {
  return `<div class="g2">${Object.entries(KHOI_THU).map(([k, [i, t, l]]) => `
      <div class="pub-feat center"><span class="pub-ic">${ic(i)}</span><b>${t}</b><p>${l}</p>
        <button class="btn btn-primary btn-block" data-act="thuBat" data-khoi="${k}" ${KIEM_TRA_THU_BAT ? "" : "disabled"}>${KIEM_TRA_THU_BAT ? "Bắt đầu làm bài" : "Sắp mở"}</button></div>`).join("")}</div>
    ${KIEM_TRA_THU_BAT ? `<p class="small muted center" style="margin-top:12px">Không cần đăng ký tài khoản. Trung tâm không lưu tên hay số điện thoại khi làm thử.</p>`
      : `<div class="alert alert-warn" style="margin-top:14px">Bài kiểm tra thử online <b>đang chuẩn bị</b>. Ba mẹ đăng ký <b>kiểm tra năng lực miễn phí</b> tại trung tâm nhé.</div>`}
    <p class="center">${CTA_TU_VAN}</p>`;
}
async function thuBatDau(khoi) {
  const khung = document.getElementById("thuKhung");
  if (!khung || !KHOI_THU[khoi]) return;
  khung.innerHTML = `<div class="center">${spinner()}<p class="muted">Đang lấy đề…</p></div>`;
  let d;
  try { d = await api("public_bai_thu", { p_khoi: khoi }, false); } catch (e) {
    khung.innerHTML = `${errBox(e)}<p class="center"><button class="btn" data-act="thuVe">← Chọn lại khối</button></p><p class="center">${CTA_TU_VAN}</p>`;
    ACT.thuVe = () => { khung.innerHTML = thuChonKhoi(); };
    return;
  }
  const T = { khoi, cau: d.cau, tl: {}, dangNop: false };
  const dem = () => { const n = Object.keys(T.tl).length, el = document.getElementById("thuDem"); if (el) el.textContent = `Đã làm ${n}/${T.cau.length} câu`; };
  khung.innerHTML = `<div class="card"><b>Kiểm tra thử · ${KHOI_THU[khoi][1]}</b><div class="small muted">${T.cau.length} câu trắc nghiệm · chọn 1 đáp án đúng cho mỗi câu</div></div>
    ${T.cau.map((q, n) => `<div class="card">
      <div class="muted small">Câu ${n + 1} / ${T.cau.length}</div>
      ${q.instruction ? `<div class="q-instr" style="margin-top:8px">${fmt(q.instruction)}</div>` : ""}
      <div class="q-text">${fmt(q.question)}</div>
      <div class="opts">${q.options.map((o, i) => `<button class="opt" data-act="thuChon" data-qi="${q.qi}" data-k="${o.k}"><span class="L">${LETTERS[i]}</span><span>${fmt(o.t)}</span></button>`).join("")}</div></div>`).join("")}
    <div class="card center"><p id="thuDem" class="muted"></p><button class="btn btn-gold btn-block btn-lg" data-act="thuNop">Nộp bài ✔</button><div id="thuLoi"></div></div>`;
  dem();
  khung.scrollIntoView({ behavior: "smooth", block: "start" });
  ACT.thuChon = (el) => {
    T.tl[el.dataset.qi] = Number(el.dataset.k);
    el.parentElement.querySelectorAll(".opt").forEach((b) => b.classList.toggle("sel", b === el));
    dem();
  };
  ACT.thuNop = async (btn) => {
    if (T.dangNop) return;
    const thieu = T.cau.length - Object.keys(T.tl).length;
    if (thieu && !confirm(`Còn ${thieu} câu chưa làm. Vẫn nộp bài?`)) return;
    T.dangNop = true; btn.disabled = true; btn.textContent = "Đang chấm…";
    try {
      const r = await api("public_cham_thu", { p_khoi: khoi, p_cau: T.cau.map((q) => q.qi), p_tra_loi: T.tl }, false);
      thuKetQua(khung, khoi, r);
    } catch (e) {
      T.dangNop = false; btn.disabled = false; btn.textContent = "Nộp bài ✔";
      document.getElementById("thuLoi").innerHTML = errBox(e);
    }
  };
}
function thuKetQua(khung, khoi, r) {
  const v = Number(r.score);
  const loi = v >= 9 ? "Xuất sắc! 🌟" : v >= 8 ? "Giỏi lắm! 👏" : v >= 6.5 ? "Khá tốt! Cố gắng thêm chút nữa nhé." : v >= 5 ? "Đạt. Xem lại các câu sai nhé." : "Con cần ôn thêm phần này.";
  khung.innerHTML = `<div class="card center">
      <div class="muted">Kiểm tra thử · ${KHOI_THU[khoi][1]}</div>
      <div class="big-score ${scoreCls(v)}" style="margin:10px 0 2px">${fmtScore(v)}</div><div class="muted">điểm</div>
      <p><b>Đúng ${r.correct}/${r.total} câu</b></p><h2 style="margin:0 0 10px">${loi}</h2>
      <p class="small muted">Muốn biết con đang ở mức nào và nên học lộ trình nào, ba mẹ đăng ký kiểm tra năng lực miễn phí tại trung tâm.</p>
      <p>${CTA_TU_VAN}</p>
      <button class="btn" data-act="thuBat" data-khoi="${khoi}">🔁 Làm đề khác</button></div>
    <h2 style="margin:22px 0 10px">Xem lại bài làm</h2>${reviewHtml(r, false)}`;
  khung.scrollIntoView({ behavior: "smooth", block: "start" });
}

function pubRoute(key) {
  const R = { "trang-chu": pubHome, "gioi-thieu": pubAbout, "chuong-trinh": pubProgram, "hoat-dong": pubActivities,
    "thanh-tich": pubAwards, "lien-he": pubContact, "dang-ky-tu-van": pubTrial, "dang-ky-hoc-thu": pubTrial, "kiem-tra-thu": pubTest };
  return R[key];
}
