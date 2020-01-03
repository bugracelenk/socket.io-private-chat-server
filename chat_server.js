var http = require('http').createServer(handler)
  , io   = require('socket.io').listen(http).set('log level', 1);
 
const port = process.env.PORT || 8080;

http.listen(port);
console.log(`Chatserver listening on port ${port}`);
 
var nicknames = {};
var log = {};
 
function handler(req, res) {
  res.writeHead(200);
  res.end();
}
 
function tstamp() {
  var currentTime = new Date();
  var days = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat');
  var day = currentTime.getDay();
  var hours = currentTime.getHours();
  var minutes = currentTime.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (hours > 11) {
    var ap = 'p';
  }
  else {
    var ap = 'a';
  }
  if (hours > 12) {
    hours = hours - 12;
  }
 
  return "["+ days[day] + " " + hours + ":" + minutes + ap + "m] ";
}
 
function updateLog(type, nick, msg) {
  var curTime = new Date();
  if (typeof 'type' != 'undefined') {
    log[curTime.getTime()] = {'type': type, 'nick': nick, 'msg': msg};
  }
  var i;
  for (i in log) {
    // Cull the log, removing entries older than a half hour.
    if (i < (curTime.getTime() - 1800000)) {
      delete log[i];
    }
  }
}
 
io.sockets.on('connection', function (socket) {
 
   socket.on('private message', function(targetUser,msg) {        
        io.sockets.socket(targetUser).emit('private message', tstamp(), socket.nickname, msg);
        updateLog('private message', socket.nickname, msg);
   });
   
  socket.on('get log', function () {
    updateLog(); // Ensure old entries are cleared out before sending it.
    io.sockets.emit('chat log', log);
  });
 
  socket.on('nickname', function (nick, fn) {
    var i = 1;
    var orignick = nick;
    while (nicknames[nick]) {
      nick = orignick+i;
      i++;
    }
    fn(nick);
    nicknames[nick] = socket.nickname = nick;
    socket.broadcast.emit('announcement', nick + ' connected');
    io.sockets.emit('nicknames', nicknames);
  });
 
  socket.on('disconnect', function () {
    if (!socket.nickname) return;
 
    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});