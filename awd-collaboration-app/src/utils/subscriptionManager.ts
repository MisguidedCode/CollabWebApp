// A simple map to store subscription cleanup functions outside of Redux
const subscriptions: Record<string, () => void> = {};

// Register a subscription cleanup function
export const registerSubscription = (key: string, unsubscribeFn: () => void): void => {
  // Clean up any existing subscription with the same key
  unregisterSubscription(key);
  subscriptions[key] = unsubscribeFn;
};

// Unregister and execute a subscription cleanup function
export const unregisterSubscription = (key: string): void => {
  if (subscriptions[key]) {
    try {
      subscriptions[key]();
    } catch (error) {
      console.error(`Error unregistering subscription ${key}:`, error);
    }
    delete subscriptions[key];
  }
};

// Unregister all subscriptions for a specific prefix
export const unregisterSubscriptionsByPrefix = (prefix: string): void => {
  Object.keys(subscriptions).forEach(key => {
    if (key.startsWith(prefix)) {
      unregisterSubscription(key);
    }
  });
};

// Unregister all subscriptions
export const unregisterAllSubscriptions = (): void => {
  Object.keys(subscriptions).forEach(unregisterSubscription);
};