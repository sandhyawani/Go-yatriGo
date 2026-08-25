import axios, { AUTH_UNAUTHORIZED_EVENT } from "../api/axios";
import {
createContext,
useContext,
useEffect,
useReducer,
useCallback } from
"react";

const STORAGE_KEY = "user";
const AUTH_LOGOUT_EVENT = "auth:logout";

const normalizeEmail = (email) =>
typeof email === "string" ? email.trim().toLowerCase() : "";

const stripSensitiveFields = (user) => {
  const sanitized = { ...(user || {}) };
  delete sanitized.password;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpire;
  return sanitized;
};

const normalizeAuthPayload = (data, fallbackToken) => {
  const details = stripSensitiveFields(data?.details || data?.user || data || {});
  const token = data?.token || details.token || fallbackToken || null;
  const tokenExpiry =
  data?.tokenExpiresAt ||
  details.tokenExpiresAt ||
  details.tokenExpiry ||
  null;

  return stripSensitiveFields({
    ...details,
    isAdmin: data?.isAdmin ?? details.isAdmin,
    token,
    tokenExpiry
  });
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = stripSensitiveFields(JSON.parse(raw));

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

const extractErrorMessage = (err) => {
  if (!err.response) {
    return "Server unavailable. Please check your connection and try again.";
  }

  return err.response.data?.message || "Authentication failed. Please try again.";
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_RESTORE_SUCCESS":
      return {
        ...state,
        user: stripSensitiveFields(action.payload),
        loading: false,
        initialized: true,
        error: null
      };

    case "AUTH_RESTORE_FAILURE":
      return {
        ...state,
        user: null,
        loading: false,
        initialized: true,
        error: null
      };

    case "LOGIN_START":
      return { ...state, user: null, loading: true, error: null };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: stripSensitiveFields(action.payload),
        loading: false,
        initialized: true,
        error: null
      };

    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        loading: false,
        initialized: true,
        error: action.payload
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        loading: false,
        initialized: true,
        error: null
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ?
        stripSensitiveFields({ ...state.user, ...action.payload }) :
        null
      };

    default:
      return state;
  }
};

export const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    initialized: false,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    const restoreUser = async () => {
      const storedUser = getStoredUser();

      try {
        const { data } = await axios.get("/auth/me", {
          withCredentials: true,
          skipAuthRedirect: true
        });

        if (cancelled) return;

        dispatch({
          type: "AUTH_RESTORE_SUCCESS",
          payload: normalizeAuthPayload(data, storedUser?.token)
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (!cancelled) {
          dispatch({ type: "AUTH_RESTORE_FAILURE" });
        }
      }
    };

    restoreUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.initialized) return;

    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripSensitiveFields(state.user)));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.initialized, state.user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch({ type: "LOGOUT" });
    };

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue === null) {
        dispatch({ type: "LOGOUT" });
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleUnauthorized);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { data } = await axios.post(
      "/auth/login",
      {
        ...credentials,
        email: normalizeEmail(credentials?.email)
      },
      { withCredentials: true }
      );

      const authenticatedUser = normalizeAuthPayload(data);
      dispatch({ type: "LOGIN_SUCCESS", payload: authenticatedUser });
      return { success: true, user: authenticatedUser };
    } catch (err) {
      const message = extractErrorMessage(err);
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    const storedUser = getStoredUser();

    try {
      await axios.post("/auth/logout", {}, {
        withCredentials: true,
        skipAuthRedirect: true,
        headers: storedUser?.token ?
        { Authorization: `Bearer ${storedUser.token}` } :
        undefined
      });
    } catch {
      console.warn(
      "[AuthContext] Server logout failed; clearing local session."
      );
    }

    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "LOGOUT" });
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  }, []);

  const updateUser = useCallback((partial) => {
    dispatch({ type: "UPDATE_USER", payload: stripSensitiveFields(partial) });
  }, []);

  return (
    <AuthContext.Provider
    value={{
      user: state.user,
      loading: state.loading,
      initialized: state.initialized,
      isAuthenticated: Boolean(state.user),
      error: state.error,
      dispatch,
      login,
      logout,
      updateUser
    }}>

      {children}
    </AuthContext.Provider>);

};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthContextProvider>.");
  }
  return ctx;
};
