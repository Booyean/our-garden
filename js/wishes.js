(function () {
  if (!localStorage.getItem('our_garden_pwd')) {
    window.location.href = 'index.html';
    return;
  }

  var LOCAL_KEY = 'our_garden_wishes';
  var API_BASE = '/api/wishes';

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    wishes: [],
    useLocal: false,
    currentTab: 'pending'
  };

  var wishList = $('wishList');
  var wishEmpty = $('wishEmpty');
  var wishInput = $('wishInput');
  var wishAddBtn = $('wishAddBtn');
  var statsDone = $('statsDone');
  var statsTotal = $('statsTotal');
  var toastEl = $('toast');
  var confettiZone = $('confettiZone');
  var whoSelect = $('wishWhoSelect');

  var pendingWishes = [];
  var doneWishes = [];
  var selectedWho = '';

  function toast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, duration || 2000);
  }

  function getLocalWishes() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveLocalWishes(arr) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  }

  async function apiGet(url) {
    try { var r = await fetch(url); return await r.json(); }
    catch (e) { state.useLocal = true; return null; }
  }

  async function apiPost(body) {
    try {
      var r = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await r.json();
    } catch (e) { state.useLocal = true; return null; }
  }

  async function apiPut(id, body) {
    try {
      var r = await fetch(API_BASE + '?id=' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await r.json();
    } catch (e) { state.useLocal = true; return null; }
  }

  whoSelect.addEventListener('click', function (e) {
    var btn = e.target.closest('.wish-who-btn');
    if (!btn) return;
    whoSelect.querySelectorAll('.wish-who-btn').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    selectedWho = btn.getAttribute('data-who');
  });

  var firstBtn = whoSelect.querySelector('.wish-who-btn.selected');
  if (firstBtn) selectedWho = firstBtn.getAttribute('data-who');

  async function loadWishes() {
    if (state.useLocal) {
      state.wishes = getLocalWishes();
    } else {
      var res = await apiGet(API_BASE);
      if (res && res.success && res.data) {
        state.wishes = res.data;
        saveLocalWishes(res.data);
      } else {
        state.wishes = getLocalWishes();
      }
    }
    pendingWishes = state.wishes.filter(function (w) { return !w.done; });
    doneWishes = state.wishes.filter(function (w) { return w.done; });
    updateStats();
    renderWishes();
  }

  function updateStats() {
    statsDone.textContent = doneWishes.length;
    statsTotal.textContent = state.wishes.length;
  }

  function renderWishes() {
    wishList.innerHTML = '';
    var list = state.currentTab === 'pending' ? pendingWishes : doneWishes;

    if (list.length === 0) {
      wishList.style.display = 'none';
      wishEmpty.style.display = 'flex';
      var icon = wishEmpty.querySelector('.wish-empty-icon');
      var text = wishEmpty.querySelector('p');
      if (state.currentTab === 'pending') {
        icon.textContent = '\uD83C\uDF1F';
        text.textContent = '还没有愿望哦～写下你们想一起做的事吧！';
      } else {
        icon.textContent = '\uD83C\uDFAF';
        text.textContent = '还没有已完成～去勾选一个吧！';
      }
      return;
    }

    wishList.style.display = 'block';
    wishEmpty.style.display = 'none';

    list.forEach(function (wish, idx) {
      var realIdx = state.wishes.indexOf(wish);
      var card = document.createElement('div');
      card.className = 'wish-item';

      var left = document.createElement('div');
      left.className = 'wish-item-left';

      var cb = document.createElement('div');
      cb.className = 'wish-checkbox';
      if (wish.done) cb.classList.add('checked');
      cb.addEventListener('click', function () { toggleWish(realIdx); });
      left.appendChild(cb);

      var body = document.createElement('div');
      body.className = 'wish-item-body';

      var content = document.createElement('p');
      content.className = 'wish-item-content';
      content.textContent = wish.content;
      if (wish.done) content.classList.add('completed');
      body.appendChild(content);

      var meta = document.createElement('p');
      meta.className = 'wish-item-meta';
      var metaParts = [];
      if (wish.who) metaParts.push(wish.who);
      if (wish.done_date) metaParts.push(wish.done_date);
      meta.textContent = metaParts.join(' · ');
      body.appendChild(meta);

      card.appendChild(left);
      card.appendChild(body);
      wishList.appendChild(card);
    });
  }

  async function toggleWish(idx) {
    var wish = state.wishes[idx];
    var newDone = wish.done ? 0 : 1;

    if (newDone === 1) {
      burstConfetti();
    }

    if (state.useLocal) {
      wish.done = newDone;
      wish.done_date = newDone ? new Date().toISOString().slice(0, 10) : null;
      saveLocalWishes(state.wishes);
      refresh();
      return;
    }

    var res = await apiPut(wish.id, { done: newDone });
    if (res && res.success) {
      wish.done = newDone;
      wish.done_date = res.data.done_date;
      saveLocalWishes(state.wishes);
      refresh();
    } else {
      wish.done = newDone;
      wish.done_date = newDone ? new Date().toISOString().slice(0, 10) : null;
      saveLocalWishes(state.wishes);
      refresh();
      if (newDone) toast('已标记完成（本地）');
    }
  }

  function refresh() {
    pendingWishes = state.wishes.filter(function (w) { return !w.done; });
    doneWishes = state.wishes.filter(function (w) { return w.done; });
    updateStats();
    renderWishes();
  }

  wishAddBtn.addEventListener('click', async function () {
    var content = wishInput.value.trim();
    if (!content) { toast('写点什么吧~'); return; }
    if (!selectedWho) { toast('先选择提出者哦~'); return; }

    var payload = { content: content, who: selectedWho };

    if (state.useLocal) {
      state.wishes.unshift({
        id: Date.now() + Math.random(),
        content: content,
        who: selectedWho,
        done: 0,
        done_date: null,
        created_at: new Date().toISOString()
      });
      saveLocalWishes(state.wishes);
      wishInput.value = '';
      refresh();
      toast('愿望已添加 &#128640;');
      return;
    }

    var res = await apiPost(payload);
    if (res && res.success) {
      state.wishes.unshift({
        id: res.data.id,
        content: content,
        who: selectedWho,
        done: 0,
        done_date: null
      });
      saveLocalWishes(state.wishes);
      wishInput.value = '';
      refresh();
      toast('愿望已添加 &#128640;');
    } else {
      state.wishes.unshift({
        id: Date.now() + Math.random(),
        content: content,
        who: selectedWho,
        done: 0,
        done_date: null
      });
      saveLocalWishes(state.wishes);
      wishInput.value = '';
      refresh();
      toast('愿望已添加（本地）');
    }
  });

  wishInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      wishAddBtn.click();
    }
  });

  wishInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  document.querySelectorAll('.wish-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.wish-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.currentTab = tab.getAttribute('data-tab');
      renderWishes();
    });
  });

  function burstConfetti() {
    var emojis = ['\uD83C\uDF38', '\u2728', '\uD83D\uDC96', '\uD83C\uDF89', '\uD83C\uDF1F', '\u2764\uFE0F'];
    for (var i = 0; i < 30; i++) {
      var particle = document.createElement('span');
      particle.className = 'confetti';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      particle.style.animationDelay = Math.random() * 0.3 + 's';
      particle.style.fontSize = (16 + Math.random() * 20) + 'px';
      confettiZone.appendChild(particle);
      setTimeout(function () { particle.remove(); }, 3000);
    }
  }

  loadWishes();
})();
