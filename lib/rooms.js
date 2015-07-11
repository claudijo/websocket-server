var array = require('./array');

module.exports = function() {
  var roomMap = {};

  return {
    add: function(roomId, socket) {
      if (array.contains(roomMap[roomId], socket)) {
        return;
      }

      if (!roomMap[roomId]) {
        roomMap[roomId] = [];
      }

      roomMap[roomId].push(socket);
    },

    remove: function(roomId, socket) {
      if (!array.contains(roomMap[roomId])) {
        return;
      }

      array.remove(roomMap[roomId], socket);

      if (!roomMap[roomId].length) {
        delete roomMap[roomId];
      }
    },

    get: function(roomId) {
      return roomMap[roomId] || [];
    }
  };
};