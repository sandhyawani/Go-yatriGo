import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, X } from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { showToast } from "../../utils/showToast";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";
import LocationSelectModal from "../modals/LocationSelectModal";

const normalizeString = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim();

const matchIndianStateAndCity = (rawState, rawCity) => {
  if (!rawState && !rawCity) return null;

  const states = Object.keys(INDIAN_STATES_AND_CITIES || {});
  const normRawState = normalizeString(rawState);
  const normRawCity = normalizeString(rawCity);

  let matchedState = "";

  for (const st of states) {
    const normSt = normalizeString(st);
    if (normSt === normRawState || normRawState.includes(normSt) || normSt.includes(normRawState)) {
      matchedState = st;
      break;
    }
  }

  if (!matchedState && normRawCity) {
    for (const st of states) {
      const cities = INDIAN_STATES_AND_CITIES[st] || [];
      const foundCity = cities.find((c) => {
        const normC = normalizeString(c);
        return normC === normRawCity || normRawCity.includes(normC) || normC.includes(normRawCity);
      });
      if (foundCity) {
        matchedState = st;
        return { state: matchedState, city: foundCity };
      }
    }
  }

  if (!matchedState) return null;

  const stateCities = INDIAN_STATES_AND_CITIES[matchedState] || [];
  let matchedCity = "";

  for (const c of stateCities) {
    const normC = normalizeString(c);
    if (normC === normRawCity || normRawCity.includes(normC) || normC.includes(normRawCity)) {
      matchedCity = c;
      break;
    }
  }

  return {
    state: matchedState,
    city: matchedCity || null,
  };
};

export const LocationDiscoveryWidget = ({ user }) => {
  const { updateUser } = useAuth();
  const userId = user?._id || user?.id;

  const [isDismissed, setIsDismissed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detectedState, setDetectedState] = useState("");
  const [detectedCity, setDetectedCity] = useState("");

  const hasLocation = Boolean(user?.city && user?.state);

  useEffect(() => {
    if (!userId) return;
    try {
      const dismissed = sessionStorage.getItem(`goyatrigo_location_dismissed_${userId}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
    }
  }, [userId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (userId) {
      try {
        sessionStorage.setItem(`goyatrigo_location_dismissed_${userId}`, "true");
      } catch {
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.info("Geolocation Unavailable", "Browser does not support geolocation. Please choose city manually.");
      setShowModal(true);
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let rawPlace = "";
          let rawState = "";

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
              {
                headers: { "Accept-Language": "en" },
                signal: controller.signal,
              }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const addr = data?.address || {};
              rawPlace =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.neighbourhood ||
                addr.county ||
                addr.state_district ||
                "";
              rawState = addr.state || "";
            }
          } catch (geoErr) {
            console.warn("Nominatim lookup failed or timed out:", geoErr);
          }

          if (!rawPlace && !rawState) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 6000);

              const photonRes = await fetch(
                `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
                { signal: controller.signal }
              );
              clearTimeout(timeoutId);

              if (photonRes.ok) {
                const pData = await photonRes.json();
                const props = pData?.features?.[0]?.properties || {};
                rawPlace = props.city || props.district || props.name || "";
                rawState = props.state || "";
              }
            } catch (pErr) {
              console.warn("Photon lookup failed:", pErr);
            }
          }

          const matched = matchIndianStateAndCity(rawState, rawPlace);

          if (matched && matched.state && matched.city) {
            try {
              const saveRes = await axios.patch(
                "/users/profile/location",
                { state: matched.state, city: matched.city },
                { withCredentials: true }
              );

              const updatedUser = saveRes.data?.user || { state: matched.state, city: matched.city };
              updateUser(updatedUser);

              showToast.success(
                "Location set",
                `Your location was set to ${matched.city}, ${matched.state}`
              );
              setIsLocating(false);
              return;
            } catch (saveErr) {
              console.error("Failed to save detected location:", saveErr);
            }
          }

          if (matched?.state) {
            setDetectedState(matched.state);
            showToast.info(
              "Select your city",
              `Detected ${matched.state}. Please confirm your city.`
            );
          } else {
            showToast.info(
              "Choose city manually",
              "Could not determine exact city from device. Please select below."
            );
          }

          setShowModal(true);
        } catch (err) {
          console.error("Error processing location:", err);
          showToast.info("Location selection", "Please choose your city manually.");
          setShowModal(true);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not retrieve your location. Please select manually.";
        if (error.code === 1) {
          msg = "Location permission denied. You can choose your city manually.";
        } else if (error.code === 3) {
          msg = "Location request timed out. You can choose your city manually.";
        }
        showToast.info("Location Access", msg);
        setShowModal(true);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 60000,
      }
    );
  };

  if (hasLocation) {
    return (
      <>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-text-primary shadow-2xs w-fit">
          <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="truncate">{user.city}, {user.state}</span>
          <button
            onClick={() => {
              setDetectedState(user.state);
              setDetectedCity(user.city);
              setShowModal(true);
            }}
            className="text-[11px] font-bold text-brand hover:text-brand-dark hover:underline transition-colors ml-1"
          >
            Change
          </button>
        </div>

        <LocationSelectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initialState={detectedState || user?.state}
          initialCity={detectedCity || user?.city}
        />
      </>
    );
  }

  if (isDismissed) {
    return (
      <LocationSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialState={detectedState}
        initialCity={detectedCity}
      />
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/70 via-white to-white p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-text-primary font-heading leading-snug">
              Discover travelers & trips near you
            </h4>
            <p className="text-[11px] text-text-muted font-medium mt-0.5 leading-relaxed">
              Use your location to find nearby trips, travel groups, and companions. (Optional)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-stretch sm:self-center justify-end shrink-0 pt-1 sm:pt-0">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold bg-brand hover:bg-brand-dark text-white rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Use My Location</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setDetectedState("");
              setDetectedCity("");
              setShowModal(true);
            }}
            disabled={isLocating}
            className="px-3 py-1.5 text-xs font-bold bg-surface hover:bg-slate-100 text-text-primary border border-border-default rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            Choose City
          </button>

          <button
            onClick={handleDismiss}
            disabled={isLocating}
            className="px-2 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Not Now
          </button>
        </div>
      </div>

      <LocationSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialState={detectedState}
        initialCity={detectedCity}
      />
    </>
  );
};

export default LocationDiscoveryWidget;
