export interface LogOutput {
  /**
   * The log level
   */
  logLevel: string;

  /**
   * The id that came from the service that called this lambda.
   * It is best practice to send this through a header called CorrelationId.
   * This allows tracking of "events" through multiple distributed services.
   */
  correlationId: string | undefined;

  /**
   * The time this was logged in ISO8601 format.
   */
  timestamp: string;

  /**
   * The actual log message, please make this a non
   */
  message: string;

  // Other extra properties
  [x: string]: any;
}
