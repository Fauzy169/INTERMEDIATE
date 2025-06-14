import CONFIG from '../config';
import { subscribePushNotification } from '../data/api';

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('ServiceWorker registration successful with scope: ', registration.scope);

      // Pastikan SW benar-benar aktif
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: CONFIG.VAPID_PUBLIC_KEY,
        });

        // Filter hanya data yang diizinkan oleh API
        const raw = subscription.toJSON();
        const safeSubscription = {
          endpoint: raw.endpoint,
          keys: {
            p256dh: raw.keys?.p256dh,
            auth: raw.keys?.auth,
          }
        };

        const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
        if (token) {
          await subscribePushNotification(safeSubscription, token);
          console.log('Push subscription sent to server');
        }
      } else {
        console.warn('Notification permission not granted');
      }

    } catch (error) {
      console.error('ServiceWorker registration or push setup failed:', error);
    }
  }
};

export const initializeServiceWorker = () => {
  if (process.env.NODE_ENV === 'production') {
    registerServiceWorker();
  }
};
