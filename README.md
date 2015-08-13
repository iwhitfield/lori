Lori [![Build Status](https://travis-ci.org/iwhitfield/lori.svg?branch=master)](https://travis-ci.org/iwhitfield/lori) [![Code Climate](https://codeclimate.com/github/iwhitfield/lori/badges/gpa.svg)](https://codeclimate.com/github/iwhitfield/lori) [![Test Coverage](https://codeclimate.com/github/iwhitfield/lori/badges/coverage.svg)](https://codeclimate.com/github/iwhitfield/lori)
====

Lori is a very lightweight logger for use in Node.js applications, with a middleware option for Express access logs. Lori is a colourful way to output quick logging, and is extremely easy to set up. It's not designed to take on the functionality of other libraries such as [morgan](https://github.com/expressjs/morgan), but to get something in place quickly which can provide insight into your application.

### Compatibility

This module is built on each commit with TravisCI on Node 0.10.x, 0.12.x and the latest version of `io.js`. Build results are sent over to [Code Climate](https://codeclimate.com/github/iwhitfield/lori) for analysis.

### Usage

Lori is available on [npm](https://www.npmjs.com/package/lori), so simply install it.

```
$ npm install lori
```

There are a couple of ways you can use Lori, either as a generic logger or as a piece of Middleware for [Express](http://expressjs.com/).

#### Middleware

As middleware, Lori will generate access logs for your Express application in the following format:

```
[Thu, 13 Aug 2015 19:14:09] [INFO]  GET /welcome 544.98ms
```

To set up Lori as a piece of Middleware, simply drop it into your app as early as possible in your setup:

```
var lori = require('lori');

app.use(lori.express());
```

#### Logging

There are several default methods written into Lori, for the common use cases with logging:

```javascript
lori.debug('test');
lori.error('test');
lori.info('test');
lori.warn('test');

// [Thu, 13 Aug 2015 19:14:09] [DEBUG] test
// [Thu, 13 Aug 2015 19:14:09] [ERROR] test
// [Thu, 13 Aug 2015 19:14:09] [INFO]  test
// [Thu, 13 Aug 2015 19:14:09] [WARN]  test
```

These methods typically take `String` arguments, however if a non-`String` argument is provided, Lori will `JSON.stringify` whatever is passed.

You can also call the `access` function the Express Middleware uses, as below:

```javascript
// [request]
lori.access(req);

// [verb, url, duration(hrtime)]
lori.access('GET', '/welcome', process.hrtime(startTime));
```

Each level has a colour associated with it (which can be changed, see below). By default all logs go to `stdout`, but this can also be modified.

#### Configuration

Lori is extremely easy to use, with a few little utilities to allow for customisation. 

##### Constructor

By default, the `lori` module provides a singleton logger for use throughout your application (it doesn't care about state), however if you wish to make many loggers, you can access the constructor as below:

```javascript
var lori = require('lori');

var Logger = new lori.Logger();
```

This allows you to have different loggers with different configurations throughout your application.

##### Configure

The `configure` function is typically called as soon as you start your application - it allows you to specify colours, logging locations, formats, etc. This function takes an object argument of the following options:

```javascript
lori.configure({
    
    // The format the date string will take at
    // the start of dated logs. This defaults to
    // a UTC style JavaScript string. Formats are
    // controlled via MomentJS, so see their docs
    // for examples.
    dateFormat: 'ddd, DD MMM YYYY HH:mm:ss',
    
    // By default, all timestamps are in UTC time,
    // but this can be changed by setting this value
    // to true. If true, dates will use the local time
    // via the default moment constructor.
    localTime: false,
    
    // Simply a flag of whether you wish to enable
    // colored output or not. If writing to a file,
    // this should usually be false.
    logColors: true,
    
    // This is the low-level log function used by Lori
    // when outputting logs. By default, logs go straight
    // to console.log (as shown), however it can be
    // overridden to write to files, etc. When writing to
    // files, it's a good idea to turn off colours.
    //
    // It should be noted that the argument passed to this
    // method is the final string after all formatting by Lori
    log: function(str){
        console.log(str);
    },
    
    // This is the theme used for each type of logger. If
    // any of these values are unset, they will have their
    // colours removed. Colours are provided by the npm
    // module `colors`, so visit their docs to see the valid
    // strings.
    // 
    // The bottom four keys shown here are part of the access
    // logs in the Express middleware - you can control each
    // part of the log output.
    theme: {
        debug: 'yellow',
        error: 'red',
        info: 'green',
        warn: 'yellow',
    
        verb: 'white',
        path: 'cyan',
        message: 'white',
        duration: 'white'
    }
    
});
```

##### Modification

This is not the only time you can control Lori though, it's dynamic - you can modify it at any time, although naturally it will only effect the instance you're working with (instead of all of them):

```javascript
// reset Lori to the default state (as shown in the above `configure`)
lori.reset();

// modify to use a new logging method on the underlying instance
lori.setLogger(function(str){
    fs.appendFileSync('./myfile.txt', str);
});

// change the date format
lori.setDateFormat('DD-MM-YYYY');

// change the theme used for colours - this will overwrite the previous theme
lori.setTheme({
    info: 'blue'
});

// change the theme used for colours - this will merge with the previous theme
lori.updateTheme({
    info: 'blue'
});

// turn off coloured output
lori.useColors(false);

// switch to using local time
lori.useLocalTime(true);
```

### Tests

Tests are written in Mocha, and can be run via npm scripts. 

```bash
$ npm test
```

You can also generate coverage reports in HTML and lcov formats using:

```bash
$ npm run coverage
$ npm run lcov
```

Sadly, couldn't use Grunt because it swallows the colours.

### Issues

If you find any issues inside this module, feel free to open an issue [here](https://github.com/iwhitfield/lori/issues "Lori Issues").