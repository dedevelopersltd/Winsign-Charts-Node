/**
 * Creates a new instance of the ApiError class.
 *
 * @param {type} status - status of the instance
 * @param {type} message - message of the instance
 * @return {type}
 */

class ApiError extends Error {
  /**
   * Constructor for creating a new instance.
   *
   * @param {type} status - status of the instance
   * @param {type} message - message of the instance
   * @return {type}
   */
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message;
  }
}

module.exports = ApiError;
