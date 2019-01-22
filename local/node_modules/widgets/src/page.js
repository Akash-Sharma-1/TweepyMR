module.exports = Page;

var Log = require("./log.js");

function Page(log, action, ux, uxConfig) {
	this.statusCode = 200;
	this.status = "Ok";
	this.headers = { "Content-Type": "text/html" };
	this.action = action || null;
	this.ux = ux || null;
	this.skin = null;
	this.wireframe = null;
	this.widgetBlocks = {};
	this.widgets = {};
	this.redirectTo = null;
	this.meta = {};
	this.cannonicalUrl = null;
	this.title = null;
	this.cssUrl = null;
	this.jsUrl = null;
	this.bodyClasses = [];
	this.body = null;
	this.log = log || new Log();

	if (uxConfig) {
		for (var key in uxConfig) {
			if (key != "widgets") {
				this[key] = uxConfig[key];
			}
		}
	}
}

Page.prototype.changeActionUx =
function Page_changeActionUx(action, ux) {
	// TODO: make this do somehting useful
}
