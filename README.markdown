Autobahn README
===============

Autobahn is [sweded][] micromachines


Requirments
-----------

* Install node.js 
* Get npm  wget http://npmjs.org/install.sh
* chmod +x install.sh
* sudo ./install.sh

Checkout the code and submodules:

	$ git clone https://[username]@github.com/full-baud/autobahn.git
	$ git submodule init
	$ git submodule update






Adding submodules
-----------------

Where we depend on other peoples code, we can tell git to add it as a submodule. 
This makes it appear to be part of our code tree, whilst still hosted in it's own repo.


E.g. Currently we dont need npm as Oli's magic git submodule command did the business
From repo root: 

	$ git submodule add https://github.com/ncr/node.ws.js.git server/node_modules/



[sweded]:http://en.wikipedia.org/wiki/Sweded#.22Sweded.22


