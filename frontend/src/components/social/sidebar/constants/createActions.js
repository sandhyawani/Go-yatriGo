import { ICONS } from "./icons";
import { ROUTES } from "./routes";

export const createActions = [
  {
    label: "Start Journey",
    description: "Create a solo or group expedition",
    icon: ICONS.Compass,
    path: ROUTES.JOURNEYS,
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
  }
];
