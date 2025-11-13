import { useEffect, useRef } from 'react';

const ApplyBlurWithMessage = () => {
  // Add blur class for visual disruption
  document.documentElement.classList.add('screenshot-detected');
  
  // Create popup
  const messageContainer = document.createElement('div');
  messageContainer.id = 'screenshot-message';
  messageContainer.setAttribute('role', 'alert'); // Accessibility
  messageContainer.setAttribute('aria-label', 'Screenshot detected - refresh to continue');
  messageContainer.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; color: black; padding: 20px; border-radius: 8px; z-index: 10000;
    text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 400px;
  `;
  messageContainer.innerHTML = `
    <p>This content is protected. Screenshots are not allowed for security. Refresh to continue.</p>
    <button id="refresh-btn" style="
      background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 5px;
      cursor: pointer; font-size: 16px; width: 100%; margin-top: 10px;
    " onclick="document.getElementById('refresh-btn').closest('#screenshot-message').remove(); document.documentElement.classList.remove('screenshot-detected'); window.location.reload();">
      Refresh Page
    </button>
  `;
  document.body.appendChild(messageContainer);
  
  // Auto-remove after 10s if not interacted
  setTimeout(() => {
    if (messageContainer.parentNode) {
      messageContainer.remove();
      document.documentElement.classList.remove('screenshot-detected');
    }
  }, 10000);
};

export const useScreenshotDetector = () => {
  const isDetectedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handlePotentialScreenshot = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        if (!isDetectedRef.current) {
          isDetectedRef.current = true;
          ApplyBlurWithMessage();
        }
      }, 300); // Debounce: Ignore rapid events
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handlePotentialScreenshot();
      }
    };

    const handleBlur = () => handlePotentialScreenshot();

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};