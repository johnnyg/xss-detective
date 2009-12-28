// ==UserScript==
// @name XSS Detective
// @author John Garland
// @version 0.7
// @namespace http://userscripts.org/scripts/show/52430
// @description Tests a selected input field against known attack vectors.
// @include http://*/~johnnyg/cs9447/*
// @include http://www.gaylordmart.com/*
// ==/UserScript==

function hover(on, el) {
   el.style.outline = on ? "solid #fc0" : "";
}

function hover_on(e) {
   hover(true, this);
}

function hover_off(e) {
   hover(false, this);
}

var detective = {

buildToolbar: function() {
                 var toolbar = document.createElement('div');
                 toolbar.style.position = 'fixed';
                 toolbar.style.left = '0px';
                 toolbar.style.bottom = '0px';
                 toolbar.style.width = '100%';
                 toolbar.style.height = '40px';
                 toolbar.style.background = 'LightGray';
                 toolbar.style.borderTop = '1px solid Gray';
                 toolbar.style.color = 'Black';

                 toolbar.style.fontFamily = 'Tahoma, Sans'
                    toolbar.style.fontSize = '0.8em';
                 document.body.appendChild(toolbar);
                 return toolbar
              },

createSelection: function() {
                    var select = document.createElement('select');
                    select.style.cssFloat = 'left';
                    select.style.width = 'auto';
                    select.style.border = '1px solid DarkGray';
                    select.style.background = '#bbb';
                    select.style.margin = '4px';
                    select.style.padding = '3px';
                    select.style.color = 'Black';
                    select.style.cursor = 'pointer';
                    select.id = "vector";
                    var option;
                    var title;
                    for (title in this.vectors) {
                       option = document.createElement('option');
                       option.text = title;
                       option.value = this.vectors[title];
                       select.appendChild(option);
                    }
                    this.toolbar.appendChild(select);
                    this.selection = select;
                 },

buttonHover: function(e) {
                e.target.style.background = 'White';
             },

buttonLeave: function(e) {
                e.target.style.background = '#bbb';
             },

createButton: function(text, handler) {
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

display: function() {

            var self = this;
            this.testIndex = -1;

            this.toolbar = this.buildToolbar();

            this.addVector("Random String", this.randomString());

            this.createButton('Select input', function (e) {
                  self.chooseTarget();
                  });

            this.createSelection();

            this.createButton('Inject XSS test vector', function(e) {
                  self.injectXSS();
                  });

            // Restore state (if any)
            var state = this.getCookie("XD_state");
            if (state == "injecting") {
               // We just injected
               // TODO: save result
               alert("Injected!");
               var expiry = -1;
               if (this.getCookie("XD_multitest")) {
                  expiry = 1;
               }
               this.setCookie("XD_state", "next_test", expiry);
               window.location = this.getCookie("XD_URL");
            } else {
               var nodeID = this.getCookie("XD_ID");
               if (nodeID) {
                  this.formID = nodeID.split(";")[0];
                  this.inputID = nodeID.split(";")[1];
                  this.target = document.forms[this.formID].elements[this.inputID];

                  if (state == "next_test") {
                     this.testIndex = this.getCookie("XD_test") + 1;
                     this.injectXSS();
                  }
               }
            }
         },

addVector: function(name, test) {
              if (typeof(this.vectors) == 'undefined') {
                 this.vectors = {};
              }
              this.vectors[name] = test;
           },

chooseTarget: function() {
                 var formsLength = document.forms.length;
                 var self = this;
                 for (var i = 0; i < formsLength; i++) {
                    form = document.forms[i];
                    inputsLength = document.forms[i].elements.length;
                    for (var j = 0; j < inputsLength; j++) {
                       input = document.forms[i].elements[j];
                       if (input.type != 'submit') {
                          input.style.cursor =  "crosshair";
                          input.addEventListener('mouseover', hover_on, false);
                          input.addEventListener('mouseout', hover_off, false);
                          input.addEventListener('focus', function (e) { self.targetSelected(this, arguments.callee, i, j); }, false);
                       }
                    }
                 }
              },

targetSelected: function(input, func, formID, inputID) {
                   this.formID = formID;
                   this.inputID = inputID;
                   this.target = input;
                   var formsLength = document.forms.length;
                   for (var i = 0; i < formsLength; i++) {
                      form = document.forms[i];
                      inputsLength = document.forms[i].elements.length;
                      for (var j = 0; j < inputsLength; j++) {
                         input = document.forms[i].elements[j];
                         if (input.type != 'submit') {
                            input.style.cursor = "auto";
                            input.style.outline = "";
                            input.removeEventListener('mouseover', hover_on, false);
                            input.removeEventListener('mouseout', hover_off, false);
                            input.removeEventListener('focus', func, false);
                         }
                      }
                   }
                },

injectXSS: function() {
              if (typeof(this.target) != 'undefined') {
                 // Save state
                 this.setCookie("XD_URL", window.location, 1);
                 this.setCookie("XD_ID", this.formID+";"+this.inputID, 1);
                 this.setCookie("XD_test", this.selection.selectedIndex, 1);
                 this.setCookie("XD_state", "injecting", 1);

                 if (this.testIndex == -1) {
                    this.testIndex = this.selection.selectedIndex;
                 }
                 this.target.value = this.selection.options[this.testIndex].value;
                 this.target.form.submit();
              } else {
                 alert("You need to select an input first!");
              }
           },

randomString: function() {
                 return "I'm a random string...NOT!!@#!:";
              },

setCookie: function(c_name, value, expiredays) {
              var exdate=new Date();
              exdate.setDate(exdate.getDate()+expiredays);
              document.cookie=c_name+ "=" +escape(value)+
                 ((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
           },

getCookie: function(c_name) {
              if (document.cookie.length>0) {
                 c_start=document.cookie.indexOf(c_name + "=");
                 if (c_start!=-1) {
                    c_start=c_start + c_name.length+1;
                    c_end=document.cookie.indexOf(";",c_start);
                    if (c_end==-1) c_end=document.cookie.length;
                    return unescape(document.cookie.substring(c_start,c_end));
                 }
              }
              return "";
           }
};

// Are we being run by greasemonkey?
if (typeof(unsafeWindow) != 'undefined') {
   var xssTestVectors = unsafeWindow.xssTestVectors;
}

// If we can't see the external tests,
// let's just create an empty set rather than dying
if (typeof(xssTestVectors) == 'undefined') {
   var xssTestVectors = {};
}

for (vector in xssTestVectors) {
   detective.addVector(vector, xssTestVectors[vector]);
}
detective.display();
