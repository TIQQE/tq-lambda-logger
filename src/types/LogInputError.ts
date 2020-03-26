import { LogInput } from '../logger';

/**
 * This is what the user sends into the log functions.
 */
export interface LogInputError extends LogInput {

  /**
   * The call stack of the error.
   */
  'stack'?: string;
}
