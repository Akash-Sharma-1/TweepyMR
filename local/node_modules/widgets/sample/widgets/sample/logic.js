exports.prepare = function(widget, page, done) {

	if (!widget.configs.content) {
		widget.configs.content = "Here is the content you requested."
	}

	widget.configs.touchedByLogic = true; // nice for testing

	return done();
}
