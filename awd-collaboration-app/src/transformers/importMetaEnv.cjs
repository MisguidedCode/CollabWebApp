module.exports = {
  process() {
    return {
      code: `
        module.exports = {
          VITE_FIREBASE_API_KEY: 'test-api-key',
          VITE_FIREBASE_AUTH_DOMAIN: 'test-domain.firebaseapp.com',
          VITE_FIREBASE_PROJECT_ID: 'test-project',
          VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket.appspot.com',
          VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
          VITE_FIREBASE_APP_ID: 'test-app-id',
          VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement-id'
        };
      `
    };
  }
};
