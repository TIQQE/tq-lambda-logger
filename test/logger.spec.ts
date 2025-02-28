import { assert } from 'chai';
import { log } from '../src/logger';
import { LogLevels } from '../src/types/logLevels';
import { LogOutput } from '../src/types/LogOutput';
import { StdoutHijacker } from './stdoutHijacker';

describe('logger', () => {
  const logMessage = 'my message';
  const hijacker = new StdoutHijacker();

  beforeEach(() => {
    log.init({
      correlationId: 'my-corr-id',
      logLevel: LogLevels.DEBUG,
    });
  });

  it('should have correct properties', (done) => {
    hijacker.hijack((data: string) => {
      const json = JSON.parse(data) as LogOutput;
      assert.equal(json.correlationId, 'my-corr-id', 'Correlation Id is not correct!');
      assert.equal(json.logLevel, LogLevels[LogLevels.INFO], 'Not correct log level!');
      done();
    });
    log.info({ message: 'Info message' });
  });

  it('should be able to log extra properties', (done) => {
    hijacker.hijack((data: string) => {
      const json = JSON.parse(data) as LogOutput;
      assert.equal(json.myProp, 42, 'Extra properties not correctly processed');
      done();
    });
    log.logLevel = LogLevels.INFO;
    log.info({ message: logMessage, bonusProperty: 'hello', myProp: 42 });
  });

  it('should log debug logs when log level is set to DEBUG', (done) => {
    log.logLevel = LogLevels.DEBUG;
    hijacker.hijack(() => {
      done();
    });
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
    hijacker.hijack(() => {
      done('Should never get here!');
    });
    log.debug({ message: logMessage });
    setTimeout(() => {
      hijacker.restore();
      done();
    }, 0);
  });

  it('should NOT log info logs when log level is set to warn', (done) => {
    hijacker.hijack(() => {
      done('Should never get here!');
    });
    setTimeout(() => {
      hijacker.restore();
      done();
    }, 0);

    log.logLevel = LogLevels.WARN;
    log.info({ message: logMessage });
  });

  it('should NOT log warn logs when log level is set to error', (done) => {
    hijacker.hijack(() => done('Should never get here!'));

    log.logLevel = LogLevels.ERROR;
    log.warn({ message: logMessage });
    setTimeout(() => {
      hijacker.restore();
      done();
    }, 0);
  });

  it('should ONLY log error logs when log level is set to error', (done) => {
    let json: LogOutput;
    const levels: any = LogLevels;
    log.logLevel = LogLevels.ERROR;

    hijacker.hijack((data: string) => {
      json = JSON.parse(data) as LogOutput;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assert.equal(levels[json.logLevel], levels.ERROR, 'Wrong level!');
      done();
    });

    log.debug({ message: logMessage });
    log.info({ message: logMessage });
    log.warn({ message: logMessage });
    log.error({ message: logMessage, stack: new Error('my error').stack });
  });

  it('should convert error object into stack string', (done) => {
    let json: LogOutput;
    const error = new Error('My error');
    hijacker.hijack((data: string) => {
      json = JSON.parse(data) as LogOutput;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assert.deepEqual(`${error.stack}`.split('\n'), json.error.stack, 'Error was not converted correctly!');
      done();
    });
    log.logLevel = LogLevels.ERROR;
    log.error({ message: logMessage, error });
  });

  it('should NOT crash when someone uses log.error without a stack', (done) => {
    let json: LogOutput;
    const error = new Error();
    delete error.stack;
    hijacker.hijack((data: string) => {
      json = JSON.parse(data) as LogOutput;
      if (json) {
        done();
      }
    });

    log.logLevel = LogLevels.ERROR;
    log.error({ message: logMessage, error });
  });

  it('should NOT log anything when log level is set to none', (done) => {
    hijacker.hijack(() => {
      done('Log level NONE is not working correctly!');
    });

    log.logLevel = LogLevels.OFF;
    log.debug({ message: logMessage });
    log.info({ message: logMessage });
    log.warn({ message: logMessage });
    log.error({ message: logMessage });
    setTimeout(() => {
      hijacker.restore();
      done();
    }, 0);
  });

  it('all log methods should accept both LogInput and string', (done) => {
    const debug: LogLevels = LogLevels.DEBUG;
    const info: LogLevels = LogLevels.INFO;
    const warn: LogLevels = LogLevels.WARN;
    const error: LogLevels = LogLevels.ERROR;
    const allLevels: any = { debug, info, warn, error };

    hijacker.hijack((data: string) => {
      const json = JSON.parse(data) as LogOutput;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      delete allLevels[json.logLevel.toLowerCase()];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assert.equal(json.message, logMessage, 'Wrong message!');

      // When all methods have run, restore stdout and complete the test
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

  it('should pretty print JSON by default (compactPrint=false)', (done) => {
    hijacker.hijack((data: string) => {
      assert.include(data, '\n', 'Log should be pretty printed by default');
      done();
    });
    log.info({ message: logMessage });
  });

  it('should print one line JSON when compactPrint is true', (done) => {
    log.init({
      compactPrint: true,
      logLevel: LogLevels.DEBUG,
    });

    hijacker.hijack((data: string) => {
      // Remove any trailing newline that might come from console.log
      const output = data.replace(/\n$/, '');

      // Verify it's valid JSON and has no newlines within the content
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      assert.isTrue(output.indexOf('\n') === -1, 'Log should be compact printed (no newlines)');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
      assert.doesNotThrow(() => JSON.parse(output), 'Should be valid JSON');
      done();
    });
    log.info({ message: logMessage });
  });

  it('should respect compactPrint setting when changed via init', () => {
    // Default state
    assert.isFalse(log.compactPrint, 'compactPrint should be false by default');

    // Change setting
    log.init({ compactPrint: true });

    // Verify change
    assert.isTrue(log.compactPrint, 'compactPrint should be true after init');
  });

  it('should serialize BigInt values when supportBigInt is true', (done) => {
    // Enable BigInt support
    log.init({
      supportBigInt: true,
      logLevel: LogLevels.DEBUG,
    });

    const testBigInt = BigInt(9007199254740991); // Max safe integer

    hijacker.hijack((data: string) => {
      const json = JSON.parse(data) as LogOutput;
      assert.equal(json.bigIntValue, '9007199254740991n', 'BigInt should be serialized as string with n suffix');
      done();
    });

    log.info({ message: logMessage, bigIntValue: testBigInt });
  });

  it('should not preserve BigInt values when supportBigInt is false', (done) => {
    // Disable BigInt support
    log.init({
      supportBigInt: false,
      logLevel: LogLevels.DEBUG,
    });

    const testBigInt = BigInt(123);

    hijacker.hijack((data: string) => {
      // This should throw an error when trying to stringify a BigInt without the replacer
      assert.throws(() => JSON.parse(data) as LogOutput, Error, 'Should throw an error when BigInt is not supported');
      done();
    });

    // This would normally throw "TypeError: Do not know how to serialize a BigInt"
    // But our test will catch it via the hijacker
    try {
      log.info({ message: logMessage, bigIntValue: testBigInt });
    } catch (error) {
      // The error is expected here, let the hijacker handle it
      done();
    }
  });

  it('should respect supportBigInt setting when changed via init', () => {
    // Default state
    assert.isFalse(log.supportBigInt, 'supportBigInt should be false by default');

    // Change setting
    log.init({ supportBigInt: true });

    // Verify change
    assert.isTrue(log.supportBigInt, 'supportBigInt should be true after init');
  });
});
