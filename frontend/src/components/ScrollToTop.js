import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Manages scroll restoration and page position across all navigation scenarios:
 * 1. Internal Link/Route Navigations (PUSH / REPLACE):
 *    - Immediately resets window scroll to (0, 0) so new pages start at the very top with the header fully visible.
 *    - If an anchor hash exists (e.g. #terms, #faq), scrolls smoothly to the target element.
 * 2. History Navigation (POP - Browser Back & Forward):
 *    - Preserves natural browser scroll position restoration without forcing unexpected jumps.
 * 3. Layout Shift & Initial Load Protection:
 *    - Ensures predictable, stable viewport positioning on initial page load and component hydration.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If navigating to an anchor hash (e.g. #contact, #terms)
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId) || document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // On internal navigation (PUSH or REPLACE), always start at top (0, 0)
    // On browser back/forward (POP), allow browser history to handle position
    if (navType !== 'POP') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [pathname, hash, navType]);

  return null;
}
