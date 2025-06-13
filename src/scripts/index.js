// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { initializeServiceWorker } from './utils/sw-register';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize service worker
  initializeServiceWorker();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    authButtons: document.querySelector('#auth-buttons'),
  });

  // Custom transition function using Animation API
  async function transitionToPage(callback) {
    // Get the current content element
    const currentContent = document.querySelector('#main-content');
    
    // Create animation for fade out
    const fadeOut = currentContent.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(20px)' }
      ],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    await fadeOut.finished;
    
    // Execute the page change
    await callback();
    
    // Get the new content element
    const newContent = document.querySelector('#main-content');
    newContent.style.opacity = '0';
    newContent.style.transform = 'translateY(-20px)';
    
    // Create animation for fade in
    const fadeIn = newContent.animate(
      [
        { opacity: 0, transform: 'translateY(-20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    await fadeIn.finished;
  }

  // Initial render with transition
  await transitionToPage(async () => {
    await app.renderPage();
  });

  // Handle hash changes with transitions
  window.addEventListener('hashchange', async () => {
    await transitionToPage(async () => {
      await app.renderPage();
    });
  });
});