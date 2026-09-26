// Light / dark toggle. Shares the NDVDB docs' saved preference, so the theme
// follows the visitor across the whole site.
(function () {
  var KEY = 'ndvdb-docs-theme';
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var light = root.dataset.theme !== 'light';
    if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
    try { light ? localStorage.setItem(KEY, 'light') : localStorage.removeItem(KEY); } catch (e) {}
  });
})();
