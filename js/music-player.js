/**
 * 背景音乐系统 - 跨页面播放
 * 方案：localStorage 保存播放状态，页面切换时恢复
 * 切换时会有短暂中断（~1-2 秒），这是多页面架构的权衡
 */

(function () {
  var STORAGE_KEY = 'our_garden_music';

  var defaultState = {
    playing: false,
    trackIdx: 0,
    position: 0,
    volume: 0.5,
    shuffle: false
  };

  function loadState() {
    try { var s = JSON.parse(localStorage.getItem(STORAGE_KEY)); return s || JSON.parse(JSON.stringify(defaultState)); }
    catch (e) { return JSON.parse(JSON.stringify(defaultState)); }
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  window.MusicPlayer = {
    state: loadState(),
    audio: null,
    playlist: [],

    init: function (playlist) {
      if (!playlist || playlist.length === 0) return;
      this.playlist = playlist;
      this._createAudio();
      this._injectUI();
      this._bindEvents();
      this._restorePlayback();
      this._startStateSaver();
      this._resumeOnInteraction();
    },

    start: function () {
      this.state.playing = true;
      saveState(this.state);
      this._syncUI();
      this.audio.play().catch(function () {});
    },

    _createAudio: function () {
      if (this.audio) {
        this.audio.pause();
        this.audio.remove();
      }
      var audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.volume = this.state.volume;
      document.body.appendChild(audio);

      audio.addEventListener('ended', this._onEnded.bind(this));
      audio.addEventListener('error', this._onError.bind(this));
      audio.addEventListener('loadedmetadata', this._onLoaded.bind(this));

      this.audio = audio;
    },

    _restorePlayback: function () {
      var self = this;
      var track = this.playlist[this.state.trackIdx];
      if (!track) return;

      this.audio.src = track.src;
      this._updateTrackDisplay();

      if (this.state.position > 0.5) {
        var onSeeked = function () {
          self.audio.removeEventListener('seeked', onSeeked);
          if (self.state.playing) {
            self.audio.play().then(function () {
              self._syncUI();
            }).catch(function () {
              self.state.playing = false;
              self._syncUI();
            });
          }
        };
        this.audio.addEventListener('seeked', onSeeked);
        this.audio.addEventListener('loadedmetadata', function () {
          self.audio.currentTime = self.state.position;
        }, { once: true });
      } else if (this.state.playing) {
        this.audio.play().then(function () {
          self._syncUI();
        }).catch(function () {
          self.state.playing = false;
          self._syncUI();
        });
      }

      this._syncUI();
    },

    _resumeOnInteraction: function () {
      var self = this;
      if (self._interactionHandler) return;
      self._interactionHandler = function () {
        if (self.audio && self.audio.src && self.state.playing && self.audio.paused) {
          self.audio.play().catch(function () {});
        }
      };
      document.addEventListener('click', self._interactionHandler, { once: false });
    },

    play: function () {
      this.state.playing = true;
      saveState(this.state);
      this.audio.play().then(function () {}.bind(this)).catch(function () {
        this.state.playing = false;
        saveState(this.state);
        this._resumeOnInteraction();
      }.bind(this));
      this._syncUI();
    },

    pause: function () {
      this.state.playing = false;
      saveState(this.state);
      this.audio.pause();
      this._syncUI();
    },

    toggle: function () {
      if (this.state.playing) this.pause(); else this.play();
    },

    next: function () {
      if (this.playlist.length === 0) return;
      var len = this.playlist.length;

      if (this.state.shuffle) {
        var nextIdx;
        do { nextIdx = Math.floor(Math.random() * len); }
        while (nextIdx === this.state.trackIdx && len > 1);
        this.state.trackIdx = nextIdx;
      } else {
        this.state.trackIdx = (this.state.trackIdx + 1) % len;
      }

      this.state.position = 0;
      saveState(this.state);
      this.audio.src = this.playlist[this.state.trackIdx].src;
      this._updateTrackDisplay();

      if (this.state.playing) {
        this.audio.play().catch(function () {});
      }
      this._syncUI();
    },

    prev: function () {
      if (this.playlist.length === 0) return;
      var len = this.playlist.length;
      if (this.audio.currentTime > 3) {
        this.audio.currentTime = 0;
      } else {
        this.state.trackIdx = (this.state.trackIdx - 1 + len) % len;
        this.state.position = 0;
        saveState(this.state);
        this.audio.src = this.playlist[this.state.trackIdx].src;
        if (this.state.playing) this.audio.play().catch(function () {});
      }
      this._updateTrackDisplay();
      this._syncUI();
    },

    toggleShuffle: function () {
      this.state.shuffle = !this.state.shuffle;
      saveState(this.state);
      this._syncUI();
    },

    setVolume: function (v) {
      this.state.volume = Math.max(0, Math.min(1, v));
      this.audio.volume = this.state.volume;
      saveState(this.state);
      if (this._volSlider) this._volSlider.value = this.state.volume;
    },

    _onEnded: function () {
      this.next();
    },

    _onError: function () {
      this._updateTrackDisplay('🎵 加载失败');
    },

    _onLoaded: function () {
      this._updateTrackDisplay();
    },

    _updateTrackDisplay: function (override) {
      var name = override;
      if (!name) {
        var track = this.playlist[this.state.trackIdx];
        name = track ? (track.name || track.src.split('/').pop()) : '🎵 无音乐';
      }
      if (this._trackLabel) this._trackLabel.textContent = name;
    },

    _startStateSaver: function () {
      var self = this;
      setInterval(function () {
        if (self.audio && !self.audio.paused) {
          self.state.position = self.audio.currentTime;
          saveState(self.state);
        }
      }, 1000);
    },

    _injectUI: function () {
      if (document.getElementById('musicWidget')) return;

      var html = ''
        + '<div class="music-widget" id="musicWidget">'
        + '  <button class="music-toggle-btn" id="musicToggleBtn" title="播放/暂停">🎵</button>'
        + '  <div class="music-panel" id="musicPanel">'
        + '    <span class="music-track-name" id="musicTrackName">🎵</span>'
        + '    <div class="music-controls">'
        + '      <button class="music-btn" id="musicPrevBtn" title="上一首">⏮️</button>'
        + '      <button class="music-btn music-btn-play" id="musicPlayBtn" title="播放/暂停">▶️</button>'
        + '      <button class="music-btn" id="musicNextBtn" title="下一首">⏭️</button>'
        + '      <button class="music-btn" id="musicShuffleBtn" title="随机播放">🔀</button>'
        + '      <button class="music-btn" id="musicListBtn" title="歌单">📋</button>'
        + '    </div>'
        + '    <div class="music-volume-row">'
        + '      <span>🔈</span>'
        + '      <input type="range" class="music-volume" id="musicVolume" min="0" max="1" step="0.05">'
        + '    </div>'
        + '    <div class="music-playlist" id="musicPlaylist" style="display:none;"></div>'
        + '  </div>'
        + '</div>';

      document.body.insertAdjacentHTML('beforeend', html);

      var self = this;
      this._trackLabel = document.getElementById('musicTrackName');
      this._volSlider = document.getElementById('musicVolume');
      this._volSlider.value = this.state.volume;

      this._syncUI();
    },

    _bindEvents: function () {
      var self = this;

      document.getElementById('musicToggleBtn').addEventListener('click', function () {
        var panel = document.getElementById('musicPanel');
        panel.classList.toggle('open');
      });

      document.getElementById('musicPlayBtn').addEventListener('click', function () {
        self.toggle();
      });

      document.getElementById('musicNextBtn').addEventListener('click', function () {
        self.next();
      });

      document.getElementById('musicPrevBtn').addEventListener('click', function () {
        self.prev();
      });

      document.getElementById('musicShuffleBtn').addEventListener('click', function () {
        self.toggleShuffle();
      });

      document.getElementById('musicListBtn').addEventListener('click', function () {
        self._togglePlaylist();
      });

      document.getElementById('musicVolume').addEventListener('input', function () {
        self.setVolume(parseFloat(this.value));
      });

      window.addEventListener('beforeunload', function () {
        if (self.audio && !self.audio.paused) {
          self.state.position = self.audio.currentTime;
          self.state.playing = true;
        } else {
          self.state.playing = false;
        }
        saveState(self.state);
      });

      this._updateTrackDisplay();
    },

    _togglePlaylist: function () {
      var list = document.getElementById('musicPlaylist');
      if (list.style.display === 'none') {
        list.innerHTML = '';
        for (var i = 0; i < this.playlist.length; i++) {
          var item = document.createElement('div');
          item.className = 'music-playlist-item';
          if (i === this.state.trackIdx) item.classList.add('active');
          item.textContent = (i + 1) + '. ' + this.playlist[i].name;
          item.addEventListener('click', (function (idx) {
            return function () { window.MusicPlayer._jumpTo(idx); };
          })(i));
          list.appendChild(item);
        }
        list.style.display = 'block';
      } else {
        list.style.display = 'none';
      }
    },

    _jumpTo: function (idx) {
      this.state.trackIdx = idx;
      this.state.position = 0;
      saveState(this.state);
      this.audio.src = this.playlist[idx].src;
      this._updateTrackDisplay();
      if (this.state.playing) this.audio.play().catch(function () {});
      this._syncUI();
      document.getElementById('musicPlaylist').style.display = 'none';
    },

    _syncUI: function () {
      var playBtn = document.getElementById('musicPlayBtn');
      var shuffleBtn = document.getElementById('musicShuffleBtn');
      var toggleBtn = document.getElementById('musicToggleBtn');

      if (playBtn) playBtn.textContent = this.state.playing ? '⏸️' : '▶️';
      if (shuffleBtn) shuffleBtn.style.opacity = this.state.shuffle ? '1' : '0.5';
      if (toggleBtn) toggleBtn.textContent = this.state.playing ? '🎶' : '🎵';
      if (this._volSlider) this._volSlider.value = this.state.volume;

      this._updateTrackDisplay();
    }
  };
})();
