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
        <div class="col-md-6" v-for="panel in panels" v-if="$index < numPanels">\
          <h4>Panel {{$index+1}}</h4>\
          <button class="button" v-on:click="copyRight" v-if="$index == 0">copy right</button>\
          <button class="button" v-on:click="copyLeft" v-if="$index == 1">copy left</button>\
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
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios{{$index}}" value="wall" v-model="panel.mount">\
              Wall mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="mountingRadios{{$index}}" value="ceil" v-model="panel.mount">\
              Ceiling mounted\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios{{$index}}" value="rodpocket" v-model="panel.hanging">\
              Rod pocket\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios{{$index}}" value="plait2fold" v-model="panel.hanging">\
              French plait 2-fold\
            </label>\
          </div>\
          <div class="radio">\
            <label>\
              <input type="radio" name="hangingRadios{{$index}}" value="plait3fold" v-model="panel.hanging">\
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
    numPanels: 1,
    panels: [
    {
      width: 100,
      height: 240,
      mount: 'wall',
      hanging: 'rodpocket',
      fullness: 1.5
    },
    {
      width: 100,
      height: 240,
      mount: 'ceil',
      hanging: 'plait2fold',
      fullness: 1.5
    }]
  }; }),
  methods: {
    copyRight: function() {
      this.panels[1].width = 300;
      //this.panels[1] = JSON.parse(JSON.stringify(this.panels[0]));
    },
    copyLeft: function() {
      this.panels[0] = JSON.parse(JSON.stringify(this.panels[1]));
    }
  },
  computed: {
    price: function () {
      var sumPrice = 0;
      for (var i = 0; i < this.numPanels; i++) {
        sumPrice += this.panels[i].width/100*this.panels[i].height/100*300;
      }
      return sumPrice;
    },
    panelPaths: function() {
      var cmToPixles = 1/2;
      var windowLeft = 190;
      var windowRight = 288+86;
      var rodHeight = 10;
      var panelRects = [
        [
          windowLeft-this.panels[0].width*cmToPixles,
          rodHeight,
          this.panels[0].width*cmToPixles,
          this.panels[0].height*cmToPixles
        ],
        [
          windowRight,
          rodHeight,
          this.panels[1].width*cmToPixles,
          this.panels[1].height*cmToPixles
        ]

      ]

      strings = []
      for (var i = 0; i < this.numPanels; i++) {
        var panelRect = panelRects[i];
        var str = "M"+panelRect[0].toString()+","+panelRect[1].toString()+" c0,0,0,0,"+
                  (panelRect[0]+panelRect[2]).toString()+","+panelRect[1].toString()+" c0,0,0,0," +
                  (panelRect[0]+panelRect[2]).toString()+","+(panelRect[1]+panelRect[3]).toString()+" c0,0,0,0,"+
                  panelRect[0].toString()+","+(panelRect[1]+panelRect[3]).toString();

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
