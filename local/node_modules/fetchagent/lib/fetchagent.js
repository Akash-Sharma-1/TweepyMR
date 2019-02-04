/* global Headers */

module.exports = fetchagent;

['get', 'put', 'post', 'delete'].forEach(function(method) {
  fetchagent[method] = function(url) {
    return fetchagent(method.toUpperCase(), url);
  };
});

fetchagent.del = fetchagent.delete;

function setAll(destination, source) {
  Object.keys(source).forEach(function(p) {
    destination.set(p, source[p]);
  });
}

function formatUrl(prefix, query) {
  function encode(v) {
    return Array.isArray(v)
      ? v.map(encodeURIComponent).join(',')
      : encodeURIComponent(v);
  }

  if (!query) {
    return prefix;
  }
  var qs = Object
    .keys(query)
    .map(function(name) { return name + '=' + encode(query[name]); })
    .join('&');
  if (!qs) {
    return prefix;
  }
  return prefix + '?' + qs;
}

function defaultContentParser(contentType) {
  return contentType && contentType.indexOf('json') !== -1
    ? 'json'
    : 'text';
}

function fetchagent(method, url) {
  var req = {
    url: url,
    query: undefined
  };
  var init = {
    method: method,
    redirect: 'manual',
    credentials: 'same-origin'
  };
  var self = {
    end: end,
    json: json,
    parser: parser,
    query: query,
    redirect: redirect,
    send: send,
    set: set,
    text: text
  };
  var error;
  var contentParser = defaultContentParser;

  function end(fn) {
    var fetched = fetch(formatUrl(req.url, req.query), init);

    if (!fn) {
      return fetched;
    }

    fetched
      .then(function(res) {
        if (!res.ok) {
          error = {
            status: res.status,
            response: res
          };
        }
        var parser = contentParser(res.headers.get('Content-Type'));
        if (parser) {
          return res[parser]();
        } else if (!error) {
          error = {
            status: 'unknown Content-Type',
            response: res
          };
        }
      })
      .then(
        function(body) { return fn(error, body); },
        function(e) {
          error = error || {};
          error.error = e;
          return fn(error);
        }
      );
  }

  function json() {
    return end().then(function(res) { return res.json(); });
  }

  function text() {
    return end().then(function(res) { return res.text(); });
  }

  function send(body) {
    if (body instanceof Blob || body instanceof FormData || typeof body !== 'object') {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      set('Content-Type', 'application/json');
    }
    return self;
  }

  function query(q) {
    req.query = q;
    return self;
  }

  function set(header, value) {
    if (!init.headers) {
      init.headers = new Headers();
    }
    if (typeof value === 'string') {
      init.headers.set(header, value);
    }
    else  {
      setAll(init.headers, header);
    }
    return self;
  }

  function redirect(follow) {
    init.redirect = follow ? 'follow' : 'manual';
    return self;
  }

  function parser(fn) {
    contentParser = fn;
    return self;
  }

  return self;
}
