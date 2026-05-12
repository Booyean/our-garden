(function () {
  var BG_STORAGE_BASE = APP_CONFIG.STORAGE_KEYS.BG_CHOICE || 'our_garden_bg';
  var CFG = APP_CONFIG.BACKGROUND;

  if (!CFG || !CFG.enableSwitcher) return;

  var options = JSON.parse(JSON.stringify(CFG.pageBgs || {}));
  options['default'] = CFG.defaultBg;
  options['gradient'] = 'gradient';

  var currentPage = (function () {
    var path = window.location.pathname.split('/').pop().replace('.html', '');
    if (path === 'photos' || path === 'surprise') path = 'photo';
    if (path === 'wishes') path = 'wish';
    return path;
  })();

  var BG_STORAGE = BG_STORAGE_BASE + '_' + currentPage;
  var currentBg = localStorage.getItem(BG_STORAGE) || ('page-' + currentPage);

  var styleEl = document.createElement('style');
  styleEl.id = 'bg-style';
  document.head.appendChild(styleEl);

  function resolveUrl(url) {
    if (!url || url === 'gradient') return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    var base = window.location.pathname.replace(/[^\/]+$/, '');
    return base + url;
  }

  function applyBg(key) {
    if (!key || key === 'auto') {
      applyBg('page-' + currentPage);
      return;
    }

    var url;
    if (key.indexOf('page-') === 0) {
      var pageKey = key.replace('page-', '');
      url = options[pageKey] || CFG.defaultBg;
    } else if (key === 'gradient') {
      url = null;
    } else {
      url = options[key] || CFG.defaultBg;
    }

    if (url && url !== 'gradient') {
      var resolved = resolveUrl(url);
      var blur = CFG.blur || 5;
      var overlay = CFG.overlayColor || 'rgba(255, 240, 245, 0.72)';

      styleEl.textContent = ''
        + 'body.has-bg-image::before {'
        + '  background-image: url(' + resolved + ');'
        + '  filter: blur(' + blur + 'px);'
        + '  opacity: 1;'
        + '}'
        + 'body.has-bg-image::after {'
        + '  background: ' + overlay + ';'
        + '}'
        + 'body { background: none; }';

      document.body.classList.add('has-bg-image');
      document.body.classList.remove('no-bg-image');
    } else {
      styleEl.textContent = ''
        + 'body { background: ' + (CFG.fallbackGradient || '#FFF0F3') + '; }';

      document.body.classList.add('no-bg-image');
      document.body.classList.remove('has-bg-image');
    }
  }

  applyBg(currentBg);

  function injectSwitcher() {
    if (document.getElementById('bgSwitcher')) return;
    document.body.insertAdjacentHTML('beforeend', ''
      + '<div class="bg-switcher" id="bgSwitcher">'
      + '  <button class="bg-switch-btn" id="bgSwitchBtn" title="切换背景">&#x1F5BC;</button>'
      + '  <div class="bg-switch-panel" id="bgSwitchPanel"></div>'
      + '</div>'
    );

    var panel = document.getElementById('bgSwitchPanel');
    var bgOptions = [
      { key: 'page-' + currentPage, label: '当前页面背景', icon: '&#x1F304;' },
      { key: 'default', label: '默认合照', icon: '&#x1F4F7;' },
      { key: 'gradient', label: '纯色渐变', icon: '&#x1F308;' }
    ];

    bgOptions.forEach(function (opt) {
      var item = document.createElement('button');
      item.className = 'bg-switch-item';
      if (currentBg === opt.key) item.classList.add('active');

      item.innerHTML = opt.icon + ' ' + opt.label;
      item.addEventListener('click', function () {
        currentBg = opt.key;
        localStorage.setItem(BG_STORAGE, opt.key);
        applyBg(opt.key);
        panel.querySelectorAll('.bg-switch-item').forEach(function (el) { el.classList.remove('active'); });
        item.classList.add('active');
        panel.classList.remove('open');
      });
      panel.appendChild(item);
    });

    document.getElementById('bgSwitchBtn').addEventListener('click', function () {
      panel.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#bgSwitcher')) {
        panel.classList.remove('open');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.page-container')) {
      injectSwitcher();
    }
  });
})();
