module.exports = function() {
  var roomMap = {};

  return {
    add: function(roomId, socket) {
      if (roomMap[roomId].includes(socket)) {
        return;
      }

      if (!roomMap[roomId]) {
        roomMap[roomId] = [];
      }

      roomMap[roomId].push(socket);
    },

    remove: function(roomId, socket) {
      if (!roomMap[roomId].includes(socket)) {
        return;
      }

      roomMap[roomId].splice(roomMap[roomId].indexOf(socket), 1);

      if (!roomMap[roomId].length) {
        delete roomMap[roomId];
      }
    },

    get: function(roomId) {
      return roomMap[roomId] || [];
    }
  };
};