import CONFIG from '../config';
import { subscribePushNotification } from '../data/api';
const registerServiceWorker = async () => {
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: CONFIG.VAPID_PUBLIC_KEY
  });

  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  if (token) {
    await subscribePushNotification(subscription, token);
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    } catch (error) {
      console.error('ServiceWorker registration failed: ', error);
    }
  }
};

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }
};

export const initializeServiceWorker = () => {
  if (process.env.NODE_ENV === 'production') {
    registerServiceWorker();
    requestNotificationPermission();
  }
};