(function () {
  if (!localStorage.getItem('our_garden_pwd')) {
    window.location.href = 'index.html';
    return;
  }

  var ANNIVERSARY_DATE = APP_CONFIG.ANNIVERSARY_DATE;
  var LOCAL_KEY = 'our_garden_photos';
  var API_BASE = '/api/photos';

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    photos: [],
    useLocal: false,
    lbIndex: -1
  };

  var timerEl = $('timerValue');
  var gridEl = $('photosGrid');
  var emptyEl = $('photosEmpty');
  var toastEl = $('toast');

  var lightbox = $('lightbox');
  var lbImg = $('lbImg');
  var lbCaption = $('lbCaption');
  var lbMeta = $('lbMeta');

  var uploadOverlay = $('uploadOverlay');
  var uploadFileInput = $('uploadFileInput');
  var uploadFileArea = $('uploadFileArea');
  var uploadPreview = $('uploadPreview');
  var uploadProgressBar = $('uploadProgressBar');
  var uploadProgressFill = $('uploadProgressFill');
  var uploadCaption = $('uploadCaption');
  var uploadDate = $('uploadDate');
  var uploadLocation = $('uploadLocation');

  var uploadFiles = [];

  function toast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, duration || 2000);
  }

  function formatNum(n) { return n < 10 ? '0' + n : '' + n; }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    var p = dateStr.split('-');
    return p[0 + p.length - 3] + '.' + p[1 + p.length - 3] + '.' + p[2 + p.length - 3];
  }

  function getLocalPhotos() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveLocalPhotos(arr) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  }

  async function apiGet(url) {
    try { var r = await fetch(url); return await r.json(); }
    catch (e) { state.useLocal = true; return null; }
  }

  async function apiDelete(id) {
    try {
      var pwd = localStorage.getItem('our_garden_pwd');
      var r = await fetch(API_BASE + '?id=' + id, { method: 'DELETE', headers: { 'X-Password': pwd } });
      return await r.json();
    } catch (e) { state.useLocal = true; return null; }
  }

  function updateTimer() {
    var now = new Date();
    var start = new Date(ANNIVERSARY_DATE + 'T00:00:00');
    var diff = now - start;
    if (diff < 0) { timerEl.textContent = '0 天'; return; }
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    timerEl.textContent = days + ' 天 ' + formatNum(hours) + ':' + formatNum(mins) + ':' + formatNum(secs);
  }

  async function loadPhotos() {
    if (state.useLocal) {
      state.photos = getLocalPhotos();
      renderPhotos();
      return;
    }
    var res = await apiGet(API_BASE);
    if (res && res.success && res.data) {
      state.photos = res.data;
      saveLocalPhotos(res.data);
      renderPhotos();
    } else {
      state.photos = getLocalPhotos();
      renderPhotos();
    }
  }

  function renderPhotos() {
    gridEl.innerHTML = '';
    if (state.photos.length === 0) {
      gridEl.style.display = 'none';
      emptyEl.style.display = 'flex';
      return;
    }
    gridEl.style.display = 'grid';
    emptyEl.style.display = 'none';

    state.photos.forEach(function (photo, idx) {
      var card = document.createElement('div');
      card.className = 'photo-card';
      card.setAttribute('data-idx', idx);

      var imgWrap = document.createElement('div');
      imgWrap.className = 'photo-card-img-wrap';
      var img = document.createElement('img');
      img.className = 'photo-card-img lazy';
      img.setAttribute('data-src', photo.image_url);
      img.alt = photo.caption || '';
      imgWrap.appendChild(img);

      var info = document.createElement('div');
      info.className = 'photo-card-info';
      if (photo.caption) {
        var cap = document.createElement('p');
        cap.className = 'photo-card-caption';
        cap.textContent = photo.caption;
        info.appendChild(cap);
      }
      var meta = document.createElement('p');
      meta.className = 'photo-card-meta';
      var parts = [];
      if (photo.photo_date) parts.push(formatDateDisplay(photo.photo_date));
      if (photo.location) parts.push(photo.location);
      meta.textContent = parts.join(' · ');
      if (parts.length > 0) info.appendChild(meta);

      card.appendChild(imgWrap);
      card.appendChild(info);

      card.addEventListener('click', function () { openLightbox(idx); });
      gridEl.appendChild(card);
    });

    initLazyLoad();
    initDeleteOnDblClick();
  }

  function initLazyLoad() {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      }, { rootMargin: '100px' });
      gridEl.querySelectorAll('.lazy').forEach(function (img) { observer.observe(img); });
    } else {
      gridEl.querySelectorAll('.lazy').forEach(function (img) {
        img.src = img.getAttribute('data-src');
        img.classList.remove('lazy');
      });
    }
  }

  function initDeleteOnDblClick() {
    gridEl.querySelectorAll('.photo-card').forEach(function (card) {
      card.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        var idx = parseInt(card.getAttribute('data-idx'));
        var photo = state.photos[idx];
        if (!photo) return;
        if (!confirm('确定要删除这张照片吗？')) return;
        deletePhoto(photo.id, idx);
      });
    });
  }

  async function deletePhoto(id, idx) {
    toast('删除中...');
    if (state.useLocal) {
      state.photos = getLocalPhotos();
      state.photos.splice(idx, 1);
      saveLocalPhotos(state.photos);
      renderPhotos();
      toast('已删除');
      return;
    }
    var res = await apiDelete(id);
    if (res && res.success) {
      state.photos.splice(idx, 1);
      saveLocalPhotos(state.photos);
      renderPhotos();
      toast('已删除');
    } else {
      state.photos.splice(idx, 1);
      saveLocalPhotos(state.photos);
      renderPhotos();
      toast('已删除（本地）');
    }
  }

  uploadFileArea.addEventListener('click', function () { uploadFileInput.click(); });
  uploadFileInput.addEventListener('change', function () {
    uploadFiles = Array.from(uploadFileInput.files);
    renderUploadPreview();
  });

  function renderUploadPreview() {
    uploadPreview.innerHTML = '';
    if (uploadFiles.length === 0) {
      uploadFileArea.style.display = '';
      return;
    }
    uploadFileArea.style.display = 'none';
    uploadFiles.forEach(function (file) {
      var img = document.createElement('img');
      img.className = 'upload-preview-img';
      img.src = URL.createObjectURL(file);
      uploadPreview.appendChild(img);
    });
  }

  $('uploadBtn').addEventListener('click', function () {
    uploadOverlay.style.display = 'flex';
    uploadFiles = [];
    uploadFileInput.value = '';
    uploadPreview.innerHTML = '';
    uploadFileArea.style.display = '';
    uploadCaption.value = '';
    uploadDate.value = '';
    uploadLocation.value = '';
    uploadProgressBar.style.display = 'none';
    uploadProgressFill.style.width = '0%';
  });

  $('uploadCancel').addEventListener('click', function () {
    uploadOverlay.style.display = 'none';
  });

  uploadOverlay.addEventListener('click', function (e) {
    if (e.target === uploadOverlay) uploadOverlay.style.display = 'none';
  });

  $('uploadSubmit').addEventListener('click', async function () {
    if (uploadFiles.length === 0) { toast('请先选择照片'); return; }

    uploadProgressBar.style.display = 'block';
    uploadProgressFill.style.width = '0%';

    for (var i = 0; i < uploadFiles.length; i++) {
      var formData = new FormData();
      formData.append('file', uploadFiles[i]);
      formData.append('caption', uploadCaption.value);
      formData.append('photo_date', uploadDate.value);
      formData.append('location', uploadLocation.value);

      var progress = Math.round(((i) / uploadFiles.length) * 100);
      uploadProgressFill.style.width = progress + '%';

      if (state.useLocal) {
        var reader = new FileReader();
        var file = uploadFiles[i];
        await new Promise(function (resolve) {
          reader.onload = function (ev) {
            var photos = getLocalPhotos();
            photos.unshift({
              id: Date.now() + Math.random(),
              image_url: ev.target.result,
              image_key: '',
              caption: uploadCaption.value,
              photo_date: uploadDate.value,
              location: uploadLocation.value,
              upload_time: new Date().toISOString()
            });
            saveLocalPhotos(photos);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      } else {
        try {
          var res = await fetch(API_BASE, { method: 'POST', body: formData });
          var data = await res.json();
          if (!data.success) {
            toast(data.message || '上传失败');
            uploadProgressBar.style.display = 'none';
            return;
          }
        } catch (e) {
          state.useLocal = true;
        }
      }
    }

    uploadProgressFill.style.width = '100%';
    toast('上传成功！共 ' + uploadFiles.length + ' 张照片 &#128149;');
    setTimeout(function () {
      uploadOverlay.style.display = 'none';
      uploadProgressBar.style.display = 'none';
      uploadProgressFill.style.width = '0%';
      loadPhotos();
    }, 500);
  });

  function openLightbox(idx) {
    state.lbIndex = idx;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    var photo = state.photos[state.lbIndex];
    if (!photo) return;
    lbImg.src = photo.image_url;
    lbCaption.textContent = photo.caption || '';
    var parts = [];
    if (photo.photo_date) parts.push(formatDateDisplay(photo.photo_date));
    if (photo.location) parts.push(photo.location);
    lbMeta.textContent = parts.join(' · ');
    $('lbPrev').style.visibility = state.lbIndex > 0 ? 'visible' : 'hidden';
    $('lbNext').style.visibility = state.lbIndex < state.photos.length - 1 ? 'visible' : 'hidden';
  }

  function lbPrev() {
    if (state.lbIndex > 0) { state.lbIndex--; updateLightbox(); }
  }

  function lbNext() {
    if (state.lbIndex < state.photos.length - 1) { state.lbIndex++; updateLightbox(); }
  }

  $('lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  $('lbPrev').addEventListener('click', lbPrev);
  $('lbNext').addEventListener('click', lbNext);

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbPrev();
    if (e.key === 'ArrowRight') lbNext();
  });

  var surpriseClickCount = 0;
  var surpriseClickTimer = null;
  var SURPRISE_CODE = 'iloveyou';
  var timerBarEl = $('timerBar');

  timerBarEl.addEventListener('click', function () {
    surpriseClickCount++;
    if (surpriseClickCount === 1) {
      surpriseClickTimer = setTimeout(function () { surpriseClickCount = 0; }, 1500);
    }
    if (surpriseClickCount >= 5) {
      clearTimeout(surpriseClickTimer);
      surpriseClickCount = 0;
      var code = prompt('请输入暗号：');
      if (code && code.toLowerCase() === SURPRISE_CODE) {
        window.location.href = 'surprise.html';
      } else if (code !== null) {
        toast('暗号不对哦～');
      }
    }
  });

  updateTimer();
  setInterval(updateTimer, 1000);
  loadPhotos();
})();
