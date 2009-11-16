// ==UserScript==
// @name XSS Detective Test Vectors
// @author John Garland
// @version 0.1
// @namespace http://userscripts.org/scripts/show/52430
// @description Tests for XSS Detective.
// ==/UserScript==

var xssTestVectors = {
        "Test 1" : "<script>alert('hello');</script>",
        "Test 2" : "<body onload='alert(1)'>"
};

if (typeof(unsafeWindow) != 'undefined') {
    unsafeWindow.xssTestVectors = xssTestVectors;
}
