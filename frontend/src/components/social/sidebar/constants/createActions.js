import { ICONS } from "./icons";
import { ROUTES } from "./routes";

export const createActions = [
  {
    label: "Discover Travel Groups",
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
    label: " Plan with Trip Mates",
    description: "Plan a private journey with your connections",
    icon: ICONS.Compass,
    isAction: true,
    action: "openCreateJourney",
  },
];
