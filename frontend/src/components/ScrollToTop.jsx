// import { useEffect } from "react";
// import { useLocation } from "react-router-dom";

// const ScrollToTop = () => {
//   const { pathname } = useLocation();

//   useEffect(() => {
//     window.scrollTo({
//         top: 0,
//         left: 0,
//         behavior: "instant"
//     });
//   }, [pathname]);

//   return null;
// };

// export default ScrollToTop;


import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 *
 * Resets the window scroll position to the top on every route change.
 *
 * Place this once, directly inside <BrowserRouter> (or your router), 
 * above all <Route> definitions:
 *
 *   <BrowserRouter>
 *     <ScrollToTop />
 *     <App />
 *   </BrowserRouter>
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // 1. Take ownership of scroll restoration so the browser doesn't
    //    fight us by restoring the previous position after we reset it.
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // 2. If the URL contains a hash (e.g. /about#team), let the browser
    //    handle anchor scrolling naturally — don't override it.
    if (hash) return;

    // 3. Scroll to top. "auto" is universally supported; "instant" is not.
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;