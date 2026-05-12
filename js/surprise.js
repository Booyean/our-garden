(function () {
  if (!localStorage.getItem('our_garden_pwd')) {
    window.location.href = 'index.html';
    return;
  }

  var HER_NAME = APP_CONFIG.HER_NAME;
  var HIS_NAME = APP_CONFIG.HIS_NAME;

  var LINES = [
    { text: '正在初始化连接...', delay: 600 },
    { text: '连接成功。', delay: 400 },
    { text: '检测到用户：' + HER_NAME, delay: 600 },
    { text: '', delay: 300 },
    { text: '有一封未读消息，来自：' + HIS_NAME, delay: 800 },
    { text: '是否读取？[Y/n] Y', delay: 500 },
    { text: '', delay: 300 },
    { text: '加载中...', delay: 800 },
    { text: '', delay: 500 },
    { text: '\u2764\uFE0F 我想对你说：', delay: 1000 },
    { text: '', delay: 400 },
    { text: '每一行代码，都是我想你的证明。', delay: 800 },
    { text: '你是我的 0 errors, 0 warnings。', delay: 900 },
    { text: '唯一的 exception 是——', delay: 700 },
    { text: '没有你的时候，我会 crash。', delay: 800 },
    { text: '', delay: 500 },
    { text: '我爱你。', delay: 1200 },
  ];

  var terminal = document.getElementById('terminal');
  var escHint = document.getElementById('escHint');
  var cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function typeLine(text, delay) {
    if (delay === 0) {
      var p = document.createElement('p');
      p.innerHTML = text || '&nbsp;';
      terminal.appendChild(p);
      return;
    }
    var p = document.createElement('p');
    terminal.appendChild(p);
    terminal.appendChild(cursor);

    for (var i = 0; i < text.length; i++) {
      p.textContent += text.charAt(i);
      await sleep(40 + Math.random() * 30);
    }

    cursor.remove();
    await sleep(delay);
  }

  async function startTypewriter() {
    for (var i = 0; i < LINES.length; i++) {
      await typeLine(LINES[i].text, LINES[i].delay);
    }
    var endP = document.createElement('p');
    endP.style.opacity = '0.6';
    endP.textContent = '[按 ESC 退出]';
    terminal.appendChild(endP);
    escHint.style.display = 'block';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.location.href = 'photos.html';
    }
  });

  startTypewriter();
})();
