[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][gemnasium-image]][gemnasium-url]

# fetchagent

Flex API for global fetch

## Install

```sh
$ npm install --save fetchagent
```

## Usage

```js
var fa = require('fetchagent');


// using callbacks
fa
  .get('http://httpbin.org/xml')
  .end(function(err, response) {
    if (err) {
      console.log(err, status);
    }
    console.log("Received:", response);
  });

// using promises
fa
  .post('http://httpbin.org/post')
  .send({ echo: 42 })
  .json()
  .then(function(response) {
    console.log("Received:", response.echo);
  });

```

# API

To configure request use one or more:

- `get(url)`, `put(url)`, `post(url)`, `delete(url)` - HTTP method to `url`
- `query()` - sets search params (a.k.a querystring)
- `set(name, vale)` - sets header `name` to `value`
- `set(obj)` - sets headers for all properties of the `object`
- `redirect(flag)` - pass truthy value if fetchagent is supposed to automatically handle redirects

To send request use on of:

- `end(callback)` - pass `callback(err, body)`
- `end()` - returns a Promise that resolves to a response
- `json()` - returns a Promise resolving to a parsed object
- `text()` - returns a Promise resolving to a body text

## License

MIT © [Damian Krzeminski](https://pirxpilot.me)

[npm-image]: https://img.shields.io/npm/v/fetchagent.svg
[npm-url]: https://npmjs.org/package/fetchagent

[travis-url]: https://travis-ci.org/pirxpilot/fetchagent
[travis-image]: https://img.shields.io/travis/pirxpilot/fetchagent.svg

[gemnasium-image]: https://img.shields.io/gemnasium/pirxpilot/fetchagent.svg
[gemnasium-url]: https://gemnasium.com/pirxpilot/fetchagent
