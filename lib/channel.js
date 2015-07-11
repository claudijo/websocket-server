var EventEmitter = require('events').EventEmitter;
var jsonRpc = require('json-rpc');
var HEARTBEAT_INTERVAL_DELAY = 3 * 1000;

module.exports = function(socket, rooms) {
  var emitter = new EventEmitter();
  var rpc = jsonRpc();
  var joinedRooms = [];
  var heartbeatCount = 0;
  var heartbeatInterval = null;

  var errorListener = function(err) {
    emitter.emit('error', err);
  };

  var closeListener = function(code, message) {
    stopHealthCheck();
    leaveAll();
    socket.removeAllListeners();
    emitter.emit('close', code, message);
  };

  var pongListener = function(data, flags) {
    resetHealthCheck();
  };

  var outboundMessageHandler = function(json) {
    if (socket.readyState !== socket.OPEN) {
      throw new Error('Socket not ready to send');
    }

    socket.send(json);
    resetHealthCheck();
  };

  var startHealthCheck = function() {
    heartbeatCount = 0;

    heartbeatInterval = setInterval(function() {
      if (heartbeatCount > 4) {
        socket.close();
        return;
      }

      heartbeatCount += 1;
      socket.ping();
    }, HEARTBEAT_INTERVAL_DELAY);
  };

  var stopHealthCheck = function() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  };

  var resetHealthCheck = function() {
    if(!heartbeatInterval) {
      return;
    }

    stopHealthCheck();
    startHealthCheck();
  };

  var inRoom = function(roomId) {
    return joinedRooms.includes(roomId);
  };

  var leave = function(roomId) {
    if (inRoom(roomId)) {
      return;
    }

    joinedRooms.splice(joinedRooms.indexOf(roomId), 1);
    rooms.remove(roomId, socket);
  };

  var leaveAll = function() {
    joinedRooms.forEach(function(roomId) {
      leave(roomId);
    });
  };

  rpc.on('message', outboundMessageHandler);
  socket.on('message', rpc.inboundMessageHandler);
  socket.on('error', errorListener);
  socket.on('close', closeListener);
  socket.on('pong', pongListener);

  startHealthCheck();

  return {
    on: function(event, var_args) {
      // Special events
      if (['message', 'error', 'close', 'pong'].includes(event)) {
        emitter.on.apply(emitter, arguments);
        return;
      }

      rpc.on.apply(rpc, arguments);
    },

    to: function(roomId) {

    },

    join: function(roomId) {
      if (inRoom(roomId)) {
        return;
      }

      joinedRooms.push(roomId);
      rooms.add(roomId, socket);
    },

    leave: leave,

    inRoom: inRoom
  };
};