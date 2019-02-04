// see: http://www.w3.org/html/wg/drafts/html/master/single-page.html#void-elements
var voids = [
  'area', 'base', 'br', 'col', 'embed',
  'hr', 'img', 'input', 'keygen', 'link',
  'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
].reduce(function(o, v) {
  o[v] = true;
  return o;
}, Object.create(null));

function htmlTag(tag, content, attrStr) {
  var text = ['<',
    tag,
    attrStr ? ' ' + attrStr :  '',
    '>'
  ];
  if(!voids[tag]) {
    text = text.concat([
      content || '',
      '</',
      tag,
      '>'
    ]);
  }
  return text;
}

function xmlTag(tag, content, attrStr) {
  var text = ['<',
    tag,
    attrStr ? ' ' + attrStr :  '',
  ];
  if (!content || !content.length) {
    text.push('/>');
  } else {
    text = text.concat([
      '>',
      content,
      '</',
      tag,
      '>'
    ]);
  }
  return text;
}

function toStr(tagFn, tag, content, attrs) {
  var attrStr, classes, ids;

  if (typeof content !== 'string') {
    attrs = content;
    content = '';
  }

  tag = tag || '';
  attrs = attrs || {};

  classes = tag.split('.');
  tag = classes.shift() || 'div';
  if (classes.length) {
    classes = classes.join(' ');
    if (attrs['class']) {
      attrs['class'] += ' ' + classes;
    } else {
      attrs['class'] = classes;
    }
  }
  ids = tag.split('#');
  if (ids.length > 1) {
    tag = ids[0] || 'div';
    attrs.id = ids[1];
  }

  attrStr = Object.keys(attrs).map(function(attr) {
    return attr +  '="' + attrs[attr] + '"';
  }).join(' ');

  return tagFn(tag, content, attrStr).join('');
}

module.exports = toStr.bind(null, htmlTag);
module.exports.xml = toStr.bind(null, xmlTag);