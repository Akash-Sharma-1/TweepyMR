var chai = require('chai');
chai.Assertion.includeStack = true;
var assert = chai.assert;
var expect = chai.expect;
var httpMocks = require('node-mocks-http');

var wtf = require('../src/framework.js');
var Widget = require('../src/widget.js');
var Page = require('../src/page.js');

var testSite = {
	root: __dirname + "/../sample",
	config: "test",
	watchr: false,
	logToConsole: false,
};

describe("Widgets, the Framework", function() {
	before(function(done) {
		wtf.init(testSite, function() {
			return done();
		});
	})
	describe("init", function() {
		it("should have set up the paths", function(done) {
			var paths = wtf.paths;
			var expectPathsMatch = function(path1, path2) {
				expect(path1.replace(/\\/g, "/").replace("test/../", ""))
				.equal(path2.replace("{root}", testSite.root).replace(/\\/g, "/").replace("test/../", ""));
			}
			expectPathsMatch(paths.base, "{root}");
			expectPathsMatch(paths.static, "{root}/static");
			expectPathsMatch(paths.libraries, "{root}/libraries");
			expectPathsMatch(paths.actions, "{root}/actions");
			expectPathsMatch(paths.widgets, "{root}/widgets");
			expectPathsMatch(paths.wireframes, "{root}/wireframes");
			expectPathsMatch(paths.skins, "{root}/skins");
			expectPathsMatch(paths.routes, "{root}/routes");
			expectPathsMatch(paths.configs, "{root}/configs");
			expectPathsMatch(paths.library("test"), "{root}/libraries/test/api.js");
			expectPathsMatch(paths.library("xyz/test"), "{root}/libraries/xyz/test/api.js");
			expectPathsMatch(paths.widget("abc/widget"), "{root}/widgets/abc/widget");
			expectPathsMatch(paths.widget("widget/one"), "{root}/widgets/widget/one");
			expectPathsMatch(paths.widgetLogic("widget1"), "{root}/widgets/widget1/logic.js");
			expectPathsMatch(paths.widgetJade("wid/get/xyz"), "{root}/widgets/wid/get/xyz/view.jade");
			expectPathsMatch(paths.widgetJsph("wid/get/xyz"), "{root}/widgets/wid/get/xyz/view.jsph");
			expectPathsMatch(paths.widgetStaticHtml("123"), "{root}/widgets/123/view.html");
			expectPathsMatch(paths.widgetLess("myWidget"), "{root}/widgets/myWidget/skin.less");
			expectPathsMatch(paths.widgetLess("myWidget", "dark"), "{root}/widgets/myWidget/skin.dark.less");
			expectPathsMatch(paths.widgetConfig("1/big/ugly"), "{root}/widgets/1/big/ugly/config.json");
			expectPathsMatch(paths.widgetScript("js/jQuery/1.10.2"), "{root}/widgets/js/jQuery/1.10.2/script.js");
			expectPathsMatch(paths.action("actionName"), "{root}/actions/actionName");
			expectPathsMatch(paths.action("act/shun"), "{root}/actions/act/shun");
			expectPathsMatch(paths.ux("homepage", 123), "{root}/actions/homepage/123.json");
			expectPathsMatch(paths.ux("act/tion", 1), "{root}/actions/act/tion/1.json");
			expectPathsMatch(paths.wireframeJade("tallSkinny"), "{root}/wireframes/tallSkinny.jade");
			expectPathsMatch(paths.wireframeJade("short/fat"), "{root}/wireframes/short/fat.jade");
			expectPathsMatch(paths.wireframeJsph("tallSkinny"), "{root}/wireframes/tallSkinny.jsph");
			expectPathsMatch(paths.wireframeJsph("short/fat"), "{root}/wireframes/short/fat.jsph");
			return done();
		})
		it("should have set up the routes", function(done) {
			// homePage
			var route = wtf.routes.homePage;
			assert(route);
			expect(route.pattern).equal("/");
			expect(route.action).equal("homePage");
			expect(typeof route.regex).equal("object"); //regex
			expect(typeof route.getUrl).equal("function");
			expect(typeof route.scrape).equal("function");
			expect(route.regex.test("/"));
			expect(route.getUrl()).equal("/");
			expect(route.getUrl({})).equal("/");
			expect(route.getUrl({junk:"stuff"})).equal("/");
			expect(wtf._findRoute("/")).equals(route);

			// _js
			route = wtf.routes._js;
			assert(route);
			expect(route.pattern).equal("/js/(string:ux).js");
			expect(route.action).equal("_js");
			expect(typeof route.regex).equal("object"); //regex
			expect(typeof route.getUrl).equal("function");
			expect(typeof route.scrape).equal("function");
			expect("/js/pqopmwfepiomad239jmlkqndcadfASDF.js").match(route.regex);
//TODO: make getUrl smart enough to put junk in like "undefined" and "0"
			//assert(route.getUrl() == "/js/undefined.js"); //this should probably be fixed
			//assert(route.getUrl({}) == "/js/undefined.js");
			//assert(route.getUrl({junk:"stuff"}) == "/js/undefined.js");
			expect(route.getUrl({ux:"bla-bla-bla"})).equal("/js/bla-bla-bla.js");
			expect(wtf._findRoute("/js/abc-123.js")).equal(route);

			// _css
			route = wtf.routes._css;
			assert(route);
			expect(route.pattern).equal("/css/(string:ux).css");
			expect(route.action).equal("_css");
			expect(typeof route.regex).equal("object"); //regex
			expect(typeof route.getUrl).equal("function");
			expect(typeof route.scrape).equal("function");
			expect("/css/pqopmwfepiomad239jmlkqacmjjaoijfecacedndcadfASDF.css").match(route.regex);
			//assert(route.getUrl() == "/css/undefined.css"); //this should probably be fixed
			//assert(route.getUrl({}) == "/css/undefined.css");
			//assert(route.getUrl({junk:"stuff"}) == "/css/undefined.css");
			expect(route.getUrl({ux:"bla-bla-bla"})).equal("/css/bla-bla-bla.css");
			expect(wtf._findRoute("/css/abc-123.css")).equal(route);

			// 404
			var route = wtf.routes._404;
			expect(wtf._findRoute("")).equal(route);
			expect(wtf._findRoute(null)).equal(route);
			expect(wtf._findRoute(".html")).equal(route);
			expect(wtf._findRoute(503034)).equal(route);
			expect(wtf._findRoute("/some/random/1/path/on-the-server.php")).equal(route);
			return done();
		})
		it("should preload widget configs", function(done) {
			//console.log(wtf.paths.widgetConfig("sample"));
			//console.log(wtf.fsCache.contentCache);
			assert(wtf.paths.widgetConfig("sample") in wtf.fsCache.contentCache);
			return done();
		})
		it("should preload widget logic", function(done) {
			var filepath = require.resolve(wtf.paths.widgetLogic("sample"));
			assert(filepath in require.cache);
			return done();
		})
		it("should preload widget views", function(done) {
			assert(wtf.paths.widgetJade("sample") in wtf.fsCache.contentCache);
			assert(wtf.paths.widgetJsph("sample") in wtf.fsCache.contentCache);
			assert(wtf.paths.widgetStaticHtml("sample") in wtf.fsCache.contentCache);
			//assert(wtf.paths.widgetJade("sample") in jade.cache);
			//assert(wtf.paths.widgetJsph("sample") in jsph.cache);
			return done();
		})
		it.skip("should preload style sheets", function(done) {

		})
		it.skip("should preload models", function(done) {

		})
		it("should preload action-ux files", function(done) {
			assert(wtf.paths.ux("homePage", "special") in wtf.fsCache.contentCache);
			return done();
		})
	})
	describe("_loadWidgetConfig", function() {
		it("should load sample widget", function(done) {
			wtf._loadWidgetConfig("sample", function(err, config) {
				assert(!err);

				expect(config.name).equal("sample");
				expect(config.description).equal("Used by unit testing to make sure things work");
				expect(config.configs.length).equal(5);

				expect(config.configs[0].name).equal('heading');
				expect(config.configs[0].description).equal('has a description');
				expect(config.configs[0].default).equal('This is a sample');

				expect(config.configs[1].name).equal('footing');
				assert(!config.configs[1].description);
				assert(!config.configs[1].default);

				expect(config.configs[2].name).equal('content');
				assert(!config.configs[2].description);
				assert(!config.configs[2].default);
				return done();
			});
		})
		it("should create minimalistic stub for widget with no config", function(done) {
			wtf._loadWidgetConfig("testConfig/hasNoConfig", function(err, config) {
				assert(!err);
				expect(config.name).equal("testConfig/hasNoConfig");
				assert(!config.description);
				assert(!config.configs.length);
				return done()
			})
		})
		it("should error out loading an invalid config.json", function(done) {
			wtf._loadWidgetConfig("testConfig/hasInvalidConfig", function(err, config) {
				assert(err);
				return done();
			})
		})
		it("should error out loading a completely non-existant widget", function(done) {
			wtf._loadWidgetConfig("non-existant-widget", function(err, config) {
				assert(err);
				return done()
			})
		})
	})
	describe("_mergeConfigs", function() {
		var defaultConfigs = [
			{
				"name":"heading",
				"description":"has a description",
				"default":"This is a sample"
			},
			{
				"name":"footing",
				"description":"",
				"default":""
			},
			{
				"name":"content",
			},
		]

		it("should have combined inputs from all three sources", function(done) {
			var uxConfigs = { content: "val" };
			var requestParams = { footing: "foot" };
			var result = wtf._mergeConfigs(defaultConfigs, uxConfigs, requestParams);
			expect(result.heading).equal("This is a sample");
			expect(result.footing).equal("foot");
			expect(result.content).equal("val");
			return done();
		})
		it.skip("should complain if uxConfigs defines values not defined in defaultConfigs", function(done) {
			// the complaint shouldnt be an exception, it should be a warning log entry of some kind
			var uxConfigs = { newConfig: "x" };
			expect(function() { wtf._mergeConfigs(defaultConfigs, uxConfigs, {}); }).to.throw();
			return done();
		})
		it("should not complain if requestParams has values not definded in defaultConfigs", function(done) {
			var requestParams = { newConfig: "x" };
			expect(function() { wtf._mergeConfigs(defaultConfigs, {}, requestParams); }).to.not.throw();
			return done();
		})
		it("should NOT include things from requestParams that are not in the defaultConfigs", function(done) {
			var requestParams = { newConfig: "x" };
			var results = wtf._mergeConfigs(defaultConfigs, {}, requestParams);
			expect(results).not.has.ownProperty('newConfig');
			return done();
		})
		it("should overwrite defaults even when override is a falsy value", function(done) {
			var falsyThings = [ false, 0, "", null, undefined, NaN ]
			for (i in falsyThings) {
				var uxConfigs = { heading: falsyThings[i] };
				var results = wtf._mergeConfigs(defaultConfigs, uxConfigs, {});
				expect(results).has.ownProperty('heading');
				assert(!results.heading);

				results = wtf._mergeConfigs(defaultConfigs, {}, uxConfigs);
				expect(results).has.ownProperty('heading');
				assert(!results.heading);
			}
			return done();
		})
		it("should favor requestParams over all else", function(done) {
			var uxConfigs = { heading: "ux" };
			var requestParams = { heading: "param" };
			var result = wtf._mergeConfigs(defaultConfigs, uxConfigs, requestParams);
			expect(result.heading).equal("param");
			return done();
		})
		it("should favor uxConfigs over default configs", function(done) {
			var uxConfigs = { heading: "ux" };
			var requestParams = {};
			var result = wtf._mergeConfigs(defaultConfigs, uxConfigs, {});
			expect(result.heading).equal("ux");
			return done();
		})
		it("should have default configs when nothing else overrides them", function(done) {
			var uxConfigs = { footing: "foot" };
			var requestParams = { content: "stuff" };
			var result = wtf._mergeConfigs(defaultConfigs, uxConfigs, {});
			expect(result.heading).equal("This is a sample");
			return done();
		})
		it("should complain about non-empty, non-object inputs", function(done) {
			var goodDefaultConfigs = defaultConfigs;
			var goodUxConfigs = { footing: "foot" };
			var goodRequestParams = { content: "stuff" };
			var badDefaultConfigs = "hi";
			var badUxConfigs = 012;
			var badRequestParams = function(){};

			expect(function() { wtf._mergeConfigs(badDefaultConfigs, goodUxConfigs, goodRequestParams) }).throw();
			expect(function() { wtf._mergeConfigs(goodDefaultConfigs, badUxConfigs, goodRequestParams) }).throw();
			expect(function() { wtf._mergeConfigs(goodDefaultConfigs, goodUxConfigs, badRequestParams) }).throw();
			expect(function() { wtf._mergeConfigs(badDefaultConfigs, badUxConfigs, goodRequestParams) }).throw();
			expect(function() { wtf._mergeConfigs(badDefaultConfigs, goodUxConfigs, badRequestParams) }).throw();
			expect(function() { wtf._mergeConfigs(badDefaultConfigs, badUxConfigs, badRequestParams) }).throw();

			return done();
		})
		it("should not complain about empty or null params", function(done) {
			var goodDefaultConfigs = defaultConfigs;
			var goodUxConfigs = { footing: "foot" };
			var goodRequestParams = { content: "stuff" };

			expect(function() { wtf._mergeConfigs({}, {}, goodRequestParams) }).to.not.throw();
			expect(function() { wtf._mergeConfigs(goodDefaultConfigs, null, goodRequestParams) }).to.not.throw();
			expect(function() { wtf._mergeConfigs(goodDefaultConfigs, goodUxConfigs, "") }).to.not.throw();
			expect(function() { wtf._mergeConfigs(undefined, {}, goodRequestParams) }).to.not.throw();
			expect(function() { wtf._mergeConfigs(null, "", {}) }).to.not.throw();
			expect(function() { wtf._mergeConfigs("", false, 0) }).to.not.throw();

			return done();
		})
		it("should be an empty object when all inputs are empty or null", function(done) {
			results = wtf._mergeConfigs("", [], null);
			expect(results).deep.equal({});
			return done();
		})
	})
	describe("_runLogic", function() {
		it("should run logic if there is a logic file", function(done) {
			var widget = new Widget('sample');
			wtf._loadWidgetConfig(widget.name, function(err, config) {
				widget.configs = wtf._mergeConfigs(config.configs, null, {footing: "stuff"});
				var page = null;
				wtf._runLogic(widget, page, function() {
					expect(widget.configs.heading).equal('This is a sample');
					expect(widget.configs.footing).equal('stuff');
					expect(widget.configs.content).equal('Here is the content you requested.');
					assert(widget.configs.touchedByLogic);
					return done();
				})
			})
		})
		it("should change nothing if there is no logic file", function(done) {
			var widget = new Widget("hasNoLogic");
			widget.configs = {
				heading: 'This is a sample',
				footing: '',
				content: 'request content',
				emptyDefault: 'yay data',
				undefinedDefault: undefined,
				name: 'some-slug',
				id: 50,
			}
			var page = null;
			wtf._runLogic(widget, page, function(err) {
				assert(!err);
				expect(widget.configs.heading).equal('This is a sample');
				assert(!widget.configs.footing);
				expect(widget.configs.content).equal('request content');
				expect(widget.configs.emptyDefault).equal('yay data');
				assert(!widget.configs.undefinedDefault);
				expect(widget.configs.name).equal('some-slug');
				expect(widget.configs.id).equal(50);
				return done();
			})
		})
	})
	// describe('render', function() {
	// 	it("should render render.jsph if it is available", function(done) {
	// 		var context = wtf.newContext();
	// 		var widget = new Widget('testRender/hasJsphJadeAndHtml');
	// 		widget.configs.content = "stuff";
	// 		wtf.render(widget, function(err) {
	// 			assert(!err);
	// 			assert(widget.html == '<h1 class="jsph">stuff</h1>');
	// 			return done();
	// 		})
	// 	})
	// 	it("should render render.jade if it is available (and jsph is not)", function(done) {
	// 		var context = wtf.newContext();
	// 		var widget = new Widget('testRender/hasJadeAndHtml');
	// 		widget.configs.content = "stuff";
	// 		wtf.render(widget, function(err) {
	// 			assert(!err);
	// 			assert(widget.html == '\n<h1 class="jade">stuff</h1>');
	// 			return done();
	// 		})
	// 	})
	// 	it("should render render.html if it is available (and jsph and jade are not)", function(done) {
	// 		var context = wtf.newContext();
	// 		var widget = new Widget('testRender/hasHtmlTemplateOnly');
	// 		wtf.render(widget, function(err) {
	// 			assert(!err);
	// 			assert(widget.html == '<h1>stuff</h1>');
	// 			return done();
	// 		})
	// 	})
	// 	it("should return empty string if no template is available", function(done) {
	// 		var context = wtf.newContext();
	// 		var widget = new Widget('testRender/hasNoTemplate');
	// 		wtf.render(widget, function(err) {
	// 			assert(!err);
	// 			assert(widget.html === '');
	// 			return done();
	// 		})
	// 	})
	// 	it("should return empty string if noRender flag is set", function(done) {
	// 		var context = wtf.newContext();
	// 		var widget = new Widget('testRender/hasJsphJadeAndHtml');
	// 		widget.configs.content = "stuff";
	// 		widget.noRender = true;
	// 		wtf.render(widget, function(err) {
	// 			assert(!err);
	// 			assert(widget.html === '');
	// 			return done();
	// 		})
	// 	})
	// })
	describe('_findScripts', function() {
		it("should find a script file for a widget", function(done) {
			var widget = new Widget('testScript/hasScriptNoDependency');
			wtf._findScripts(widget, function(err) {
				assert(!err)
				assert(widget.scripts.length == 1)
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency')
				return done()
			})
		})
		it("should find no script file if a widget has no script", function(done) {
			var widget = new Widget('testScript/hasNoScript');
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(!widget.scripts || widget.scripts.length == 0);
				return done();
			})
		})
		it("should find a dependency script and a widgets script file - dependency first", function(done) {
			var widget = new Widget('testScript/hasScriptWithDependency');
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 2);
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[1].widget == 'testScript/hasScriptWithDependency');
				return done();
			})
		})
		it("should find a dependency script even if a widget has no script of its own", function(done) {
			var widget = new Widget('testScript/hasDependencyButNoScript');
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 1);
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency');
				return done();
			})
		})
		it("should find multiple dependencies", function(done) {
			var widget = new Widget('testScript/hasMultipleDependencies');
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 3);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.scripts[1].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[2].widget == 'testScript/hasMultipleDependencies')
				return done();
			})
		})
		it("should find dependencies of dependencies", function(done) {
			var widget = new Widget('testScript/hasDependenciesWithDependencies');
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 4);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.scripts[1].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[2].widget == 'testScript/hasMultipleDependencies');
				assert(widget.scripts[3].widget == 'testScript/hasDependenciesWithDependencies');
				return done();
			})
		})
		it("should not find any scripts if noRender flag is set", function(done) {
			var widget = new Widget("sample");
			widget.noRender = true;
			wtf._findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 0);
				return done();
			})
		})
	})
	describe('_findStyles', function() {
		it("should add a widget if it has a .less file", function(done) {
			var widget = new Widget("sample")
			wtf._findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		});
		it("should not add a widget if it doesn't have a .less file", function(done) {
			var widget = new Widget("testStyles/hasNoStyles")
			wtf._findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 0);
				return done();
			})
		});
		it("should not add a widget if noRender flag is set", function(done) {
			var widget = new Widget("sample")
			widget.noRender = true;
			wtf._findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 0);
				return done();
			})
		});
		it("should add a widget if a skinned .less file exists for the current skin, even if default styles arent provided.", function(done) {
			var widget = new Widget("testStyles/hasSkinnedStylesOnly")
			widget.skin = "nifty";
			wtf._findStyles(widget, function(err) {
				assert(!err);
				expect(widget.styles.length).equal(1);
				expect(widget.styles[0].widget).equal(widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		})
		it("should add a widget if a skinned .less file doesnt exist for the current skin ... if default styles are provided.", function(done) {
			var widget = new Widget("testStyles/hasDefaultStylesOnly")
			widget.skin = "nifty";
			wtf._findStyles(widget, function(err) {
				assert(!err);
				expect(widget.styles.length).equal(1);
				expect(widget.styles[0].widget).equal(widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		})
		it("It should not add a widget that has another skin .less file if neither the current skin nor the default skin are provided.", function(done) {
			var widget = new Widget("testStyles/hasSkinnedStylesOnly")
			widget.skin = "non-existant-skin";
			wtf._findStyles(widget, function(err) {
				assert(!err);
				expect(widget.styles.length).equal(0);
				return done();
			})
		})
	})
	describe('_prepareWidget', function() {
		it("should work", function(done) {
			var requestParams = {
				id: 1,
				name: 'brent',
				content: 'content from request param',
			}

			var widget = new Widget("sample");
			widget.skin = "nifty";

			widget.configs = { //from action-ux config file
				heading: 'Hello Rubix.js',
				content: 'content from ux config file',
				junk: "junk",
			}

			wtf._prepareWidget(widget, null, requestParams, function(err) {
				assert(!err);
				assert(!widget.errors || widget.errors.length == 0);

				assert(!widget.configs.id);
				assert(!widget.configs.name);
				assert(!widget.configs.junk);
				expect(widget.configs.content).equal('content from request param');
				expect(widget.configs.heading).equal('Hello Rubix.js');
				assert(!widget.configs.footing);
				expect(widget.configs.touchedByLogic).equal(true);

				assert(!widget.noRender);

				assert(widget.scripts.length == 1);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.styles[0].time > 1);

				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);

				return done();
			})
		})
	})
	// describe('planResponse', function() {
	// 	it("should handle magic js route, and populate context.scripts", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "_js" };
	// 		context.ux = "WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D";
	// 		wtf.planResponse(context, function(err) {
	// 			assert(!err);
	// 			assert(context.responseType == "js");
	// 			assert(context.requiredScripts.length == 3);
	// 			assert(context.requiredScripts[0] == "some/widget");
	// 			assert(context.requiredScripts[1] == "another/widget");
	// 			assert(context.requiredScripts[2] == "widget/3");
	// 			return done();
	// 		});
	// 	})
	// 	it("should handle magic css route, and populate skin and widgets", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "_css" };
	// 		context.ux = "eyJ0IjoieXVtbXkiLCJ3IjpbInNhbXBsZTEiLCJhbm90aGVyL3dpZGdldCJdfQ%3D%3D";
	// 		wtf.planResponse(context, function(err) {
	// 			assert(!err);
	// 			assert(context.skin == "yummy");
	// 			assert(context.requiredStyles.length == 2);
	// 			assert(context.requiredStyles[0] == 'sample1');
	// 			assert(context.requiredStyles[1] == 'another/widget');
	// 			return done();
	// 		})
	// 	})
	// 	it("should find homePage route, and load default ux settings", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "homePage" };
	// 		wtf.planResponse(context, function(err) {
	// 			assert(!err);
	// 			assert(context.responseType == "html");
	// 			assert(context.pageTitle == "home page");
	// 			assert(context.widgetBlocks.head.length == 0);
	// 			assert(context.widgetBlocks.left.length == 0);
	// 			assert(context.widgetBlocks.center.length == 1);
	// 			assert(context.widgetBlocks.footer.length == 0);
	// 			assert(context.widgetBlocks.center[0].id == "firstContent");
	// 			return done();
	// 		});
	// 	})
	// 	it("should find homePage route, and load specified ux settings", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "homePage" };
	// 		context.ux = 'special';
	// 		wtf.planResponse(context, function(err) {
	// 			assert(!err);
	// 			assert(context.responseType == "html");
	// 			assert(context.pageTitle == "special home page");
	// 			assert(context.widgetBlocks.head.length == 1);
	// 			assert(context.widgetBlocks.header.length == 1);
	// 			assert(context.widgetBlocks.left.length == 0);
	// 			assert(context.widgetBlocks.center.length == 1);
	// 			assert(context.widgetBlocks.footer.length == 0);
	// 			assert(context.widgetBlocks.head[0].id == "reqSomeScripts");
	// 			assert(context.widgetBlocks.header[0].id == "iDontRender");
	// 			assert(context.widgetBlocks.center[0].id == "firstContent");
	// 			return done();
	// 		});
	// 	})
	// })
	// describe('extractJsListFromUrl', function() {
	// 	it('should do its thing without errors', function(done) {
	// 		var context = wtf.newContext();
	// 		context.ux = "WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D";
	// 		var jsList = wtf.extractJsListFromUrl(context);
	// 		assert(jsList.length == 3);
	// 		assert(jsList[0] == "some/widget");
	// 		assert(jsList[1] == "another/widget");
	// 		assert(jsList[2] == "widget/3");
	// 		return done();
	// 	})
	// })
	// describe('extractCssListFromUrl', function() {
	// 	it('should do its thing without errors', function(done) {
	// 		var context = wtf.newContext();
	// 		// context.skin = "yummy";
	// 		// context.requiredStyles = [
	// 		// 	{ widget: "sample1", time: 1512 },
	// 		// 	{ widget: "another/widget", time: 1902923 },
	// 		// ]
	// 		// var cssFileUrl = wtf._buildCssFileUrl(context);
	// 		context.ux = "eyJ0IjoieXVtbXkiLCJ3IjpbInNhbXBsZTEiLCJhbm90aGVyL3dpZGdldCJdfQ%3D%3D";
	// 		var requestedStyles = wtf.extractCssListFromUrl(context);
	// 		assert(requestedStyles.t == 'yummy');
	// 		assert(requestedStyles.w.length == 2);
	// 		assert(requestedStyles.w[0] == "sample1");
	// 		assert(requestedStyles.w[1] == "another/widget");
	// 		return done();
	// 	})
	// })
	// describe('loadScript', function() {
	// 	it("should load a widget's script if it is available", function(done) {
	// 		wtf.loadScript('sample', function(err, script) {
	// 			assert(!err);
	// 			expect(script).equal("// this is a sample script.js");
	// 			return done();
	// 		})
	// 	})
	// 	it("should gracefully return no script if no script is available", function(done) {
	// 		wtf.loadScript('testScript/hasNoScript', function(err, script) {
	// 			//assert(err);
	// 			assert(!script);
	// 			return done();
	// 		})
	// 	})
	// })
	// describe('loadStyle', function() {
	// 	it("should load a widgets style for the current skin if available", function(done) {
	// 		wtf.loadStyle("sample", "nifty", function(err, style) {
	// 			assert(!err);
	// 			expect(style).equal(".sample {\r\n\tcolor: yellow;\r\n\tbackground-color: black;\r\n\th2 { font-weight: bold; }\r\n}");
	// 			return done();
	// 		})
	// 	})
	// 	it("should load a widgets default style if one for the current skin isnt available", function(done) {
	// 		wtf.loadStyle("testStyles/hasDefaultStylesOnly", "nifty", function(err, style) {
	// 			assert(!err);
	// 			expect(style).equal("/* contents of testStyles/hasDefaultStylesOnly/styles.default.less */");
	// 			return done();
	// 		})
	// 	})
	// 	it("should gracefully return no styles (and an err) if neither stlye is available", function(done) {
	// 		wtf.loadStyle('testStyles/hasSkinnedStylesOnly', "non-existant-skin", function(err, style) {
	// 			assert(err);
	// 			assert(!style);
	// 			return done();
	// 		})
	// 	})
	// })
	describe('_buildJsFileUrl', function() {
		it("should build jsUrl from scripts on widgets", function(done) {
			var request = httpMocks.createRequest();
			request.page = new Page();
			request.page.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [
						{ widget: "some/widget", time: 123 },
						{ widget: "another/widget", time: 1234 },
					],
				},
				widget2: {
					name: "widget/3",
					scripts: [
						{ widget: "widget/3", time: 12356 },
					],
				},
				widgetx: {
					name: "widgetX",
					// conveniently has no scriptss
				}
			}
			var jsUrl = wtf._buildJsFileUrl(request);
			assert(jsUrl == "/js/WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D.js?ver=12356");
			return done();
		})
		it("should return falsy if there are no required scripts", function(done) {
			var request = httpMocks.createRequest();
			request.page = new Page();
			request.page.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [],
				},
				widget2: { name: "widget/3" },
			}
			var jsUrl = wtf._buildJsFileUrl(request);
			assert(!jsUrl);
			return done();
		})
	})
	describe('_buildCssFileUrl', function() {
		it("should build requiredStyles from widgets[].styles", function(done) {
			var request = httpMocks.createRequest();
			request.page = new Page();
			request.page.widgets = {
				widget1: {
					name: "some/widget",
					styles: [
						{ widget: "some/widget", time: 123 },
						{ widget: "another/widget", time: 1234 },
					],
				},
				widget2: {
					name: "widget/3",
					styles: [
						{ widget: "widget/3", time: 12356 },
					],
				},
				widgetx: {
					name: "widgetX",
					// conveniently has no styles
				}
			}
			var url = wtf._buildCssFileUrl(request);
			expect(url).equal("/css/eyJ0IjoiZGVmYXVsdCIsInciOlsic29tZS93aWRnZXQiLCJhbm90aGVyL3dpZGdldCIsIndpZGdldC8zIl19.css?ver=12356");
			return done();
		})
		it("should return falsy if there are no required scripts", function(done) {
			var request = httpMocks.createRequest();
			request.page = new Page();
			request.page.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [],
				},
				widget2: { name: "widget/3" },
			}
			var jsUrl = wtf._buildJsFileUrl(request);
			assert(!jsUrl);
			return done();
		})
	})
	// describe('buildResponse', function() {
	// 	it('should build homePage default UX', function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "homePage" };
	// 		wtf.planResponse(context, function(err) {
	// 			assert(!err);
	// 			wtf.buildResponse(context, function(err) {
	// 				assert(!err);
	// 				expect(context.widgets.length == 1);
	// 				var widget = context.widgets['firstContent'];
	// 				assert(widget);
	// 				var configs = widget.configs;
	// 				assert(configs);
	// 				expect(configs.heading).equal("widget 5");
	// 				expect(configs.footing).equal("the end");
	// 				expect(configs.content).equal("Here is the content you requested.");
	// 				expect(configs.pageNo).equal(null);
	// 				expect(configs.pageSize).equal(null);
	// 				expect(context.responseType).equal('html');
	// 				expect(context.responseStatusCode).equal(200);
	// 				expect(context.pageTitle).equal('home page');
	// 				expect(context.jsFileUrl).match(/^\/js\/WyJzYW1wbGUiXQ\%3D\%3D\.js\?ver=\d+$/);
	// 				expect(context.cssFileUrl).match(/^\/css\/eyJ3IjpbInNhbXBsZSJdfQ\%3D\%3D\.css\?ver=\d+$/);
	// 				expect(context.responseBody).match(/^\<\!DOCTYPE html\>/)
	// 				return done();
	// 			})
	// 		})
	// 	})
	// 	it("should build a fairly complex js response in the right order", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "_js" };
	// 		context.responseType = "js";
	// 		context.requiredScripts = ['sample', 'testScript/hasScriptNoDependency'];
	// 		wtf.buildResponse(context, function(err) {
	// 			assert(!err);
	// 			expect(context.responseType).equal('js');
	// 			//expect(context.responseStatusCode).equal(200);
	// 			expect(context.responseBody).equal('// this is a sample script.js\n\n// HasScriptNoDependency\r\n');
	// 			return done();
	// 		})
	// 	})
	// 	it("should build a css (compiled from less) file with stuff in main folder and overrides on individual widgets and all that", function(done) {
	// 		var context = wtf.newContext();
	// 		context.route = { action: "_css" };
	// 		context.responseType = "css";
	// 		context.skin = "nifty";
	// 		context.requiredStyles = ['sample', 'testStyles/hasDefaultStylesOnly'];
	// 		wtf.buildResponse(context, function(err) {
	// 			assert(!err);
	// 			expect(context.responseBody).equal(".defaultAndNifty.fromNifty h2 {\n  line-height: 3;\n}\n.onlyInDefault {\n  color: blue;\n}\n.onlyInDefault h4 {\n  color: black;\n}\n.onlyInNifty {\n  color: blue;\n}\n.onlyInNifty h4 {\n  color: black;\n}\n.sample {\n  color: yellow;\n  background-color: black;\n}\n.sample h2 {\n  font-weight: bold;\n}\n/* contents of testStyles/hasDefaultStylesOnly/styles.default.less */\n");
	// 			return done();
	// 		})
	// 	})
	// })
	// describe("responder", function() {
	// 	it.skip("should serve up '/'", function(done) {
	// 		var request  = httpMocks.createRequest({
	// 			method: 'GET',
	// 			url: '/',
	// 			params: {}
	// 		});
	// 		var response = httpMocks.createResponse();
	// 		wtf.responder(request, response, function(err) {
	// 			assert(!err);
	// 			// TODO ... expect all kinds of other things we know happen on hompage
	// 			expect(response.statusCode).equal(200);
	// 			assert(response._isEndCalled());
	// 			assert(response._isJSON());
	// 			assert(response._isUTF8());
	// 			return done();
	// 		})
	// 	})
	// 	it.skip("should serve up '/acrobat?ux=special&heading=override'", function(done) {
	// 		return done();
	// 	})
	// 	it.skip("should serve up /js/WyJzYW1wbGUiXQ%3D%3D.js?ver=123", function(done) {
	// 		return done();
	// 	})
	// 	it.skip("should serve up '/css/eyJ3IjpbInNhbXBsZSJdfQ%3D%3D.css?ver=123'", function(done) {
	// 		return done();
	// 	})
	// })
	describe("initLogs", function() {
		it("should add start time to request", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				assert(request.startedAt);
				// startAt is an array of 2 int looking things
				expect(request.startedAt.length).equal(2);
				expect(request.startedAt[0]).match(/^\d+$/);
				expect(request.startedAt[1]).match(/^\d+$/);

				request.clearTimeout();
				return done();
			})
		})
		it("should add logging capabilities", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				expect(typeof request.log).equal("object");
				// expect(typeof request.logError).equal("function");
				// expect(typeof request.logWarning).equal("function");
				// expect(typeof request.logInfo).equal("function");
				// expect(typeof request.startTimer).equal("function");
				// expect(typeof request.endTimer).equal("function");
				// expect(typeof request.getErrors).equal("function");
				// expect(typeof request.getWarnings).equal("function");
				// expect(typeof request.getInfos).equal("function");
				// expect(typeof request.getTimers).equal("function");
				request.log.error("an error occured");
				request.log.warning("danger, danger!");
				request.log.info("some stuff");
				//request.log.startTimer("testTimer", "doing some stuff");
				//request.log.endTimer("testTimer");
				//request.log.startTimer("brokenTimer", "this wont be closed properly");
				//request.log.endTimer("broke_timr");
				//expect(request.logs.length).equal(6);
				expect(request.log.events.length).equal(3);
				//there hsould be 2 errors (the one we added, and the one from broken timer)
				//expect(request.getErrors().length).equal(2);
				//there should be a warning
				//expect(request.getWarnings().length).equal(1);
				//there should be an info
				//expect(request.getInfos().length).equal(1);
				//there should be 2 timers (one with an end time, and one with no end time)
				//expect(request.getTimers().length).equal(2);

				request.clearTimeout();
				return done();
			})
		})
		it("should add a timer to ensure clean up", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				expect(typeof request.onTimeout).equal("object");
				assert(!request.timedOut);
				request.clearTimeout();
				return done();
			})
		})
	})
	describe("chooseRoute", function() {
		it("should select the right route", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.url = "http://somesite.com/";
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseRoute(request, response, function(err) {
					assert(!err);
					expect(request.route).equal(wtf.routes.homePage);
					request.clearTimeout();
					return done();
				})
			})
		})
	})
	describe("extractParams", function() {
		it("should find query string params", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.url = "http://somesite.com/?id=5&name=brent";
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.extractParams(request, response, function(err) {
					assert(!err);
					expect(Object.keys(request.params).length).equal(2);
					expect(request.params.id).equal("5");
					expect(request.params.name).equal("brent");
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should find post params", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.route = wtf.routes.homePage;
			request.body = "id=75&name=jimmy-johns";
			request.method = "POST";
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.extractParams(request, response, function(err) {
					assert(!err);
					expect(Object.keys(request.params).length).equal(2);
					expect(request.params.id).equal("75");
					expect(request.params.name).equal("jimmy-johns");
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should find pretty params", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.url = "http://somesite.com/user/4/joe.html";
			request.route = wtf.routes.userPage;
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.extractParams(request, response, function(err) {
					assert(!err);
					expect(Object.keys(request.params).length).equal(2);
					expect(request.params.id).equal("4");
					expect(request.params.name).equal("joe");
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should favor post over get over pretty", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.url = "http://somesite.com/user/5/brent.html?id=3&q=funny";
			request.body = "id=15&post-it=note";
			request.method = "POST";
			request.route = wtf.routes.userPage;
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.extractParams(request, response, function(err) {
					assert(!err);
					expect(Object.keys(request.params).length).equal(4);
					expect(request.params.id).equal("15");
					expect(request.params.name).equal("brent");
					expect(request.params.q).equal("funny");
					expect(request.params['post-it']).equal("note");
					request.clearTimeout();
					return done();
				})
			})
		})
	})
	describe("dynamicCss", function() {
		it("should ignore non-css requests", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function() {
				request.route = wtf.routes.homePage;
				wtf.dynamicCss(request, response, function() {
					assert(!request.page);
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should process dynamicCss requests, and prepare them to be sent (but not send)", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function() {
				request.route = wtf.routes._css;
				request.ux = "eyJ0IjoiZGVmYXVsdCIsInciOlsic29tZS93aWRnZXQiLCJhbm90aGVyL3dpZGdldCIsIndpZGdldC8zIl19";
				wtf.dynamicCss(request, response, function() {
					assert(request.page);
					assert(request.page.body);
					expect(request.page.headers['Content-Type']).equal("text/css");
					request.clearTimeout();
					return done();
				})
			})
		})
	})
	describe("dynamicJs", function() {
		it("should ignore non-dynamicJs requests", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function() {
				request.route = wtf.routes.homePage;
				wtf.dynamicJs(request, response, function() {
					assert(!request.page)
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should process dynamicJs requests, and prepare them to be sent (but not send)", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function() {
				request.action = wtf.routes._js.action;
				request.ux = "WyJqcy9qb2VzVGVtcGxhdGVzIiwianMvbWVzc2FnaW5nIiwianMvbWVzc2FnaW5nL2Zvcm1zIiwianMvcXVpY2tTZWFyY2giLCJqcy9vdmVyZmxvd0NsYXNzIl0%3D";
				wtf.dynamicJs(request, response, function() {
					assert(request.page);
					assert(request.page.body);
					expect(request.page.headers['Content-Type']).equal("application/javascript");
					request.clearTimeout();
					return done();
				})
			})
		})
	})
	describe("chooseActionUx", function() {
		it("should populate request.action and request.ux", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.route = wtf.routes.homePage;

			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseActionUx(request, response, function(err) {
					assert(!err);
					expect(request.action).equal("homePage");
					expect(request.ux).equal("default");
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should notice ux as a request param and use it", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.route = wtf.routes.userPage;
			request.params.ux = "special";

			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseActionUx(request, response, function(err) {
					assert(!err);
					expect(request.action).equal("userPage");
					expect(request.ux).equal("special");
					request.clearTimeout();
					return done();
				})
			})
		})
		it("should default to action:404 / ux:'default'", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseActionUx(request, response, function(err) {
					assert(!err);
					expect(request.action).equal("_404");
					expect(request.ux).equal("default");
					request.clearTimeout();
					return done();
				})
			})
		})
		it.skip("should run the rules engine and update requests accordingly", function(done) {

		})
	})
	describe("prepareResponse", function() {
		describe("homePage : special", function () {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			it("should load details form the action/ux file", function(done) {
				wtf.initLogs(request, response, function(err) {
					assert(!err);
					request.action = "homePage";
					request.ux = "special";
					request.params = { footing: 'override' };
					wtf.prepareResponse(request, response, function(err) {
						assert(!err);
						// load correct action/ux config
						assert(request.page);
						expect(request.page.wireframe).equal('default');
						expect(request.page.title).equal('special home page');
						expect(request.page.skin).equal('nifty');
						expect(Object.keys(request.page.widgetBlocks).length).equal(5);
						expect(request.page.widgetBlocks.center.length).equal(1);
						expect(Object.keys(request.page.widgets).length).equal(3);
						return done();
					});
				})
			})
			it("should prepare the sample widget correctly", function(done) {
				var widget = request.page.widgets.firstContent;
				expect(typeof widget).equal("object");
				expect(widget.name).equal("sample");
				expect(widget.configs.heading).equal("widget 5");
				expect(widget.configs.content).equal("this is a special page");
				expect(widget.configs.footing).equal("override");
				expect(widget.configs.touchedByLogic).equal(true);
				expect(widget.scripts.length).equal(1);
				expect(widget.styles.length).equal(1);
				expect(widget.html).equal('<div class="widget sample jsph">\r\n\r\n\t<h2 class="widgetHeader">widget 5\r\n\r\n\t<div class="widgetContent">this is a special page</div>\r\n\r\n\t<div class="widgetFooter">override</div>\r\n');
				var errors = widget.log.getErrors();
				if (errors.length) console.log(errors);
				expect(errors.length).equal(0);
				return done();
			})
			it("should handle noRender correctly", function(done) {
				var widget = request.page.widgets.iDontRender;
				expect(typeof widget).equal("object");
				expect(widget.name).equal("testLogic/alwaysNoRender");
				expect(widget.noRender).equal(true);
				expect(widget.scripts.length).equal(0);
				expect(widget.styles.length).equal(0);
				expect(widget.html).equal('');
				var errors = widget.log.getErrors();
				if (errors.length) console.log(errors);
				expect(errors.length).equal(0);
				return done();
			})
			it("should find the right dependency scripts", function(done) {
				var widget = request.page.widgets.reqSomeScripts;
				expect(typeof widget).equal("object");
				expect(widget.name).equal('testScript/hasMultipleDependencies');
				expect(widget.scripts.length).equal(3);
				expect(widget.styles.length).equal(0);
				expect(widget.html).equal('');
				var errors = widget.log.getErrors();
				if (errors.length) console.log(errors);
				expect(errors.length).equal(0);
				return done();
			})
			it.skip("should produce an error widget for widgets that caused errors", function(done) {

			})
			it("should fill html output for correct wireframe/widgets/etc", function(done) {
				expect(request.page.cssUrl).match(/^\/css\/eyJ0IjoiZGVmYXVsdCIsInciOlsic2FtcGxlIl19.css\?ver\=\d+$/);
				expect(request.page.jsUrl).match(/^\/js\/WyJzYW1wbGUiLCJ0ZXN0U2NyaXB0L2hhc1NjcmlwdE5vRGVwZW5kZW5jeSIsInRlc3RTY3JpcHQvaGFzTXVsdGlwbGVEZXBlbmRlbmNpZXMiXQ\%3D\%3D\.js\?ver\=\d+$/);

				expect(request.page.statusCode).equal(200);
				expect(request.page.headers['Content-Type']).equals('text/html');
				expect(request.page.body).equal("<!DOCTYPE html>\n<html>\n  <head>\n    <title>special home page</title>\n    <link rel=\"stylesheet/less\" type=\"text/css\" href=\"/css/eyJ0IjoiZGVmYXVsdCIsInciOlsic2FtcGxlIl19.css?ver=1394021765000\">\n  </head>\n  <body>\n    <div class=\"pageContainer\">\n      <div class=\"pageHeader\">\n      </div>\n      <div class=\"pageMiddle\">\n        <div class=\"pageCenter\"><div class=\"widget sample jsph\">\r\n\r\n\t<h2 class=\"widgetHeader\">widget 5\r\n\r\n\t<div class=\"widgetContent\">this is a special page</div>\r\n\r\n\t<div class=\"widgetFooter\">override</div>\r\n\n        </div>\n      </div>\n    </div>\n    <script src=\"/js/WyJzYW1wbGUiLCJ0ZXN0U2NyaXB0L2hhc1NjcmlwdE5vRGVwZW5kZW5jeSIsInRlc3RTY3JpcHQvaGFzTXVsdGlwbGVEZXBlbmRlbmNpZXMiXQ%3D%3D.js?ver=1394226295000\"></script>\n  </body>\n</html>");
				return done();
			})
			it.skip("should not overwrite predefined status codes", function(done) {

			})
			it.skip("should not overwrite predefined mime-type", function(done) {

			})
			it("should cleanup after its done", function(done) {
				wtf.logRequest(request, response, function(err) {
					return done();
				})
			})
		})
	})
	describe("sendResponse", function() {
		it("should send body and headers as prepared", function(done) {
			var request = httpMocks.createRequest();
			var response = httpMocks.createResponse();
			request.page = new Page();
			request.page.body = "some stuff";
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf._sendResponse(request, response, function(err) {
					assert(!err);
					expect(response.statusCode).equal(200);
					expect(response._isEndCalled()).equal(true);
					expect(response._isJSON()).equal(false);
					var headers = response._getHeaders();
					expect(headers['Content-Type']).equal("text/html");
					//expect(response._isUTF8()).equal(true);
					expect(response._isDataLengthValid()).equal(true);
					expect(response._getData()).equals('some stuff');
					//expect(request.ttfb).ok;
					//expect(request.ttlb).ok;
					//response._cookies = {}
					//_getHeaders();??
					wtf.logRequest(request, response, function(err) {
						return done();
					})
				})
			})
		})
	})
	describe("dev Route", function() {
		it("should load page with requested widget", function(done) {
			var request = httpMocks.createRequest({
				method: 'GET',
				url: '/dev/testRender/hasHtmlTemplateOnly',
			})
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseRoute(request, response, function(err) {
					assert(!err);
					expect(request.route).equal(wtf.routes._dev);
					wtf.extractParams(request, response, function(err) {
						assert(!err);
						expect(request.params['theWidget']).equal("testRender/hasHtmlTemplateOnly");
						wtf.dynamicCss(request, response, function(err) {
							assert(!err);
							wtf.dynamicJs(request, response, function(err) {
								assert(!err);
								wtf.chooseActionUx(request, response, function(err) {
									assert(!err);
									expect(request.action).equal("_dev");
									expect(request.ux).equal("default");
									wtf.prepareResponse(request, response, function(err) {
										assert(!err);
										assert(request.page.widgets.theWidget);
										expect(request.page.widgets.theWidget.name).equal("testRender/hasHtmlTemplateOnly");
										assert(request.page.widgets.theWidget.html);
										assert(request.page.body);
										wtf._sendResponse(request, response, function(err) {
											assert(!err);
											wtf.logRequest(request, response, function(err) {
												assert(!err);
												return done();
											})
										})
									})
								})
							})
						})
					})
				})
			})
		})
	})
	describe("logRequest", function() {
		it("should, do some kind of logging", function(done) {
			var request = httpMocks.createRequest({
				method: 'GET',
				url: '/?ux=special',
			});
			var response = httpMocks.createResponse();
			wtf.initLogs(request, response, function(err) {
				assert(!err);
				wtf.chooseRoute(request, response, function(err) {
					assert(!err);
					wtf.extractParams(request, response, function(err) {
						assert(!err);
						wtf.dynamicCss(request, response, function(err) {
							assert(!err);
							wtf.dynamicJs(request, response, function(err) {
								assert(!err);
								wtf.chooseActionUx(request, response, function(err) {
									assert(!err);
									wtf.prepareResponse(request, response, function(err) {
										assert(!err);
										wtf._sendResponse(request, response, function(err) {
											assert(!err);
											wtf.logRequest(request, response, function(err) {
												assert(!err);
												//console.log(request.responseBody);
												return done();
											})
										})
									})
								})
							})
						})
					})
				})
			})
		})
	})
})