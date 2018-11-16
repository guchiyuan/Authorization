const MyAppError= require('./MyAppError');
module.exports = class AppCommonError extends MyAppError {
    constructor (message,code) {
      // Providing default message and overriding status code.
      super(message, code);
      Object.setPrototypeOf(this, AppCommonError.prototype);
    }
  };