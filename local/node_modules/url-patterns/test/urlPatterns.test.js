var chai = require('chai');
chai.Assertion.includeStack = true;
var assert = chai.assert;
var expect = chai.expect;
var urlPatterns = require('../src/urlPatterns.js');

describe("urlPatterns", function() {
	describe('createRegex', function() {
		it('should recognize slugs', function(done) {
			var regex = urlPatterns.createRegex("(slug:x)");
			expect("brent0boy").match(regex);
			expect("brent-0-boy").match(regex);
			expect("brent0-boy-").match(regex);
			expect("-brent0boy-").match(regex);
			expect("brent15-52").match(regex);
			expect("Brent-0").match(regex);  // I know, slugs dont theortically have capital letters, but we allow them anyway
			expect("brent-0-Boy").match(regex);
			expect("brent_0").match(regex); // same goes for underscores
			expect("0-1").match(regex);
			expect("0").match(regex);
			expect("-").match(regex);
			expect("b").match(regex);
			expect("3D_Jetski_Racing").match(regex);

			assert(!regex.test(""));  // its gotta have something
			assert(!regex.test("asdfasdf adsfasdf")); // spaces are not ok
			assert(!regex.test("asdfasdf,adsfasdf")); // commas are bad
			assert(!regex.test("as.df")); // period is bad
			assert(!regex.test("as(f")); // symbols in genreal are
			assert(!regex.test("as)df"));
			assert(!regex.test("as]df"));
			assert(!regex.test("as>df"));
			assert(!regex.test("as|df"));
			assert(!regex.test("as+df"));
			assert(!regex.test("as=df"));
			assert(!regex.test("as\\df"));
			assert(!regex.test("as/df"));
			return done();
		})
		it('should recognize strings', function(done) {
			var regex = urlPatterns.createRegex("(string:s)");
			expect("brent0boy").match(regex);
			expect("brent-0-boy").match(regex);
			expect("brent0-boy-").match(regex);
			expect("-brent0boy-").match(regex);
			expect("brent15-52").match(regex);
			expect("Brent-0").match(regex);
			expect("brent-0-Boy").match(regex);
			expect("brent_0").match(regex);
			expect("0-1").match(regex);
			expect("0").match(regex);
			expect("-").match(regex);
			expect("b").match(regex);
			expect("asdflakjsdf").match(regex);
			expect("asdfasdf adsfasdf").match(regex);
			expect("asdfasdf, adsfasdf").match(regex);
			expect("as.df").match(regex);
			expect("as(f").match(regex);
			expect("as@df").match(regex);
			expect("as]df").match(regex);
			expect("as>df").match(regex);
			expect("as+df").match(regex);
			expect("as=df").match(regex);
			expect("3D_Jetski_Racing").match(regex);

			assert(!regex.test(""));
			assert(!regex.test("as\\df"));
			assert(!regex.test("as/df"));
			assert(!regex.test("as|df"));
			return done();
		})
		it('should recognize path', function(done) {
			var regex = urlPatterns.createRegex("(path:file)");
			expect("x/y/z.html").match(regex);
			expect("abv").match(regex);
			expect("this.jpg").match(regex);
			expect("someplace/somewhere/somefile.ext").match(regex);

			assert(!regex.test(""));
			return done();
		})
		it('should recognize ints', function(done) {
			var regex = urlPatterns.createRegex("(int:x)");
			expect("0").match(regex);
			expect("1").match(regex);
			expect("132413475696770578012435").match(regex);
			expect("-1").match(regex);
			expect("-600").match(regex);
			expect("934812").match(regex);

			assert(!regex.test(""));
			assert(!regex.test("0.0"));
			assert(!regex.test("1.23"));
			assert(!regex.test("$1230"));
			assert(!regex.test("a234"));
			assert(!regex.test("3F3"));
			assert(!regex.test("-1.5"));
			assert(!regex.test("1,5"));
			return done();
		})
		it('should recognize decimals', function(done) {
			var regex = urlPatterns.createRegex("(decimal:d)");
			expect("0").match(regex);
			expect("1").match(regex);
			expect("132413475696770578012435").match(regex);
			expect("-1").match(regex);
			expect("-600").match(regex);
			expect("934812").match(regex);
			expect("0.0").match(regex);
			expect("1.23").match(regex);
			expect("-1.5").match(regex);

			expect("").not.match(regex);
			expect("$1230").not.match(regex);
			expect("a234").not.match(regex);
			expect("3F3").not.match(regex);
			expect("1,5").not.match(regex);
			expect("1,000,000.00").not.match(regex);
			expect("1.5.4").not.match(regex);
			return done();
		})
		it('should recognize urls like /something/(int:id)/(slug:name).html', function(done) {
			var regex = urlPatterns.createRegex("/something/(int:id)/(slug:name).html");
			expect("/something/1/test.html").match(regex);
			expect("/something/-1/te-st.html").match(regex);
			expect("/something/10/tae2s57t.html").match(regex);

			assert(!regex.test("/something/1b/test.html"));
			assert(!regex.test("/something/1/te st.html"));
			return done();
		})
		it('should recognize urls like /stuff/(path:relativePath)', function(done) {
			var regex = urlPatterns.createRegex("/stuff/(path:relativePath)");
			expect("/stuff/1/test.html").match(regex);
			expect("/stuff/x").match(regex);
			expect("/stuFF/1/te st.html").match(regex);
			expect("/stuff/").not.match(regex);
			expect("/not-stuff/asdf0-aqfee").not.match(regex);
			return done();
		})
	})
	describe('getUrl', function() {
		it('should build urls like /file/(int:id)/(slug:name).html', function(done) {
			var getUrl = urlPatterns.createBuilder("/something/(int:id)/(slug:name).html")
			expect("/something/1/test.html").equals(getUrl({ id:1, name:'test' }))
			expect("/something/-1/te-st.html").equals(getUrl({ id:-1, name:'te-st' }))
			expect("/something/10/tae2s57t.html").equals(getUrl({ id:10, name:'tae2s57t' }))
			return done();
		})
		it('should honor null replacements for /file/(int:id)/(slug:name).html', function(done) {
			var nullReplacements = { id:-500, name:'unknown' };
			var getUrl = urlPatterns.createBuilder("/something/(int:id)/(slug:name).html", nullReplacements);
			expect("/something/1/unknown.html").equals(getUrl({ id:1 }))
			expect("/something/-500/te-st.html").equals(getUrl({ name:'te-st' }))
			expect("/something/-500/unknown.html").equals(getUrl());
			expect("/something/-500/unknown.html").equals(getUrl({}));
			expect("/something/-500/unknown.html").equals(getUrl([]));
			expect("/something/-500/unknown.html").equals(getUrl("bogus"));
			return done();
		})
		it('should default to sane values for null params', function(done) {
			var getUrl = urlPatterns.createBuilder("/something/(int:id)/(slug:name).html");
			expect("/something/1/undefined.html").equals(getUrl({ id:1 }))
			expect("/something/0/te-st.html").equals(getUrl({ name:'te-st' }))
			expect("/something/0/undefined.html").equals(getUrl());
			expect("/something/0/undefined.html").equals(getUrl({}));
			expect("/something/0/undefined.html").equals(getUrl([]));
			expect("/something/0/undefined.html").equals(getUrl("bogus"));
			return done();
		})
	})
	describe('scrapeUrl', function() {
		it('should scrape /file/(int:id)/(slug:name).html correctly', function(done) {
			var scrape = urlPatterns.createScraper("/something/(int:id)/(slug:name).html");
			expect({ id:'1', name:'test' }).eql(scrape("/something/1/test.html"));
			expect({ id:'-1', name:'te-st' }).eql(scrape("/something/-1/te-st.html"));
			expect({ id:'10', name:'tae2s57t' }).eql(scrape("/something/10/tae2s57t.html"));
			return done();
		})
		it('should scrape /media/(path:relativePath) correctly', function(done) {
			var scrape = urlPatterns.createScraper("/media/(path:relativePath)");
			expect({ relativePath:'1/test.html' }).eql(scrape("/media/1/test.html"));
			expect({ relativePath:'-1/te-st.html' }).eql(scrape("/media/-1/te-st.html"));
			expect({ relativePath:'tae2s57t.html' }).eql(scrape("/media/tae2s57t.html"));
			return done();
		})
	})
})