import { LogInput } from './types/LogInput';
import { LogInputError } from './types/LogInputError';
import { LogLevels } from './types/logLevels';
import { LogOptions } from './types/LogOptions';
import { LogOutput } from './types/LogOutput';

/**
 * Provides methods for writing logs to in different log-levels. Logs are written in JSON format to stdout using console.log().
 */
class Logger {
  /**
   * This governs which logs will be written. If log level is
   * INFO all logs with INFO and above will be written. So: INFO
   * WARN and ERROR.
   */
  public logLevel: LogLevels = this.setInitialLogLevel();

  /**
   * The id that came from the service that called this lambda.
   * It is best practice to send this through a header called CorrelationId.
   * This allows tracking of "events" through multiple distributed services.
   */
  public correlationId: string | undefined;

  /**
   * If true (default is false), the JSON log will be printed in a compact format.
   */
  public compactPrint: boolean = false;

  /**
   * Setup the meta data that will be added to all logs.
   */
  public init(options: LogOptions) {
    this.logLevel = options.logLevel || this.logLevel;
    this.correlationId = options.correlationId || this.correlationId;
    this.compactPrint = options.compactPrint ?? this.compactPrint;
  }

  /**
   * Prints debug log.
   */
  public debug(logInput: LogInput | string) {
    this.writeLog(logInput, LogLevels.DEBUG, console.debug);
  }

  /**
   * Prints info log.
   */
  public info(logInput: LogInput | string) {
    this.writeLog(logInput, LogLevels.INFO, console.info);
  }

  /**
   * Prints warn log
   */
  public warn(logInput: LogInput | string) {
    this.writeLog(logInput, LogLevels.WARN, console.warn);
  }

  /**
   * Prints error log.
   */
  public error(logInput: LogInputError | string) {
    logInput = this.preProcessErrorProperties(logInput);
    this.writeLog(logInput, LogLevels.ERROR, console.error);
  }

  /**
   * Write log to standard out.
   * @param logInput The log data
   * @param logLevel The log level of the log that will be written.
   * @param logFunction The function that will be used to write the log. 'console.debug' | 'console.info' | 'console.warn' | 'console.error'. It defaults to 'console.log'.
   */
  private writeLog(logInput: LogInput | string, logLevel: LogLevels, logFunction: any) {
    if (typeof logInput === 'string') {
      logInput = this.stringToLogInput(logInput);
    }
    if (logLevel >= this.logLevel) {
      let log = this.createLogJson(logInput, logLevel);
      logFunction(this.compactPrint ? JSON.stringify(log) : JSON.stringify(log, null, 2));
    }
  }

  /**
   * Set initial log level from environment param LOG_LEVEL, with fallback to INFO.
   */
  private setInitialLogLevel(): LogLevels {
    try {
      if (!process.env.LOG_LEVEL) {
        return LogLevels.INFO;
      }

      let logLevel: string = process.env.LOG_LEVEL;
      const possibleLogLevel: LogLevels | undefined = (LogLevels as any)[logLevel];

      // Explicit undefined check to avoid any false negatives
      if (possibleLogLevel !== undefined) {
        return possibleLogLevel;
      } else {
        return LogLevels.INFO;
      }
    } catch (ex) {
      return LogLevels.INFO;
    }
  }

  private stringToLogInput(message: string): LogInput {
    return { message };
  }

  private createLogJson(logInput: LogInput, level: LogLevels): LogOutput {
    // @ts-ignore
    let logOutput: LogOutput = {};
    logOutput.timestamp = new Date().toISOString();
    logOutput.logLevel = LogLevels[level];
    logOutput.message = logInput.message;

    if (this.correlationId) {
      logOutput.correlationId = this.correlationId;
    }

    for (let prop of Object.keys(logInput)) {
      if (prop === 'message' || prop === 'xRequestId' || prop === 'context') {
        continue;
      }
      logOutput[prop] = logInput[prop];
    }

    return logOutput;
  }

  /**
   * If we find a property of type Error we cannot stringify it directly because it
   * will just be outputted as "{}", instead if we find an instanceof Error we add
   * the stack to a stack property.
   */
  private preProcessErrorProperties(logInput: LogInputError | string) {
    if (typeof logInput === 'string') {
      logInput = this.stringToLogInput(logInput);
    }
    for (let prop of Object.keys(logInput)) {
      if (logInput[prop] instanceof Error) {
        let ex = logInput[prop];
        logInput[prop] = {
          ...ex,
          name: ex.name,
          message: ex.message,
          stack: ex.stack ? ex.stack.split('\n') : '',
        };
      }
    }

    return logInput;
  }
}

const log = new Logger();

export { log, LogLevels, LogInput, LogOutput };
