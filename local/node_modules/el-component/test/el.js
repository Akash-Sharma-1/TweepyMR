var el = require('..');
var xml = el.xml;

/* global describe, it */

describe('el', function() {

  it('should generate simple element', function() {
    el('iframe').should.eql('<iframe></iframe>');
    el().should.eql('<div></div>');
  });

  it('should generate content', function() {
    el('span', 'some text inside').should.eql('<span>some text inside</span>');
  });

  it('should parse class', function() {
    el('span.title', 'Title').should.eql('<span class="title">Title</span>');
    el('span.title.car', 'Title').should.eql('<span class="title car">Title</span>');
    el('span.title', 'Title', { 'class': 'car' }).should.eql('<span class="car title">Title</span>');
  });

  it('should parse ID', function() {
    el('span#title', 'Title').should.eql('<span id="title">Title</span>');
    el('#title', 'Title').should.eql('<div id="title">Title</div>');
    el('span#title.car', 'Title').should.eql('<span class="car" id="title">Title</span>');
    el('span#title.car.a.b', 'Title').should.eql('<span class="car a b" id="title">Title</span>');
    el('#title.car', 'Title').should.eql('<div class="car" id="title">Title</div>');
  });

  it('should treat void elements differently from non void elements', function() {
    el('img', { src: 'http://example.com/img.png' }).should.eql('<img src="http://example.com/img.png">');
    el('iframe', { src: 'http://example.com' }).should.eql('<iframe src="http://example.com"></iframe>');
  });

});

describe('xml', function() {

  it('should render empty elements', function() {
    xml('svg').should.eql('<svg/>');
  });

  it('should ignore voids', function() {
    xml('img', { src: 'http://example.com/img.png' }).should.eql('<img src="http://example.com/img.png"/>');
  });

  it('should render content without attributes', function() {
    xml('path', 'some text inside').should.eql('<path>some text inside</path>');
  });

  it('should render attributes without content', function() {
    xml('path', {
      width: 1,
      height: '0.5em'
    }).should.eql('<path width="1" height="0.5em"/>');
  });

  it('should render attributes with content', function() {
    xml('item', 'some text', {
      width: 1,
      height: '0.5em'
    }).should.eql('<item width="1" height="0.5em">some text</item>');
  });
});
