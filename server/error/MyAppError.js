class MyAppError extends Error {
  constructor (message, code) {
    super(message);
    this.name = this.constructor.name;
    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
    this.code = code;
    Object.setPrototypeOf(this, MyAppError.prototype);
  }
};

module.exports = MyAppError;