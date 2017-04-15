'use strict';

var IMAGE_BASE = 'images/';
var OUTER_FRAME_URLS = ['frame_top.png', 'frame_right.png', 'frame_bottom.png', 'frame_left.png'];

var LINES_URLS = ['line_thin.png', 'line_medium.png', 'line_thick.png'];

var LINE_THICKNESS = [2, 3, 4];

var OTHER_URLS = [
//'rod.png', 
//'rod_start.png',
//'rod_end.png',
'curtain.png'
//'curtain_fabric.jpeg'
];

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var hideElement = function hideElement(selector) {
  var doneHiding = false;
  var observer = new MutationObserver(function (mutations, observer) {
    if (doneHiding) return;
    // fired when a mutation occurs
    var priceElem = document.querySelector(selector);
    if (priceElem) {
      priceElem.style.cssText = 'display: none';
      doneHiding = true;
    }
  });

  // define what element should be observed by the observer
  // and what types of mutations trigger the callback
  observer.observe(document, {
    subtree: true,
    attributes: true
  });
};

// Price button
hideElement('div[slot="article-price"');

// Article choices
hideElement('form[name="articleChoices"]');
//
// Article quantity
hideElement('input[name="quantity"]');

var PIXEL_RATIO = function () {
  var ctx = document.createElement("canvas").getContext("2d"),
      dpr = window.devicePixelRatio || 1,
      bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;

  return dpr / bsr;
}();

var _rescaleCanvas = function _rescaleCanvas(canvas) {
  // finally query the various pixel ratios
  var ctx = canvas.getContext('2d');

  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
  var ratio = devicePixelRatio / backingStoreRatio;

  // upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {

    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter
    // the fact that we've manually scaled
    // our canvas element
    //ctx.scale(ratio, ratio);
  }
};

var floorRect = function floorRect(r) {
  return {
    x: Math.floor(r.x),
    y: Math.floor(r.y),
    width: Math.floor(r.width),
    height: Math.floor(r.height)
  };
};

var drawRect = function drawRect(ctx, r, name) {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.width, r.height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.font = "20px Georgia";
  ctx.fillText(name, r.x + r.width / 2 - ctx.measureText(name).width / 2, r.y + r.height / 2);
};

var drawLineRect = function drawLineRect(ctx, lineIdx, linesImgs, rect) {
  var tl = [rect.x, rect.y];
  var tr = [rect.x + rect.width, rect.y];
  var br = [rect.x + rect.width, rect.y + rect.height];
  var bl = [rect.x, rect.y + rect.height];
  var lineIdx = 1;
  var img = linesImgs[lineIdx];
  var thickness = LINE_THICKNESS[lineIdx];
  drawLine(ctx, img, thickness, tl, tr);
  drawLine(ctx, img, thickness, tr, br);
  drawLine(ctx, img, thickness, br, bl);
  drawLine(ctx, img, thickness, bl, tl);
};

var expandRectBy = function expandRectBy(r, extra) {
  var exp = JSON.parse(JSON.stringify(r));
  exp.x -= extra;
  exp.y -= extra;
  exp.width += 2 * extra;
  exp.height += 2 * extra;
  return exp;
};

var getInnerRects = function getInnerRects(r, cols, rows, padding) {
  var rects = [];
  var innerWidth = r.width / cols;
  var innerHeight = r.height / rows;
  for (var col = 0; col < cols; col++) {
    for (var row = 0; row < rows; row++) {
      rects.push(expandRectBy({
        x: r.x + innerWidth * col,
        y: r.y + innerHeight * row,
        width: innerWidth,
        height: innerHeight

      }, -padding));
    }
  }return rects;
};

