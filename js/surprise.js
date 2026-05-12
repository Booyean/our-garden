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
    { text: '神女栖真，原托清波明性；仙郎践约，终成白首同心。', delay: 1000 },
    { text: '观夫沧溪改壑，岂怨东海扬尘？但看故地新人，便是星河不夜。', delay: 400 },
    { text: '灵均问天之道，早藏桑户琴中；', delay: 800 },
    { text: '义山寄雨之思，今化锦江春色。', delay: 900 },
    { text: '', delay: 800 },
    { text: '论世华如书，独爱一句；愿此生为读，常驻百年', delay: 700 },
    { text: '藏在这里的爱， 不会被老天爷发现吧？', delay: 800 },
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
