exports.remove = function(arr, elem) {
  var i;
  if (!arr) return;
  i = arr.indexOf(elem);
  if (i < 0) return;
  arr.splice(i, 1);
};

exports.contains = function(arr, elem) {
  if (!arr) return false;
  return arr.indexOf(elem) > -1;
};