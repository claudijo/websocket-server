module.exports = function(err) {
  return {
    message: err.message
  };

  // TODO: Handle developent errors without stack property
  var obj = {};

  Object.getOwnPropertyNames(err).forEach(function(key) {
    obj[key] = err[key];
  });

  return obj;
};