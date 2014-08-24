var Hapi = require('hapi');
var server = new Hapi.Server(process.env.PORT || 3000);
var TempoDBClient = require('tempodb').TempoDBClient;
var tempodb = new TempoDBClient('heroku-5e2f03bd25cf424098426a8a21db26f3', process.env.TEMPODB_API_KEY, process.env.TEMPODB_API_SECRET, {hostname: process.env.TEMPODB_API_HOST, port: process.env.TEMPODB_API_PORT});


var sensors = new Array();
sensors[0] = {id: 0, name: 'Photo Resistor', measurements: new Array()};

server.route({
	method: 'GET'
	    , path: '/'
	    , handler: function(request, reply){
	    reply('Hello, Internet of Things fans!');
	}
    });

/*
curl -X POST -H "Content-Type: application/json" -d '{"value": 20}' -i http://iotbe-njugbe.herokuapp.com/sensor/0/measurement
 */

server.route({
	method: 'POST'
	    , path: '/sensor/{sensor_id}/measurement'
	    , config: {
	    handler: function(request, reply){
		var newMeasurement = new Object();
		newMeasurement.created_on = new Date();
		newMeasurement.value = request.payload.value;
		console.dir(newMeasurement);
		//sensors[request.params.sensor_id].measurements.push(newMeasurement);
		tempodb.write_key('sensor-' + request.params.sensor_id, [{t: newMeasurement.created_on, v: newMeasurement.value}], function(error, result){ 
			if(error){
			    console.log("An error occured when writing to TempoDB.");
			    console.dir(error);
			    reply(error);
			}else{
			    var out = result.status;
			    if(result.json){
				out += ': ' + JSON.stringify(result.json);
			    }
			    console.log(out);
			    console.log(result.response);
			    reply(result);
			} 
		    });

		//reply(newMeasurement);
	    }
	}
});

server.route({
	method: 'GET'
	    , path: '/sensor/{sensor_id}/measurements'
	    , handler: function(request, reply){
	    reply(sensors[request.params.sensor_id].measurements);
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
	    reply(sensors[request.params.id]);
	}
});

server.route({
	method: 'GET'
	    , path: '/sensor/{id}/measurements/last/{number_of_samples}'
	    , handler: function(request, reply){
	    var last_samples = new Array();
	    var measurements_length = sensors[request.params.id].measurements.length;
	    for(var i = 0; i < request.params.number_of_samples; i++){
		last_samples.push(sensors[request.params.id].measurements[measurements_length - 1 - request.params.number_of_samples + i]);
	    }
	    reply(last_samples);
	}
});


server.start(function(){
	console.log('Server running at:' + server.info.uri);
});
