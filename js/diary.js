(function () {
  if (!localStorage.getItem('our_garden_pwd')) {
    window.location.href = 'index.html';
    return;
  }

  var AUTHOR_KEY = 'our_garden_author';
  var LOCAL_DIARY_KEY = 'our_garden_diaries';
  var MOODS = {
    '\uD83D\uDE0A': '#FFD700',
    '\uD83E\uDD7A': '#87CEEB',
    '\uD83D\uDE22': '#B0C4DE',
    '\uD83D\uDE0D': '#FF69B4',
    '\uD83E\uDD70': '#FF9BB5',
    '\uD83D\uDE14': '#A9A9A9'
  };

  var state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null,
    currentDiary: null,
    selectedMood: '',
    author: localStorage.getItem(AUTHOR_KEY) || '',
    monthDiaries: {},
    useLocal: false
  };

  var $ = function (id) { return document.getElementById(id); };
  var calTitle = $('calTitle');
  var calGrid = $('calGrid');
  var diarySection = $('diarySection');
  var diaryCard = $('diaryCard');
  var diaryDateLabel = $('diaryDateLabel');
  var diaryAuthorBadge = $('diaryAuthorBadge');
  var diaryContent = $('diaryContent');
  var moodList = $('moodList');
  var saveBtn = $('saveBtn');
  var authorOverlay = $('authorOverlay');
  var toastEl = $('toast');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDate(y, m, d) {
    return y + '-' + pad(m + 1) + '-' + pad(d);
  }

  function formatDisplay(dateStr) {
    var p = dateStr.split('-');
    return p[0] + '年' + parseInt(p[1]) + '月' + parseInt(p[2]) + '日';
  }

  function getLocalDiaries() {
    try { return JSON.parse(localStorage.getItem(LOCAL_DIARY_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveLocalDiary(dateStr, data) {
    var all = getLocalDiaries();
    all[dateStr] = data;
    localStorage.setItem(LOCAL_DIARY_KEY, JSON.stringify(all));
  }

  async function apiGet(url) {
    try {
      var res = await fetch(url);
      return await res.json();
    } catch (e) {
      state.useLocal = true;
      return null;
    }
  }

  async function apiPost(url, body) {
    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      state.useLocal = true;
      return null;
    }
  }

  async function apiPut(url, body) {
    try {
      var pwd = localStorage.getItem('our_garden_pwd');
      var res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Password': pwd },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      state.useLocal = true;
      return null;
    }
  }

  function toast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, duration || 2000);
  }

  var OLD_AUTHORS = ['\uD83D\uDC30', '\uD83D\uDC3B'];

  if (state.author && (state.author.indexOf('\\u') !== -1 || OLD_AUTHORS.indexOf(state.author) !== -1)) {
    localStorage.removeItem(AUTHOR_KEY);
    state.author = '';
  }

  var localRaw = localStorage.getItem(LOCAL_DIARY_KEY);
  if (localRaw && localRaw.indexOf('\\u') !== -1) {
    localStorage.removeItem(LOCAL_DIARY_KEY);
  }

  function initAuthor() {
    if (state.author) {
      authorOverlay.style.display = 'none';
      return;
    }
    authorOverlay.style.display = 'flex';
    var btns = authorOverlay.querySelectorAll('.author-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.author = btn.getAttribute('data-author');
        localStorage.setItem(AUTHOR_KEY, state.author);
        authorOverlay.style.display = 'none';
        updateAuthorBadge();
      });
    });
  }

  function updateAuthorBadge() {
    diaryAuthorBadge.textContent = state.author;
  }

  function renderCalendar() {
    calTitle.textContent = state.year + '年' + (state.month + 1) + '月';
    calGrid.innerHTML = '';

    var firstDay = new Date(state.year, state.month, 1).getDay();
    var daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    var today = new Date();
    var todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calGrid.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = formatDate(state.year, state.month, d);
      var cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.setAttribute('data-date', dateStr);

      var num = document.createElement('span');
      num.className = 'cal-day-num';
      num.textContent = d;
      cell.appendChild(num);

      if (dateStr === todayStr) cell.classList.add('today');
      if (dateStr === state.selectedDate) cell.classList.add('selected');

      if (dateStr > todayStr) {
        cell.classList.add('disabled');
      }

      if (state.monthDiaries[dateStr]) {
        var dot = document.createElement('span');
        dot.className = 'cal-day-dot';
        var mood = state.monthDiaries[dateStr];
        if (MOODS[mood]) dot.style.background = MOODS[mood];
        cell.appendChild(dot);
      }

      if (dateStr <= todayStr) {
        cell.addEventListener('click', (function (ds) {
          return function () { selectDate(ds); };
        })(dateStr));
      }

      calGrid.appendChild(cell);
    }
  }

  async function loadMonthDiaries() {
    var monthStr = state.year + '-' + pad(state.month + 1);
    state.monthDiaries = {};

    if (state.useLocal) {
      var all = getLocalDiaries();
      Object.keys(all).forEach(function (k) {
        if (k.startsWith(monthStr)) state.monthDiaries[k] = all[k].mood || '';
      });
      renderCalendar();
      return;
    }

    var res = await apiGet('/api/diary/month?month=' + monthStr);
    if (res && res.success && res.data) {
      res.data.forEach(function (item) {
        state.monthDiaries[item.date] = item.mood || '';
      });
    } else {
      var all = getLocalDiaries();
      Object.keys(all).forEach(function (k) {
        if (k.startsWith(monthStr)) state.monthDiaries[k] = all[k].mood || '';
      });
    }
    renderCalendar();
  }

  async function selectDate(dateStr) {
    state.selectedDate = dateStr;
    renderCalendar();
    diarySection.style.display = 'block';
    diarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    diaryDateLabel.textContent = formatDisplay(dateStr);
    updateAuthorBadge();

    state.currentDiary = null;
    state.selectedMood = '';
    diaryContent.value = '';
    clearMoodSelection();
    diaryCard.style.borderLeftColor = 'var(--primary-light)';

    if (state.useLocal) {
      var all = getLocalDiaries();
      if (all[dateStr]) {
        state.currentDiary = all[dateStr];
        fillDiary(state.currentDiary);
      }
      return;
    }

    var res = await apiGet('/api/diary?date=' + dateStr);
    if (res && res.success && res.data) {
      state.currentDiary = res.data;
      fillDiary(res.data);
    } else {
      var all = getLocalDiaries();
      if (all[dateStr]) {
        state.currentDiary = all[dateStr];
        fillDiary(all[dateStr]);
      }
    }
  }

  function fillDiary(data) {
    diaryContent.value = data.content || '';
    if (data.mood) {
      state.selectedMood = data.mood;
      highlightMood(data.mood);
      var color = MOODS[data.mood];
      if (color) diaryCard.style.borderLeftColor = color;
    }
    if (data.author) {
      diaryAuthorBadge.textContent = data.author;
    }
  }

  function clearMoodSelection() {
    moodList.querySelectorAll('.mood-item').forEach(function (el) {
      el.classList.remove('active');
    });
  }

  function highlightMood(mood) {
    clearMoodSelection();
    var item = moodList.querySelector('[data-mood="' + mood + '"]');
    if (item) item.classList.add('active');
  }

  moodList.addEventListener('click', function (e) {
    var btn = e.target.closest('.mood-item');
    if (!btn) return;
    var mood = btn.getAttribute('data-mood');
    state.selectedMood = mood;
    highlightMood(mood);
    var color = btn.getAttribute('data-color');
    diaryCard.style.borderLeftColor = color || 'var(--primary-light)';
  });

  saveBtn.addEventListener('click', async function () {
    if (!state.author) {
      authorOverlay.style.display = 'flex';
      return;
    }
    var content = diaryContent.value.trim();
    if (!content) {
      toast('写点什么再保存吧~');
      return;
    }

    var dateStr = state.selectedDate;
    var payload = {
      date: dateStr,
      author: state.author,
      content: content,
      mood: state.selectedMood
    };

    if (state.currentDiary) {
      var yes = confirm('今天已经写过了，要更新吗？');
      if (!yes) return;

      if (state.useLocal) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存 \uD83D\uDC95');
        return;
      }

      var res = await apiPut('/api/diary?date=' + dateStr, payload);
      if (res && res.success) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存 \uD83D\uDC95');
      } else if (state.useLocal) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存到本地 \uD83D\uDC95');
      } else {
        toast('保存失败，请重试');
      }
    } else {
      if (state.useLocal) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存 \uD83D\uDC95');
        return;
      }

      var res = await apiPost('/api/diary', payload);
      if (res && res.success) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存 \uD83D\uDC95');
      } else if (state.useLocal) {
        saveLocalDiary(dateStr, payload);
        state.currentDiary = payload;
        state.monthDiaries[dateStr] = payload.mood;
        renderCalendar();
        toast('已保存到本地 \uD83D\uDC95');
      } else {
        toast(res && res.message ? res.message : '保存失败');
      }
    }
  });

  $('prevMonth').addEventListener('click', function () {
    state.month--;
    if (state.month < 0) { state.month = 11; state.year--; }
    state.selectedDate = null;
    diarySection.style.display = 'none';
    loadMonthDiaries();
  });

  $('nextMonth').addEventListener('click', function () {
    state.month++;
    if (state.month > 11) { state.month = 0; state.year++; }
    state.selectedDate = null;
    diarySection.style.display = 'none';
    loadMonthDiaries();
  });

  initAuthor();
  loadMonthDiaries();
})();
