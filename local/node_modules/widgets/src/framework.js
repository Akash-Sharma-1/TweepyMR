var fs = require('fs');
var path = require('path');
var urlPatterns = require('url-patterns');
var jsph = require('jsph');
var jade = require('jade');
var async = require('async');
var less = require('less');
//var static = require('node-static');
//var staticFiles; // = new static.Server(wtf.paths.static, siteConfig.staticOptions)
var urlParser = require('url');
var querystring = require('querystring')
var colors = require('cli-color');

// class constructors
var Page = require('./page.js')
var Widget = require('./widget.js');
var Log = require('./log.js');
var FsCache = require('./fsCache.js');

var wtf = {
	init: function(options, done) {
		wtf.options = options || {};
		if (!wtf.options.root) {
			wtf.options.root = path.dirname(require.main.filename);
		}
		wtf.paths = require("./paths.js");

		wtf.fsCache = new FsCache(function() {
			wtf._loadRoutes();
			if (typeof done == "function") {
				return done();
			}
		});
	},

	requireLibrary: function(libraryName) {
		return require(wtf.paths.library(libraryName));
	},

	_loadRoutes: function() {
		var routePath = path.join(wtf.paths.routes, "routes.js");
		var routes = require(routePath);

		routes._css = routes._css || "/css/(string:ux).css";
		routes._js = routes._js || "/js/(string:ux).js";
		routes._dev = routes._dev || "/dev/(path:theWidget)";
		routes._ajax = routes._ajax || "/ajax/(path:theWidget)";

		for(routeKey in routes) {
			if (typeof routes[routeKey] == "string") {
				routes[routeKey] = {
					action: routeKey,
					pattern: routes[routeKey],
				}
			}
			var route = routes[routeKey]

			// if they defined a pattern instead of a regex, make a regex out of it
			if (route.pattern && !route.regex) {
				route.regex = urlPatterns.createRegex(route.pattern)
			}

			// if a route has no getUrl function create one for it
			if (route.pattern && !route.getUrl) {
				route.getUrl = urlPatterns.createBuilder(route.pattern)
			}

			if (route.pattern && !route.scrape) {
				route.scrape = urlPatterns.createScraper(route.pattern)
			}
		}

		if (!routes._404) {
			routes._404 = {
				regex: null,
				action: "_404",
				getUrl: function() {},
				scrape: function() {},
			}
		}

		wtf.routes = routes;
		return wtf.routes;
	},

	_findRoute: function(requestedPath) {
		requestedPath = '' + requestedPath;
		for (routeKey in wtf.routes) {
			if (wtf.routes[routeKey].regex
				&& requestedPath.match(wtf.routes[routeKey].regex))
			{
				return wtf.routes[routeKey];
			}
		}
		return wtf.routes._404;
	},

	_buildJsFileUrl: function(request) {
		var requiredScripts = {};
		if (request.page) {
			for (var i in request.page.widgets) {
				var widget = request.page.widgets[i];
				for (var j in widget.scripts) {
					requiredScripts[widget.scripts[j].widget] = widget.scripts[j];
				}
			}
		}

		var list = [];
		var max = 0;
		for(var i in requiredScripts) {
			var widgetName = requiredScripts[i].widget;
			if (list.indexOf(widgetName) == -1) {
				list.push(widgetName);
				max = Math.max(max, requiredScripts[i].time);
			}
		}

		if (!list.length) {
			return null;
		}

		var bigOleString = JSON.stringify(list);
		bigOleString = (new Buffer(bigOleString)).toString('base64');
		return wtf.routes._js.getUrl({ ux: bigOleString }) + "?ver=" + max;
	},

	_buildCssFileUrl: function(request) {
		var requiredStyles = {};
		if (request.page) {
			for (var i in request.page.widgets) {
				var widget = request.page.widgets[i];
				for (var j in widget.styles) {
				requiredStyles[widget.styles[j].widget] = widget.styles[j];
				}
			}
		}

		var max = 0;
		var list = {
			t: request.skin || "default",
			w: [],
		}
		for (var i in requiredStyles) {
			var widgetName = requiredStyles[i].widget;
			if (list.w.indexOf(widgetName) == -1) {
				list.w.push(widgetName);
				max = Math.max(max, requiredStyles[i].time);
			}
		}
		var bigOleString = JSON.stringify(list);
		bigOleString = (new Buffer(bigOleString)).toString('base64');
		return wtf.routes._css.getUrl({ ux: bigOleString }) + "?ver=" + max;
	},

	_loadActionUxConfig: function(page, action, ux, callback) {
		if (!action || !ux) {
			return callback("Unspecified Action:Ux '" + action + "':'" + ux + "'");
		}
		var uxFile = wtf.paths.ux(action, ux);
		var uxConfigs = null;
		wtf.fsCache.readFile(uxFile, "utf8", function(err, data) {
			page.log.error(err);
			if (!data) {
				return callback("uxFile empty or doesn't exist: " + uxFile);
			}
			// eval it
			try {
				uxConfigs = eval("(" + data + ")")
			}
			catch (err) {
				page.log.error(err);
				return callback("uxFile doesn't parse as valid JSON: " + uxFile);
			}
			// load_parent
			var extendAction = action;
			var extendUx = null;
			if (uxConfigs.extends) {
				var parts = uxConfigs.extends.split(":");
				switch (parts.length) {
					case 2:
						extendAction = parts[0];
						extendUx = parts[1];
						break;
					case 1:
						extendUx = parts[0];
						break;
					default:
						page.log.warning("extends contains too many : characters. '" + uxConfigs.extends + "'");
						break;
				}
			}
			wtf._loadActionUxConfig(page, extendAction, extendUx, function(err) {
				// widgetBlocks get extened
				if (uxConfigs.widgetBlocks) {
					for(var key in uxConfigs.widgetBlocks) {
						var block = uxConfigs.widgetBlocks[key];
						if (page.widgetBlocks[key]) {
							// append them to the existing block
							for(var x in block) {
								page.widgetBlocks[key].push(block[x]);
							}
						}
						else { // just use this for that block
							page.widgetBlocks[key] = block;
						}
					}
				}

				// widgets overright widgets with the same id
				if (uxConfigs.replaceWidgets) {
					for (var i in uxConfigs.replaceWidgets) {
						var replacementWidget = uxConfigs.replaceWidgets[i];
						for (var key in page.widgetBlocks) {
							var block = page.widgetBlocks[key];
							for (var x in block) {
								var widget = block[x];
								if (widget.id == replacementWidget.id) {
									block[x] = replacementWidget;
								}
							}
						}
					}
				}

				// now, all other properties just port across
				for(var key in uxConfigs) {
					if (key != "replaceWidgets" && key != "widgetBlocks") {
						if (typeof page[key] == "array") {
							page[key] = page[key].concat(uxConfigs[key]);
						}
						else if (page[key] && typeof page[key] == "object") {
							// merge the objects
							for (var i in uxConfigs[key]) {
								page[key][i] = uxConfigs[key][i]
							}
						}
						else { // just overwrte it
							page[key] = uxConfigs[key];
						}
					}
				}
				return callback();
			})
		})
	},

	_loadWidgetConfig: function(widgetName, callback) {
		if (!widgetName) {
			return callback("Widget Not Found 'undefined'");
		}

		var config;

		var emptyConfig = {
			name: widgetName,
			configs: [],
			requires: [],
		};

		var widgetConfigPath = wtf.paths.widgetConfig(widgetName);

		wtf.fsCache.readFile(widgetConfigPath, "utf8", function(err, fileContent) {
			if (!fileContent) {
				wtf.fsCache.exists(wtf.paths.widget(widgetName), function(widgetFolderExists) {
					if (!widgetFolderExists) {
					// folder not found, complain about non existant widget
						return callback("Widget Not Found '" + widgetName + "'");
					}
					else {
					// file not found -> create minimalistic stub
						return callback(null, config || emptyConfig);
					}
				})
				return;
			}
			else {
				try {
					config = eval("(" + fileContent + ")") || emptyConfig;
				}
				catch (err) {
					return callback(err, config || emptyConfig);
				}
			}

			// TODO:  should we complain if the config tried to change this?
			config.name = widgetName;

			// add defaults for missing fields
			if (!config.configs) {
				config.configs = [];
			}
			if (!config.requires) {
				config.requires = [];
			}

			// TODO:  what other fields are there?
			return callback(null, config || emptyConfig);
		})
	},

	_mergeConfigs: function(defaultConfigs, uxConfigs, requestParams) {
		if (!defaultConfigs) defaultConfigs = [];
		if (!uxConfigs) uxConfigs = {};
		if (!requestParams) requestParams = {};
		if (typeof defaultConfigs != "object") throw "invalid value for defaultConfigs";
		if (typeof uxConfigs != "object") throw "invalid value for uxConfigs";
		if (typeof requestParams != "object") throw "invalid value for requestParams";

		var configs = {};

		// get the defaults out of the widget config file
		for (var i in defaultConfigs) {
			if (defaultConfigs[i].default === undefined) {
				configs[defaultConfigs[i].name] = null;
			}
			else {
				configs[defaultConfigs[i].name] = defaultConfigs[i].default;
			}
		}

		// override the existing values based on the configs defined in the action/ux file
		for (key in uxConfigs) {
			if (key in configs) {
				configs[key] = uxConfigs[key];
			}
			//else { // this should be logged as a warning, not an error
			//	throw "uxConfigs contains a value for '" + key + "' which is not in the widget's config options.";
			//}
		}

		// clone the GET params
		for (key in requestParams) {
			if (key in configs) {
				configs[key] = requestParams[key];
			}
		}
		return configs;
	},

	_runLogic: function(widget, page, callback) {
		var logicFile = wtf.paths.widgetLogic(widget.name);
		wtf.fsCache.exists(logicFile, function(logicFileExists) {
			if (!logicFileExists) return callback();
			try {
				var widgetLogic = require(logicFile);
				widgetLogic.prepare(widget, page, function(err) {
					widget.log.error(err);
					return callback();
				})
			}
			catch (err) {
				widget.log.error(err);
				return callback();
			}
		})
	},

	_render: function(widget, callback) {
		if (widget.noRender) {
			widget.html = "";
			return callback();
		}

		var jsphFile = wtf.paths.widgetJsph(widget.name);
		wtf.fsCache.exists(jsphFile, function(jsphFileExists) {
			if (jsphFileExists) {
				jsph.renderFileCached(jsphFile, widget.configs, function(err, html) {
					widget.log.error(err);
					widget.html = html;
					return callback();
				})
			}
			else {
				var jadeFile = wtf.paths.widgetJade(widget.name)
				wtf.fsCache.exists(jadeFile, function(jadeFileExists) {
					if (jadeFileExists) {
						widget.configs.pretty = true;
						jade.renderFileCached(jadeFile, widget.configs, function(err, html) {
							widget.log.error(err);
							widget.html = html;
							return callback();
						})
					}
					else {
						var htmlFile = wtf.paths.widgetStaticHtml(widget.name)
						wtf.fsCache.exists(htmlFile, function(htmlFileExists) {
							if (htmlFileExists) {
								wtf.fsCache.readFile(htmlFile, "utf8", function(err, html) {
									widget.log.error(err);
									widget.html = html;
									return callback();
								})
							}
							else {
								widget.html = "";
								return callback();
							}
						})
					}
				})
			}
		})
	},

	_findScripts: function(widget, callback) {
		widget.scripts = [];


		if (widget.noRender) {
			return callback();
		}

		// surf the dependency tree
		var addWidget = function(widgetName, cb) {
			widget.scripts.push(widgetName)
			wtf._loadWidgetConfig(widgetName, function(err, config) {
				if (err) {
					widget.log.error(err);
					return cb(err);
				}
				if (config.requires.length) {
					for(var i = 0; i < config.requires.length; i++) {
						addWidget(config.requires[i], cb)
					}
				}
				return cb(null)
			})
		}

		var scriptExists = function(widgetName, cb) {
			wtf.fsCache.exists(wtf.paths.widgetScript(widgetName), function(fileExists) {
				return cb(fileExists);
			})
		}

		var count = 0;
		addWidget(widget.name, function(err) {
			count++;

			// when count = length, we have surfed to the end of the tree
			if (count == widget.scripts.length) {
				async.map(widget.scripts, function(x, cb) {
					var scriptjs = wtf.paths.widgetScript(x);
					wtf.fsCache.stat(scriptjs, function(err, stats) {
						if (err || !stats) {
							return cb(null, 0);
						}
						else {
							return cb(null, { widget: x, time: stats.mtime.getTime() });
						}
					})
				}, function(err, results) {
					if (err) {
						widget.log.error(err);;
						widget.scripts = [];
						return callback();
					}
					else {
						widget.scripts = results.filter(function(x) {
							return x != 0;
						});
						widget.scripts.reverse();
						return callback();
					}
				})
			}
		})
	},

	_findStyles: function(widget, callback) {
		widget.styles = [];
		if (widget.noRender) {
			return callback(null, widget);
		}

		var skinLess = wtf.paths.widgetLess(widget.name, widget.skin);
		var defaultLess = wtf.paths.widgetLess(widget.name);

		wtf.fsCache.stat(skinLess, function(err, stats) {
			if (stats) {
				widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
				return callback();
			}
			//else
			wtf.fsCache.stat(defaultLess, function(err, stats) {
				if (stats) {
					widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
				}
				return callback();
			})
		})
	},

	// loadScript: function(widgetName, callback) {
	// 	var scriptName = wtf.paths.widgetScript(widgetName)
	// 	return wtf.fsCache.readFile(scriptName, "utf8", callback);
	// },

	// loadStyle: function(widgetName, skin, callback) {
	// 	var styleFiles = [
	// 		wtf.paths.widgetLess(widgetName, skin),
	// 		wtf.paths.widgetLess(widgetName),
	// 	]

	// 	async.detectSeries(styleFiles, wtf.fsCache.exists, function(foundFile) {
	// 		if (foundFile) {
	// 			return wtf.fsCache.readFile(foundFile, "utf8", callback)
	// 		}
	// 		else {
	// 			return callback("Style '" + skin + "' not found for widget '" + widgetName + "'", "")
	// 		}
	// 	})
	// },

	_prepareWidget: function(widget, page, reqParams, callback) {
		wtf._loadWidgetConfig(widget.name, function (err, config) {
			if (err) {
				widget.noRender = true; // we should consider displaying an error instead of total norender
				widget.log.error(err);
				return callback();
			}

			widget.configs = wtf._mergeConfigs(config.configs, widget.configs, reqParams);
			wtf._runLogic(widget, page, function(err) {
				widget.log.error(err);
				wtf._findStyles(widget, function(err) {
					widget.log.error(err);
					wtf._findScripts(widget, function(err) {
						widget.log.error(err);
						callback();
					})
				})
			})
		})
	},


	initLogs: function(request, response, next) {
		request.startedAt = process.hrtime();
		request.log = new Log();
		request.onTimeout = setTimeout(function() {
			request.timedOut = true;
			request.log.error("request timed out");
			wtf.logRequest(request, response, function(){})
		}, /* wtf.maxRequestMs || */ 5000);
		request.clearTimeout = function() {
			if (request.onTimeout) {
				clearTimeout(request.onTimeout);
				request.onTimeout = null;
			}
		}
		return next();
	},

	chooseRoute: function(request, response, next) {
		request.log.info("chooseRoute");
		request.path = urlParser.parse(request.url || '', true).pathname;
		request.route = wtf._findRoute(request.path);
		if (request.route == wtf.routes._404) {
			request.log.info("no route found for query '" + request.path + "'")
		}
		return next();
	},

	extractParams: function(request, response, next) {
		request.log.info("extractParams");
		var parsedUrl = urlParser.parse(request.url || '', true);
		request.path = parsedUrl.path;

		// start with pretty pars
		request.params = (request.route)
			? request.route.scrape(parsedUrl.pathname)
			: {};
		// then apply "get" params
		for(key in parsedUrl.query) {
			request.params[key] = parsedUrl.query[key];
		}
		// then apply "post" params
		// NOTE ... this expects some other middleware to have set up "request.body"
		if (request.method == "POST" && request.body) {
			var post = (typeof request.body == "object" ? request.body : querystring.parse(request.body));
			for (key in post) {
				request.params[key] = post[key];
			}
		}

		return next();
	},

	dynamicCss: function(request, response, next) {
		request.log.info("dynamicCss");
		if (!request.action && request.route) {
			request.action = request.route.action;
		}
		if (request.action != "_css") {
			return next();
		}
		request.ux = getUx(request);
		request.page = new Page(request.log, request.action, request.ux, null);

		var styleInfo;
		var base64String = decodeURIComponent(request.ux);
		try {
			var buffer = new Buffer(base64String, "base64");
			styleInfo = JSON.parse(buffer);
		}
		catch (e) {
			request.log.error(e);
			request.log.info("base64String: " + base64String);
			return next();
		}

		var skin = styleInfo.t; // "t" was for "theme"
		var requiredStyles = styleInfo.w; //w is short for widgets

		request.log.info("\tskin: " + skin);
		for(var i in requiredStyles) {
			request.log.info("\t" + requiredStyles[i]);
		}

		// array of functions for the async.parallel
		var loadFiles = [];

		var defaultSkin = wtf.paths.cssSkinFolder("default");
		var themedSkin = wtf.paths.cssSkinFolder(skin);
		fs.readdir(defaultSkin, function(err, files) {
			if (err) {
				request.log.error(err);
				return next();
			}
			fs.readdir(themedSkin, function(err, themedFiles) {
				if (err) {
					request.log.error(err);
					return next();
				}
				if (themedFiles && files) {
					for(var i in themedFiles) {
						if (files.indexOf(themedFiles[i]) == -1) {
							files.push(themedFiles[i]);
						}
					}
				}
				files.sort();
				for (i in files) {
					loadFiles[loadFiles.length] = (function(file) {
						return function(cb) {
							var themedFile = path.join(themedSkin, file);
							var defaultFile = path.join(defaultSkin, file);
							wtf.fsCache.readFile(themedFile, "utf8", function(err, data) {
								request.log.error(err);
								if (data !== null) {
									return cb(null, data);
								}
								wtf.fsCache.readFile(defaultFile, "utf8", function(err, data) {
									request.log.error(err);
									return cb(null, data);
								})
							})
						}
					})(files[i]);
				}
				for (i in requiredStyles) {
					loadFiles[loadFiles.length] = (function(widgetName) {
						return function(cb) {
							var defaultLess = wtf.paths.widgetLess(widgetName);
							var skinLess = wtf.paths.widgetLess(widgetName, skin);
							wtf.fsCache.readFile(skinLess, "utf8", function(err, data) {
								if (data !== null) {
									return cb(null, data);
								}
								wtf.fsCache.readFile(defaultLess, "utf8", function(err,data) {
									return cb(null, data);
								})
							})
						}
					})(requiredStyles[i]);
				}
				// load the contents of all of those files
				async.parallel(loadFiles, function(err, results) {
					request.log.error(err);
					request.page.headers['Content-Type'] = "text/css";
					// assemble all of the scripts into one script as the response body
					if (results) {
						var lessData = results.join("\n\n");
						less.render(lessData, function(err, compiledCss) {
							request.page.body = compiledCss;
							return next();
						})
					}
					else {
						request.page.body = err;
						return next();
					}
				})
			})
		})
	},

	dynamicJs: function(request, response, next) {
		request.log.info("dynamicJs");
		if (!request.action && request.route) {
			request.action = request.route.action;
		}
		if (request.action != "_js") {
			return next();
		}
		request.ux = getUx(request);
		request.page = new Page(request.log, request.action, request.ux, null);

		var requiredScripts;
		var base64String = decodeURIComponent(getUx(request));
		try {
			var buffer = new Buffer(base64String, "base64");
			requiredScripts = JSON.parse(buffer);
		}
		catch (e) {
			request.log.error(e);
			request.log.info("base64String: " + base64String);
			return next();
		}
		for(var i in requiredScripts) {
			request.log.info("\t" + requiredScripts[i]);
		}

		// array of functions for the async.parallel
		var loadScripts = [];

		// make a list of functions to load the scripts
		for (widgetName in requiredScripts) {
			loadScripts[loadScripts.length] = (function(widget) {
				return function(cb) {
					var scriptPath = wtf.paths.widgetScript(widget);
					wtf.fsCache.readFile(scriptPath, "utf8" ,function(err, data) {
						request.log.error(err);
						return cb(null, data);
					})
				}
			})(requiredScripts[widgetName]);
		}

		// load the scripts in parallel
		async.parallel(loadScripts, function(err, results) {
			request.log.error(err);
			// assemble all of the scripts into one script as the response body
			if (results) {
				request.page.headers['Content-Type'] = "application/javascript";
				request.page.body = results.join("\n\n");
			}
			else {
				request.page.body = err;
			}
			return next();
		})
	},

	chooseActionUx: function(request, response, next) {
		request.log.info("chooseActionUx");
		switch(request.action) {
			case "_css":  // special route for dynamic css
			case "_js":   // special action for dynamic scripts
				return next();
		}

		if (!request.action && !request.route) {
			request.log.error("Unable to run rules, request.action not set, and request.route not available as fallback.");
			request.route = wtf.routes._404;
		}
		request.action = request.action || request.route.action;
		request.ux = getUx(request) || "default";
		request.skin = getSkin(request) || "default";

		// TODO: should actually run rules
		return next();
	},

	prepareResponse: function(request, response, next) {
		request.log.info("prepareResponse");
		// dont even do this function for the special routes
		switch(request.action) {
			case "_css":  // special route for dynamic css
			case "_js":   // special action for dynamic scripts
				return next();
		}

		var uxJson;
		var loadWidgets = {};
		var renderWidgets = {};
		request.page = new Page(request.log, request.action, request.ux);
		request.page.requestPath = request.path;
		request.page.session = request.session;

		async.series([
			// load the action/ux config file
			function(done) {
				request.log.info("load Action/Ux config");
				wtf._loadActionUxConfig(request.page, request.action, request.ux, function(err) {
					request.log.error(err);
					if (err) {
						request.log.warning("defaulting to default UX for this action: " + request.action);
						wtf._loadActionUxConfig(request.page, request.action, "default", function(err) {
							request.log.error(err);
							return done();
						})
						return;
					}
					return done()
				})
			},

			// create the widgets, and create functions that will prepare each one
			function(done) {
				request.log.info("create widgets");
				for (var blockIndex in request.page.widgetBlocks) {
					var block = request.page.widgetBlocks[blockIndex];
					for (var widgetIndex in block) {
						var widgetConfigs = block[widgetIndex];
						widgetConfigs.id = widgetConfigs.id || (blockIndex + "-" + widgetIndex);

						if (widgetConfigs.id == "theWidget" 
							&& (request.page.action == "_dev" || request.page.action == "_ajax")) 
						{
							widgetConfigs.widget = request.params["theWidget"];
						}

						var newWidget = new Widget(
							widgetConfigs.widget
							, widgetConfigs.id
							, request.page.skin
							, widgetConfigs.configs
						);

						for (var key in widgetConfigs) {
							switch(key) {
								case "id":  // dont update these
								case "widget":
								case "name":
								case "configs":
									break;
								default: // do update everything else
									newWidget[key] = widgetConfigs[key];
									break;
							}
						}

						request.page.widgets[newWidget.id] = newWidget;

						// these are used for async.auto
						loadWidgets[newWidget.id] = [];
						renderWidgets[newWidget.id] = [];

						if (newWidget.runAfter) {
							loadWidgets[newWidget.id].push(newWidget.runAfter);
						}

						loadWidgets[widgetConfigs.id].push(
							(function(widget) {
								return function(cb) {
									wtf._prepareWidget(widget, request.page, request.params, function(err) {
										widget.log.error(err);
										return cb();
									});
								}
							})(newWidget)
						);

						renderWidgets[widgetConfigs.id].push(
							(function(widget) {
								return function(cb) {
									wtf._render(widget, function(err) {
										widget.log.error(err);
										return cb();
									});
								}
							})(newWidget)
						);
					}
				}
				return done();
			},

			// actually load them up now
			function(done) {
				request.log.info("load widgets");
				async.auto(loadWidgets, done);
			},

			// render them all
			function(done) {
				request.log.info("render Widgets")
				async.auto(renderWidgets, done);
			},

			// render the page itself
			function(done) {
				request.log.info("render Wireframe");
				request.page.cssUrl = wtf._buildCssFileUrl(request);
				request.page.jsUrl = wtf._buildJsFileUrl(request);

				var jsphWireframe = wtf.paths.wireframeJsph(request.page.wireframe);
				jsph.renderFileCached(jsphWireframe, request.page, function(err, html) {
					request.log.error(err);
					if (!err && html) {
						request.page.body = html;
						return done();
					}

					var jadeWireframe = wtf.paths.wireframeJade(request.page.wireframe);
					request.page.pretty = true;
					jade.renderFileCached(jadeWireframe, request.page, function(err, html) {
						request.log.error(err);
						request.page.body = html;
						return done();
					})
				})
			},

			function(done) {
				request.log.info("done building response");
				next();
				return done();
			}
		])
	},

	_sendResponse: function(request, response, next) {
		request.log.info("sendResponse - start");
		//request.responseHeaders['Cache-Control'] = request.responseHeaders['Cache-Control'] || 'max-age=0'
		//response.sendDate = true;
		request.ttfb = process.hrtime(request.startedAt);
		response.writeHead(request.page.statusCode, request.page.headers);
		response.write(request.page.body || "");
		//request.ttlb = process.hrtime(request.startedAt);
		//convert timestamp to ms
		request.ttfb = +Math.round((request.ttfb[0] * 1000) + (request.ttfb[1] / 1000000));
		//request.ttlb = +Math.round((request.ttlb[0] * 1000) + (request.ttlb[1] / 1000000));
		response.end();
		return next();
	},

	// this wrapper function exists because connect really doesnt want you to call next() if you send a reply.
	// but I dont see a good way to do unit tests without a callback
	sendResponse: function(request, response, next) {
		var dontCallback = function() {};
		wtf._sendResponse(request, response, dontCallback);
	},

	logRequest: function(request, response, next) {
		request.log.info("logRequest");
		request.clearTimeout();
		if (wtf.options && wtf.options.logToConsole) {
			console.log();
			console.log(colors.whiteBright(request.method  + "  " + request.url));
			console.log(colors.white("action:   ") + colors.yellow(request.action || "?") + colors.magenta(" : ") + colors.yellow(request.ux || "?"));
			console.log(colors.white("ttfb:     ") +
				(request.ttfb < 250 ? colors.green(request.ttfb)
				: (request.ttfb < 500 ? colors.magenta(request.ttfb)
				: (request.ttfb < 1000 ? colors.redBright(request.ttfb)
				: colors.magentaBright(request.ttfb)))
			) + colors.blackBright("ms"));

			for (var i in request.log.events) {
				lines = request.log.events[i].message.match(/[^\r\n]+/g);
				firstLine = lines[0];
				theRest = lines.slice(1).join("\n");

				switch(request.log.events[i].type) {
					case "info":
						console.log(colors.blackBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
					case "warning":
						console.log(colors.cyanBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
					default:
					case "error":
						console.log(colors.yellowBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
				}
			}
			if (request.page) {
				for (var x in request.page.widgets) {
					var widget = request.page.widgets[x];
					if (widget.log.events.length) {

						console.log(colors.redBright("Widget Log:" + x + " (" + widget.name + ")"));
						for (var i in widget.log.events) {
							lines = widget.log.events[i].message.match(/[^\r\n]+/g);
							firstLine = lines[0];
							theRest = lines.slice(1).join("\n");

							switch(widget.log.events[i].type) {
								case "info":
									console.log("\t" + colors.blackBright(firstLine));
									if (theRest) console.log("\t" + colors.blackBright(theRest));
									break;
								case "warning":
									console.log("\t" + colors.cyanBright(firstLine));
									if (theRest) console.log("\t" + colors.blackBright(theRest));
									break;
								default:
								case "error":
									console.log("\t" + colors.yellowBright(firstLine));
									if (theRest) console.log("\t" + colors.blackBright(theRest));
									break;
							}
						}
					}
				}
			}
		}
		return next();
	},
};

module.exports = wtf;

function getUx(request) {
	if (!request) return "";
	return request.ux || (request.params?request.params.ux:"") || "";
}

function getSkin(request) {
	if (!request) return "";
	return request.skin || (request.params?request.params.skin:"") || "";
}