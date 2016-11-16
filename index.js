var Hapi = require('hapi');
var fs = require('fs');
var good = require('good');
var path = require('path');
var request = require("request");

var env = process.env.NODE_ENV;

if(!env) throw "Please set NODE_ENV variable.";


const getConfigFile = function () {
  try {
    // Try to load the user's personal configuration file
    return require(process.cwd() + '/conf.my.' + env + '.json');
  } catch (e) {
    // Else, read the default configuration file
    return require(process.cwd() + '/conf.' + env + '.json');
  }
}

const startServer = function(cluster){

    var conf = getConfigFile();
    
    var server = new Hapi.Server();

    if(conf.tls && conf.tls.key && conf.tls.cert){
        const tls = {
          key: fs.readFileSync(conf.tls.key),
          cert: fs.readFileSync(conf.tls.cert)
        };
    }

    server.connection({ 
        host: conf.host,
        port: conf.port,
        tls: tls
    });

    var plugins = [];

    Object.keys(conf.plugins).forEach(function(pluginName){
        var plugin = {};
        plugin.register = require(pluginName);
        plugin.options = conf.plugins[pluginName];
        plugins.push(plugin);
    });

    plugins.push({
        register: good,
        options: {
            reporters: [
            {
                reporter: require('good-console'),
                events: { log: '*', response: '*' }
            }, {
                reporter: require('good-file'),
                events: { ops: '*' },
                config: 'all.log'
            }]
        }
    });

    if(cluster){
        server.method({
            name: 'cluster.getWorker',
            method: function(){
                return cluster.worker;
            },
            options: {}
        });
    }

    server.register(plugins, function(err){
        if (err) {
            throw err; // something bad happened loading the plugin
        }

    });

    request.get("http://localhost:5984/shinytooth/_design/user/_view/scopes", function(err,res,data){
        if(JSON.parse(res.body).total_rows==0){
            request({  
                method: 'POST',
                uri: 'http://localhost:5984/shinytooth/',
                body: {
                    type: 'scopes',
                    scopes:['default','admin']
                },
                json: true 
            }, function(err,res,data){
                if(err){
                    throw err;
                }
            });
        }
    });
    
    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
}

if(env === 'production'){
    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {
      // Fork workers.
      for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        console.log("worker ", worker.process.pid,"died");
      });
      
    } else {
        startServer(cluster);
    }
}else{

    startServer();
}

