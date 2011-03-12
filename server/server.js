var sys = require('sys'),
     ws = require('ws')

var server = ws.createServer(function (socket) {

  socket.addListener("connect", function (resource) {
    sys.puts("client connected from " + resource);
    
	moveIt();
  })

  socket.addListener("data", function (data) {
    socket.write(data);
  })

  socket.addListener("close", function () {
    sys.puts("client left");
  })
  
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
 
})

server.listen(8080)

