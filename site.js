'use strict';

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
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.font = "20px Georgia";
  ctx.fillText(name, r.x + r.width / 2 - ctx.measureText(name).width / 2, r.y + r.height / 2);
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

var getImageData = function getImageData(img) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  if (img == null) return null;
  canvas.width = img.width;
  canvas.height = img.height;
  context.drawImage(img, 0, 0);
  return context.getImageData(0, 0, img.width, img.height);
};

var drawCurtain = function drawCurtain(ctx, panel, v, f, baseimg) {
  if (baseimg == null) return;

  var numPockets = Math.floor(v.panelWidth / v.pocketLength);
  var adjustedPocketLength = Math.floor(v.panelWidth / numPockets);

  var fullPocketLenghtPx = Math.floor(f * 2 * v.pocketLength);
  var A = Math.floor(f * 5); // curtain depth amplitude
  if (!(A in curveLengthsForAmplitude)) {
    // Note: pocketLength doesn't change
    curveLengthsForAmplitude[A] = curveLengths(A, fullPocketLenghtPx);
  }

  var lengths = curveLengthsForAmplitude[A].lengths;
  var derivs = curveLengthsForAmplitude[A].derivatives;

  var imgdata = ctx.getImageData(0, 0, panel.width, panel.height);
  var imgdatalen = imgdata.data.length;
  for (var i = 0; i < imgdatalen / 4; i++) {
    for (var k = 0; k < 4; k++) {
      imgdata.data[4 * i + k] = 255;
    }var pixelIdx = Math.floor(i);
    var yIdx = Math.floor(pixelIdx / panel.width);
    var xIdx = Math.floor(pixelIdx - yIdx * panel.width);
    var numWhole = Math.floor(xIdx / lengths.length);
    var idx = xIdx % lengths.length;
    var curveLength = lengths[idx] + numWhole * lengths[lengths.length - 1];
    var x = curveLength;
    var baseIdx = 4 * (Math.floor(x + 200) % baseimg.width + baseimg.width * (yIdx % baseimg.height));

    for (var k = 0; k < 3; k++) {
      var c = baseimg.data[baseIdx + k];
      var deriv = derivs[idx];
      var curtainNormal = [deriv, -1];
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

      imgdata.data[4 * i + k] = finalColor;
    }

    imgdata.data[4 * i + 3] = 255;
  }

  ctx.putImageData(imgdata, panel.x, panel.y);
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
      panelHeight: 240,
      mountType: 'wall',
      hangingType: 'rodpocket',
      closedFullness: 1.5,
      // affects style
      cmToPixels: 1.5,
      pocketLength: 8,
      ceilingHeight: 300,
      curtainToFloor: 3,
      rodToCurtain: 5,
      wallToCurtain: 20,
      windowAreaWidth: 84 * 2,
      windowAreaHeight: 146,
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
      ['left.png', 'right.png', 'top.png', 'bottom.png', 'left_inner.png', 'right_inner.png', 'top_inner.png', 'bottom_inner.png'].forEach(function (url) {
        var img = new Image();
        img.src = url;
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
      return this.cmToPixels * (this.windowAreaWidth + 2 * this.panelWidth + 2 * this.canvasBuffer + 2 * this.wallToCurtain);
    },
    canvasHeight: function canvasHeight() {
      return this.cmToPixels * (this.ceilingHeight + this.canvasBuffer * 2);
    }
  },
  directives: {
    drawCanvas: function drawCanvas(canvasElement, binding) {
      var v = binding.value;
      var w = canvasElement.width;
      var h = canvasElement.height;
      var f = v.cmToPixels;
      var ctx = canvasElement.getContext("2d");
      ctx.lineWidth = 1;
      ctx.translate(0.5, 0.5);
      ctx.clearRect(0, 0, w, h);

      var wr = {
        x: w / 2 + f * (-v.windowAreaWidth / 2),
        y: h + f * (-v.windowAreaHeight - v.windowSillHeight - v.canvasBuffer),
        width: f * v.windowAreaWidth,
        height: f * v.windowAreaHeight
      };

      var outerFrameUrls = ['top.png', 'right.png', 'bottom.png', 'left.png'];
      var innerFrameUrls = ['top_inner.png', 'right_inner.png', 'bottom_inner.png', 'left_inner.png'];
      var outerFrameImgs = outerFrameUrls.map(function (url) {
        return v.images[url];
      });
      var innerFrameImgs = innerFrameUrls.map(function (url) {
        return v.images[url];
      });

      drawFrame(ctx, wr, outerFrameImgs, false);
      var innerWindowRects = getInnerRects(wr, 3, 2, 5);
      innerWindowRects.forEach(function (innerRect) {
        drawFrame(ctx, innerRect, innerFrameImgs, true);
      });

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
        height: f * 1
      });

      //drawRect(ctx, wr, 'window');
      drawRect(ctx, rod, 'rod');

      // Draw the ceiling, floor and wall lines
      // Ceiling line
      ctx.beginPath();
      ctx.moveTo(f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.lineTo(w - f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.stroke();
      // Floor line
      ctx.beginPath();
      ctx.moveTo(f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.lineTo(w - f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.stroke();
      // Wall lines
      ctx.beginPath();
      ctx.moveTo(f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.lineTo(f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w - f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.lineTo(w - f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.stroke();

      // 4 diagonal corners
      // TL
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(w, h);
      ctx.lineTo(w - f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w - f * v.canvasBuffer, f * v.canvasBuffer);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(f * v.canvasBuffer, h - f * v.canvasBuffer);
      ctx.stroke();

      drawCurtain(ctx, p1r, v, f, getImageData(v.images['curtain']));
      drawCurtain(ctx, p2r, v, f, getImageData(v.images['curtain']));
    }
  }
});

var vm = new Vue({
  el: '#app'
});

