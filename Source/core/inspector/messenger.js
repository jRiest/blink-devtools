window.addEventListener('message', function(e) {
  if (e.origin.indexOf('chrome-extension') !== 0) { return; }

  var data = e.data;
  if (data.type === 'executeFn') {
    window[data.fn].apply(null, data.args);
  }
}, false);