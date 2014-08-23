var Hapi = require('hapi');
var server = new Hapi.Server(process.env.PORT || 3000);

var sensors = new Array();
sensors[0] = {id: 0, name: 'Photo Resistor', measurements: new Array()};

server.route({
	method: 'GET'
	    , path: '/'
	    , handler: function(request, reply){
	    reply('Hello, Internet of Things fans!');
	}
    });

server.route({
	method: 'POST'
	    , path: '/sensor/{sensor_id}/measurement'
	    , config: {
	    handler: function(request, reply){
		var newMeasurement = new Object();
		newMeasurement.created_on = new Date();
		newMeasurement.value = req.payload.value;
		sensors[request.params.sensor_id].measurements.push(newMeasurement);
		reply(newMeasurement);
	    }
	}
});

server.route({
	method: 'GET'
	    , path: '/sensor/{sensor_id}/measurements'
	    , handler: function(request, reply){
	    reply(sensors[req.params.sensor_id].measurements);
	}
});

server.route({
	method: 'GET'
	    , path: '/sensors'
	    , handler: function(request, reply){
	    reply(sensors);
	}
});

server.route({
	method: 'GET'
	    , path: '/sensor/{id}'
	    , handler: function(request, reply){
	    reply(sensors[req.params.id]);
	}
});



server.start(function(){
	console.log('Server running at:' + server.info.uri);
});
