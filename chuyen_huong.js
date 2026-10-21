// GitHub Pages tra 404.html cho duong dan khong co file -> chuyen link dep ve trang ung dung.
// msninh.vn/kiemtra/<ma de> -> msninh.vn/#/kiemtra/<ma de>
(function () {
  var m = location.pathname.match(/^\/kiemtra\/([A-Za-z0-9._-]+)\/?$/i);
  if (m) { location.replace("/#/kiemtra/" + m[1].toLowerCase()); return; }
  if (/^\/kiemtra\/?$/i.test(location.pathname)) { location.replace("/#/login"); return; }
  document.addEventListener("DOMContentLoaded", function () { var b = document.getElementById("nd"); if (b) b.hidden = false; });
})();
