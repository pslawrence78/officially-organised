import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "today"
  | "week"
  | "car"
  | "prep"
  | "menu"
  | "people"
  | "repeat"
  | "template"
  | "place"
  | "settings"
  | "calendar"
  | "chevron"
  | "close"
  | "check"
  | "plus"
  | "edit"
  | "trash"
  | "arrowLeft"
  | "clock"
  | "school"
  | "gift";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  today: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></>,
  week: <><path d="M4 5h16v14H4zM8 3v4M16 3v4M4 9h16"/><path d="M8 13h3M13 13h3M8 16h3M13 16h3"/></>,
  car: <><path d="m5 17-1-1v-5l2-5h12l2 5v5l-1 1"/><path d="M5 11h14M7 17v2M17 17v2"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/></>,
  prep: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9l1 1 2-2M9 14l1 1 2-2M14 9h2M14 14h2"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 4.8"/></>,
  repeat: <><path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></>,
  template: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,
  place: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3M8 17h3"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
  arrowLeft: <><path d="m15 18-6-6 6-6M9 12h12"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  school: <><path d="m3 10 9-6 9 6-9 6Z"/><path d="M7 13v5c3 2 7 2 10 0v-5M21 10v6"/></>,
  gift: <><path d="M20 12v8H4v-8"/><path d="M2 7h20v5H2z"/><path d="M12 7v13"/><path d="M12 7c0-2-1.5-4-3.5-4S5 4.5 5 6c0 .6.2 1 .6 1H12Z"/><path d="M12 7c0-2 1.5-4 3.5-4S19 4.5 19 6c0 .6-.2 1-.6 1H12Z"/></>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
