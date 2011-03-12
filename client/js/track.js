(function(w) {

	// Create some players
	var players = [
		new Player('1', 'David', 'https://secure.gravatar.com/avatar/a3b09ba64ff875d8718e610dc729581b'),
		new Player('2', 'Oli', 'https://secure.gravatar.com/avatar/9d1124bf8f7fe1b93a92a7927accd9a9')
	];
	
	w.getPlayers = function() {return players;};
	
})(window);



$(document).ready(function() {

	var camera, scene, renderer, self;
	
	// Re-render the scene every Xms
	setInterval(function() {renderer.render( scene, camera );}, 16);
	
	(function init() {
		
		scene = new THREE.Scene();
	
	  camera = new THREE.Camera(75, window.innerWidth / window.innerHeight, 1, 10000);
	  camera.position.z = 1000;
	  
	  var players = getPlayers();
	  var playerCubes = {};
	  
	  self = players[1];
	  
	  for(var i = 0; i < players.length; ++i) {
	  
	  	var materials = [];
	  	
	  	var gravatarMaterial = new THREE.MeshBasicMaterial(
				{
	  			map:ImageUtils.loadTexture(players[i].getAvatar())
	  		}
	  	);
	  	
	  	for(var j = 0; j < 6 ; ++j) {
	  		materials.push([gravatarMaterial]);
	  	}
	  	
	  	var cube = new THREE.Mesh(
	  		new Cube(200, 200, 200, 1, 1, materials),
	  		new THREE.MeshFaceMaterial()
	  	);
	  	
	  	playerCubes[players[i].getId()] = cube;
	  	
	  	cube.position.y = 300;
			cube.overdraw = true;
			
			scene.addObject(cube);
	  }
	
		$(document).keydown(function(event) {
		
		  var dist = 10;
		    	
			var repeat = function() {
			
				if (event.which === 37 ) {
					// left
					playerCubes[self.getId()].position.x -= dist;
					//ws.send(JSON.stringify({id:self.getId(), }));
				}
			
				if (event.which === 38 ) {
					// up
					playerCubes[self.getId()].position.y += dist;
					//ws.send(JSON.stringify({id:self.getId(), }));	    		
				}
				
				if (event.which === 39 ) {
					// right
					playerCubes[self.getId()].position.x += dist;
					//ws.send(JSON.stringify({id:self.getId(), })); 		
				}
				
				if (event.which === 40 ) {
					// down
					playerCubes[self.getId()].position.y -= dist;
					//ws.send(JSON.stringify({id:self.getId(), }));			    					    		
				}
				
				camera.position.x = playerCubes[self.getId()].position.x;
				camera.position.y = playerCubes[self.getId()].position.y;
			}
		    	
		  var id = setInterval(repeat, 10)
		    	
		  $(document).keyup(function(){
		    clearInterval(id);
		  });
		  
		});

		var bg = new THREE.Mesh(
			new Plane(2104, 1184),
	  	new THREE.MeshBasicMaterial({map:ImageUtils.loadTexture('img/track.jpg')})
	  );
	  
	  bg.position.z = -10;
	  scene.addObject(bg);

	  renderer = new THREE.CanvasRenderer();
	  renderer.setSize( window.innerWidth - 50, window.innerHeight - 50 );
	  
	  document.body.appendChild(renderer.domElement);
/*        
	  ws = new WebSocket(wsUrl);
	        	        
		ws.addEventListener('open', function(event) {
        console.log('Socket open');
    });
        	    
		ws.addEventListener('message', function(event) {
		
			messageCount++;
				
			console.info('Recieved a message');
			console.log(event);
				
			var playerData = JSON.parse(event.data);
			
			for(var i = 0; i < playerData.length; ++i) {
				
				if(playerData[i] && 
					playerData[i].id && 
					playerCubes[playerData[i].id] &&
					playerData[i].position && 
					playerData[i].position.x && 
					playerData[i].position.y) {
				
					playerCubes[playerData[i].id].position.x = playerData[i].position.x;
					playerCubes[playerData[i].id].position.y = playerData[i].position.y;
					
				} else {
				
					console.error('Invalid data for player at index ' + i);
				}
			}
			
		});
        	    
		ws.addEventListener('error', function(event) {
				console.log('Socket error');
				console.log(event);
		});
		
		ws.addEventListener('close', function(event) {
				console.log('Socket closed');
				console.log(event);
		});
*/
		
	})();

});



