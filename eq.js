define("frequency-draw", ["require", "exports"], function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var LineDraw = /** @class */ (function () {
    function LineDraw() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 1024;
      this.canvas.height = 128;
      this.ctx = this.canvas.getContext("2d");
      this.backgroundColor = "#222222";
    }
    LineDraw.prototype.draw = function (analyser) {
      analyser.fftSize = 2048;
      var data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      var ctx = this.ctx;
      var el = ctx.canvas;
      var count = data.length;
      var w = el.width / count;
      var x = 0,
        v,
        y;
      ctx.save();
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.beginPath();
      for (var i = 0; i < count; i++) {
        v = data[i] / 128.0;
        y = (v * el.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += w;
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#DBDBDB";
      ctx.stroke();
      ctx.restore();
    };
    return LineDraw;
  })();
  exports.LineDraw = LineDraw;
  var BarDraw = /** @class */ (function () {
    function BarDraw() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 1280;
      this.canvas.height = 128;
      this.ctx = this.canvas.getContext("2d");
      this.backgroundColor = "#222222";
      this.gradient = this.ctx.createLinearGradient(
        0,
        0,
        0,
        this.canvas.height
      );
      this.gradient.addColorStop(0, "#ff4446");
      this.gradient.addColorStop(1, "#4446ff");
    }
    BarDraw.prototype.draw = function (analyser) {
      analyser.fftSize = 256;
      var data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      var ctx = this.ctx;
      var el = ctx.canvas;
      var count = data.length;
      ctx.save();
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.transform(1, 0, 0, -1, 0, el.height);
      ctx.fillStyle = this.gradient;
      var w = el.width / count;
      var x = 0,
        h = 0,
        v = 0;
      for (var i = 0; i < data.length; i++) {
        v = data[i] / 0xff;
        h = v * el.height;
        ctx.fillRect(x + 1, 0, w - 2, h);
        x += w;
      }
      ctx.restore();
    };
    return BarDraw;
  })();
  exports.BarDraw = BarDraw;
});
define("equalizer", ["require", "exports"], function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var EqualizerFilter = /** @class */ (function () {
    function EqualizerFilter(frequencys) {
      this.frequencys = frequencys;
      this.count = frequencys.length;
      this.filters = new Array(this.count);
    }
    EqualizerFilter.prototype.init = function (ac) {
      var filter,
        i = 0;
      for (i = 0; i < this.count; i++) {
        filter = ac.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = this.frequencys[i];
        this.filters[i] = filter;
        if (this.filters[i - 1]) {
          this.filters[i - 1].connect(this.filters[i]);
        }
      }
    };
    Object.defineProperty(EqualizerFilter.prototype, "first", {
      get: function () {
        return this.filters[0];
      },
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(EqualizerFilter.prototype, "last", {
      get: function () {
        return this.filters[this.count - 1];
      },
      enumerable: true,
      configurable: true,
    });
    return EqualizerFilter;
  })();
  exports.EqualizerFilter = EqualizerFilter;
  var Equalizer = /** @class */ (function () {
    function Equalizer() {
      this.presets = {
        Manual: { name: "Manual", values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        Dance: { name: "Dance", values: [5, 2, 0, -10, -5, 0, 6, 12, 11, 10] },
        Rap: { name: "Rap", values: [-13, -9, -4, 2, 8, 12, 2, -11, -2, 8] },
        Metal: { name: "Metal", values: [12, 7, -3, 4, 13, 8, 3, -3, 8, 12] },
        Jazz: { name: "Jazz", values: [-8, 6, 0, 8, -8, 10, -2, 13, 8, 1] },
        SoftRock: {
          name: "SoftRock",
          values: [5, 5, 2, -2, -8, -12, -4, 0, 7, 9],
        },
        Rock: { name: "Rock", values: [6, 3, -8, -12, -4, 3, 8, 10, 10, 7] },
        Live: { name: "Live", values: [-6, 0, 4, 8, 9, 9, 5, 3, 2, 1] },
        Treble: {
          name: "Treble",
          values: [-10, -11, -12, -6, 2, 8, 13, 13, 11, 14],
        },
        Bass: { name: "Bass", values: [11, 7, 3, 0, 0, -6, -10, -10, -2, -2] },
        Classic: {
          name: "Classic",
          values: [0, 7, -1, -7, -12, -8, 0, 10, 4, -5],
        },
        Opera: {
          name: "Opera",
          values: [-13, -8, 0, 6, 14, 4, -4, -7, -8, -10],
        },
        Default: { name: "Default", values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      };
      // 100 200 400 600 1K 3K 6K 12K 14K 16K
      this.frequencys = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000];
      this.eqFilter = new EqualizerFilter(this.frequencys);
    }
    Equalizer.prototype.init = function (ac) {
      this.eqFilter.init(ac);
    };
    Equalizer.prototype.use = function (name) {
      var seq = this.presets[name] || this.presets[0];
      for (var i = 0; i < this.eqFilter.filters.length; i++) {
        this.eqFilter.filters[i].gain.value = seq.values[i];
      }
    };
    Equalizer.prototype.reset = function () {
      for (var i = 0; i < this.eqFilter.filters.length; i++) {
        this.eqFilter.filters[i].gain.value = 0;
      }
    };
    Equalizer.prototype.set = function (index, value) {
      this.eqFilter.filters[index].gain.value = value;
    };
    Equalizer.prototype.get = function (index) {
      return this.eqFilter.filters[index].gain.value;
    };
    Equalizer.prototype.connect = function (before, aftter) {
      if (this.eqFilter) {
        before.connect(this.eqFilter.first);
        this.eqFilter.last.connect(aftter);
      }
    };
    Equalizer.prototype.toString = function () {
      var values = [];
      for (var i = 0; i < this.eqFilter.filters.length; i++) {
        values[i] = this.eqFilter.filters[i].gain.value;
      }
      return values.toString();
    };
    return Equalizer;
  })();
  exports.Equalizer = Equalizer;
});
define("equalizer-ui", ["require", "exports"], function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var EqualizerUIItem = /** @class */ (function () {
    function EqualizerUIItem() {
      this.div = document.createElement("div");
      this.freq = document.createElement("span");
      this.input = document.createElement("input");
      this.label = document.createElement("span");
      this.div.className = "slide-wrapper";
      this.input.type = "range";
      this.input.min = "-20.0";
      this.input.max = "20.0";
      this.input.value = "0";
      this.freq.className = "scope";
      this.freq.textContent = "";
      this.label.className = "scope";
      this.label.textContent = this.input.value + " dB";
      this.div.appendChild(this.freq);
      this.div.appendChild(this.input);
      this.div.appendChild(this.label);
    }
    return EqualizerUIItem;
  })();
  exports.EqualizerUIItem = EqualizerUIItem;
  var EqualizerUI = /** @class */ (function () {
    function EqualizerUI(count) {
      this.el = document.createElement("div");
      this.el.className = "equalizer";
      this.comboxEqualizer = document.createElement("select");
      this.items = [];
      this.updateItems(count);
    }
    EqualizerUI.prototype.updateItems = function (count) {
      for (var i = 0; i < count; i++) {
        var item = this.createItem(i);
        this.el.appendChild(item.div);
        this.items[i] = item;
      }
    };
    EqualizerUI.prototype.createItem = function (index) {
      var _this = this;
      var item = new EqualizerUIItem();
      item.input.addEventListener(
        "input",
        function () {
          if (_this.update) {
            _this.update(item, index);
          }
        },
        false
      );
      return item;
    };
    return EqualizerUI;
  })();
  exports.EqualizerUI = EqualizerUI;
});
define("audio-player", [
  "require",
  "exports",
  "equalizer",
  "equalizer-ui",
], function (require, exports, equalizer_1, equalizer_ui_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var AudioPlayer = /** @class */ (function () {
    function AudioPlayer() {
      this.eq = new equalizer_1.Equalizer();
      this.ui = new equalizer_ui_1.EqualizerUI(this.eq.frequencys.length);
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.eq.init(this.audioCtx);
      for (var i = 0, item = void 0; i < this.ui.items.length; i++) {
        item = this.ui.items[i];
        if (this.eq.frequencys[i] > 1000) {
          item.freq.textContent =
            Math.floor(this.eq.frequencys[i] / 1000) + "K";
        } else {
          item.freq.textContent = this.eq.frequencys[i] + "";
        }
      }
    }
    Object.defineProperty(AudioPlayer.prototype, "width", {
      get: function () {
        return this.usedDraw ? this.usedDraw.canvas.width : 0;
      },
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(AudioPlayer.prototype, "height", {
      get: function () {
        return this.usedDraw ? this.usedDraw.canvas.height : 0;
      },
      enumerable: true,
      configurable: true,
    });
    AudioPlayer.prototype.useDraw = function (draw) {
      this.usedDraw = draw;
    };
    AudioPlayer.prototype.connect = function (media) {
      this.mediaSource = this.audioCtx.createMediaElementSource(media);
      if (this.eq) {
        this.eq.connect(this.mediaSource, this.analyser);
      } else {
        this.mediaSource.connect(this.analyser);
      }
      this.analyser.connect(this.audioCtx.destination);
    };
    AudioPlayer.prototype.sync = function (ctx) {
      if (this.usedDraw) {
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;
        ctx.drawImage(
          this.usedDraw.canvas,
          0,
          0,
          ctx.canvas.width,
          ctx.canvas.height
        );
      }
    };
    AudioPlayer.prototype.update = function () {
      if (this.usedDraw) {
        this.usedDraw.draw(this.analyser);
      }
    };
    return AudioPlayer;
  })();
  exports.AudioPlayer = AudioPlayer;
});
define("main", [
  "require",
  "exports",
  "frequency-draw",
  "audio-player",
], function (require, exports, frequency_draw_1, audio_player_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  function $id(id) {
    return document.getElementById(id);
  }
  function $$(selector) {
    return document.querySelector(selector);
  }
  function run() {
    var playBtn = $id("play");
    var f = $id("f");
    var fullscreen = $id("fullscreen");
    var equalizer = $id("equalizer");
    var video = $id("v");
    var canvas = $id("cv");
    var ctx = canvas.getContext("2d");
    var play = {
      src: "",
    };
    var comboxEqualizer = $id("combox-equalizer");
    var comboxDraw = $id("combox-draw");
    var audioPlayer = new audio_player_1.AudioPlayer();
    var lineDraw = new frequency_draw_1.LineDraw();
    var barDraw = new frequency_draw_1.BarDraw();
    var audioPlayerInited = false;
    audioPlayer.ui.update = function (item, index) {
      var val = +item.input.value;
      if (audioPlayer.eq) {
        audioPlayer.eq.set(index, val);
      }
      updateEq();
      comboxEqualizer.value = "Manual";
      item.label.textContent = val + " dB";
    };
    equalizer.appendChild(audioPlayer.ui.el);
    function initAudioPlayer() {
      if (audioPlayerInited) return;
      audioPlayer.useDraw(lineDraw);
      resetEq();
      updateEq();
      audioPlayer.connect(video);
      audioPlayerInited = true;
    }
    function resetEq() {
      if (audioPlayer.eq) {
        audioPlayer.eq.reset();
      }
    }
    function updateEq() {
      for (var i = 0; i < 10; i++) {
        var item = audioPlayer.ui.items[i];
        if (audioPlayer.eq) {
          item.input.value = audioPlayer.eq.get(i) + "";
          item.label.textContent = item.input.value + " dB";
        }
      }
    }
    function update() {
      if (!video.paused) {
        audioPlayer.update();
        audioPlayer.sync(ctx);
      }
      requestAnimationFrame(update);
    }
    function updatePlayBtn() {
      if (video.paused) {
        playBtn.textContent = "播放";
      } else {
        playBtn.textContent = "暂停";
      }
    }
    function init() {
      video.volume = 0.5;
      video.addEventListener(
        "play",
        function () {
          if (audioPlayer.audioCtx.state === "suspended") {
            audioPlayer.audioCtx.resume();
          }
          initAudioPlayer();
          updatePlayBtn();
        },
        false
      );
      video.addEventListener(
        "pause",
        function () {
          updatePlayBtn();
        },
        false
      );
      playBtn.addEventListener(
        "click",
        function () {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        },
        false
      );
      f.addEventListener(
        "input",
        function (e) {
          var file = f.files && f.files[0];
          f.value = "";
          if (!file) return;
          play.src = URL.createObjectURL(file);
          video.src = play.src;
          updatePlayBtn();
        },
        false
      );
      fullscreen.addEventListener(
        "click",
        function () {
          document.body.requestFullscreen();
        },
        false
      );
      comboxEqualizer.addEventListener(
        "input",
        function () {
          var val = comboxEqualizer.value;
          if (audioPlayer.eq) audioPlayer.eq.use(val);
          updateEq();
        },
        false
      );
      comboxDraw.addEventListener(
        "input",
        function () {
          var val = comboxDraw.value;
          if (val === "0") {
            audioPlayer.useDraw(lineDraw);
          } else if (val === "1") {
            audioPlayer.useDraw(barDraw);
          }
        },
        false
      );
      update();
    }
    init();
  }
  if (!AudioContext) {
    alert("your browser not support AudioContext.");
  } else {
    run();
  }
});

requirejs(["main"]);
