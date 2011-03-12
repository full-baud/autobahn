var sys = require('sys'),
     ws = require('ws')

var server = ws.createServer(function (socket) {

  socket.addListener("connect", function (resource) {
    sys.puts("client connected from " + resource)
    
    socket.write("welcome\r\n")
  })

  socket.addListener("data", function (data) {
    socket.write(data)
  })

  socket.addListener("close", function () {
    sys.puts("client left")
  })
  
 
})

server.listen(8080)