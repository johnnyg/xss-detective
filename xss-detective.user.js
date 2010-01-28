// ==UserScript==
// @name XSS Detective
// @author John Garland
// @version 0.8
// @namespace http://userscripts.org/scripts/show/52430
// @description Tests a selected input field against known attack vectors.
// @include http://*/~johnnyg/cs9447/*
// @include http://www.gaylord.com/*
// ==/UserScript==

DEBUG = true;

function Deferred() {
   this.callbacks = [];
   this.addCallback = function (callback, context) {
      this.callbacks.push({
         func : callback,
         scope : context,
         args : Array.prototype.slice.call(arguments, 2)
      });
      return this;
   };
   this.callback = function (result) {
      while (this.callbacks.length > 0) {
         var cb = this.callbacks.shift();
         cb.args.unshift(result);
         result = cb.func.apply(cb.scope, cb.args);
      }
   }
   return true;
}

Function.prototype.bind = function(scope) {
   var self = this;
   return function() {
      return self.apply(scope, arguments);
   }
}

var detective = {

buildToolbar:
   function() {
      var toolbar = document.createElement('div');
      toolbar.style.position = 'fixed';
      toolbar.style.left = '0px';
      toolbar.style.bottom = '0px';
      toolbar.style.width = '100%';
      toolbar.style.background = 'LightGray';
      toolbar.style.borderTop = '1px solid Gray';
      toolbar.style.color = 'Black';
      toolbar.style.overflow = 'hidden';
      toolbar.style.fontFamily = 'Tahoma, Sans'
      toolbar.style.fontSize = '0.8em';
      toolbar.hide = function() { this.style.display = 'none' };
      toolbar.show = function() { this.style.display = 'inline' };
      document.body.appendChild(toolbar);
      return toolbar;
   },

createSelection:
   function(multiple, options, getAttributes) {
      var select = document.createElement('select');
      select.style.cssFloat = 'left';
      select.style.width = 'auto';
      select.style.border = '1px solid DarkGray';
      select.style.background = '#bbb';
      select.style.margin = '5px';
      select.style.color = 'Black';
      select.style.cursor = 'pointer';
      select.size = 1;
      select.multiple = multiple;
      for (i in options) {
         var attributes = getAttributes(options[i]);
         var option = document.createElement('option');
         for (attribute in attributes) {
            option[attribute] = attributes[attribute];
         }
         select.appendChild(option);
      }
      select.hide = this.toolbar.hide;
      select.show = this.toolbar.show;
      this.toolbar.appendChild(select);
      return select;
   },

buttonHover:
   function(e) {
      e.target.style.background = 'White';
   },

buttonLeave:
   function(e) {
      e.target.style.background = '#bbb';
   },

createButton:
   function(text, handler) {
      var button = document.createElement('div');
      button.style.cssFloat = 'left';
      button.style.width = 'auto';
      button.style.border = '1px solid DarkGray';
      button.style.background = '#bbb';
      button.style.margin = '5px';
      button.style.padding = '0 2px 0 2px';
      button.style.color = 'Black';
      button.style.cursor = 'pointer';
      button.textContent = text;
      button.addEventListener('mouseover', this.buttonHover, false);
      button.addEventListener('mouseout', this.buttonLeave, false);
      if (handler) {
         button.addEventListener('click', handler, false);
      }
      button.hide = this.toolbar.hide;
      button.show = this.toolbar.show;
      this.toolbar.appendChild(button);
      return button;
   },

init:
   function() {

      this.target = null;
      this.targetEvents = {
         'mouseover' : this.hoverOn.bind(this),
         'mouseout' : this.hoverOff.bind(this),
         'focus' : this.targetSelected.bind(this)
      };

      this.toolbar = this.buildToolbar();

      //this.addVector("Random String", this.randomString());

      this.createButton('Select input', this.chooseTarget.bind(this));

      this.testSelection = this.createSelection(true, this.tests, function(test) {
            return {"text" : test.name, "value" : test.vector};
      });

      this.injectButton = this.createButton('Inject XSS test vector', this.injectXSS.bind(this));

      this.detailSelection = this.createSelection(false, ["Description", "Vector"], function(option) {
            return {
               "text" : option,
               "title" : "Show "+option.toLowerCase()+" as test tooltip",
               "value" : option,
               "selected" : option == "Description"
            };
      });

      // Only add events after details field exists
      this.testSelection.addEventListener('change', this.updateDetails.bind(this), false);
      this.detailSelection.addEventListener('change', this.updateDetails.bind(this), false);

      // Hide these until a target is selected
      this.testSelection.hide();
      this.injectButton.hide();
      this.detailSelection.hide();

      this.updateDetails();
   },

addVector:
   function(test) {
      if (typeof(this.tests) === 'undefined') {
         this.tests = [];
      }
      this.tests.push(test)
   },

chooseTarget:
   function(e) {
      if (this.target !== null) {
         this.hover(false, this.target);
         this.target = null;
         this.testSelection.hide();
         this.injectButton.hide();
         this.detailSelection.hide();
      }
      var formsLength = document.forms.length;
      for (var i = 0; i < formsLength; i++) {
         form = document.forms[i];
         inputsLength = document.forms[i].elements.length;
         for (var j = 0; j < inputsLength; j++) {
            input = document.forms[i].elements[j];
            if (input.type !== 'submit') {
               input.style.cursor =  "crosshair";
               for (var i in this.targetEvents) {
                  input.addEventListener(i, this.targetEvents[i], false);
               }
            }
         }
      }
   },

targetSelected:
   function(e) {
      this.target = e.currentTarget;
      var formsLength = document.forms.length;
      for (var i = 0; i < formsLength; i++) {
         form = document.forms[i];
         inputsLength = document.forms[i].elements.length;
         for (var j = 0; j < inputsLength; j++) {
            input = document.forms[i].elements[j];
            if (input.type !== 'submit') {
               input.style.cursor = "auto";
               for (var i in this.targetEvents) {
                  input.removeEventListener(i, this.targetEvents[i], false);
               }
            }
         }
      }
      this.hover(true, this.target);
      this.testSelection.show();
      this.injectButton.show();
      this.detailSelection.show();
   },

injectXSS:
   function(e) {
      if (this.target !== null) {
         var selected = this.getSelectedTests();
         if (selected.length > 0) {
            this.passed = [];
            for (var i in selected) {
               var testIndex = selected[i];
               this.target.value = this.tests[testIndex].vector;
               var deferred = this.asyncSubmit(this.target.form);
               deferred.addCallback(this.tests[testIndex].check);
               deferred.addCallback(this.storeResult, this, testIndex);
               if (DEBUG) {
                  deferred.addCallback(alert);
               }
            }
         } else {
            alert("You need to select at least one test!");
         }
      } else {
         alert("You need to select an input first!");
      }
   },

asyncSubmit:
   function(form) {
      if (typeof(arguments.callee.counter) === 'undefined') {
         arguments.callee.counter = 0;
      }
      var counter = arguments.callee.counter++;
      var previous = form.target;
      var deferred = new Deferred();
      var iframe = document.createElement('iframe');
      iframe.style.display = "none";
      iframe.name = "XD_AJAX_LOL_"+counter;
      iframe.addEventListener('load', function (e) {
         if (this.contentDocument.body.firstChild !== null) {
            deferred.callback(this.contentDocument);
            document.body.removeChild(this);
            form.target = previous;
         }
      }, false);
      document.body.appendChild(iframe);
      form.target = iframe.name;
      form.submit();
      return deferred;
   },

getSelectedTests:
   function() {
      var selectedTests = [];
      var selectedIndex = this.testSelection.selectedIndex;
      var length = this.testSelection.length;
      if (selectedIndex >= 0 && selectedIndex < length) {
         selectedTests.push(selectedIndex);
      }
      for (var i = selectedIndex + 1; this.testSelection.multiple && i < length; i++) {
         if (this.testSelection[i].selected) {
            selectedTests.push(i);
         }
      }
      return selectedTests;
   },

randomString:
   function(length) {
      var rand = [];
      while (rand.length < length) {
         rand.push(String.fromCharCode(Math.floor(Math.random()*95)+32));
      }
      return rand.join('');
   },

storeResult:
   function(passed, testIndex) {
      this.passed[testIndex] = passed;
      if (DEBUG) {
         return testIndex+" => "+passed;
      }
   },

updateDetails:
   function(e) {
      var type = this.detailSelection.options[this.detailSelection.selectedIndex].value;
      for (var i in this.tests) {
         if (type === "Description") {
            this.testSelection[i].title = this.tests[i].description;
         } else {
            this.testSelection[i].title = this.tests[i].vector;
         }
      }
   },

hover:
   function(on, el) {
      el.style.outline = on ? "solid #fc0" : "";
   },

hoverOn:
   function(e) {
      this.hover(true, e.currentTarget);
   },

hoverOff:
   function(e) {
      this.hover(false, e.currentTarget);
   },

show:
   function() {
      this.toolbar.show();
   },

hide:
   function() {
      this.toolbar.hide();
   },
};

// Are we being run by greasemonkey?
if (typeof(unsafeWindow) !== 'undefined') {
   var xssTestVectors = unsafeWindow.xssTestVectors;
}

// If we can't see the external tests,
// let's just create an empty set rather than dying
if (typeof(xssTestVectors) === 'undefined') {
   var xssTestVectors = [];
}

for (vector in xssTestVectors) {
   detective.addVector(xssTestVectors[vector]);
}
detective.init();
