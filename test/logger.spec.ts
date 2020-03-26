import { assert } from 'chai';
import { log } from '../src/logger';
import { LogLevels } from '../src/types/logLevels';
import { LogOutput } from '../src/types/LogOutput';
import { StdoutHijacker } from './stdoutHijacker';

describe('logger', () => {

  let logMessage = 'my message';
  const hijacker = new StdoutHijacker();

  beforeEach(() => {
    log.init({
      correlationId: 'my-corr-id',
      logLevel: LogLevels.DEBUG
    });
  });

  it('should have correct properties', (done) => {
    hijacker.hijack((data: any) => {
      let json = JSON.parse(data);
      assert.equal(json.correlationId, 'my-corr-id', 'Correlation Id is not correct!');
      assert.equal(json.logLevel, LogLevels[LogLevels.INFO], 'Not correct log level!');
      done();
    });
    log.info({ message: 'Info message' });
  });

  it('should be able to log extra properties', (done) => {
    hijacker.hijack((data: any) => {
      let json = JSON.parse(data);
      assert.equal(json.myProp, 42, 'Extra properties not correctly processed');
      done();
    });
    log.logLevel = LogLevels.INFO;
    log.info({ message: logMessage, bonusProperty: 'hello', myProp: 42 });
  });

  it('should log debug logs when log level is set to DEBUG', (done) => {
    log.logLevel = LogLevels.DEBUG;
    hijacker.hijack(() => { done(); });
    log.debug({ message: logMessage });
  });

  it('should log warn logs when log level is set to INFO', (done) => {
    log.logLevel = LogLevels.INFO;
    hijacker.hijack(() => {
      done();
    });
    log.warn({ message: logMessage });
  });

  it('should NOT log debug logs when log level is set to info', (done) => {
    log.logLevel = LogLevels.INFO;
    hijacker.hijack(() => { done('Should never get here!'); });
    log.debug({ message: logMessage });
    setTimeout(() => { hijacker.restore(); done(); }, 0);
  });

  it('should NOT log info logs when log level is set to warn', (done) => {
    hijacker.hijack(() => { done('Should never get here!'); });
    setTimeout(() => { hijacker.restore(); done(); }, 0);

    log.logLevel = LogLevels.WARN;
    log.info({ message: logMessage });
  });

  it('should NOT log warn logs when log level is set to error', (done) => {
    hijacker.hijack(() => done('Should never get here!'));

    log.logLevel = LogLevels.ERROR;
    log.warn({ message: logMessage });
    setTimeout(() => { hijacker.restore(); done(); }, 0);
  });

  it('should ONLY log error logs when log level is set to error', (done) => {
    let json: LogOutput;
    let levels: any = LogLevels;
    log.logLevel = LogLevels.ERROR;

    hijacker.hijack((data: any) => {
      json = JSON.parse(data);
      assert.equal(levels[json.logLevel], levels.ERROR, 'Wrong level!');
      done();
    });

    log.debug({ message: logMessage });
    log.info({ message: logMessage });
    log.warn({ message: logMessage });
    log.error({ message: logMessage, stack: (new Error('my error')).stack });
  });

  it('should convert error object into stack string', (done) => {
    let json: LogOutput;
    let error = new Error('My error');
    hijacker.hijack((data: any) => {
      json = JSON.parse(data);
      assert.deepEqual(`${error.stack}`.split('\n'), json.error.stack, 'Error was not converted correctly!');
      done();
    });
    log.logLevel = LogLevels.ERROR;
    log.error({ message: logMessage, error });
  });

  it('should NOT crash when someone uses log.error without a stack', (done) => {
    let json: LogOutput;
    let error = new Error();
    delete error.stack;
    hijacker.hijack((data: any) => {
      json = JSON.parse(data);
      if (json) {
        done();
      }
    });

    log.logLevel = LogLevels.ERROR;
    log.error({ message: logMessage, error });
  });

  it('should NOT log anything when log level is set to none', (done) => {
    hijacker.hijack(() => { done('Log level NONE is not working correctly!'); });

    log.logLevel = LogLevels.OFF;
    log.debug({ message: logMessage });
    log.info({ message: logMessage });
    log.warn({ message: logMessage });
    log.error({ message: logMessage });
    setTimeout(() => { hijacker.restore(); done(); }, 0);
  });

  it('all log methods should accept both LogInput and string', (done) => {
    let debug: LogLevels = LogLevels.DEBUG,
      info: LogLevels = LogLevels.INFO,
      warn: LogLevels = LogLevels.WARN,
      error: LogLevels = LogLevels.ERROR;
    let allLevels: any = { debug, info, warn, error };

    hijacker.hijack((data: any) => {
      let json = JSON.parse(data);
      delete allLevels[json.logLevel.toLowerCase()];
      assert.equal(json.message, logMessage, 'Wrong message!');

      // When all methods have run, restore stdout and complete the test
      if (Object.keys(allLevels).length === 0) {
        hijacker.restore();
        done();
      }
    }, false);

    // Make sure everything even log.debug is run
    log.logLevel = LogLevels.DEBUG;

    // Use all log methods to make sure all are compatible
    log.debug(logMessage);
    log.info(logMessage);
    log.warn(logMessage);
    log.error(logMessage);
  });
});