var drawLine = function drawLine(ctx, lineImg, lineThickness, startPoint, endPoint) {
  if (lineImg == undefined) return;
  var dx = endPoint[0] - startPoint[0];
  var dy = endPoint[1] - startPoint[1];
  var angle = Math.atan2(dy, dx);
  ctx.translate(startPoint[0], startPoint[1]);
  ctx.rotate(angle);
  var width = Math.sqrt(dx * dx + dy * dy);
  var sideExtra = lineThickness / 4;
  var offset = Math.floor(Math.random() * (lineImg.width - width));
  ctx.drawImage(lineImg, offset, 0, width + 2 * sideExtra, lineImg.height, -sideExtra, -lineImg.height / 2, width + sideExtra * 2, lineImg.height);
  ctx.rotate(-angle);
  ctx.translate(-startPoint[0], -startPoint[1]);
};

var drawFramePiece = function drawFramePiece(ctx, img, wr, side, placeInner, lastPiece) {
  if (img == undefined) return;
  if (!placeInner) {
    var extra = side == 'left' || side == 'right' ? img.width : img.height;
    wr = expandRectBy(wr, extra);
  }
  var width = Math.min(img.width, wr.width) / (lastPiece ? 2 : 1);
  var height = Math.min(img.height, wr.height);
  var sourceX = side == 'bottom' ? img.width - width : 0;
  var sourceY = side == 'left' ? img.height - height : 0;
  var canvasX = wr.x + (side == 'right' ? wr.width - img.width : 0);
  var canvasY = wr.y + (side == 'bottom' ? wr.height - img.height : 0);
  ctx.drawImage(img, sourceX, sourceY, width, height, canvasX, canvasY, width, height);
};

var drawFrame = function drawFrame(ctx, wr, frameImages, placeInner) {
  drawFramePiece(ctx, frameImages[0], wr, 'top', placeInner);
  drawFramePiece(ctx, frameImages[1], wr, 'right', placeInner);
  drawFramePiece(ctx, frameImages[2], wr, 'bottom', placeInner);
  drawFramePiece(ctx, frameImages[3], wr, 'left', placeInner);
  drawFramePiece(ctx, frameImages[0], wr, 'top', placeInner, true);
};

var curveLengths = function curveLengths(amplitude, fullLength) {
  var ys = [];
  for (var x = 0; x < fullLength; x++) {
    ys.push(amplitude * Math.sin(x * 2 * 3.14 / fullLength));
  }

  var lengths = [];
  var length = 0;
  for (var x = 1; x < ys.length; x++) {
    var y1 = ys[x - 1];
    var y2 = ys[x];
    var dy = y2 - y1;
    var dx = 1;
    var dist = Math.sqrt(dx * dx + dy * dy);
    length += dist;
    lengths.push(length);
  }

  var derivatives = [];
  for (var x = 1; x < ys.length; x++) {
    var y1 = ys[x - 1];
    var y2 = ys[x];
    var dy = y2 - y1;
    derivatives.push(dy / dx);
  }

  return {
    lengths: lengths,
    derivatives: derivatives
  };
};

var curveLengthsForAmplitude = {};

var getCurveLengthsForAmplitude = function getCurveLengthsForAmplitude(A, v) {
  if (!(A in curveLengthsForAmplitude)) {
    // Note: pocketLength doesn't change
    var pocketLength = Math.floor(v.cmToPixels * 2 * v.pocketLength);
    curveLengthsForAmplitude[A] = curveLengths(A, pocketLength);
  }
  return curveLengthsForAmplitude[A];
};

var getImageData = function getImageData(img) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  if (img == null) return null;
  canvas.width = img.width;
  canvas.height = img.height;
  context.drawImage(img, 0, 0);
  return context.getImageData(0, 0, img.width, img.height);
};

