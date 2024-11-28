class AppError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;

    // Use captureStackTrace if available
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default AppError;
