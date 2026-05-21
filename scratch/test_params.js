function show(msg, type = 'info', duration = 4000) {
  console.log('duration:', duration);
}

function success(msg, duration) {
  show(msg, 'success', duration);
}

success('test'); // should be 4000
success('test', 2000); // should be 2000
success('test', undefined); // should be 4000
