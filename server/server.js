var sys = require('sys'),
     ws = require('ws')

Player = {
	// generated, unique.  not sequential.
	token: "",
	
	// user entered
	name: "",
	
	// eg. MD5'd email for gravatar
	avatar: ""
}

Lounge = {
	numPlayers: 4,
	title: "Lounge",
	players: [
	
	]
};

Game = {
	
};

var autoBahn = {
	// a lounge is a game that hasn't started yet
	lounges: [
		
	],
	
	// games are in progress
	games: [
		
	],
	
	getLoungeList: function() {
		sys.puts("asked for lounge list");
		
		return autoBahn.lounges;
	}
};

var server = ws.createServer(function(socket) {
	socket.addListener("connect", function(resource) {
		sys.puts("client connected from " + resource);
	});
	
	socket.addListener("data", function (data) {
		sys.puts("got " + data);
		
		//{action: "methodName", args: [bar, baz]}
		
		try {
			var methodCall = eval("(" + data + ")");
			//var methodCall = JSON.parse(data);
		} catch(e) {
			sys.puts(":( " + e);
		}
		
		if(methodCall && autoBahn[methodCall.action]) {
			var output = {
				action: methodCall.action,
				args: methodCall.args,
				response: autoBahn[methodCall.action].apply(this, methodCall.args ? methodCall.args : [])
			}
			
			socket.write(JSON.stringify(output)+ "\r\n");
		}
	});
	
	socket.addListener("close", function () {
		sys.puts("client left");
	});
	
	
  var moveIt = function() {
  	var direction = Math.ceil(Math.random());
  	var amount = Math.random() * 10;
  	
  	var stuff = {
  		axis: direction,
  		distance: amount
  	};
  	
  	sys.puts("Sending to client " + JSON.stringify(stuff));
  	
  	socket.write(JSON.stringify(stuff)+ "\r\n");
  	var movementTime = Math.random() * 1000;
    setTimeout(moveIt, movementTime);
  }
 
}).listen(8080);