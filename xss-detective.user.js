// ==UserScript==
// @name XSS Detective
// @author John Garland
// @version 0.8
// @namespace http://userscripts.org/scripts/show/52430
// @description Tests a selected input field against known attack vectors.
// @include http://*/~johnnyg/cs9447/*
// @include http://www.gaylord.com/*
// ==/UserScript==

function Deferred() {
   this.callbacks = [];
   this.addCallback = function (callback) {
      this.callbacks.push(callback);
   };
   this.callback = function (result) {
      while (this.callbacks.length > 0) {
         result = this.callbacks.shift()(result);
      }
   }
   return true;
}

var detective = {

buildToolbar:
   function() {
      var toolbar = document.createElement('div');
      toolbar.style.position = 'fixed';
      toolbar.style.left = '0px';
      toolbar.style.bottom = '0px';
      toolbar.style.width = '100%';
      toolbar.style.height = '40px';
      toolbar.style.background = 'LightGray';
      toolbar.style.borderTop = '1px solid Gray';
      toolbar.style.color = 'Black';
      toolbar.style.overflow = 'hidden';

      toolbar.style.fontFamily = 'Tahoma, Sans'
      toolbar.style.fontSize = '0.8em';
      document.body.appendChild(toolbar);
      return toolbar
   },

createSelection:
   function(id, options, getAttributes) {
      var select = document.createElement('select');
      select.style.cssFloat = 'left';
      select.style.width = 'auto';
      select.style.border = '1px solid DarkGray';
      select.style.background = '#bbb';
      select.style.margin = '4px';
      select.style.padding = '3px';
      select.style.color = 'Black';
      select.style.cursor = 'pointer';
      select.id = id;
      for (i in options) {
         var attributes = getAttributes(options[i]);
         var option = document.createElement('option');
         for (attribute in attributes) {
            option[attribute] = attributes[attribute];
         }
         select.appendChild(option);
      }
      this.toolbar.appendChild(select);
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
      button.style.height = '16px';
      button.style.border = '1px solid DarkGray';
      button.style.background = '#bbb';
      button.style.margin = '4px';
      button.style.padding = '3px';
      button.style.color = 'Black';
      button.style.cursor = 'pointer';

      button.textContent = text;

      button.addEventListener('mouseover', this.buttonHover, false);
      button.addEventListener('mouseout', this.buttonLeave, false);
      if (handler) {
         button.addEventListener('click', handler, false);
      }
      this.toolbar.appendChild(button);
   },

init:
   function() {

      var self = this;

      this.toolbar = this.buildToolbar();

      //this.addVector("Random String", this.randomString());

      this.createButton('Select input', function (e) { self.chooseTarget(); });

      this.createSelection("tests", this.tests, function(test) { return {"text" : test.name, "title" : test.description, "value" : test.vector}; });
      this.testSelection = document.getElementById('tests');

      this.createButton('Inject XSS test vector', function(e) { self.injectXSS(); });

      this.createSelection("details_types", ["Description", "Vector"], function(option) { return { "text" : option, "value" : option }; });
      this.detailSelection = document.getElementById('details_types');

      this.details = document.createElement('input');
      this.details.type = 'text';
      this.details.style.cssFloat = 'left';
      this.details.style.width = '70%';
      this.details.style.border = '0px';
      this.details.style.background = 'LightGray';
      this.details.style.margin = '4px';
      this.details.style.padding = '3px';
      this.details.style.color = 'Black';
      this.details.id = "details";
      this.toolbar.appendChild(this.details);

      // Onlly add events after details field exists
      this.testSelection.addEventListener('change', function(e) { self.updateDetails(); }, false);
      this.detailSelection.addEventListener('change', function(e) { self.updateDetails(); }, false);

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
   function() {
      var self = this;
      this.target = null;
      var formsLength = document.forms.length;
      for (var i = 0; i < formsLength; i++) {
         form = document.forms[i];
         inputsLength = document.forms[i].elements.length;
         for (var j = 0; j < inputsLength; j++) {
            input = document.forms[i].elements[j];
            if (input.type !== 'submit') {
               input.style.cursor =  "crosshair";
               input.addEventListener('mouseover', self.hover_on, false);
               input.addEventListener('mouseout', self.hover_off, false);
               input.addEventListener('focus', self.targetSelected, false);
            }
         }
      }
   },

targetSelected:
   function(e) {
      var self = detective;
      self.target = e.currentTarget;
      var formsLength = document.forms.length;
      for (var i = 0; i < formsLength; i++) {
         form = document.forms[i];
         inputsLength = document.forms[i].elements.length;
         for (var j = 0; j < inputsLength; j++) {
            input = document.forms[i].elements[j];
            if (input.type !== 'submit') {
               input.style.cursor = "auto";
               input.removeEventListener('mouseover', self.hover_on, false);
               input.removeEventListener('mouseout', self.hover_off, false);
               input.removeEventListener('focus', self.targetSelected, false);
            }
         }
      }
      self.hover(true, self.target);
   },

injectXSS:
   function() {
      if (typeof(this.target) !== 'undefined') {
         var testIndex = this.testSelection.selectedIndex;
         this.target.value = this.tests[testIndex].vector;
         var deferred = this.asyncSubmit(this.target.form);
         deferred.addCallback(this.tests[testIndex].check);
         deferred.addCallback(alert);
      } else {
         alert("You need to select an input first!");
      }
   },

asyncSubmit:
   function(form) {
      var previous = form.target;
      var deferred = new Deferred();
      var iframe = document.createElement('iframe');
      iframe.style.display = "none !important";
      iframe.name = "XD_AJAX_LOL_"+this.randomString(6);
      iframe.addEventListener('load', function (e) {
         this.addEventListener('load', function (e) {
            deferred.callback(this.contentDocument);
            document.body.removeChild(this);
            form.target = previous;
         }, false);
         this.removeEventListener('load', arguments.callee, false);
      }, false);
      document.body.appendChild(iframe);
      form.target = iframe.name;
      form.submit();
      return deferred;
   },

randomString:
   function(length) {
      var rand = [];
      while (rand.length < length) {
         rand.push(String.fromCharCode(Math.floor(Math.random()*95)+32));
      }
      return rand.join('');
   },

updateDetails:
   function() {
      var selected = this.testSelection.options[this.testSelection.selectedIndex];
      var type = this.detailSelection.options[this.detailSelection.selectedIndex].value;
      var details = "";
      if (type === "Description") {
         details = selected.title;
      } else {
         details = selected.value;
      }
      this.details.value = details;
   },

hover:
   function(on, el) {
      el.style.outline = on ? "solid #fc0" : "";
   },

hover_on:
   function(e) {
      var self = detective;
      self.hover(true, e.currentTarget);
   },

hover_off:
   function(e) {
      var self = detective;
      self.hover(false, e.currentTarget);
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
