import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, Check } from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { showToast } from "../../utils/showToast";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";

export const LocationSelectModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialState = "",
  initialCity = ""
}) => {
  const { updateUser } = useAuth();
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const states = Object.keys(INDIAN_STATES_AND_CITIES || {});
  const cities = selectedState ? INDIAN_STATES_AND_CITIES[selectedState] || [] : [];

  useEffect(() => {
    if (isOpen) {
      setSelectedState(initialState || "");
      setSelectedCity(initialCity || "");
      setError("");
    }
  }, [isOpen, initialState, initialCity]);

  if (!isOpen) return null;

  const handleStateChange = (e) => {
    const nextState = e.target.value;
    setSelectedState(nextState);
    setSelectedCity("");
    if (error) setError("");
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    if (error) setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedState) {
      setError("Please select a state.");
      return;
    }
    if (!selectedCity) {
      setError("Please select a city.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await axios.patch(
        "/users/profile/location",
        { state: selectedState, city: selectedCity },
        { withCredentials: true }
      );

      const updatedUser = response.data?.user || { state: selectedState, city: selectedCity };
      updateUser(updatedUser);

      showToast.success(
        "Location updated",
        `Location set to ${selectedCity}, ${selectedState}`
      );

      if (onSuccess) {
        onSuccess(updatedUser);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update location.";
      setError(msg);
      showToast.error("Update failed", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSaving && onClose()}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[1.75rem] sm:rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-heading">
                  Choose Location
                </h3>
                <p className="text-[11px] text-text-muted">
                  Discover travelers and journeys in your area
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="modal-state-select" className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                State
              </label>
              <div className="relative">
                <select
                  id="modal-state-select"
                  value={selectedState}
                  onChange={handleStateChange}
                  disabled={isSaving}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-text-primary font-bold text-sm outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
                >
                  <option value="">Select State</option>
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-city-select" className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                City
              </label>
              <div className="relative">
                <select
                  id="modal-city-select"
                  value={selectedCity}
                  onChange={handleCityChange}
                  disabled={!selectedState || isSaving}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-text-primary font-bold text-sm outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedState ? "Select City" : "Select State first"}
                  </option>
                  {cities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-text-muted font-medium">
              Your location is optional and can be updated anytime from your profile.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !selectedState || !selectedCity}
                className="px-5 py-2 text-xs font-bold bg-brand hover:bg-brand-dark text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Location</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default LocationSelectModal;
