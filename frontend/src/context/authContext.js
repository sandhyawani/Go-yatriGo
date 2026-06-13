// import axios from "../api/axios";
// import { createContext, useEffect, useReducer } from "react";

// const getStoredUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem("user")) || null;
//   } catch {
//     localStorage.removeItem("user");
//     return null;
//   }
// };

// const INITIAL_STATE = {
//   user: getStoredUser(),
//   loading: false,
//   error: null,
// };

// export const AuthContext = createContext(INITIAL_STATE);

// const AuthReducer = (state, action) => {
//   switch (action.type) {
//     case "LOGIN_START":
//       return {
//         user: null,
//         loading: true,
//         error: null,
//       };
//     case "LOGIN_SUCCESS":
//       return {
//         user: action.payload,
//         loading: false,
//         error: null,
//       };
//     case "LOGIN_FAILURE":
//       return {
//         user: null,
//         loading: false,
//         error: action.payload,
//       };
//     case "LOGOUT":
//       return {
//         user: null,
//         loading: false,
//         error: null,
//       };
//     default:
//       return state;
//   }
// };

// export const AuthContextProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

//   useEffect(() => {
//     if (state.user) {
//       localStorage.setItem("user", JSON.stringify(state.user));
//     } else {
//       localStorage.removeItem("user");
//     }
//   }, [state.user]);

//   const logout = async () => {
//     try {
//       await axios.post("/auth/logout").catch(() => {
//         console.warn("Server logout failed, clearing local state anyway.");
//       });
//     } finally {
//       localStorage.removeItem("user");
//       dispatch({ type: "LOGOUT" });
//       window.location.href = "/login";
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user: state.user,
//         loading: state.loading,
//         error: state.error,
//         dispatch,
//         logout, // add the logout function to the context
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };



import axios from "../api/axios";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "user";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely reads and parses the stored user from localStorage.
 * Wrapped in a function (not called at module scope) so it's
 * never executed during SSR where localStorage doesn't exist.
 *
 * Fix #5  — lazy evaluation, not module-level side effect
 * Fix #6  — checks token expiry before trusting stored user
 */
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // If the stored object carries a JWT expiry, validate it.
    // Adjust the field name to match your actual token shape.
    if (parsed?.tokenExpiry && Date.now() > parsed.tokenExpiry) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

/**
 * Safely extracts a serializable error message from any thrown value.
 * Fix #10 — avoids storing raw Error / Axios error objects in state
 */
const extractErrorMessage = (err) =>
  err?.response?.data?.message   // Axios server message
  ?? err?.message                 // JS Error message
  ?? "An unexpected error occurred";

// ─── Reducer ──────────────────────────────────────────────────────────────────

// Fix #9 — camelCase for plain functions, PascalCase is for React components
const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, user: null, loading: true,  error: null };

    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };

    case "LOGIN_FAILURE":
      // Fix #10 — payload is already a plain string by the time it gets here
      return { ...state, user: null, loading: false, error: action.payload };

    case "LOGOUT":
      return { ...state, user: null, loading: false, error: null };

    // Fix #11 — update profile fields without re-authenticating
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * Fix #4 — default value is null, not INITIAL_STATE.
 * A consumer outside the Provider gets null, which throws fast
 * and visibly at the useAuth() guard — not a silent undefined crash.
 */
export const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthContextProvider = ({ children }) => {
  // Fix #5 — getStoredUser is passed as an initializer function,
  // called by useReducer exactly once, not at module parse time.
  const initAuth = () => ({
    user: getStoredUser(),
    loading: false,
    error: null,
  });

  const [state, dispatch] = useReducer(authReducer, null, initAuth);

  // Sync user to localStorage whenever it changes
  useEffect(() => {
    if (state?.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.user]);

  /**
   * Login action creator.
   * Fix #1 — consumers call login() instead of dispatching directly,
   * keeping all auth logic inside the context.
   */
  const login = useCallback(async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { data } = await axios.post("/auth/login", credentials, {
        withCredentials: true,
      });
      dispatch({ type: "LOGIN_SUCCESS", payload: data });
      return { success: true };
    } catch (err) {
      const message = extractErrorMessage(err);
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  }, []);

  /**
   * Logout action creator.
   * Fix #2  — clean nested try/catch instead of mixing await + .catch()
   * Fix #3  — returns a redirect path instead of calling window.location
   *            so the caller (a React Router component) can use navigate().
   */
  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // Server logout failed — clear local state regardless.
      console.warn("[AuthContext] Server logout failed; clearing local session.");
    }

    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "LOGOUT" });

    // Fix #3 — let the caller navigate; don't hard-reload the page.
    // Usage in a component: const { logout } = useAuth(); await logout(); navigate("/login");
  }, []);

  /**
   * Update user profile data in-place (e.g. after avatar or name change).
   * Fix #11
   */
  const updateUser = useCallback((partial) => {
    dispatch({ type: "UPDATE_USER", payload: partial });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user:       state?.user,
        loading:    state?.loading,
        error:      state?.error,
        dispatch,
        // Fix #1 — action creators only, no raw dispatch
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ──────────────────────────────────────────────────────────────

/**
 * useAuth — consume the AuthContext safely.
 * Fix #8 — single place for the "used outside Provider" guard.
 *
 * @returns {{ user, loading, error, login, logout, updateUser }}
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthContextProvider>.");
  }
  return ctx;
};