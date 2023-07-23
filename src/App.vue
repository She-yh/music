<script>
import * as echarts from "echarts/core";
import {
  TitleComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import { BarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import WaveSurfer from "wavesurfer.js";
import { reactive, watch } from "vue";
echarts.use([
  TitleComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  DataZoomComponent,
]);
let musicUrl =
  "https://mypage-1304169477.cos.ap-shanghai.myqcloud.com/The%20greatest%20works.mp3";
var audio, ctx, wavesurfer, panNode, biquadFilter;
var chartDom, myChart;
var dataAxis = new Array(64).fill(0).map((item, index) => (item = index));
var option = {
  grid: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  xAxis: {
    show: false,
    data: dataAxis,
  },
  dataZoom: [
    {
      type: "inside",
    },
  ],
  yAxis: { show: false },
  series: [
    {
      type: "bar",
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 1, color: "rgba(130,150,180,0.9)" },
          { offset: 0, color: "rgba(145,168,190,0.9)" },
        ]),
      },
      data: [],
      animation: false,
    },
  ],
};

export default {
  data() {
    return {
      fullscreenLoading: true,
      dialogVisible: true,
      dataArray: new Uint8Array(128).fill(0),
      zoomBar: 0,
      slideValue: 50,
    };
  },
  watch: {
    zoomBar(val) {
      wavesurfer.zoom(Number(val));
    },
    slideValue(val) {
      panNode.pan.setValueAtTime((val - 50) / 50, ctx.currentTime);
    },
  },
  methods: {
    playMusic() {
      // audio.play();
      wavesurfer.play();
      this.dialogVisible = false;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      biquadFilter = this.filters.map((cur) => {
        let bf = ctx.createBiquadFilter();
        bf.type = cur.type;
        bf.frequency.value = cur.freq;
        bf.gain.value = cur.gain;
        return bf;
      });
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      panNode = ctx.createStereoPanner();
      const source = ctx.createMediaElementSource(audio);
      source.connect(panNode);
      biquadFilter
        .reduce((pre, cur) => {
          pre.connect(cur);
          return cur;
        }, panNode)
        .connect(analyser);
      analyser.connect(ctx.destination);
      const render = () => {
        requestAnimationFrame(render);
        analyser.getByteFrequencyData(this.dataArray);
        option.series[0].data = Array.from(this.dataArray);
        option && myChart.setOption(option);
      };
      render();
    },
    uploadMusic() {
      var file = document.getElementById("input").files[0];
      document.getElementById("audio").pause();
      var fileReader = new FileReader();
      if (file) {
        this.fullscreenLoading = true;
        fileReader.readAsDataURL(file);
      }
      let that = this;
      fileReader.onloadend = function () {
        that.fullscreenLoading = false;
        document.getElementById("audio").src = fileReader.result;
        document.getElementById("audio").play();
      };
    },
    wakeInput() {
      this.$refs.fileRef.dispatchEvent(new MouseEvent("click"));
    },
  },
  setup() {
    const filters = reactive([
      {
        name: "64",
        freq: 64,
        type: "lowshelf",
        gain: 0,
      },
      {
        name: "125",
        freq: 125,
        type: "peaking",
        gain: 0,
      },
      {
        name: "250",
        freq: 250,
        type: "peaking",
        gain: 0,
      },
      {
        name: "500",
        freq: 500,
        type: "peaking",
        gain: 0,
      },
      {
        name: "1k",
        freq: 1000,
        type: "peaking",
        gain: 0,
      },
      {
        name: "2k",
        freq: 2000,
        type: "peaking",
        gain: 0,
      },
      {
        name: "4k",
        freq: 4000,
        type: "highshelf",
        gain: 0,
      },
    ]);
    watch(
      filters,
      (newVal) => {
        newVal.forEach((item, index) => {
          biquadFilter[index].gain.value = item.gain;
        });
      },
      {
        deep: true,
      }
    );
    return {
      filters,
    };
  },
  mounted() {
    audio = document.getElementById("audio");
    audio.src = musicUrl;
    wavesurfer = WaveSurfer.create({
      container: "#waveContainer",
      scrollParent: true,
      autoCenter: false,
      fillParent: true,
      hideScrollbar: false,
      removeMediaElementOnDestroy: false,
      backend: "MediaElement",
      splitChannels: true,
    });
    wavesurfer.load(audio);
    document.getElementById("waveContainer").oninput = () => {
      wavesurfer.zoom(Number(this.value));
    };
    chartDom = document.getElementById("fftBar");
    myChart = echarts.init(chartDom);
    wavesurfer.on("waveform-ready", () => {
      this.fullscreenLoading = false;
    });

    window.addEventListener("resize", () => {
      myChart.resize();
    });
    const zoomSize = 30;
    myChart.on("click", function (params) {
      myChart.dispatchAction({
        type: "dataZoom",
        startValue: dataAxis[Math.max(params.dataIndex - zoomSize / 2, 0)],
        endValue: dataAxis[Math.min(params.dataIndex + zoomSize / 2, 128 - 1)],
      });
    });
  },
};
</script>

