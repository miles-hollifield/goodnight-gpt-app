import { API_BASE } from "@/utils/constants";
import { Message } from "@/types";
import { ChatError, ErrorType } from "@/types/errors";

let messageIdCounter = 1000; // Start higher to avoid conflicts

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000
};

async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ChatError && !error.retryable) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Retry logic failed unexpectedly');
}

export async function sendMessage(message: string): Promise<Message> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_RETRY_OPTIONS.timeout);
    
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw ChatError.fromResponse(res);
      }
      
      const data = await res.json();
      
      return {
        id: messageIdCounter++,
        sender: "ai",
        text: data.response ?? "(no response)",
        context: data.context,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ChatError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw ChatError.fromNetworkError(error);
      }
      
      throw new ChatError(
        ErrorType.UNKNOWN,
        'Unknown error occurred',
        'An unexpected error occurred. Please try again.',
        undefined,
        true
      );
    }
  }, { maxRetries: 2 }); // Fewer retries for chat messages to avoid long delays
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_BASE}/`, {
      method: "GET",
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}
