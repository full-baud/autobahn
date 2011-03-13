Autobahn README
===============

Autobahn is [sweded][] micromachines

Requirements
-----------

Install git and node.js (currently version 0.4.2)

	$ sudo port selfupdate
	$ sudo port install git nodejs

Checkout the code and submodules:

	$ git clone https://[username]@github.com/full-baud/autobahn.git
	$ git submodule init
	$ git submodule update


Adding submodules
-----------------

Where we depend on other peoples code, we can tell git to add it as a submodule. 
This makes it appear to be part of our code tree, whilst still hosted in it's own repo.

	$ git submodule add https://github.com/ncr/node.ws.js.git server/node_modules/

Submodules in use are:
- npm
- jasmin

See .gitmodules for the authoritative list.


Unit tests
----------

Added [jasmine-node][] test framework.
	$ git submodule add https://github.com/mhevery/jasmine-node.git test

Put unit tests in the spec directory. To run node.js tests
	$ cd test
	$ node specs.js


Screen Shots
------------

Teh awesomenesses.

### The Lounge
<img src="https://github.com/full-baud/autobahn/raw/master/docs/img/autobahn-1-lounge.jpg" />

### The Track
<img src="https://github.com/full-baud/autobahn/raw/master/docs/img/autobahn-2-track.jpg" />

### Autobahn in space
<img src="https://github.com/full-baud/autobahn/raw/master/docs/img/autobahn-0-space.jpg" />






[sweded]:http://en.wikipedia.org/wiki/Sweded#.22Sweded.22
[jasmine-node]:https://github.com/mhevery/jasmine-node

