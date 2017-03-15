(function() {
  var socket = io();

  var c = document.getElementById('container');
  var setHost = document.getElementById('set-host');
  var setPlayer = document.getElementById('set-player');

  setHost.addEventListener('click', setHostEventListener);
setPlayer.addEventListener('click', setPlayerEventListener);

  function setHostEventListener(event) {
    event.stopPropagation();
   c.innerHTML = '<canvas id="game"></canvas>';
    setHost.removeEventListener('click', setHostEventListener);
    setPlayer.removeEventListener('click', setPlayerEventListener);
    //fullScreen();
    setupHost();
  }

  function setPlayerEventListener(event) {
  event.stopPropagation();
  c.innerHTML = '<canvas id="game-player"></canvas><div id="player-name"></div>';
  setHost.removeEventListener('click', setHostEventListener);
  setPlayer.removeEventListener('click', setPlayerEventListener);
  //fullScreen();
  setupPlayer();
}

 function setupHost(){
socket.emit('host game', { gameName: 'lily' });

  var players = [];
  playerPlacementOrder = ['left', 'right']; // 'top','bottom' for four palyers

  socket.on('new player joined', function(data) {
    console.log('new player joined', data);
    players.push(setupPlayer({
      name: data.playerName,
      color: data.playerColor,
      placement: playerPlacementOrder[players.length],
      leftKey: 37,
      rightKey: 39
    }));
  });

    socket.on('player left', function(data) {
      console.log('player left', data);
      players = players.filter(function(p) { return p.name !== data.playerName; });
    });

    socket.on('orientation data', function(data) {
      var player = players.filter(function(p) { return p.name === data.playerName; })[0];
      if (!player) return console.log('Player not found', data.playerName);

      var tilt = data.beta;
      if (tilt < -45) tilt = -45;
      if (tilt > 45) tilt = 45;
      tilt += 45;

      player.pos = tilt / 90;
  });



   // RequestAnimFrame: a browser API for getting smooth animations
   window.requestAnimFrame = (function(){
   	return  window.requestAnimationFrame       ||
   		window.webkitRequestAnimationFrame ||
   		window.mozRequestAnimationFrame    ||
   		window.oRequestAnimationFrame      ||
   		window.msRequestAnimationFrame     ||
   		function( callback ){
   			return window.setTimeout(callback, 1000 / 60);
   		};
   })();

   window.cancelRequestAnimFrame = ( function() {
   	return window.cancelAnimationFrame          ||
   		window.webkitCancelRequestAnimationFrame    ||
   		window.mozCancelRequestAnimationFrame       ||
   		window.oCancelRequestAnimationFrame     ||
   		window.msCancelRequestAnimationFrame        ||
   		clearTimeout
   } )();


   // Initialize canvas and required variables
   var canvas = document.getElementById("game"),
   		ctx = canvas.getContext("2d"), // Create canvas context
   		W = window.innerWidth, // Window's width
   		H = window.innerHeight, // Window's height
   		particles = [], // Array containing particles
   		ball = {}, // Ball object
   		paddles = [2], // Array containing two paddles
   		mouse = {}, // Mouse object to store it's current position
deviceOri = {}, // device ori to store .....
      points = 0, // Varialbe to store points
   		point1=0,
   		point2=0,
   		lWall=0,  //left and right wall colision (1-colide 0-no colision)
   		rWalll=0,
   		fps = 60, // Max FPS (frames per second)
   		particlesCount = 20, // Number of sparks when ball strikes the paddle
   		flag = 0, // Flag variable which is changed on collision
   		particlePos = {}, // Object to contain the position of collision
   		multipler = 1, // Varialbe to control the direction of sparks
   		startBtn = {}, // Start button object
   		restartBtn = {}, // Restart button object
   		over = 0, // flag varialbe, cahnged when the game is over
      orientationData = 0, // orientation data storage
   		init, // variable to initialize animation
   		paddleHit;

   // Add mousemove and mousedown events to the canvas
   canvas.addEventListener("mousemove", trackPosition, true);
   canvas.addEventListener("mousedown", btnClick, true);

   // Initialise the collision sound
   collision = document.getElementById("collide");

   // Set the canvas's height and width to full screen
   canvas.width = W;
   canvas.height = H;

   // Function to paint canvas
   function paintCanvas() {
   	ctx.fillStyle = "rgba(49, 171, 071, 0.9)";
   	ctx.fillRect(0, 0, W, H);
   	ctx.strokeRect(8, 8, W-16, H-16);
   	ctx.lineWidth= 8;
   	ctx.strokeStyle= "white";
   }

   function setupPlayer(options) {
     var pladdelR = {
       name: options.name,
       placement: options.placement,
       color: options.color,
       pos: 0.5,
       h: 200,
       w:15 ,
       size: 80,
       offset: 40,
       left: 0,
       right: 0,
       isHit: false,
     };

     player.getPos = function(gs) {
       var pos;
       if (player.placement === 'top')    pos = { x: gs.x + gs.w * player.pos, y: -player.offset };
       if (player.placement === 'bottom') pos = { x: gs.x + gs.w * player.pos, y: gs.vp.h + player.offset };
       if (player.placement === 'left')   pos = { x: 0, y: H/2 - h/2 };
       if (player.placement === 'right')  pos = { x: W - w, y: H/2 - h/2 };


       return pos;
     };

     window.addEventListener('keydown', function(event) {
       if (event.keyCode === options.leftKey) player.left = 1;
       if (event.keyCode === options.rightKey) player.right = 1;
     });

     window.addEventListener('keyup', function(event) {
       if (event.keyCode === options.leftKey) player.left = 0;
       if (event.keyCode === options.rightKey) player.right = 0;
     });

     return player;
   }



   // Function for creating paddles
   function Paddle(pos) {
   	// Height and width
   	this.h = 200;
   	this.w = 15;

   	// Paddle's position
   	this.y = H/2 - this.h/2;
   	this.x = (pos == "left") ? 0 : W - this.w;

   }

   // Push two new paddles into the paddles[] array
   paddles.push(new Paddle("right"));
   paddles.push(new Paddle("left"));

   // Ball object
   ball = {
   	x: 50,
   	y: 50,
   	r: 10,
   	c: "rgba(243, 255, 24, 0.9)",
   	vx: 4,
   	vy: 8,

   	// Function for drawing ball on canvas
   	draw: function() {
   		ctx.beginPath();
   		ctx.fillStyle = this.c;
   		ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
   		ctx.fill();
   	}
   };


   // Start Button object
   startBtn = {
   	w: 100,
   	h: 50,
   	x: W/2 - 50,
   	y: H/2 - 25,

   	draw: function() {
   		ctx.strokeStyle = "blue";
   		ctx.lineWidth = "2";
   		ctx.strokeRect(this.x, this.y, this.w, this.h);

   		ctx.font = "18px Arial, sans-serif";
   		ctx.textAlign = "center";
   		ctx.textBaseline = "middle";
   		ctx.fillStlye = "Green";
   		ctx.fillText("Start", W/2, H/2 );
   	}
   };

   // Restart Button object
   restartBtn = {
   	w: 100,
   	h: 50,
   	x: W/2 - 50,
   	y: H/2 - 50,

   	draw: function() {
   		ctx.strokeStyle = "green";
   		ctx.lineWidth = "2";
   		ctx.strokeRect(this.x, this.y, this.w, this.h);

   		ctx.font = "18px Arial, sans-serif";
   		ctx.textAlign = "center";
   		ctx.textBaseline = "middle";
   		ctx.fillStlye = "white";
   		ctx.fillText("Restart", W/2, H/2 - 25 );
   	}
   };

   // Function for creating particles object
   function createParticles(x, y, m) {
   	this.x = x || 0;
   	this.y = y || 0;

   	this.radius = 1.2;

   	this.vx = -1.5 + Math.random()*3;
   	this.vy = m * Math.random()*1.5;
   }

   // Draw everything on canvas
   function draw() {
   	paintCanvas();
   	for(var i = 0; i < paddles.length; i++) {
          if (i%2==0) {
              p = paddles[i];

     		       ctx.fillStyle = 'rgba(200, 0, 0, 0.8)'; // color change for padel and ball
     		        ctx.fillRect(p.x, p.y, p.w, p.h);
              }
          else {
              p = paddles[i];

              		ctx.fillStyle = 'rgba(0, 0, 200, 0.8)'; // color change for padel and ball
              		ctx.fillRect(p.x, p.y, p.w, p.h);
              }

   	}

   	ball.draw();
   	update();
   }

   // Function to increase speed after every 5 points
   function increaseSpd() {
   	if(points % 4 == 0) {
   		if(Math.abs(ball.vx) < 15) {
   			ball.vx += (ball.vx < 0) ? -1 : 1;
   			ball.vy += (ball.vy < 0) ? -2 : 2;
   		}
   	}
   }

   // Track the position of mouse cursor
   function trackPosition(e) {
   	mouse.x = e.pageX;
   	mouse.y = e.pageY;
   }

   //updet the paddel position with orientaton data

   socket.on('orientation data', function(data) {
       var player = players.filter(function(p) { return p.name === data.playerName; })[0];
       if (!player) return console.log('Player not found', data.playerName);

       var tilt = data.beta;
       if (tilt < -45) tilt = -45;
       if (tilt > 45) tilt = 45;
       tilt += 45;

       orientationData = tilt / 90;
     });

   // Function to update positions, score and everything.
   // Basically, the main game logic is defined here
   function update() {

   	// Update scores
   	updateScore();

   	// Move the paddles on mouse move
   	if(mouse.x && mouse.y) {
   		for(var i = 1; i < paddles.length; i++) {

          p = paddles[i];
     			p.y = mouse.y - p.h/2;
      }
   	}

    if (orientationData) {
      for (var i = 0; i < paddles.length; i++) {
          if (i%2 == 0) {
              p = paddles[i];
              p.y = (orientationData * H) - p.h/2;
          }
          else {
              p = paddles[i];
              p.y = (orientationData * H) - p.h/2;
          }
      }
    }


   	// Move the ball
   	ball.x += ball.vx;
   	ball.y += ball.vy;

   	// Collision with paddles
   	p1 = paddles[1];
   	p2 = paddles[2];

   	// If the ball strikes with paddles,
   	// invert the y-velocity vector of ball,
   	// increment the points, play the collision sound,
   	// save collision's position so that sparks can be
   	// emitted from that position, set the flag variable,
   	// and change the multiplier
   	if(collides(ball, p1)) {
   		collideAction(ball, p1);
   	}


   	else if(collides(ball, p2)) {
   		collideAction(ball, p2);
   	}

   	else {
   		// Collide with walls, If the ball hits the (left and right) top/bottom,
   		// walls, run gameOver() function
   		if(ball.x + ball.r > W) {
   			ball.x = W - ball.r;
   lWall= 1;
   			lReRun();
   		}

   		else if(ball.x < 0) {
   			ball.x = ball.r;
   rWall=1;
   			rReRun();
   		}

   		// If ball strikes the top and bottom walls, invert the
   		// y-velocity vector of ball
   		if(ball.y + ball.r > H) {
   			ball.vy = -ball.vy;
   			ball.y = H - ball.r;
   		}

   		else if(ball.y -ball.r < 0) {
   			ball.vy = -ball.vy;
   			ball.y = ball.r;
   		}
   	}



   	// If flag is set, push the particles
   	if(flag == 1) {
   		for(var k = 0; k < particlesCount; k++) {
   			particles.push(new createParticles(particlePos.x, particlePos.y, multiplier));
   		}
   	}

   	// Emit particles/sparks
   	emitParticles();

   	// reset flag
   	flag = 0;
   }

   //Function to check collision between ball and one of
   //the paddles
   function collides(b, p) {
   	if(b.y + ball.r >= p.y && b.y - ball.r <=p.y + p.h) {
   		if(b.x >= (p.x - p.w) && p.x > 0){
   			paddleHit = 1;
   			return true;
   		}

   		else if(b.x <= p.w && p.x == 0) {
   			paddleHit = 2;
   			return true;
   		}

   		else return false;
   	}
   }

   //Do this when collides == true
   function collideAction(ball, p) {
   	ball.vx = -ball.vx;

   	if(paddleHit == 1) {
   		ball.x = p.x - p.w;
   		particlePos.x = ball.x + ball.r;
   		multiplier = -1;

   	}

   	else if(paddleHit == 2) {
   		ball.x = p.w + ball.r;
   		particlePos.x = ball.x - ball.r;
   		multiplier = 1;

   	}

   	points++;
   	increaseSpd();

   	if(collision) {
   		if(points > 0)
   			collision.pause();

   		collision.currentTime = 0;
   		collision.play();
   	}

   	particlePos.y = ball.y;
   	flag = 1;
   }

   // Function for emitting particles
   function emitParticles() {
   	for(var j = 0; j < particles.length; j++) {
   		par = particles[j];

   		ctx.beginPath();
   		ctx.fillStyle = "white";
   		if (par.radius > 0) {
   			ctx.arc(par.x, par.y, par.radius, 0, Math.PI*2, false);
   		}
   		ctx.fill();

   		par.x += par.vx;
   		par.y += par.vy;

   		// Reduce radius so that the particles die after a few seconds
   		par.radius = Math.max(par.radius - 0.05, 0.0);

   	}
   }

   // Function for updating score
   function updateScore() {
   	ctx.fillStlye = "white";
   	ctx.font = "50px Arial, sans-serif";
   	ctx.textAlign = "left";
   	ctx.textBaseline = "top";
   	ctx.fillText(point2 + " : " + point1, W/2-50, 20 );
   }
   // re run the game

   function lReRun() {
   	if (point2 < 5 && lWall==1){
   		point2 ++;
   		lWall=0;

   		ball.x = 20;
   		ball.y = 20;
   		ball.vx = 10;
   		ball.vy = 2; // cheek to see if the ball starts from where it ended

   	}
   	else {
   		gameOver();
   	}
   }
   	function rReRun() {
   		 if (point1<5 && rWall==1) {
   		rWall=0;
   		point1 ++;

   			ball.x = W-20;
   			ball.y = 20;
   			ball.vx = -10;
   			ball.vy = 2; // cheek to see if the ball starts from where it ended

   	}
   else {
   	gameOver();
   }

   //gameOver();
   }
   // Function to run when the game overs

   function gameOver() {

   if (lWall==1) {
   	ctx.fillStlye = "white";
   	ctx.font = "40px Arial, sans-serif";
   	ctx.textAlign = "center";
   	ctx.textBaseline = "middle";
   	ctx.fillText("Player1 is the WINER", W/2, H/2 + 60 );
   }
   else {
   	ctx.fillStlye = "white";
   	ctx.font = "40px Arial, sans-serif";
   	ctx.textAlign = "center";
   	ctx.textBaseline = "middle";
   	ctx.fillText("Player2 is the WINER", W/2, H/2 + 60 );
   }
   	ctx.fillStlye = "white";
   	ctx.font = "20px Arial, sans-serif";
   	ctx.textAlign = "center";
   	ctx.textBaseline = "middle";
   	ctx.fillText("GAME OVER ", W/2, H/2 + 25 );

   	// Stop the Animation
   	cancelRequestAnimFrame(init);

   	// Set the over flag
   	over = 1;

   	// Show the restart button
   	restartBtn.draw();

   }

   // Function for running the whole animation
   function animloop() {
   	init = requestAnimFrame(animloop);
   	draw();
   }

   // Function to execute at startup
   function startScreen() {
   	draw();
   	startBtn.draw();
   }

   // On button click (Restart and start)


   function btnClick(e) {

   	// Variables for storing mouse position on click
   	var mx = e.pageX,
   			my = e.pageY;

   	// Click start button
   	if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w) {
   		animloop();

   		// Delete the start button after clicking it
   		startBtn = {};
   	}

   	// If the game is over, and the restart button is clicked
   	if(over == 1) {
   		if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
   			ball.x = 20;
   			ball.y = 20;
   			point1 = 0;
   			point2 = 0;
   			points = 0;
   			ball.vx = 10;
   			ball.vy = 3;
   			animloop();

   			over = 0;
   		}
   	}
   }

   // Show the start screen
   startScreen();

 }
function setupPlayer(){
    var canvas = document.getElementById('game-player');
    var playerNameTag = document.getElementById('player-name');

    var playerName;

    socket.emit('join game', { gameName: 'lily' });

    socket.on('game joined', function(data) {
      console.log('game joined', data);
      canvas.style.backgroundColor = data.playerColor;
      playerNameTag.innerHTML = data.playerName;
      playerName = data.playerName;s
    })

    window.addEventListener('deviceorientation', function(event) {
      var alpha = event.alpha; // direction
      var beta = event.beta; // tilt front-back
      var gamma = event.gamma; // tilt left-right

      var data = { gameName: 'lily', playerName: playerName, alpha: alpha, beta: beta, gamma: gamma };
      socket.emit('orientation data', data);
  });

 }

})();
