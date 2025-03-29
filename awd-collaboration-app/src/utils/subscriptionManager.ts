interface Subscription {
  cleanup: () => void;
  componentId: string;
  type: string;
  createdAt: number;
}

class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private static instance: SubscriptionManager;

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  registerSubscription(key: string, cleanup: () => void, componentId: string, type: string): void {
    // Clean up any existing subscription with the same key
    this.unregisterSubscription(key);
    
    // Add new subscription
    this.subscriptions.set(key, {
      cleanup,
      componentId,
      type,
      createdAt: Date.now()
    });

    // Log registration in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[SubscriptionManager] Registered ${type} subscription for ${componentId} (${key})`);
    }
  }

  unregisterSubscription(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      try {
        subscription.cleanup();
        this.subscriptions.delete(key);
        
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[SubscriptionManager] Unregistered ${subscription.type} subscription for ${subscription.componentId} (${key})`);
        }
      } catch (error) {
        console.error(`[SubscriptionManager] Error unregistering subscription ${key}:`, error);
      }
    }
  }

  unregisterSubscriptionsByPrefix(prefix: string): void {
    Array.from(this.subscriptions.keys()).forEach(key => {
      if (key.startsWith(prefix)) {
        this.unregisterSubscription(key);
      }
    });
  }

  unregisterSubscriptionsByComponent(componentId: string): void {
    Array.from(this.subscriptions.entries())
      .filter(([_, subscription]) => subscription.componentId === componentId)
      .forEach(([key]) => this.unregisterSubscription(key));
  }

  unregisterAllSubscriptions(): void {
    Array.from(this.subscriptions.keys()).forEach(key => 
      this.unregisterSubscription(key)
    );
  }

  getSubscriptionInfo(): { [key: string]: { componentId: string; type: string; age: number } } {
    const now = Date.now();
    const info: { [key: string]: { componentId: string; type: string; age: number } } = {};
    
    this.subscriptions.forEach((subscription, key) => {
      info[key] = {
        componentId: subscription.componentId,
        type: subscription.type,
        age: Math.round((now - subscription.createdAt) / 1000) // Age in seconds
      };
    });
    
    return info;
  }
}

const subscriptionManager = SubscriptionManager.getInstance();

export const registerSubscription = (
  key: string,
  cleanup: () => void,
  componentId: string,
  type: string
): void => {
  subscriptionManager.registerSubscription(key, cleanup, componentId, type);
};

export const unregisterSubscription = (key: string): void => {
  subscriptionManager.unregisterSubscription(key);
};

export const unregisterSubscriptionsByPrefix = (prefix: string): void => {
  subscriptionManager.unregisterSubscriptionsByPrefix(prefix);
};

export const unregisterSubscriptionsByComponent = (componentId: string): void => {
  subscriptionManager.unregisterSubscriptionsByComponent(componentId);
};

export const unregisterAllSubscriptions = (): void => {
  subscriptionManager.unregisterAllSubscriptions();
};

export const getSubscriptionInfo = () => {
  return subscriptionManager.getSubscriptionInfo();
};