var drawCurtain = function drawCurtain(ctx, panel, v, f, curtainImg, lineIdx, lineImages, transform, shadingNormal) {
  if (curtainImg == null || lineImages[lineIdx] == null) return;

  var numPockets = Math.floor(v.panelWidth / v.pocketLength);
  var adjustedPocketLength = Math.floor(v.panelWidth / numPockets);

  var A = Math.floor(f * 5); // curtain depth amplitude

  var lengths = getCurveLengthsForAmplitude(A, v).lengths;
  var derivatives = getCurveLengthsForAmplitude(A, v).derivatives;

  var panelCurveWidth = lengths[panel.width % lengths.length] + Math.floor(panel.width / lengths.length) * lengths[lengths.length - 1];
  panelCurveWidth = Math.floor(panelCurveWidth);

  var curtainCanvas = document.createElement('canvas');
  curtainCanvas.width = panelCurveWidth;
  curtainCanvas.height = panel.height;
  var curtainCtx = curtainCanvas.getContext('2d');
  // Clear with white
  curtainCtx.fillStyle = "white";
  curtainCtx.fillRect(0, 0, panelCurveWidth, panel.height);
  // Draw the top and bottom line, so that they can be waveified
  var t = LINE_THICKNESS[lineIdx];
  curtainCtx.drawImage(curtainImg, 0, t, panelCurveWidth, panel.height - 2 * t);
  var clp = [// curtain line points
  [t, t], [panelCurveWidth - t, t], [panelCurveWidth - t, panel.height - t], [t, panel.height - t]];
  drawLine(curtainCtx, lineImages[lineIdx], LINE_THICKNESS[lineIdx], clp[0], clp[1]);
  drawLine(curtainCtx, lineImages[lineIdx], LINE_THICKNESS[lineIdx], clp[3], clp[2]);
  var curtainImg = curtainCtx.getImageData(0, 0, panelCurveWidth, panel.height);

  var imgdata = ctx.getImageData(0, 0, panel.width, panel.height);
  var imgdatalen = imgdata.data.length;
  for (var i = 0; i < imgdatalen / 4; i++) {
    for (var k = 0; k < 4; k++) {
      imgdata.data[4 * i + k] = 255;
    }var pixelIdx = Math.floor(i);
    var yIdx = Math.floor(pixelIdx / panel.width);
    var xIdx = Math.floor(pixelIdx - yIdx * panel.width);
    var coord = transform(xIdx, yIdx);
    var curtainNormal = shadingNormal(xIdx, yIdx);

    var baseIdx = 4 * (coord.x % curtainImg.width + curtainImg.width * (coord.y % curtainImg.height));

    for (var k = 0; k < 3; k++) {
      var c = curtainImg.data[baseIdx + k];
      var norm = Math.sqrt(Math.pow(curtainNormal[0], 2) + Math.pow(curtainNormal[1], 2));
      curtainNormal[0] /= norm;
      curtainNormal[1] /= norm;

      var lightNormal = [1, -1];
      norm = Math.sqrt(Math.pow(lightNormal[0], 2) + Math.pow(lightNormal[1], 2));
      lightNormal[0] /= norm;
      lightNormal[1] /= norm;

      var diffuseLight = 0.1 * (curtainNormal[0] * lightNormal[0] + curtainNormal[1] * lightNormal[1]);
      var ambientLight = 0.9;
      var finalColor = (diffuseLight + ambientLight) * c;
      finalColor = Math.min(255, finalColor);

      // If curtain alpha is not fully opaque, then we don't want diffuse lighting
      if (curtainImg.data[baseIdx + 3] != 255) finalColor = c;

      imgdata.data[4 * i + k] = finalColor;
    }

    imgdata.data[4 * i + 3] = 255;
  }

  ctx.putImageData(imgdata, panel.x, panel.y);

  // Draw the side-lines of the curtain
  drawLine(ctx, lineImages[lineIdx], LINE_THICKNESS[lineIdx], [panel.x + t, panel.y + t], [panel.x + t, panel.y + panel.height - t]);
  drawLine(ctx, lineImages[lineIdx], LINE_THICKNESS[lineIdx], [panel.x + panel.width - t, panel.y + t], [panel.x + panel.width - t, panel.y + panel.height - t]);
};

