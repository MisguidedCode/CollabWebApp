const envMock = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-domain.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
  MODE: 'test'
};

// Create proxy for import.meta.env
const processEnvProxy = new Proxy(envMock, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    return undefined;
  }
});

module.exports = processEnvProxy;
module.exports.processEnv = processEnvProxy;
module.exports.default = processEnvProxy;
