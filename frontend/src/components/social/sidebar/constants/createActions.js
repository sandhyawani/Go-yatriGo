import { ICONS } from "./icons";
import { ROUTES } from "./routes";

// Centralized create action definitions.
// All entry points (Launch Expedition drawer, desktop Create menu, Journey Hub) reference
// these same actions so navigation/modal behaviour is consistent everywhere.
export const createActions = [
  {
    label: "Group with Stranger",
    description: "Create a group trip and find new travel companions",
    icon: ICONS.Users,
    path: ROUTES.CREATE_SQUAD,
  },
  {
    label: "Travel Memory",
    description: "Capture photos and memories",
    icon: ICONS.Camera,
    isAction: true,
    action: "openCreatePost",
  },
  {
    label: "Journey with Trip Mates",
    description: "Plan a private journey with your connections",
    icon: ICONS.Compass,
    isAction: true,
    action: "openCreateJourney",
  },
];
