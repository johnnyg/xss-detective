// ==UserScript==
// @name XSS Detective
// @author John Garland
// @version 0.7
// @namespace http://userscripts.org/scripts/show/52430
// @description Tests a selected input field against known attack vectors.
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

        self.toolbar = self.buildToolbar();
        
        self.addVector("Random String", self.randomString());

        self.createButton('Select input', function (e) {
            self.chooseTarget();
        });

        self.createSelection();

        self.createButton('Inject XSS test vector', function(e) {
            self.injectXSS();
        });
    },

    addVector: function(name, test) {
        if (typeof(this.vectors) == 'undefined') {
            this.vectors = {};
        }
        this.vectors[name] = test;
    },

    chooseTarget: function() {
        var forms = document.evaluate("//form", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var formsLength = forms.snapshotLength;
        var self = this;
        for (var i = 0; i < formsLength; i++) {
            form = forms.snapshotItem(i);
            inputs = document.evaluate("//input", form, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            inputsLength = inputs.snapshotLength;
            for (var j = 0; j < inputsLength; j++) {
                input = inputs.snapshotItem(j);
                if (input.type != 'submit') {
                    input.style.cursor =  "crosshair";
                    input.addEventListener('mouseover', hover_on, false);
                    input.addEventListener('mouseout', hover_off, false);
                    input.addEventListener('focus', function (e) { self.targetSelected(this, arguments.callee); }, false);
                }
            }
        }
    },

    targetSelected: function(input, f) {
        var forms = document.evaluate("//form", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var formsLength = forms.snapshotLength;
        for (var i = 0; i < formsLength; i++) {
            form = forms.snapshotItem(i);
            inputs = document.evaluate("//input", form, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            inputsLength = inputs.snapshotLength;
            for (var j = 0; j < inputsLength; j++) {
                input = inputs.snapshotItem(j);
                if (input.type != 'submit') {
                    input.style.cursor = "auto";
                    input.style.outline = "";
                    input.removeEventListener('mouseover', hover_on, false);
                    input.removeEventListener('mouseout', hover_off, false);
                    input.removeEventListener('focus', f, false);
                }
            }
        }
        this.target = input;
    },

    injectXSS: function() {
        if (typeof(this.target) != 'undefined') {
            this.target.value = this.selection.options[this.selection.selectedIndex].value;
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

// If we can't see the external test,
// let's just create an empty set rather than dying
if (typeof(xssTestVectors) == 'undefined') {
    var xssTestVectors = {};
}

for (vector in xssTestVectors) {
    detective.addVector(vector, xssTestVectors[vector]);
}
detective.display();
