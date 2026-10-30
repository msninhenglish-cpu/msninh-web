// GitHub Pages tra 404.html cho duong dan khong co file -> chuyen link dep ve trang ung dung.
// msninh.vn/kiemtra/<ma de> -> msninh.vn/#/kiemtra/<ma de>
(function () {
  var m = location.pathname.match(/^\/kiemtra\/([A-Za-z0-9._-]+)\/?$/i);
  if (m) { location.replace("/#/kiemtra/" + m[1].toLowerCase()); return; }
  // msninh.vn/baivenha/khoi2/3010A -> msninh.vn/#/baivenha/khoi2/3010A (de tao tren web, ma ngay-thang + chu)
  var b = location.pathname.match(/^\/baivenha\/(?:(khoi\d{1,2})\/)?([A-Za-z0-9-]+)\/?$/i);
  if (b) { location.replace("/#/baivenha/" + (b[1] ? b[1].toLowerCase() + "/" : "") + b[2].toUpperCase()); return; }
  if (/^\/baivenha\/?$/i.test(location.pathname)) { location.replace("/#/login"); return; }
  if (/^\/kiemtra\/?$/i.test(location.pathname)) { location.replace("/#/login"); return; }
  document.addEventListener("DOMContentLoaded", function () { var b = document.getElementById("nd"); if (b) b.hidden = false; });
})();
