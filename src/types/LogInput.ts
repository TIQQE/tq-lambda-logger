/**
 * This is what the user sends into the log functions.
 */
export interface LogInput {

  /**
   * The actual log message.
   */
  'message': string;

  /**
   * Additional properties, these will also be logged.
   */
  [x: string]: any;
}
