(function () {
  var $ = function (id) { return document.getElementById(id); };

  window.App = {};

  /**
   * Toast 提示
   */
  window.App.toast = function (msg, duration) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, duration || 2000);
  };

  /**
   * Loading 遮罩
   */
  window.App.showLoading = function (msg) {
    var overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div><p class="loading-text" id="loadingText"></p>';
      document.body.appendChild(overlay);
    }
    $('loadingText').textContent = msg || '加载中...';
    overlay.classList.add('open');
  };

  window.App.hideLoading = function () {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  /**
   * 网络错误友好提示
   */
  window.App.showNetworkError = function () {
    App.toast('网络连接失败，数据已保存到本地 \uD83D\uDCBE', 3000);
  };

  /**
   * API 请求助手（自动处理离线降级）
   */
  window.App.api = async function (url, options) {
    try {
      var res = await fetch(url, options);
      if (!res.ok) {
        var errData = null;
        try { errData = await res.json(); } catch (e) {}
        return { success: false, data: null, message: (errData && errData.message) || '请求失败 (' + res.status + ')' };
      }
      return await res.json();
    } catch (e) {
      return { success: false, data: null, message: 'network_error', _offline: true };
    }
  };

  /**
   * 导出数据为 JSON 文件下载
   */
  window.App.exportData = function () {
    var data = {
      config: {
        title: APP_CONFIG.SITE_TITLE,
        anniversary: APP_CONFIG.ANNIVERSARY_DATE
      },
      author: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTHOR) || '',
      diaries: [],
      photos: [],
      wishes: []
    };
    try { data.diaries = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DIARIES) || '[]'); } catch (e) {}
    try { data.photos  = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.PHOTOS)  || '[]'); } catch (e) {}
    try { data.wishes  = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.WISHES)  || '[]'); } catch (e) {}

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'our-garden-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.toast('数据已导出 \uD83D\uDCE5');
  };

  /**
   * 页面淡入过渡
   */
  document.addEventListener('DOMContentLoaded', function () {
    var container = document.querySelector('.page-container');
    if (container) {
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.4s ease';
      requestAnimationFrame(function () {
        container.style.opacity = '1';
      });
    }
  });

  /**
   * 桌面端适配检查
   */
  (function () {
    var w = window.innerWidth;
    if (w < 800) {
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:10px;background:var(--danger);color:#fff;text-align:center;font-size:13px;z-index:9999;';
      banner.textContent = '为获得最佳体验，建议在电脑上打开 \uD83D\uDCBB';
      document.body.insertBefore(banner, document.body.firstChild);
    }
  })();

  /**
   * 页面底部添加导出按钮
   */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.page-container') && !document.querySelector('.export-btn')) {
      var container = document.querySelector('.page-container');
      var wrapper = document.createElement('div');
      wrapper.className = 'export-area';
      wrapper.innerHTML = '<button class="export-btn" id="exportDataBtn" title="导出数据备份">\uD83D\uDCE5 导出数据</button>';
      container.appendChild(wrapper);
      setTimeout(function () {
        var btn = document.getElementById('exportDataBtn');
        if (btn) btn.addEventListener('click', App.exportData);
      }, 100);
    }
  });
})();
