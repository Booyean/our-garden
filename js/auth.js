(function () {
  var STORAGE_KEY = 'our_garden_pwd';
  var form = document.getElementById('loginForm');
  var input = document.getElementById('passwordInput');
  var errorEl = document.getElementById('loginError');
  var subtitleEl = document.getElementById('loginSubtitle');
  var hintEl = document.getElementById('loginHint');
  var submitBtn = document.getElementById('submitBtn');
  var card = document.getElementById('loginCard');

  var savedPwd = localStorage.getItem(STORAGE_KEY);
  var isFirstVisit = !savedPwd;

  if (isFirstVisit) {
    subtitleEl.textContent = '设定属于我们的密码 \uD83D\uDC95';
    submitBtn.textContent = '开启花园';
    hintEl.textContent = '首次访问，请设置一个只有你们知道的密码';
    input.placeholder = '设置密码...';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var pwd = input.value.trim();
    if (!pwd) {
      showError('请输入密码哦~');
      return;
    }
    if (isFirstVisit) {
      if (pwd.length < 2) {
        showError('密码至少 2 个字符~');
        return;
      }
      localStorage.setItem(STORAGE_KEY, pwd);
      _startMusicAndGo();
    } else {
      if (pwd === savedPwd) {
        _startMusicAndGo();
      } else {
        showError('密码不对哦，再想想？\uD83D\uDCAD');
        card.classList.add('shake');
        setTimeout(function () { card.classList.remove('shake'); }, 400);
        input.value = '';
        input.focus();
      }
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    setTimeout(function () { errorEl.textContent = ''; }, 3000);
  }

  function _startMusicAndGo() {
    var musicState = {
      playing: true,
      trackIdx: 0,
      position: 0,
      volume: (APP_CONFIG && APP_CONFIG.MUSIC ? APP_CONFIG.MUSIC.defaultVolume : 0.5),
      shuffle: false
    };
    localStorage.setItem('our_garden_music', JSON.stringify(musicState));
    window.location.href = 'diary.html';
  }

  createFloatingHearts();

  function createFloatingHearts() {
    var container = document.getElementById('floatingHearts');
    var hearts = ['\u2764', '\uD83E\uDE77', '\uD83D\uDC96', '\u2665', '\uD83C\uDF38'];
    for (var i = 0; i < 15; i++) {
      var heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.animationDuration = (8 + Math.random() * 12) + 's';
      heart.style.animationDelay = Math.random() * 10 + 's';
      heart.style.fontSize = (12 + Math.random() * 16) + 'px';
      container.appendChild(heart);
    }
  }
})();
