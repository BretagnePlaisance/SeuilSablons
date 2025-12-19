// Polyfill pour Promise.catch sur anciennes WebView
if (typeof Promise !== 'undefined' && !Promise.prototype.catch) {
  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };
}

// Polyfill pour Promise.finally
if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    return this.then(
      value => Promise.resolve(callback()).then(() => value),
      reason => Promise.resolve(callback()).then(() => { throw reason; })
    );
  };
}