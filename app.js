var http = require('http');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

app.use(express.static('static'));

var games = {};
var playerColors = ['rgba(200, 0, 0, 0.8)', 'rgba(0, 0, 200, 0.8)']; //, 'rgba(0, 200, 0, 0.8)', 'rgba(0, 200, 200, 0.8)']; for four players


function getOrCreateGame(gameName) {
  var game = games[gameName];
  if (game) return game;

  console.log('creating new game', gameName);
  return games[gameName] = {
    hostSocket: null,
    players: [],
  };
}
function choosPlayerColor(num){
var colo='red';
  if (num%2==0) {
    colo = 'Red';
  }
  else {
    colo= 'Blue'
  }
  return colo;
}

function leaveGame(gameName, leavingPlayer) {
  var game = games[gameName];
  if (!game) return console.log('no game with name', gameName, 'to leave');
  game.players = game.players.filter(function(player) { return player.player !== leavingPlayer; });

  if (game.hostSocket) game.hostSocket.emit('player left', leavingPlayer);
}

io.on('connection', function(socket) {
  var hostedGames = [];
  var joinedGames = [];

  console.log('User connected');
  socket.on('disconnect', function() {
    console.log('User disconnected');
  });


  socket.on('orientation data', function(data) {
    var game = getOrCreateGame(data.gameName);
    if (game.hostSocket) game.hostSocket.emit('orientation data', data);
  });


  socket.on('host game', function(data) {
      console.log('Hosting game from: ', data);
  });
  socket.on('join game', function(data) {
    console.log('join game', data);

        var game = getOrCreateGame(data.gameName);
        var num = 1;
var colo = 0;
        game.players.forEach(function(p) { if (p.player.num === num)  num += 1; });

        var player = {

          num: num ,

          playerName: 'player ' + (num%2 +1) ,
          playerColor: playerColors[(num - 1) % playerColors.length],
        };

      game.players.push({
          player: player,
          socket: socket
      });
      joinedGames.push({ gameName: data.gameName, player: player });

      console.log('new player joined', player);

      if (game.hostSocket) game.hostSocket.emit('new player joined', player);
        socket.emit('game joined', player);


  });
});



var port = process.env.PORT || 5000;
server.listen(port, function(err) {
  if (err) return console.log(err.stack);
  console.log('listening on port', port);
})