Vue.component('curtain-options', {
  template: '\
  <div>\
    <div class="row">\
      <h4>How many panels?</h4>\
      <div class="radio">\
        <label>\
          <input type="radio" name="panelRadios" value="1" v-model="numPanels">\
          1\
        </label>\
      </div>\
      <div class="radio">\
        <label>\
          <input type="radio" name="panelRadios" value="2" v-model="numPanels">\
          2\
        </label>\
      </div>\
    </div>\
    <div class="row">\
      <div class="col-md-4">\
        <h4>Current price: {{price}} SEK</h4>\
        <div class="row">\
          <div class="form-group">\
            <div class="input-group">\
              <input v-model="panelWidth" type="number" min="1" step="1" class="form-control" placeholder="Width">\
              <div class="input-group-addon">cm</div>\
            </div>\
            <div class="input-group">\
              <input v-model="panelHeight" type="number" min="1" step="1" class="form-control" placeholder="Height">\
              <div class="input-group-addon">cm</div>\
            </div>\
          </div>\
          <div class="input-group">\
            <input v-model="closedFullness" type="number" min="1" max="2" step="0.5" class="form-control" placeholder="Fullness">\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios" value="wall" v-model="mountType">\
              Wall mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios" value="ceil" v-model="mountType">\
              Ceiling mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="rodpocket" v-model="hangingType">\
              Rod pocket\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="plait2fold" v-model="hangingType">\
              French plait 2-fold\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="plait3fold" v-model="hangingType">\
              French plait 3-fold\
            </label>\
          </div>\
        </div>\
      </div>\
      <div class="col-lg-4">\
       <canvas v-draw-canvas="all" v-bind:width="canvasWidth" v-bind:height="canvasHeight">\
       </canvas>\
      </div>\
    </div>\
    <img id="curtainImg" src="right.png" style="display: none" />\
  </div>\
  ',
  data: function data() {
    return {
      // affects price
      numPanels: 2,
      panelWidth: 100,
      panelHeight: 280,
      mountType: 'wall',
      hangingType: 'rodpocket',
      closedFullness: 1.5,
      // affects style
      cmToPixels: 3,
      pocketLength: 8,
      ceilingHeight: 300,
      curtainToFloor: 3,
      rodToCurtain: 5,
      wallToCurtain: 20,
      windowAreaWidth: 84 + 2 * 45 / 3,
      windowAreaHeight: 146 + 2 * 45 / 3,
      windowSillHeight: 70,
      canvasMinWidth: 400,
      canvasMinHeight: 300,
      canvasBuffer: 50,
      images: {}
    };
  },
  methods: {
    imgLoad: function imgLoad(event) {
      self = this;
      OUTER_FRAME_URLS.concat(LINES_URLS).concat(OTHER_URLS).forEach(function (url) {
        var img = new Image();
        img.src = IMAGE_BASE + url;
        img.onload = function () {
          Vue.set(self.images, url, img);
        };
      });
    }
  },
  created: function created(event) {
    this.imgLoad();
  },
  computed: {
    price: function price() {
      var widthMeters = this.panelWidth * this.closedFullness / 100;
      var heightMeters = this.panelHeight / 100;
      var meterPrice = 300;
      return Math.round(widthMeters * heightMeters * meterPrice);
    },
    all: function all() {
      var self = this;
      Object.keys(this.$data).forEach(function (key) {
        self[key];
      });
      return this.$data;
    },
    canvasWidth: function canvasWidth() {
      return PIXEL_RATIO * this.cmToPixels * (this.windowAreaWidth + 2 * this.panelWidth + 2 * this.canvasBuffer + 2 * this.wallToCurtain);
    },
    canvasHeight: function canvasHeight() {
      return PIXEL_RATIO * this.cmToPixels * (this.ceilingHeight + this.canvasBuffer * 2);
    }
  },
  directives: {
    rescaleCanvas: function rescaleCanvas(canvasElement, binding) {
      _rescaleCanvas(canvasElement);
    },
    drawCanvas: function drawCanvas(canvasElement, binding) {
      var v = binding.value;
      var w = canvasElement.width / PIXEL_RATIO;
      var h = canvasElement.height / PIXEL_RATIO;
      var f = v.cmToPixels;

      canvasElement.style.width = canvasElement.width / PIXEL_RATIO + 'px';
      canvasElement.style.height = canvasElement.height / PIXEL_RATIO + 'px';
      var ctx = canvasElement.getContext("2d");
      ctx.lineWidth = 1;
      ctx.clearRect(0, 0, w, h);

      var outerFrameImgs = OUTER_FRAME_URLS.map(function (url) {
        return v.images[url];
      });
      var linesImgs = LINES_URLS.map(function (url) {
        return v.images[url];
      });

      var wr = {
        x: w / 2 + f * (-v.windowAreaWidth / 2),
        y: h + f * (-v.windowAreaHeight - v.windowSillHeight - v.canvasBuffer),
        width: f * v.windowAreaWidth,
        height: f * v.windowAreaHeight
      };

      drawFrame(ctx, wr, outerFrameImgs, true);

      var frameWidth = (outerFrameImgs[0] || { 'height': 0 }).height;
      var innerRect = expandRectBy(wr, -frameWidth);
      var innerWindowRects = getInnerRects(innerRect, 2, 3, 5);
      innerWindowRects.forEach(drawLineRect.bind(null, ctx, 1, linesImgs));

      var p1r = floorRect({
        x: wr.x - f * v.panelWidth,
        y: h + f * (-v.panelHeight - v.curtainToFloor - v.canvasBuffer),
        width: f * v.panelWidth,
        height: f * v.panelHeight
      });

      var p2r = floorRect({
        x: wr.x + wr.width,
        y: p1r.y,
        width: f * v.panelWidth,
        height: f * v.panelHeight
      });

      var rod = floorRect({
        x: w / 2 + f * (-v.windowAreaWidth / 2 - v.panelWidth),
        y: h + f * (-v.curtainToFloor - v.panelHeight - v.rodToCurtain - v.canvasBuffer),
        width: f * (v.windowAreaWidth + 2 * v.panelWidth),
        height: f * 2.5
      });

      drawLineRect(ctx, 1, linesImgs, rod);

      var lineCoords = [
      // ceiling
      [[f * v.canvasBuffer, f * v.canvasBuffer], [w - f * v.canvasBuffer, f * v.canvasBuffer]],
      // floor
      [[f * v.canvasBuffer, h - f * v.canvasBuffer], [w - f * v.canvasBuffer, h - f * v.canvasBuffer]],
      // wall
      [[f * v.canvasBuffer, f * v.canvasBuffer], [f * v.canvasBuffer, h - f * v.canvasBuffer]], [[w - f * v.canvasBuffer, f * v.canvasBuffer], [w - f * v.canvasBuffer, h - f * v.canvasBuffer]],
      // 4 diagonal corners
      // TL
      [[0, 0], [f * v.canvasBuffer, f * v.canvasBuffer]],
      // TR
      [[w, h], [w - f * v.canvasBuffer, h - f * v.canvasBuffer]],
      // BL
      [[w, 0], [w - f * v.canvasBuffer, f * v.canvasBuffer]],
      // BR
      [[0, h], [f * v.canvasBuffer, h - f * v.canvasBuffer]]];

      lineCoords.forEach(function (line) {
        var lineIdx = 2;
        var img = linesImgs[lineIdx];
        var thickness = LINE_THICKNESS[lineIdx];
        drawLine(ctx, img, thickness, line[0], line[1]);
      });

      var A = Math.floor(f * 5);
      var lengths = getCurveLengthsForAmplitude(A, v).lengths;
      var derivatives = getCurveLengthsForAmplitude(A, v).derivatives;
      var transform = function transform(x, y) {
        var numWhole = Math.floor(x / lengths.length);
        var idx = x % lengths.length;
        var curveLength = lengths[idx] + numWhole * lengths[lengths.length - 1];
        return { x: Math.floor(curveLength), y: y };
      };

      var normal = function normal(x, y) {
        var idx = x % lengths.length;
        var deriv = derivatives[idx];
        return [deriv, -1];
      };
      drawCurtain(ctx, p1r, v, f, v.images['curtain.png'], 1, linesImgs, transform, normal);
      drawCurtain(ctx, p2r, v, f, v.images['curtain.png'], 1, linesImgs, transform, normal);
    }
  }
});

var vm = new Vue({
  el: '#app'
});

