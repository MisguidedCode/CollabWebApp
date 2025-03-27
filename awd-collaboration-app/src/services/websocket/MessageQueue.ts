import { WebSocketMessage } from './types';

export class MessageQueue {
  private queue: WebSocketMessage[] = [];
  private processingInterval: number;
  private maxRetries: number;
  private retryTimeout: number;
  private onSend: (message: WebSocketMessage) => Promise<boolean>;
  private processing: boolean = false;
  private timerId?: NodeJS.Timeout;

  constructor(
    onSend: (message: WebSocketMessage) => Promise<boolean>,
    options: {
      processingInterval?: number;
      maxRetries?: number;
      retryTimeout?: number;
    } = {}
  ) {
    this.onSend = onSend;
    this.processingInterval = options.processingInterval || 100;
    this.maxRetries = options.maxRetries || 3;
    this.retryTimeout = options.retryTimeout || 1000;
  }

  public enqueue(message: WebSocketMessage): void {
    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    // Add message ID if not present (for deduplication)
    if (!message.id) {
      message.id = `${message.type}_${message.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add to queue
    this.queue.push(message);

    // Start processing if not already started
    this.startProcessing();
  }

  public clear(): void {
    this.queue = [];
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
    this.processing = false;
  }

  private startProcessing(): void {
    if (!this.processing && this.queue.length > 0) {
      this.processing = true;
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    const message = this.queue[0];
    
    try {
      const success = await this.onSend(message);
      
      if (success) {
        // Remove the message from the queue if sent successfully
        this.queue.shift();
        
        // Process next message after interval
        setTimeout(() => this.processQueue(), this.processingInterval);
      } else {
        // Handle retry logic
        await this.handleRetry(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      await this.handleRetry(message);
    }
  }

  private async handleRetry(message: WebSocketMessage): Promise<void> {
    // Get retry count from message or initialize it
    const retryCount = (message as any).retryCount || 0;

    if (retryCount < this.maxRetries) {
      // Increment retry count
      (message as any).retryCount = retryCount + 1;

      // Calculate exponential backoff delay
      const delay = this.retryTimeout * Math.pow(2, retryCount);

      // Schedule retry
      setTimeout(() => this.processQueue(), delay);
    } else {
      // Max retries reached, remove message from queue
      console.error(`Failed to send message after ${this.maxRetries} retries:`, message);
      this.queue.shift();
      
      // Continue with next message
      setTimeout(() => this.processQueue(), this.processingInterval);
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getPendingMessages(): WebSocketMessage[] {
    return [...this.queue];
  }

  public isProcessing(): boolean {
    return this.processing;
  }
}
