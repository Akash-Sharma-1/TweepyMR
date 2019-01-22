var wtf = require("./framework.js");
var path = require("path");

var paths = {};
paths.base = wtf.options.root;
paths.static = path.join(paths.base, 'static');
paths.libraries = path.join(paths.base, 'libraries');
paths.actions = path.join(paths.base, 'actions');
paths.widgets = path.join(paths.base, 'widgets');
paths.wireframes = path.join(paths.base, 'wireframes');
paths.skins = path.join(paths.base, 'skins');
paths.routes = path.join(paths.base, 'routes');
paths.configs = path.join(paths.base, 'configs');

paths.library = function(libraryName) {
	return path.join(
		paths.libraries
		, libraryName
		, "api.js"
	);
}

paths.action = function(actionName) {
	return path.join(
		paths.actions
		, actionName
	);
}

paths.ux = function(actionName, ux) {
	return path.join(
		paths.actions
		, actionName
		, ux + ".json"
	);
}

paths.widget = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
	);
}

paths.widgetConfig = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "config.json"
	);
}

paths.widgetLogic = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "logic.js"
	);
}

paths.widgetStaticHtml = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.html"
	);
}

paths.widgetJsph = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.jsph"
	);
}

paths.widgetJade = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.jade"
	);
}

paths.widgetLess = function(widgetName, skin) {
	return path.join(
		paths.widgets
		, widgetName
		, "skin" + (skin && skin != 'default' ? "." + skin : "") + ".less"
	);
}

paths.widgetScript = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "script.js"
	);
}

paths.wireframeJade = function(wireframeName) {
	return path.join(
		paths.wireframes
		, wireframeName + ".jade"
	);
}

paths.wireframeJsph = function(wireframeName) {
	return path.join(
		paths.wireframes
		, wireframeName + ".jsph"
	);
}

paths.cssSkinFolder = function(theme) {
	return path.join(
		paths.skins
		, theme
	);
}

module.exports = paths;