var sys = require('sys'),
     ws = require('ws')

var people = [];

var server = ws.createServer(function (socket) {

  socket.addListener("connect", function (event) {
    sys.puts("client connected from " + event);
     
	moveIt();
  })

  socket.addListener("data", function (data) {
    
    sys.puts("Received from client " +data);
    //socket.write(data);
  })

  socket.addListener("close", function () {
    sys.puts("client left");
  })
  
  
  socket.addListener("error", function () {
  	sys.puts("Error");
  })
  
  var moveIt = function() {
  	var direction = Math.round(Math.random());
  	var amount = (Math.random() * 60)-30;
  	
  	var stuff = {
  		axis: direction,
  		distance: amount
  	};
  	
  	//sys.puts("Sending to client " + JSON.stringify(stuff));
  	
  	socket.write(JSON.stringify(stuff)+ "\r\n");
  	var movementTime = Math.random() * 1000;
  	
  	setTimeout(moveIt, 1);

    //setTimeout(moveIt, movementTime);
  }
 
})

server.listen(8080)