<template>
  <section v-loading.fullscreen.lock="fullscreenLoading" class="mainContainer">
    <div id="waveContainer"></div>
    <section id="down-container">
      <div id="fftBar"></div>
      <div id="controls-container">
        <div id="controls-top">
          <input type="file" ref="fileRef" id="input" @change="uploadMusic" />
          <el-button id="upload" round type="primary" @click="wakeInput">
            <span> upload! </span>
          </el-button>
        </div>
        <div id="controls-middle">
          <div class="slider-demo-block">
            <span class="demonstration">zoom</span>
            <el-slider v-model="zoomBar" />
          </div>
          <div>
            <span class="demonstration">Channel</span>
            <div class="stereo-controler">
              <span style="margin-right: 8px">left</span>
              <el-slider v-model="slideValue" />
              <span style="margin-left: 8px">right</span>
            </div>
          </div>
        </div>
        <div id="controls-bottom">
          <div
            v-for="(item, index) of filters"
            :key="index"
            class="slider-container"
          >
            <el-slider
              vertical
              height="200px"
              v-model="item.gain"
              :min="-40"
              :max="40"
            />
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <audio id="audio" loop crossOrigin="anonymous"></audio>
    <el-dialog
      v-model="dialogVisible"
      :show-close="false"
      width="300px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <template #header> 介绍 </template>
      这将是一个音频处理网站，但尚在测试中，只开放部分功能，因为和声道相关，建议佩戴耳机使用。<br />
      <br />
      <br />
      现在开始体验吧！
      <template #footer>
        <el-button type="primary" @click="playMusic()">开始 !</el-button>
      </template>
    </el-dialog>
  </section>

  <section id="footer"></section>
</template>

<style scoped>
#input {
  display: none;
}
.slider-demo-block {
  width: 80px;
}
#down-container {
  display: flex;
  height: 350px;
  width: calc(100% - 32px);
  padding: 16px;
}
@media screen and (max-width: 400px) {
  #down-container {
    flex-direction: column;
  }
  #fftBar {
    height: 200px;
  }
}
#fftBar {
  box-shadow: 0 0 18px 5px rgb(83 83 83 / 20%);
  margin-right: 16px;
  height: 350px;
  flex: 0.5;
}
.slider-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
#controls-container {
  display: flex;
  min-width: 350px;
  flex-direction: column;
  flex: 0.5;
  justify-content: space-evenly;
  box-shadow: 0 0 18px 5px rgb(83 83 83 / 20%);
}
#controls-top {
  display: flex;
  justify-content: center;
}
#controls-middle {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}
#controls-bottom {
  display: flex;
  justify-content: space-evenly;
}
#upload {
  box-shadow: 0 0 18px 5px rgb(83 83 83 / 20%);
  background-color: rgb(55, 55, 55);
  backdrop-filter: saturate(180%) blur(20px);
  height: 32px;
  width: 80px;
  border: 0;
}
.mainContainer {
  display: flex;
  flex-direction: column;
}
#waveContainer {
  box-shadow: 0 0 18px 5px rgb(83 83 83 / 20%);
  width: calc(100%-32px);
  border-radius: 5px;
  margin: 16px;
}
.stereo-controler {
  display: flex;
  width: 180px;
}
</style>
