exports.register = function (server, conf, next) {
  
  require('./dataprovider.routes')(server, conf);

  return next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
