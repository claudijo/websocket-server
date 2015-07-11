var EventEmitter = require('events').EventEmitter;
var JsonRpc = require('json-rpc');
var array = require('./array');
var HEARTBEAT_INTERVAL_DELAY = 3 * 1000;

module.exports = function(socket, rooms) {
  var emitter = new EventEmitter();
  var jsonRpc = new JsonRpc();
  var joinedRooms = [];
  var heartbeatCount = 0;
  var heartbeatInterval = null;

  var errorListener = function(err) {
    emitter.emit('error', err);
  };

  var closeListener = function(code, message) {
    stopHealthCheck();
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
    return array.contains(joinedRooms, roomId);
  };

  jsonRpc.on('message', outboundMessageHandler);
  socket.on('message', jsonRpc.inboundMessageHandler);
  socket.on('error', errorListener);
  socket.on('close', closeListener);
  socket.on('pong', pongListener);

  return {
    on: function(event, var_args) {
      // Special events
      if (array.contains(['message', 'error', 'close', 'pong'], event)) {
        emitter.on.apply(emitter, arguments);
        return;
      }

      jsonRpc.on.apply(jsonRpc, arguments);
    },

    to: function(roomId) {

    },

    join: function(roomId) {
      if (inRoom(roomId)) {
        return;
      }

      joinedRooms.push(roomId);
      rooms.add(roomId, this);
    },

    leave: function(roomId) {
      if (inRoom(roomId)) {
        return;
      }

      array.remove(joinedRooms, roomId);
      rooms.remove(roomId, this);
    },

    leaveAll: function() {
      joinedRooms.forEach(function(roomId) {
        this.leave(roomId);
      }.bind(this));
    }
  };
};