module.exports = function(result, error, id) {
  return {
    jsonrpc: '2.0',
    result: result,
    error: error,
    id: id
  };
};