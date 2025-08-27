export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
  TIMEOUT = 'TIMEOUT',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  retryable: boolean;
  timestamp: number;
}

export class ChatError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    statusCode?: number,
    retryable = false
  ) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.timestamp = Date.now();
    this.name = 'ChatError';
  }

  static fromResponse(response: Response): ChatError {
    const statusCode = response.status;
    
    switch (statusCode) {
      case 400:
        return new ChatError(
          ErrorType.BAD_REQUEST,
          `Bad request: ${response.statusText}`,
          "Your message couldn't be processed. Please try rephrasing your question.",
          statusCode,
          false
        );
      case 401:
        return new ChatError(
          ErrorType.UNAUTHORIZED,
          `Unauthorized: ${response.statusText}`,
          "Authentication failed. Please refresh the page and try again.",
          statusCode,
          false
        );
      case 429:
        return new ChatError(
          ErrorType.RATE_LIMIT,
          `Rate limit exceeded: ${response.statusText}`,
          "Too many requests. Please wait a moment before trying again.",
          statusCode,
          true
        );
      case 500:
      case 502:
      case 503:
        return new ChatError(
          ErrorType.SERVER_ERROR,
          `Server error: ${response.statusText}`,
          "Our servers are experiencing issues. We're working to fix this.",
          statusCode,
          true
        );
      case 504:
        return new ChatError(
          ErrorType.TIMEOUT,
          `Gateway timeout: ${response.statusText}`,
          "The request took too long to process. Please try again.",
          statusCode,
          true
        );
      default:
        return new ChatError(
          ErrorType.UNKNOWN,
          `Unknown error: ${response.status} ${response.statusText}`,
          "Something went wrong. Please try again.",
          statusCode,
          true
        );
    }
  }

  static fromNetworkError(error: Error): ChatError {
    if (error.name === 'AbortError') {
      return new ChatError(
        ErrorType.TIMEOUT,
        'Request was cancelled',
        'Request was cancelled. Please try again.',
        undefined,
        true
      );
    }
    
    return new ChatError(
      ErrorType.NETWORK_ERROR,
      `Network error: ${error.message}`,
      "Unable to connect to the server. Please check your internet connection.",
      undefined,
      true
    );
  }
}
