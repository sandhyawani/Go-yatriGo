import { ICONS } from "./icons";
import { ROUTES } from "./routes";

export const navItems = [
  {
    label: "Home",
    icon: ICONS.Home,
    path: ROUTES.HOME,
    tourId: "nav-home",
  },
  {
    label: "Explore",
    icon: ICONS.Compass,
    path: ROUTES.EXPLORE,
    matchPrefix: true,
    tourId: "nav-explore",
  },
  {
    label: "Search",
    icon: ICONS.Search,
    isAction: true,
    action: "openSearch",
  },
  {
    label: "Journey Hub",
    icon: ICONS.BookOpen,
    path: ROUTES.JOURNEYS,
    matchPrefix: true,
  },
  {
    label: "Chat",
    icon: ICONS.MessageSquare,
    path: ROUTES.CHAT,
    matchPrefix: true,
    tourId: "nav-chat",
  },
];

