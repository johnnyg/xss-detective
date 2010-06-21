=======================
COMP9447 Project Report
=======================

.. contents:: Table Of Contents
   :backlinks: entry

Concept
=======

Write an interactive tool to assist in detecting cross-site scripting vulnerabilities on a website.

Goals
=====

Ease Of Use
+++++++++++

There are existing solutions, however they run as separate applications.
To make the tool easier to use, we want something interactive that runs in the browser itself.
This brings up the idea of "click and pwn"; a user browsing a website can easily bring up the tool and
quickly and effortless tell if the site has a cross-site scripting vulnerabilities.

Platform Independence
+++++++++++++++++++++

The advantage of a platform independent tool means that we can reach a wider audience.
As the tool is supposed to integrate into a user's normal browsing behavior,
using a platform independent tool caters for the user's different choice of browser.
Having established that we want something platform independent, a browser plugin is out of the question.

Extendibility
+++++++++++++

Once the tool is written, extending it should be relatively easy.
This will allow users to share their own tests with others and
maximise the chances of successfully detecting cross-site scripting vulnerabilities.

Achievements
============

Goals Achieved
++++++++++++++

Ease Of Use
-----------

The tool presents itself as an unobtrusive toolbar.
Ease of use was achieved by

Only showing what is necessary
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

By default the toolbar is hidden. The toolbar is toggled by a user customisable shortcut key.
When the toolbar is revealed, only one button is initially available; selections and buttons appear as needed.

Focusing the user's attention
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Dimming and hiding is used to concentrate the user's attention on what is important.
Colourful outlines are used to acknowledge the result of a user's action.

Simplicity
~~~~~~~~~~

Choosing a target, selecting one or more test(s) is intuitive through clearly labeled buttons.
The outcome of the test(s) are plainly shown in a text area.

Platform Independence
---------------------

Platform independence was achieved by writing the tool as client-side JavaScript.
By client-side JavaScript, we mean JavaScript that is attached to the browser rather than the page.
Every (major) browser has support for client-side JavaScript albeit under a different name:

 * Firefox: Greasemonkey
 * Opera: User JavaScript
 * Safari: Greasekit
 * Chrome: Greasemonkey
 * IE: Trixie

The tool however, was only tested in Firefox and Opera.
Furthermore the tool was written using no libraries as to maximise portability.

Extendibility
-------------

Extendibility was achieved by having external tests.
This allowed tests to be easily shared and added.

Obstacles Overcome
++++++++++++++++++

Remembering State
-----------------

Probably one of the hardest obstacles was remembering state (in a portable way).
The initial solution used cookies to store the current state when submitting a form and then extracted it to go back to its previous state.
The make matters worse there is no portable way of serialising JavaScript objects.
This solution was flawed and a nightmare to get working; deeming it the nickname of "cookie monster".
The final solution doesn't overcome this obstacle at all; instead it solves a different problem.
The problem to solve is how to submit a form multiple times with different inputs and keep track of each one?
The initial solution manually submitted the form and hence required the cookies to remember state in between page loads.
The final solution however, submitted the form in the background, meaning the page was never reloaded and the normal JavaScript objects were sufficient to remember state.
This also added the benefit of being able to parallelise the submissions.

Submitting In The Background
----------------------------

Having determined that background submissions were the way to go, there was an obstacle about actually doing them.
The most obvious solution would be to use XMLHttpRequest which is supported by all major browsers.
The most accurate way of determining if a page is vulnerable to cross-site scripting is to inject JavaScript which changes the page's Document Object Model and then checking whether or not it has changed.
Simply checking the page's source for a string leads to false positives / negatives.
The problem with this is that XMLHttpRequest only returns a Document Object Model (rather than a string) if the page is pure XML rather than (X)HTML.
There are hacks that allow you to create a Document Object Model from a string, however they don't run any scripts, making them useless.
This obstacle was eventually overcome by using inline frames.
**Side Note:** I thought it was sadly hilarious that even today, in the era of "Web 2.0", I *still* had to resort to iframes.
The submission was still done asynchronously through a series of hidden inline frames.

Asynchronous Programming
------------------------

As the form was repeatedly being submitted asynchronously I couldn't guarantee the order in which each would finish or keep track of what each result should be.
I solved this problem by porting Deferreds_ to JavaScript.
It wasn't a full port but was more than sufficient for my needs.
**Side Note:** Rupert and I also ported Deferreds to C during Advanced Operating Systems :D

Forgetting Scope
----------------

JavaScript has this horrible habit of forgetting scope; if you specify an object's method as an element's callback function, the "this" argument inside that function no longer refers to the object but to the element.
To overcome this, I used a well known hack of binding a scope to a specific object.

Reflection
==========

I learnt a lot from doing this assignment:

JavaScript
++++++++++

I learnt the limitations and quirks of JavaScript and how to resolve them as best you can.
Whenever there were multiple ways to doing something I investigated the pros and cons of each way and ran benchmarks to see which was fastest.
This lead me to learn about JavaScript performance.
I also learnt to never, ever doing another JavaScript project :-?

Agile Programming
+++++++++++++++++

A lot of time was wasted trying to think up the perfect design rather than actual coding.
Although I think it's important to work out on paper and pen your design before implementing it, you shouldn't fuss over it too much;
I found that a lot of good ideas popped up as I was coding.
In the end, I found I was the most productive when I mapped out the features I wanted to add that week, then added them and then presented them to Rupert for feedback.

Extensions Can Be Burdens In Disguise
+++++++++++++++++++++++++++++++++++++

When I first got the extension for this I thought it was a blessing despite Richard warning me otherwise.
Now I know how much of a burden they can be.
That said, I'm really glad I did get it because it has taught me so much and I get to hand in something that I'm actually proud of, rather than a "cookie monster".

.. _Deferreds: http://twistedmatrix.com/documents/current/core/howto/defer.html
