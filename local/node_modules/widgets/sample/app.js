var http = require('http');
var connect = require('connect');
var wtf = require('widgets');

var siteConfig = {
	site: "www.test.com",
	root: __dirname,
	port: 8080,
	staticOptions: { cache: false },
	logToConsole: true,
}

wtf.init(siteConfig, function() {
	var app = connect()
		.use(wtf.initLogs)
		.use(function(req, res, next){
			res.on('finish', function(){
				wtf.logRequest(req, res, function(){});
			});
			next();
		})
		.use(connect.static(wtf.paths.static))
		.use(wtf.chooseRoute)
		.use(wtf.extractParams)
		.use(wtf.dynamicCss)
		.use(wtf.dynamicJs)
		.use(wtf.chooseActionUx)
		.use(wtf.prepareResponse)
		.use(wtf.sendResponse)
		;

	var server = http.createServer(app);
	server.listen(siteConfig.port);

	console.log("listening on " + siteConfig.port);
});

