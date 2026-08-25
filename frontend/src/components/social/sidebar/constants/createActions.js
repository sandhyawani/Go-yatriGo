import { ICONS } from "./icons";
import { ROUTES } from "./routes";

// Centralized create action definitions.
// All entry points (Launch Expedition drawer, desktop Create menu, Journey Hub) reference
// these same actions so navigation/modal behaviour is consistent everywhere.
export const createActions = [
  {
    label: "Start Journey",
    description: "Create a solo or group expedition",
    icon: ICONS.Compass,
    isAction: true,
    action: "openCreateJourney",
  },
  {
    label: "Travel Memory",
    description: "Capture photos and memories",
    icon: ICONS.Camera,
    isAction: true,
    action: "openCreatePost",
  },
  {
    label: "Travel Squad",
    description: "Create a travel group",
    icon: ICONS.Users,
    path: ROUTES.CREATE_SQUAD,
  },
];
