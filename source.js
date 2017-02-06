MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var hideElement = function(selector) {
  var doneHiding = false;
  var observer = new MutationObserver(function(mutations, observer) {
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

}

// Price button
hideElement('div[slot="article-price"');

// Article choices
hideElement('form[name="articleChoices"]');
//
// Article quantity
hideElement('input[name="quantity"]');

var drawRect = function(ctx, r, name) {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.width, r.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.font = "20px Georgia";
  ctx.fillText(
    name,
    r.x+r.width/2-ctx.measureText(name).width/2,
    r.y+r.height/2
  );
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
  </div>\
  ',
  data: (function(){ return {
    // affects price
    numPanels: 2,
    panelWidth: 100,
    panelHeight: 240,
    mountType: 'wall',
    hangingType: 'rodpocket',
    closedFullness: 1.5,
    // affects style
    ceilingHeight: 340,
    curtainToFloor: 0,
    cmToPixels: 1.5,
    windowAreaWidth: 84*2,
    windowAreaHeight: 146,
    windowSillHeight: 100
    canvasMinWidth: 400,
    canvasMinHeight: 300,
  }; }),
  methods: {
  },
  computed: {
    price: function () {
      var widthMeters = (this.panelWidth*this.closedFullness)/100;
      var heightMeters = this.panelHeight/100;
      var meterPrice = 300;
      return Math.round(widthMeters * heightMeters * meterPrice);
    },
    all: function() {
      var self = this;
      Object.keys(this.$data).forEach(function(key) {
        self[key]
      });
      return this.$data;
    },
    canvasWidth: function() {
      return this.cmToPixels*(this.panelWidth*this.numPanels + this.windowAreaWidth);
    },
    canvasHeight: function() {
      return this.cmToPixels*this.ceilingHeight;
    },
  },
  directives: {
    drawCanvas: function(canvasElement, binding) {
      var v = binding.value;
      var w = canvasElement.width;
      var h = canvasElement.height;
      var f = v.cmToPixels;
      var ctx = canvasElement.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      
      var wr = {
        x: w/2-f*v.windowAreaWidth/2,
        y: h+f*(-v.windowAreaHeight-v.windowSillHeight),
        width: f*(v.windowAreaWidth),
        height: f*(v.windowAreaHeight)
      };

      var p1r = {
        x: wr.x-f*v.panelWidth,
        y: h-f*v.panelHeight-f*v.curtainToFloor,
        width: f*v.panelWidth,
        height: f*v.panelHeight
      };

      var p2r = {
        x: wr.x+wr.width,
        y: h-f*v.panelHeight-f*v.curtainToFloor,
        width: f*v.panelWidth,
        height: f*v.panelHeight
      };

      drawRect(ctx, wr, 'window');
      drawRect(ctx, p1r, 'panel1');
      drawRect(ctx, p2r, 'panel2');
    }
  }
});

new Vue({
  el: '#app'
});
