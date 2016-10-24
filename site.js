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

Vue.component('curtain-options', {
  template: '\
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
              <input v-model="panel.width" type="number" min="1" step="1" class="form-control" placeholder="Width">\
              <div class="input-group-addon">cm</div>\
            </div>\
            <div class="input-group">\
              <input v-model="panel.height" type="number" min="1" step="1" class="form-control" placeholder="Height">\
              <div class="input-group-addon">cm</div>\
            </div>\
          </div>\
          <div class="input-group">\
            <input v-model="panel.fullness" type="number" min="1" max="2" step="0.5" class="form-control" placeholder="Fullness">\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios" value="wall" v-model="panel.mount">\
              Wall mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios" value="ceil" v-model="panel.mount">\
              Ceiling mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="rodpocket" v-model="panel.hanging">\
              Rod pocket\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="plait2fold" v-model="panel.hanging">\
              French plait 2-fold\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios" value="plait3fold" v-model="panel.hanging">\
              French plait 3-fold\
            </label>\
          </div>\
        </div>\
      </div>\
      <div class="col-lg-4">\
       <svg width="580" height="400" xmlns="http://www.w3.org/2000/svg">\
         <g>\
          <title>background</title>\
          <rect fill="#fff" id="canvas_background" height="402" width="582" y="-1" x="-1"/>\
          <g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid">\
           <rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"/>\
          </g>\
         </g>\
         <g>\
          <title>Layer 1</title>\
          <rect stroke="#000" id="svg_1" height="145.99999" width="84" y="121.5" x="189.5" stroke-width="1.5" fill="#fff"/>\
          <rect id="svg_2" height="147" width="86" y="121.5" x="288.5" stroke-width="1.5" stroke="#000" fill="#fff"/>\
          <path v-for="path in panelPaths" d="{{path}}" stroke-width="1.5" stroke="#000" fill="#fff"/>\
         </g>\
        </svg>\
      </div>\
    </div>\
  ',
  data: (function(){ return {
    numPanels: 2,
    panel: {
      width: 100,
      height: 240,
      mount: 'wall',
      hanging: 'rodpocket',
      fullness: 1.5
    }
  }; }),
  methods: {
  },
  computed: {
    price: function () {
      var widthMeters = (this.panel.width*this.panel.fullness)/100;
      var heightMeters = this.panel.height/100;
      var meterPrice = 300;
      return Math.round(widthMeters * heightMeters * meterPrice);
    },
    panelPaths: function() {
      var cmToPixles = 1;
      var windowLeft = 190;
      var windowRight = 288+86;
      var rodHeight = 80;
      var panelRects = [
        [
          windowLeft-this.panel.width*cmToPixles,
          rodHeight,
          this.panel.width*cmToPixles,
          this.panel.height*cmToPixles
        ],
        [
          windowRight,
          rodHeight,
          this.panel.width*cmToPixles,
          this.panel.height*cmToPixles
        ]

      ]

      strings = []
      for (var i = 0; i < this.numPanels; i++) {
        var panelRect = panelRects[i];
        var str = "M"+panelRect[0].toString()+","+panelRect[1].toString()+" c0,0,0,0,"+
                  (panelRect[2]).toString()+","+(0).toString()+" c0,0,0,0," +
                  (0).toString()+","+(panelRect[3]).toString()+" c0,0,0,0,"+
                  (-panelRect[2]).toString()+","+(0).toString()+" c0,0,0,0,"+
                  (0).toString()+","+(-panelRect[3]).toString();

        //var str = "M"+((i+1)*100)+",100 c20,20-20,-20,100,0";
        strings.push(str);
      }
      return strings;
    }
  }
});

new Vue({
  el: '#app'
});
