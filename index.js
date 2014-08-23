var Hapi = require('hapi');
var server = new Hapi.Server(process.env.PORT || 3000);

server.route({
	method: 'GET'
	    , path: '/'
	    , handler: function(request, reply){
	    reply('Hello, Internet of Things fans!');
	}
    });

server.start(function(){
	console.log('Server running at:' + server.info.uri);
});
