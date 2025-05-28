import { bigIntReplacer } from './bigIntReplacer';
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
   *
   * The logger will look for `process.env.LOG_LEVEL` and use that
   * if it is set. If not, it will use the default of INFO.
   * @default INFO
   */
  public logLevel: LogLevels = this.setInitialLogLevel();

  /**
   * The id that came from the service that called this lambda.
   * It is best practice to send this through a header called CorrelationId.
   * This allows tracking of "events" through multiple distributed services.
   * @default undefined
   */
  public correlationId: string | undefined;

  /**
   * If true, the JSON log will be printed in a compact format.
   * @default false
   */
  public compactPrint: boolean = false;

  /**
   * If true, BigInt values will be serialized as a string + "n". Example BigInt(123) -> "123n"
   * @default false
   */
  public supportBigInt: boolean = false;

  /**
   * Setup the meta data that will be added to all logs.
   * Calling init with no/missing options will reset the
   * logger options to their initial state.
   */
  public init(options: LogOptions) {
    this.logLevel = options.logLevel ?? this.logLevel;
    this.correlationId = options.correlationId ?? undefined;
    this.compactPrint = options.compactPrint ?? false;
    this.supportBigInt = options.supportBigInt ?? false;
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
  private writeLog(logInput: LogInput | string, logLevel: LogLevels, logFunction: (...args: any[]) => void) {
    if (typeof logInput === 'string') {
      logInput = this.stringToLogInput(logInput);
    }
    if (logLevel >= this.logLevel) {
      const log = this.createLogJson(logInput, logLevel);
      // Call the appropriate console logging function with the serialized log object
      // When supportBigInt is true, bigIntReplacer is used to properly serialize BigInt values
      // When compactPrint is true, the JSON is output without indentation, otherwise with 2-space indentation
      logFunction(
        this.compactPrint
          ? JSON.stringify(log, this.supportBigInt ? bigIntReplacer : undefined)
          : JSON.stringify(log, this.supportBigInt ? bigIntReplacer : undefined, 2)
      );
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

      const logLevel: string = process.env.LOG_LEVEL;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
    const logOutput: LogOutput = {
      timestamp: new Date().toISOString(),
      logLevel: LogLevels[level],
      message: logInput.message,
      correlationId: undefined,
    };

    if (this.correlationId) {
      logOutput.correlationId = this.correlationId;
    }

    for (const prop of Object.keys(logInput)) {
      if (prop === 'message' || prop === 'xRequestId' || prop === 'context') {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    for (const prop of Object.keys(logInput)) {
      if (logInput[prop] instanceof Error) {
        const ex = logInput[prop];
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

export { log, LogInput, LogLevels, LogOutput };
