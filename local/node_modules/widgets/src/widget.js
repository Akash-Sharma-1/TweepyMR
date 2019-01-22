var Log = require("./log.js");

Widget = function(widgetName, widgetId, skin, uxConfigs) {
	this.id = widgetId;
	this.name = "" + widgetName;
	this.configs = uxConfigs || {};
	this.skin = skin || 'default';
	this.log = new Log();
	this.noRender = false;
	this.html = null;
}

module.exports = Widget;