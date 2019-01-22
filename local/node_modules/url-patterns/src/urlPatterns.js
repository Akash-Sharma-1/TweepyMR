(function () {
// becomes => module.exports
	var urlPatterns = {};

// private:
	var commonPatterns = {
		domain: "(https?:\\/\\/)?([\\da-z_\\.-]+)\\.([a-z\\.]{2,6})",
		int: "(\\-?\\d+)",
		slug: "([a-z0-9_\\-]+)",
		string: "([a-z0-9 !@#$%^&*()_+=`{}\\[\\]:;'<>?,.\\-]+)",
		date: "(\\d{4}-\\d{1,2}-\\d{1,2})",
		decimal: "(\\-?\\d+(\\\.\\d+)?)",
		path: "([a-z0-9 !@#$%^&*()_+=`{}\\[\\]:;'<>?,.\\\\\\/\\-]+)",
		csv: "([%a-z0-9\\-,]+)",
	}

	var paramRegex = /\((int|slug|date|decimal|string|csv|path)\:([a-z0-9\-]+)\)/i

// public:
	urlPatterns.createRegex = function(pattern) {
		pattern = pattern.replace("/", "\\/")
			.replace("[", "(:?")
			.replace("]", ")?")
			.replace(/\(int\:([a-z0-9\-]+)\)/ig, commonPatterns.int)
			.replace(/\(slug\:([a-z0-9\-]+)\)/ig, commonPatterns.slug)
			.replace(/\(string\:([a-z0-9\-]+)\)/ig, commonPatterns.string)
			.replace(/\(path\:([a-z0-9\/\-]+)\)/ig, commonPatterns.path)
			.replace(/\(csv\:([a-z0-9\-]+)\)/ig, commonPatterns.csv)
			.replace(/\(date\:([a-z0-9\-]+)\)/ig, commonPatterns.date)
			.replace(/\(decimal\:([a-z0-9\-]+)\)/ig, commonPatterns.decimal)
			;
		return new RegExp("^" + pattern + "$", "i");
	}

	urlPatterns.createBuilder = function(pattern, nullReplacements) {
		var builderTemplate = pattern;
		var urlParams = [];
		var paramTypes = [];
		var match = paramRegex.exec(builderTemplate);
		while (match != null) {
			var paramType = match[1];
			var paramName = match[2];
			urlParams.push(paramName);
			paramTypes.push(paramType);
			builderTemplate = builderTemplate.replace(match[0], "{" + paramName + "}");
			match = paramRegex.exec(builderTemplate);
		}

		return function(obj) {
			var returnValue = builderTemplate;
			obj = obj || {};
			nullReplacements = nullReplacements || {};
			for(var i = 0; i < urlParams.length; i++) {
				var replacementValue = obj[urlParams[i]];
				if (replacementValue === undefined || replacementValue === null) {
					replacementValue = nullReplacements[urlParams[i]];
					if (replacementValue === undefined || replacementValue === null) {
						switch(paramTypes[i]) {
							case "int":
							case "decimal":
							case "csv":
								replacementValue = "0";
								break;
							case "slug":
							case "string":
							case "path":
								replacementValue = "undefined";
								break;
							case "date":
								replacementValue = "0000-00-00";
								break;
						}
					}
				}
				returnValue = returnValue.replace("{" + urlParams[i] + "}", encodeURIComponent(replacementValue));
			}
			return returnValue;
		}
	}

	urlPatterns.createScraper = function(pattern) {
		var regex = urlPatterns.createRegex(pattern)
		var builderTemplate = pattern
		var urlParams = []

		var match = paramRegex.exec(builderTemplate)
		while (match != null) {
			var paramType = match[1]
			var paramName = match[2]
			urlParams.push(paramName)
			builderTemplate = builderTemplate.replace(match[0], "{" + paramName + "}")
			match = paramRegex.exec(builderTemplate)
		}

		return function(path) {
			var matches = regex.exec(path) || [];
			var values = {};
			for (var i = 0; i < urlParams.length && i < matches.length; i++) {
				values[urlParams[i]] = matches[i + 1];
			}
			return values;
		}
	}

	module.exports = urlPatterns;
}());
