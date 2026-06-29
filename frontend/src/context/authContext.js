import axios from "../api/axios";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";

const STORAGE_KEY = "user";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Older sessions may include an expiry timestamp.
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

const extractErrorMessage = (err) =>
  err?.response?.data?.message ??
  err?.message ??
  "An unexpected error occurred";

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, user: null, loading: true, error: null };

    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };

    case "LOGIN_FAILURE":
      return { ...state, user: null, loading: false, error: action.payload };

    case "LOGOUT":
      return { ...state, user: null, loading: false, error: null };

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};

export const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const initAuth = () => ({
    user: getStoredUser(),
    loading: false,
    error: null,
  });

  const [state, dispatch] = useReducer(authReducer, null, initAuth);

  useEffect(() => {
    if (state?.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.user]);

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

  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // Clear the local session even if the server is unavailable.
      console.warn(
        "[AuthContext] Server logout failed; clearing local session.",
      );
    }

    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "LOGOUT" });

  }, []);

  const updateUser = useCallback((partial) => {
    dispatch({ type: "UPDATE_USER", payload: partial });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state?.user,
        loading: state?.loading,
        error: state?.error,
        dispatch,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthContextProvider>.");
  }
  return ctx;
};
