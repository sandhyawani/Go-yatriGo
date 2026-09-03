import React, { createContext, useContext, useState, useEffect } from "react";

const REGISTRATION_SESSION_KEY = "goyatrigo_register_draft";

const defaultFormData = {
  name: "",
  email: "",
  mobile: "",
  state: "",
  city: "",
  govIdType: "",
  acceptedPolicies: false,
  password: "",
  repeatPassword: "",
};

const RegistrationContext = createContext(null);

export const RegistrationProvider = ({ children }) => {
  const [formData, setFormDataState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(REGISTRATION_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFormData, ...parsed, password: "", repeatPassword: "" };
      }
    } catch (e) {
      // ignore JSON parse errors
    }
    return defaultFormData;
  });

  const setFormData = (updater) => {
    setFormDataState((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      const merged = { ...prev, ...updated };

      // Persist non-sensitive fields to sessionStorage
      try {
        const { password, repeatPassword, ...safeFields } = merged;
        sessionStorage.setItem(REGISTRATION_SESSION_KEY, JSON.stringify(safeFields));
      } catch (e) {
        // ignore storage errors
      }

      return merged;
    });
  };

  const clearRegistrationDraft = () => {
    setFormDataState(defaultFormData);
    try {
      sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <RegistrationContext.Provider
      value={{
        formData,
        setFormData,
        clearRegistrationDraft,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationDraft = () => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error("useRegistrationDraft must be used within a RegistrationProvider");
  }
  return ctx;
};

export default RegistrationContext;
