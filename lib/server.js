var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require('ws').Server;

module.exports = function(opts) {
  var webSocketServer = new WebSocketServer(opts);
  var emitter = new EventEmitter();
  var rooms = require('./rooms')();

  var connectionListener = function(socket) {
    var channel = require('channel')(socket, rooms);
    emitter.emit('connection', channel);
  };

  var errorListener = function(err) {
    emitter.emit('error', err);
  };

  var headersListener = function(headers) {
    emitter.emit('headers', headers);
  };

  webSocketServer.on('connection', connectionListener);
  webSocketServer.on('error', errorListener);
  webSocketServer.on('headers', headersListener);

  return {
    on: emitter.on.bind(emitter)
  };
};
