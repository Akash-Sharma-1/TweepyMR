var watchr = require('watchr');
var jsph = require('jsph');
var jade = require('jade');
var fs = require('fs');
var path = require('path');
var async = require('async');
var colors = require('cli-color');

FsCache = function(done) {
	var _this = this;
	var wtf = require("./framework.js");
	var existsCache = this.existsCache = {};
	var contentCache = this.contentCache = {};
	var statCache = this.siteCache = {};
	jsph.cache = jsph.cache || {};
	jade.cache = jade.cache || {};

	jsph.cachedCompile = function(filename, callback) {
		if (filename in jsph.cache) {
			return callback(null, jsph.cache[filename]);
		}
		_this.readFile(filename, function(err, data) {
			if (err) console.log(err);
			if (data) {
				try {
					jsph.cache[filename] = jsph.compile(data);
					return callback(null, jsph.cache[filename]);
				}
				catch(e) {
					console.log(e);
					jsph.cache[filename] = null;
					// I'm not entirely sure I want to report the error
					return callback();
				}
			}
			else {
				jsph.cache[filename] = null;
				// I'm not entirely sure I want to report the error
				return callback();
			}
		});
	}

	jsph.renderFileCached = function(filename, paramObject, callback) {
		callback = callback || paramObject;
		if (typeof options == "function") {
			callback = paramObject;
			paramObject = null;
		}
		jsph.cachedCompile(filename, function(err, compiledTemplate) {
			if (err) console.log(err);
			var result = null;
			if (typeof compiledTemplate == "function") {
				result = compiledTemplate(paramObject);
			}
			else if (compiledTemplate) {
				console.log("jsph.renderFile ... template was not a function", compiledTemplate);
			}
			return callback(null, result);
		})
	}

	jade.cachedCompile = function(filename, callback) {
		if (filename in jade.cache) {
			return callback(null, jade.cache[filename]);
		}
		_this.readFile(filename, function(err, data) {
			if (err) console.log(err);
			if (data) {
				try {
					jade.cache[filename] = jade.compile(data, {pretty:true});
					return callback(null, jade.cache[filename]);
				}
				catch(e) {
					console.log(e);
					jade.cache[filename] = null;
					// I'm not entirely sure I want to report the error
					return callback();
				}
			}
			else {
				jade.cache[filename] = null;
				// I'm not entirely sure I want to report the error
				return callback();
			}
		});
	}


	jade.renderFileCached = function(filename, paramObject, callback) {
		callback = callback || paramObject;
		if (typeof options == "function") {
			callback = paramObject;
			paramObject = null;
		}

		jade.cachedCompile(filename, function(err, compiledTemplate) {
			if (err) console.log(err);
			var result = null;
			if (typeof compiledTemplate == "function") {
				result = compiledTemplate(paramObject);
			}
			else if (compiledTemplate) {
				console.log("jade.renderFile ... template was not a function", compiledTemplate);
			}
			return callback(null, result);
		})
	}

	this.readFile = function(filename, options, callback) {
		if (typeof options == "function") {
			callback = options;
			options = null;
		}
		if (filename in contentCache) {
			return callback(null, contentCache[filename]);
		}
		else {
			options = options || "Utf8";
			fs.readFile(filename, options, function(err, data) {
				if (!data) data = null;
				contentCache[filename] = data;
				return callback(null, contentCache[filename]);
			});
			return;
		}
	}

	this.stat = function(filename, callback) {
		if (filename in statCache) {
			return callback(null, statCache[filename]);
		}
		else {
			fs.stat(filename, function(err, data) {
				if (!data) data = null;
				statCache[filename] = data;
				return callback(null, statCache[filename]);
			});
			return;
		}
	}

	this.exists = function(filename, callback) {
		if(filename in existsCache) {
			return callback(existsCache[filename]);
		}
		else {
			fs.exists(filename, function(data) {
				existsCache[filename] = data || false;
				return callback(existsCache[filename]);
			});
			return;
		}
	}

	var walk = function(dir, done) {
		var results = [];
		fs.readdir(dir, function(err, list) {
			if (err) return done(err);
			var pending = list.length;
			if (!pending) return done(null, results);
			list.forEach(function(element) {
				var file = path.join(dir, element);
				if (element.substr(0,1) == "." || element == "node_modules") {
					if (!--pending) {
						done(null, results);
					}
				}
				else {
					fs.stat(file, function(err, stat) {
						if (stat && stat.isDirectory()) {
							walk(file, function(err, res) {
								results = results.concat(res);
								if (!--pending) {
									done(null, results);
								}
							});
						}
						else {
							results.push(file);
							if (!--pending) {
								done(null, results);
							}
						}
					});
				}
			});
		});
	};

	var cacheStuff = function(dir, done) {
		walk(dir, function(err, list) {
			if (err) console.log(err);
			list = list || [];
			async.each(list, function(file, next) {
				var callNext = function() { next() };
				if ((/logic\.js$/i).test(file)
					|| (/api\.js$/i).test(file)
				) {
					require(file);
					callNext();
				}
				else if ((/script\.js$/i).test(file)
					|| (/\.json$/i).test(file)
					|| (/\.html$/i).test(file)
					|| (/\.less$/i).test(file)
				) {
					_this.readFile(file, callNext);
				}
				else if ((/\.jade$/i).test(file)) {
					jade.cachedCompile(file, callNext);
				}
				else if ((/\.jsph$/i).test(file)) {
					jsph.cachedCompile(file, callNext);
				}
				else {
					callNext();
				}
			},
			done);
		})
	}

	//var fileWatchers;
	var startWatchr = function() {
		console.log("Initializing File Watchr");
		watchr.watch({
			paths: [wtf.paths.base],
			ignoreHiddenFiles: true,
			ignoreCommonPatterns: true,
			listeners: {
				error: function(err){
					console.log('File Watchr error:', err);
				},
				change: function(changeType,filePath,fileCurrentStat,filePreviousStat){
					switch(changeType) {
						case "update": {
							if (filePath in require.cache) {
								console.log("Reloading", filePath);
								var tmp = require.cache[filePath];
								delete require.cache[filePath];
								try {
									require(filePath);
								}
								catch (err) {
									console.log(colors.redBright("Unable to load new version of " + filePath));
									console.log(err);
									console.log("reverting to previously usable version of file");
									require.cache[filePath] = tmp; // arent you glad we saved this
								}
								if (/\/routes\.js$/.test(filePath)) {
									wtf._loadRoutes();
								}
							}
							// jade Cache
							else if (filePath in jade.cache) {
								console.log("Reloading", filePath);
								var tmpTemplate = jade.cache[filePath];
								var tmpFile = contentCache[filePath];
								delete contentCache[filePath];
								delete jade.cache[filePath];
								jade.cachedCompile(filePath, function(err) {
									if (err) {
										console.log(colors.redBright("Unable to build template from new version of " + filePath));
										console.log(err);
										console.log("reverting to previous version of file");
										contentCache[filePath] = contentCache[filePath] || tmpFile;
										jade.cache[filePath] = tmpTemplate;
									}
								});
							}
							// jsph cache
							else if (filePath in jsph.cache) {
								console.log("Reloading", filePath);
								var tmpTemplate = jsph.cache[filePath];
								var tmpFile = contentCache[filePath];
								delete contentCache[filePath];
								delete jsph.cache[filePath];
								jsph.cachedCompile(filePath, function(err) {
									if (err) {
										console.log(colors.redBright("Unable to build template from new version of " + filePath));
										console.log(err);
										console.log("reverting to previous version of file");
										contentCache[filePath] = contentCache[filePath] || tmpFile;
										jsph.cache[filePath] = tmpTemplate;
									}
								});
							}
							// plain text contentCache
							else if (filePath in contentCache) {
								console.log("Reloading content", filePath);
								var tmp = contentCache[filePath];
								delete contentCache[filePath];
								_this.readFile(filePath, "utf8", function(err) {
									if (err) {
										console.log(colors.redBright("Unable to load new version of " + filePath));
										console.log(err);
										console.log("reverting to previously usable version of file");
										contentCache[filePath] = tmp;
									}
								})
							}
							if (filePath in statCache) {
								console.log("Reloading stats", filePath);
								_this.stat(filePath, function(err) {
									if (err) {
										console.log(colors.redBright("Unable to stat new version of " + filePath));
										console.log(err);
									}
								});
							}
							break;
						}
						case "create": {
							if (filePath in existsCache) {
								existsCache[filePath] = true;
							}
							if (filePath in jade.cache) {
								delete jade.cache[filePath];
								jade.cachedCompile(filePath, function() {});
							}
							if (filePath in jsph.cache) {
								delete jsph.cache[filePath];
								jsph.cachedCompile(filePath, function() {});
							}
							break;
						}
						case "delete": {
							if (filePath in existsCache) {
								existsCache[filePath] = false;
							}
							if (filePath in jade.cache) {
								jade.cache[filePath] = null;
							}
							if (filePath in jsph.cache) {
								jsph.cache[filePath] = null;
							}
							break;
						}
					}
				}
			},
			next: function(err, watchers) {
				if (err) {
					console.log("Failed to load Watchr:", err);
				}
			}
		});

	}

	if (wtf.options.watchr === undefined || wtf.options.watchr !== false) {
		startWatchr();
	}

	cacheStuff(wtf.options.root, done);
}




module.exports = FsCache;