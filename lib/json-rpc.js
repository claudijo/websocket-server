var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');
var ERRORS = require('./json-rpc-errors');
var response = require('./json-rpc-response');
var request = require('./json-rpc-request');
var errorParser = require('./error-parser');

module.exports = function() {
  var emitter = new EventEmitter();

  var messageQueue = [];
  var responseListeners = {};

  var handleRequest = function(request, forceBatchResponse) {
    var replyCallback = function noop() {};

    if (typeof request.method !== 'string') {
      deferredSend(response(undefined, ERRORS.INVALID_REQUEST, null), forceBatchResponse);
      return;
    }

    if (!emitter.listener(request.method).length) {
      deferredSend(response(undefined, ERRORS.METHOD_NOT_FOUND, request.id), forceBatchResponse);
      return;
    }

    if (typeof request.id === 'string' || typeof request.id === 'number') {
      replyCallback = function(err, result) {
        if (err === null) {
          err = undefined;
        } else if (err instanceof Error) {
          err = errorParser(err);
        }
        deferredSend(response(result, err, request.id));
      };
    }

    emitter.emit(request.method, request.params, replyCallback);
  };

  var flushMessageQueue = function(forceBatchResponse) {
    var data;
    var json;

    if (messageQueue.length === 0) {
      return;
    }

    if (!forceBatchResponse && messageQueue.length === 1) {
      data = messageQueue[0];
    } else {
      data = messageQueue;
    }

    json = JSON.stringify(data);
    messageQueue = [];
    emitter.emit('message', json);
  };

  var deferredSend = function(message, forceBatchResponse) {
    messageQueue.push(message);
    process.nextTick(function() {
      flushMessageQueue(forceBatchResponse);
    });
  };

  return {
    on: emitter.on.bind(emitter),

    emit: function(method, params, fn) {
      var id;
      var message;

      if (typeof params === 'function') {
        fn = params;
      }

      if (typeof fn === 'function') {
        id = uuid.v4();
        responseListeners[id] = fn;

        // Timeout uncalled response listeners.
        setTimeout(function() {
          if (responseListeners[id]) {
            deferredSend(response(undefined, ERRORS.INTERNAL_ERROR, id));
            delete responseListeners[id];
          }
        }, 10 * 1000);
      }

      message = request(method, params, id);
      messageQueue.push(message);

      process.nextTick(flushMessageQueue);
    },

    inboundMessageHandler: function(json) {
      try {
        var data = JSON.parse(json);
      } catch(err) {
        deferredSend(response(undefined, ERRORS.PARSE_ERROR, null));
        return;
      }

      if (data.jsonrpc !== '2.0') {
        return;
      }

      if (data.id) {
        if (responseListeners[data.id]) {
          responseListeners[data.id].call(null, data.error, data.result);
        }

        delete responseListeners[data.id];
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        data.forEach(function(request) {
          handleRequest(request, true);
        });

        return;
      }

      handleRequest(data);
    }
  }
};
