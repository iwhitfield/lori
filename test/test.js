var express = require('express');
var fs = require('fs-extra');
var moment = require('moment');
var request = require('supertest');
var should = require('should');

var lori = require('../');
var pkgName = require('../package').name;

var debugDir = __dirname + '/../tmp';
var debugLog = debugDir + '/debug.log';

describe(pkgName, function(){

  beforeEach('setup debug logs', function(start){

    fs.remove(debugDir, function(){

      fs.mkdir(debugDir, function(err){
        if(err){
          return start(err);
        }

        var logFile = fs.createWriteStream(debugLog, {
          flags: 'w'
        });

        lori.setLogger(function(str){
          logFile.write(str + '\n');
        });

        start();
      });

    });

  });

  describe('configuration', function(){

    var defaultTheme = {
      debug: 'yellow',
      error: 'red',
      info: 'green',
      warn: 'yellow',

      duration: undefined,
      message: 'white',
      path: 'cyan',
      verb: 'white'
    };

    it('defaults to a pre-determined theme', function(){
      should(lori.defaultTheme).be.ok;
      should(lori.defaultTheme).deepEqual(defaultTheme);
    });

    it('sets a default date format', function(){
      should(lori.dateFormat).be.ok;
      should(lori.dateFormat).eql('ddd, DD MMM YYYY HH:mm:ss');
    });

    it('uses UTC dates by default', function(){
      should(lori.localTime).be.false;
    });

    it('uses colours by default', function(){
      should(lori.logColors).be.true;
    });

    it('modifies settings via #configure', function(){
      lori.configure({
        dateFormat: 'YYYY',
        localTime: true,
        logColors: false,
        theme: {
          duration: 'green'
        }
      });

      should(lori.defaultTheme).be.ok;
      should(lori.defaultTheme).deepEqual(defaultTheme);

      should(lori.currentTheme).be.ok;
      should(lori.currentTheme).deepEqual({ duration: 'green' });

      should(lori.logColors).be.false;

      should(lori.dateFormat).be.ok;
      should(lori.dateFormat).eql('YYYY');

      should(lori.localTime).be.true;
    });

    it('can set a theme manually', function(){
      lori.setTheme({
        duration: 'blue'
      });

      should(lori.currentTheme).be.ok;
      should(lori.currentTheme).deepEqual({ duration: 'blue' });
    });

    it('can update the existing theme', function(){
      lori.updateTheme({
        duration: 'blue'
      });

      should(lori.currentTheme).be.ok;
      should(lori.currentTheme).deepEqual({
        debug: 'yellow',
        error: 'red',
        info: 'green',
        warn: 'yellow',

        verb: 'white',
        path: 'cyan',
        message: 'white',
        duration: 'blue'
      });
    });

    it('updates date formats', function(){
      lori.setDateFormat('YYYY');
      lori.setDateFormat([]);

      should(lori.dateFormat).be.ok;
      should(lori.dateFormat).eql('YYYY');
    });

    it('allows local time', function(){
      lori.useLocalTime(true);
      should(lori.localTime).be.true;
    });

    it('can disable colours', function(next){
      lori.useColors(false);

      lori.info('test');

      var date = moment.utc();

      getDebugLines(function(err, lines){
        if(err){
          return next(err);
        }

        should(lines).be.ok;
        should(lines).have.lengthOf(1);
        should(lines[0]).eql('[' + date.format(lori.dateFormat) + '] [INFO]  test');

        next();
      });
    });

  });

  describe('constructor', function(){

    it('can create a new Logger instance', function(){
      var L = new lori.Logger();

      L.dateFormat = 'YYYY';

      should(L.dateFormat).eql('YYYY');
      should(lori.dateFormat).eql('ddd, DD MMM YYYY HH:mm:ss');
    });

  });

  describe('middleware', function(){

    var app, agent;

    before('setup express server', function(){
      app = express();
      agent = request.agent(app);

      app.use(lori.express());

      app.all('/', function(req, res){
        res.status(200).send({
          name: 'supertest'
        });
      });
    });

    it('returns a function to be used as middleware', function(){
      var fn = lori.express();

      should(fn).be.a.Function;
      should(fn).have.lengthOf(3);
    });

    it('correctly measures a request', function(next){
      agent
        .get('/')
        .end(function(){

          getDebugLines(function(err, lines){
            if(err){
              return next(err);
            }

            var date = moment.utc();
            var splitBuffer = lines.pop().split(/\s+/);

            // length
            should(splitBuffer).have.lengthOf(9);

            // date
            should([
              splitBuffer[0], splitBuffer[1], splitBuffer[2],
              splitBuffer[3], splitBuffer[4]
            ].join(' ')).eql('\u001b[32m[' + date.format(lori.dateFormat) + ']');

            // meta
            should(splitBuffer[5]).eql('[INFO]\u001b[39m');
            should(splitBuffer[6]).eql('\u001b[37mGET\u001b[39m');
            should(splitBuffer[7]).eql('\u001b[36m/\u001b[39m');
            should(splitBuffer[8]).match(/\d+\.?\d*ms/);

            next();
          });

        });

    });

    it('uses custom date formats', function(next){
      var dateFormat = 'DD-MM-YYYY';

      lori.setDateFormat(dateFormat);

      agent
        .delete('/')
        .end(function(){

          getDebugLines(function(err, lines){
            if(err){
              return next(err);
            }

            var date = moment.utc();
            var splitBuffer = lines.pop().split(/\s+/);

            // length
            should(splitBuffer).have.lengthOf(5);

            // date
            should(splitBuffer[0]).eql('\u001b[32m[' + date.format(dateFormat) + ']');

            // meta
            should(splitBuffer[1]).eql('[INFO]\u001b[39m');
            should(splitBuffer[2]).eql('\u001b[37mDELETE\u001b[39m');
            should(splitBuffer[3]).eql('\u001b[36m/\u001b[39m');
            should(splitBuffer[4]).match(/\d+\.?\d*ms/);

            next();
          });

        });

    });

  });

  describe('loggers', function(){

    it('handle string arguments', function(next){

      var loggers = ['debug','error','info','warn'];

      loggers.forEach(function(k){
        lori[k]('test');
      });

      getDebugLines(function(err, lines){
        if(err){
          return next(err);
        }

        for(var i = 0, j = lines.length; i < j; i++){
          should(lines[i]).containEql(loggers[i].toUpperCase());
          should(lines[i]).containEql('test');
        }

        should(lines.length).eql(4);

        next();
      });

    });

    it('handle object arguments', function(next){

      var loggers = ['debug','error','info','warn'];
      var obj = {
        field1: 'value',
        field2: 123,
        field3: {
          field4: []
        }
      };

      loggers.forEach(function(k){
        lori[k](obj);
      });

      getDebugLines(function(err, lines){
        if(err){
          return next(err);
        }

        for(var i = 0, j = lines.length; i < j; i++){
          should(lines[i]).containEql(loggers[i].toUpperCase());
          should(lines[i]).containEql(JSON.stringify(obj));
        }

        should(lines.length).eql(4);

        next();
      });

    });

  });

  afterEach('reset lori status', function(){
    lori.reset();
  });

});

function getDebugLines(cb){
  setTimeout(function(){
    fs.readFile(debugLog, function(err, buffer){
      if(err){
        return cb(err);
      }
      cb(null, buffer.toString().slice(0, -1).split('\n'));
    });
  }, 3);
}