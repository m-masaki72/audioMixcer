var n;
var i;
var audioctx, source, buffet, IRBuffer, IRsource;
var panner, merger, delay, dry_d, wet_d, dry_r, wet_r, feedback, main, reverb;
var sensitivity;
var px, py, pz;
var stage;
var rec;
var preInstance;

function init() {
   //init any variable
   n = 2;
   source = new Array(n);
   buffer = new Array(n);
   audioctx = new AudioContext();
   panner = new Array(n);
   dry_d = new Array(n);
   wet_d = new Array(n);
   dry_r = new Array(n);
   wet_r = new Array(n);
   delay = new Array(n);
   merger = new Array(n);
   feedback = new Array(n);
   reverb = new Array(n);
   sensitivity = 3;
   px = new Array(n);
   py = new Array(n);
   pz = new Array(n);

   window.AudioContext = window.webkitAudioContext||window.AudioContext;

   initNodeParam();
   initNodeConnection();
   loadMP3();
   loadIR();
   initStage();
   initSliders();
   setup();
}

function initNodeParam(){
   /*
   ** webのフォーム情報から初期値を出しているので，初期値はhtml側から編集すること
   */
   for(i = 0; i < n; ++i){
      delay[i] = audioctx.createDelay();
      delay[i].delayTime.value = $("#delayTimeSlider").val();
      feedback[i] = audioctx.createGain();
      feedback[i].gain.value = $("#delayFeedbackSlider").val();
      dry_d[i] = audioctx.createGain();
      dry_d[i].gain.value = 1 - $("#delaySendRatioSlider").val();
      wet_d[i] = audioctx.createGain();
      wet_d[i].gain.value = $("#delaySendRatioSlider").val();
      merger[i] = audioctx.createGain();
      dry_r[i] = audioctx.createGain();
      dry_r[i].gain.value = 1 - $("#reverbSendRatioSlider").val();
      wet_r[i] = audioctx.createGain();
      wet_r[i].gain.value = $("#reverbSendRatioSlider").val();
      reverb[i] = audioctx.createConvolver();
      panner[i] = audioctx.createPanner();
   }
   main = audioctx.createGain();
}

function initNodeConnection(){

   for(i = 0; i < n; ++i){
      wet_d[i].connect(delay[i]);
      delay[i].connect(merger[i]);
      delay[i].connect(feedback[i]);
      feedback[i].connect(delay[i]);
      dry_d[i].connect(merger[i]);
      merger[i].connect(dry_r[i]);
      merger[i].connect(wet_r[i]);
      dry_r[i].connect(panner[i]);
      wet_r[i].connect(reverb[i]);
      reverb[i].connect(panner[i]);
      panner[i].connect(main);
   }
   main.connect(audioctx.destination);
}

function loadMP3(){
   for(i = 0; i < n; ++i){
      (function(){
         var li = i;
         var req = new XMLHttpRequest();
         if(li == 1){
            req.open("GET", "momoca.mp3", true);
         }else {
            req.open("GET", "momoca2.mp3", true);
         }
         req.responseType = "arraybuffer";
         req.onload = function() {
            if(req.response) {
               audioctx.decodeAudioData(req.response).then(function(b){buffer[li]=b;},function(){});
            }
         };
         req.send();
      })();
   }
}

function loadIR(){
   var req = new XMLHttpRequest();
   req.open("GET", "./IRdata/terrys_warehouse_omni.wav", true);
   req.responseType = "arraybuffer";
   req.onload = function() {
      if(req.response) {
         audioctx.decodeAudioData(req.response).then(function(b){
            IRBuffer=b;
            IRsource = audioctx.createBufferSource();
            IRsource.buffer = IRBuffer;
            for(i = 0; i < n; ++i){
               reverb[i].buffer = IRBuffer;
            }
         },function(){});
      }
   };
   req.send();
}

function initStage(){
   stage  = new createjs.Stage("demoCanvas");
   var back = new createjs.Bitmap("./fig/back.png");
   back.scaleX = stage.canvas.width / 512;
   back.scaleY = stage.canvas.height / 512;
   stage.addChild(back);

   for(i = 0; i < n; ++i){
      px[i] = py[i] = pz[i] = 0;
      var image = new createjs.Shape();
      image.graphics.beginFill("White");
      image.graphics.drawCircle(stage.canvas.width/2, stage.canvas.width/2, 15);
      image.id = i;
      image.alpha = 0.5;
      var t = new createjs.Text("OK");
      var container = new createjs.Container();
      container.addChild(image);
      container.addEventListener("mousedown", startDrag);
      stage.addChild(container);
   }
}

