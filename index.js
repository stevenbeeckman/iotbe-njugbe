var Hapi = require('hapi');
var server = new Hapi.Server(process.env.PORT || 3000);
var TempoDBClient = require('tempodb').TempoDBClient;
var tempodb = new TempoDBClient('heroku-5e2f03bd25cf424098426a8a21db26f3', process.env.TEMPODB_API_KEY, process.env.TEMPODB_API_SECRET, {hostname: process.env.TEMPODB_API_HOST, port: process.env.TEMPODB_API_PORT});
var moment = require('moment');

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
		newMeasurement.t = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
		newMeasurement.v = request.payload.value;
		//console.dir(newMeasurement);
		//sensors[request.params.sensor_id].measurements.push(newMeasurement);
		var tempodb_data = new Array();
		tempodb_data.push(newMeasurement);

		var series_key = 'sensor-' + request.params.sensor_id;
		console.log("Data for series " + series_key + ":");
		console.dir(tempodb_data);
		tempodb.write_key(series_key, tempodb_data, function(error, result){ 
			if(error){
			    console.log("An error occured when writing to TempoDB.");
			    console.dir(error);
			    reply(error);
			}else{
			    //console.dir(result);
			    var out = result.status;
			    if(result.json){
				out += ': ' + JSON.stringify(result.json);
			    }
			    console.log(out);
			    //console.log(result.response);
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
	    var series_key = "sensor-" + request.params.sensor_id;
	    var series_start_date = moment("2014-08-24").format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
	    var series_end_date = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
	    tempodb.read(series_key, series_start_date, series_end_date, null, function(err, result){
		    if(err){
			console.log("TempoDB: " + err.status + ": " + err.json);
			reply(err);
		    }else{
			console.log(result.json);
			result.json.data.toArray(function(err, data){
				if(err){
				    console.log(err);
				    reply(err);
				}else{
				    console.log("Returning " + data.length + " data points for series " + series_key );
				    reply(data);
				}
			    });
		    }
		});
	}
});

server.route({
	method: 'GET'
	    , path: '/sensors'
	    , handler: function(request, reply){
	    reply(sensors);
	}
});


// returns a summary of the time series behind the sensor
server.route({
	method: 'GET'
	    , path: '/sensor/{id}'
	    , handler: function(request, reply){
	    var series_key = "sensor-" + request.params.id;
	    var series_start_date = moment("2014-08-24").format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
	    var series_end_date = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
	    tempodb.getSummary(series_key, series_start_date, series_end_date, function(error, result){;
		    if(error){
			console.log(error);
			reply(error);
		    }else{
			console.log(result.json);
			reply(result.json);
		    }
		}
		);
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
