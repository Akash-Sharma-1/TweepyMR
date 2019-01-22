var jsph = require("../src/jsph.js");
var assert = require("assert");

jsph.helpers.makeDiv = function(options) {
	return "<div class='" + options['class'] + "'>" + options.contents + "</div>";
}

describe("jsph", function() {
	describe("compile", function() {
		it("should return a function", function(done) {
			var result = jsph.compile("template goes here");
			assert (typeof result == "function");
			return done();
		})
	})
	describe("compileFile", function() {
		it("should return a function", function(done) {
			jsph.compileFile(__dirname + "/sample.jsph", function(err, result) {
				assert (!err);
				assert (typeof result == "function");
				return done();
			})
		})
		it("should error out when file doesnt exist", function(done) {
			jsph.compileFile(__dirname + "/some-totally-non-existant-file.jsph", function(err, result) {
				assert (err);
				assert (typeof result == "function");
				assert (result() == "");
				return done();
			})
		})
	})
	describe("compileFileSync", function() {
		it("should return a function", function(done) {
			var result = jsph.compileFileSync(__dirname + "/sample.jsph")
			assert (typeof result == "function");
			return done();
		})
		it("should error out when file doesnt exist", function(done) {
			try {
				jsph.compileFileSync(__dirname + "/file-which-does-not-exist.jsph")
				assert(false); //if you got this far, you failed
			}
			catch(err) {
				assert(err);
			}
			return done();
		})
	})
	describe("render", function() {
		describe("empty template", function() {
			it("should return empty string", function(done) {
				assert(jsph.render() == "");
				assert(jsph.render(null) == "");
				assert(jsph.render(undefined) == "");
				return done();
			})
			it("should work with or without vars being passed", function(done) {
				assert(jsph.render(null, null) == "");
				assert(jsph.render(null, undefined) == "");
				assert(jsph.render(null, []) == "");
				assert(jsph.render(null, {}) == "");
				assert(jsph.render(null, { var1: 1, var2: "stuff" }) == "");
				return done();
			})
		})
		describe("non-empty template", function() {
			it("should return expected string", function(done) {
				assert(jsph.render("hello") == "hello");
				assert(jsph.render("hello <?= 'world' ?>!") == "hello world!");
				return done();
			})
			it("should accept vars and use them", function(done) {
				var vars = { person1: "brent", person2: "joe" };
				var template = "<? for(var i in this) { ?>hi, <?=this[i]?>.<? } ?>";
				var output = jsph.render(template, vars);
				assert(output == "hi, brent.hi, joe.");
				return done();
			})
			it("should see the jsph object inside of the template", function(done) {
				var vars = { divOptions: { "class":"test", "contents": "stuff" } };
				var template = "here is a div: <?= jsph.helpers.makeDiv(this.divOptions) ?>, I hope you like it."
				var output = jsph.render(template, vars);
				assert(output == "here is a div: <div class='test'>stuff</div>, I hope you like it.");
				return done();
			})
			// php supports (even recommends) leavig off the close script tag to avoid trailing whitespace, we should not blow up if we encounter that kind of thing
			it("should work even when you don't close your script tag", function(done) {
				var template = "this <? if(true) { ?>works!<? }";
				var output = jsph.render(template);
				assert(output == "this works!");
				return done();
			})
		})
	})
	describe("renderFile", function() {
		it("should render expected output", function(done) {
			var vars = { someArray: ["brent","joe"]};
			jsph.renderFile(__dirname + "/sample.jsph", vars, function(err, output) {
				var expected = "\n\t\tHello, brent!\n\t\tHello, joe!\n\t<div class='greeting'>hi there</div>\n";
				output = output.replace(/\r\n/g, "\n");
				assert(output == expected);
				return done();
			});
		})
		it("should error out when file doesnt exist", function(done) {
			var vars = { someArray: ["brent","joe"]};
			jsph.renderFile(__dirname + "/some-totally-non-existant-file.jsph", vars, function(err, output) {
				assert(err);
				assert(!output);
				return done();
			});
		})
	})
	describe("renderFileSync", function() {
		it("should render expected output", function(done) {
			var vars = { someArray: ["brent","joe"]};
			var output = jsph.renderFileSync(__dirname + "/sample.jsph", vars);
			var expected = "\n\t\tHello, brent!\n\t\tHello, joe!\n\t<div class='greeting'>hi there</div>\n";
			output = output.replace(/\r\n/g, "\n");
			assert(output == expected);
			return done();
		})
		it("should error out when file doesnt exist", function(done) {
			var vars = { someArray: ["brent","joe"]};
			try {
				var output = jsph.renderFileSync(__dirname + "/some-totally-non-existant-file.jsph", vars);
				console.log(output);
				assert(false);
			}
			catch(err) {
				assert(err);
			}
			return done();
		})
	})
});