function initSliders(){
   $("#delayTimeSlider").on("input", function(){
      var delayTime = $(this).val();
      $("#delayTime").val(delayTime);
      delay[$("#trgIndex").val()].delayTime.value = delayTime;
   });
   $("#delayFeedbackSlider").on("input", function(){
      var feedbackValue = $(this).val();
      $("#delayFeedback").val(feedbackValue);
      feedback[$("#trgIndex").val()].gain.value = feedbackValue;
   });
   $("#delaySendRatioSlider").on("input", function(){
      var wet_dValue = $(this).val();
      $("#delaySendRatio").val(wet_dValue);
      wet_d[$("#trgIndex").val()].gain.value = wet_dValue;
      dry_d[$("#trgIndex").val()].gain.value = 1 - wet_dValue;
   });
   $("#reverbSendRatioSlider").on("input", function(){
      var wet_rValue = $(this).val();
      $("#reverbSendRatio").val(wet_rValue);
      wet_r[$("#trgIndex").val()].gain.value = wet_rValue;
      dry_r[$("#trgIndex").val()].gain.value = 1 - wet_rValue;
   });
}



function setup() {
   for(i = 0; i < n; i++)
   panner[i].panningModel = ["equalpower","HRTF"][document.getElementById("panmodel").selectedIndex];
   updatePage(0);
}

function updatePage(index) {
   stage.update();
   $("#trgIndex").val(index);
   $("#xpos").val(px[index]);
   $("#ypos").val(pz[index] * -1);
   $("#delayTimeSlider").val(delay[index].delayTime.value);
   $("#delayTime").val(delay[index].delayTime.value);
   $("#delayFeedbackSlider").val(feedback[index].gain.value);
   $("#delayFeedback").val(feedback[index].gain.value);
   $("#delaySendRatioSlider").val(wet_d[index].gain.value);
   $("#delaySendRatio").val(wet_d[index].gain.value);
   $("#reverbSendRatioSlider").val(wet_r[index].gain.value);
   $("#reverbSendRatio").val(wet_r[index].gain.value);
}

function playAudio() {
   for(i = 0; i < n; i++){
      if(source[i] == null) {
         source[i] = audioctx.createBufferSource();
         source[i].buffer = buffer[i];
         source[i].loop = true;
         source[i].connect(dry_d[i]);
         source[i].connect(wet_d[i]);
         source[i].start();
      }
   }
}

function stopAudio() {
   for(i = 0; i < n; i++){
      if(source[i] != null) {
         source[i].stop();
         source[i] = null;
      }
   }
}


/*
*  Dragfunction
*/
function startDrag(eventObject) {
   var instance = eventObject.target;
   console.log(instance);
   instance.addEventListener("pressmove", drag);
   instance.addEventListener("pressup", stopDrag);
   instance.offset = new createjs.Point(instance.x - eventObject.stageX, instance.y - eventObject.stageY);
   if(preInstance) preInstance.alpha = 0.5;
   instance.alpha = 1;
   preInstance = instance;
}

function drag(eventObject) {
   var instance = eventObject.target;
   var offset = instance.offset;
   var id = instance.id;
   instance.x = eventObject.stageX + offset.x;
   instance.y = eventObject.stageY + offset.y;
   px[id] = eventObject.stageX/stage.canvas.width * 2 - 1;
   pz[id] = eventObject.stageY/stage.canvas.height * 2 - 1;
   panner[id].setPosition(px[id] * sensitivity, 0, pz[id] * sensitivity);
   updatePage(id);
}

function stopDrag(eventObject) {
   var instance = eventObject.target;
   instance.removeEventListener("pressmove", drag);
   instance.removeEventListener("pressup", stopDrag);
}

/*
* recording function
*/
function startRecording(){
   rec = new Recorder(main);
   rec.record();
}
function endRecording(){
   rec.stop();
   rec.exportWAV(createDownloadLink);
}

function createDownloadLink() {
   rec.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      var hf = document.createElement('a');

      au.controls = true;
      au.src = url;
      hf.href = url;
      hf.download = new Date().toISOString() + '.wav';
      hf.innerHTML = hf.download;
      li.appendChild(au);
      li.appendChild(hf);
      $("body").append(li);
   });
}

//常にキャンバスを更新する
createjs.Ticker.on("tick",function(){
   if(stage)
   stage.update();
});
