module.exports = Log;

function Log() {
	this.events = [];
}

Log.prototype.events = [];

Log.prototype.info =
function Log_info(message) {
	if (message) {
		this.events.push({
			type: "info",
			message: message,
			time: process.hrtime(),
		})
	}
}

Log.prototype.warning =
function Log_warning(message) {
	// gimme some stack trace goodness
	if (message) {
		if (message.stack) {
			message = "" + message + "\n" + message.stack;
		}
		else {
			try{ throw new Error("boom!"); }
			catch(e) {
				var stack = e.stack.match(/[^\r\n]+/g).slice(2,5);
				message += "\n" + stack.join("\n");
			}
		}
		this.events.push({
			type: "warning",
			message: message,
			time: process.hrtime(),
		})
	}
}

Log.prototype.error =
function Log_error(message) {
	// gimme some stack trace goodness
	if (message) {
		if (message.stack) {
			message = "" + message + "\n" + message.stack;
		}
		else {
			try{ throw new Error("boom!"); }
			catch(e) {
				var stack = e.stack.match(/[^\r\n]+/g).slice(2,6);
				message += "\n" + stack.join("\n");
			}
		}
		this.events.push({
			type: "error",
			message: message,
			time: process.hrtime(),
		})
	}
}

Log.prototype.getErrors =
function Log_getErrors() {
	return this.events.filter(function(x) { return x.type == "error" });
}

		// this.startTimer = function(name, message) {
		// 	events.push({
		// 		timerName: name,
		// 		type: "timer",
		// 		message: message,
		// 		time: process.hrtime(),
		// 		endTime: null,
		// 	})
		// }
		// this.endTimer = function(name) {
		// 	var matchingTimer = events.filter(function(x) { return x.timerName == name });
		// 	if (matchingTimer && matchingTimer[0]) {
		// 		matchingTimer[0].endTime = process.hrtime();
		// 	}
		// 	else {
		// 		request.logError("Attempt was made to end timer named '" + name + "', which was never started");
		// 	}
		// }
		// request.getWarnings = function() {
		// 	return events.filter(function(x) { return x.type == "warning" });
		// }
		// request.getInfos = function() {
		// 	return events.filter(function(x) { return x.type == "info" });
		// }
		// request.getTimers = function() {
		// 	return events.filter(function(x) { return x.type == "timer" });
		// }
