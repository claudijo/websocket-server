module.exports = function(method, params, id) {
  return {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: id
  };
};