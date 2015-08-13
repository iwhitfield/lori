var moment = require('moment');
var util = require('util');

function Logger(){
  var defaultTheme = this.currentTheme = {
    debug: 'yellow',
    error: 'red',
    info: 'green',
    warn: 'yellow',

    verb: 'white',
    path: 'cyan',
    message: 'white',
    duration: undefined
  };

  this.colors = require('colors/safe');
  this.colors.setTheme(this.currentTheme);

  Object.defineProperties(this, {
    defaultTheme: {
      value: defaultTheme
    }
  });

  this.reset();
}

Logger.prototype = {

  /*
    Configuration.
   */

  configure: function configure(opts){
    this.currentTheme = opts && opts['theme'] || this['defaultTheme'];

    this.colors.setTheme(this.currentTheme);

    this.dateFormat = opts && opts.dateFormat || this.dateFormat;
    this.localTime = opts && opts.localTime || this.localTime;
    this.logColors = opts && opts.colors !== undefined
      ? Boolean(opts.colors) : this.logColors;

    this.setLogger(opts && opts.log);
  },

  reset: function reset(){
    this.setLogger(console.log);
    this.setTheme(this['defaultTheme']);

    this.dateFormat = 'ddd, DD MMM YYYY HH:mm:ss';
    this.localTime = false;
    this.logColors = true;
  },

  setDateFormat: function setDateFormat(format){
    if(typeof format === 'string'){
      this.dateFormat = format;
    }
  },

  setLogger: function setLogger(fn){
    fn = fn || console.log;
    this.log = function(){
      var args = Array.prototype.slice.call(arguments);
      return fn(util.format.apply(util, args));
    };
  },

  setTheme: function setTheme(obj){
    if(typeof obj === 'object') {
      this.currentTheme = obj;
      this.colors.setTheme(obj);
    }
  },

  updateTheme: function updateTheme(obj){
    if(typeof obj === 'object') {
      Object
        .keys(this.currentTheme)
        .forEach(function(k){
          if(!obj.hasOwnProperty(k)){
            obj[k] = this.currentTheme[k];
          }
        }.bind(this));

      this.currentTheme = obj;
      this.colors.setTheme(obj);
    }
  },

  useColors: function useColors(bool){
    this.logColors = Boolean(bool);
  },

  useLocalTime: function useLocalTime(bool){
    this.localTime = !Boolean(bool);
  },

  /*
    Middleware.
   */

  express: function express(){

    var _this = this;

    return function(req, res, next){
      req._startTime = process.hrtime();

      req.on('end', _this.access.bind(_this, req));

      next();
    };

  },

  /*
    Loggers.
   */

  access: function access(){
    var verb
      = arguments.length === 1 ? arguments[0].method : arguments[0];
    var path
      = arguments[1] || arguments[0].path;
    var duration
      = arguments[2] || process.hrtime(arguments[0]._startTime);

    this.log('%s  %s %s %s',
      this.wrapDate('[INFO]', 'info'),
      this.wrap(verb, 'verb'),
      this.wrap(path, 'path'),
      this.wrap(toMs(duration) + 'ms', 'duration')
    );
  },

  debug: function debug(msg){
    this.log('%s %s', this.wrapDate('[DEBUG]', 'debug'), this.wrap(format(msg), 'message'));
  },

  error: function error(msg){
    this.log('%s %s', this.wrapDate('[ERROR] ', 'red'), this.wrap(format(msg), 'message'));
  },

  info: function warn(msg){
    this.log('%s  %s', this.wrapDate('[INFO]', 'info'), this.wrap(format(msg), 'message'));
  },

  log: console.log,

  warn: function warn(msg){
    this.log('%s  %s', this.wrapDate('[WARN]  ', 'warn'), this.wrap(format(msg), 'message'));
  },

  /*
    Utility.
   */

  wrap: function wrap(str, type){
    try {
      if(this.logColors) {
        return this.colors[type](str);
      }
    } catch(e) { }
    return str;
  },

  wrapDate: function wrap(str, type){
    var m = this.localTime ? moment : moment['utc'];
    return this.wrap('[' + m().format(this.dateFormat) + '] ' + str, type);
  }

};

function format(msg){
  return typeof msg === 'string' ? msg : JSON.stringify(msg);
}

function toMs(hrtime, dec){
  return parseFloat(((hrtime[0] * 1000) + (hrtime[1] / 1000000)).toFixed(dec || 2));
}

module.exports = new Logger();
module.exports.Logger = Logger;