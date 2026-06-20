import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "../components/common/Icon";
import { PRODUCT_NAME, PRODUCT_SHORT_NAME, PRODUCT_TAGLINE } from "../config/productIdentity";

interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  end?: boolean;
}

const primaryNavigation: NavItem[] = [
  { label: "Home", to: "/", icon: "home", end: true },
  { label: "Today", to: "/today", icon: "today" },
  { label: "Week", to: "/week", icon: "week" },
  { label: "Car", to: "/car", icon: "car" },
  { label: "Prep", to: "/prep", icon: "prep" },
];

const secondaryNavigation: NavItem[] = [
  { label: "Calendar", to: "/calendar", icon: "calendar" },
  { label: "People", to: "/people", icon: "people" },
  { label: "Routines", to: "/routines", icon: "repeat" },
  { label: "Templates", to: "/templates", icon: "template" },
  { label: "Places", to: "/places", icon: "place" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

function navigationClass({ isActive }: { isActive: boolean }) {
  return isActive ? "is-active" : undefined;
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="app-frame">
      <header className="app-header">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label={`${PRODUCT_NAME} dashboard`}>
          <span className="brand__mark" aria-hidden="true">{PRODUCT_SHORT_NAME}</span>
          <span>
            <strong>{PRODUCT_NAME}</strong>
            <small>{PRODUCT_TAGLINE}</small>
          </span>
        </a>
        <button
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          className="menu-button"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Icon name="menu" />
          <span>More</span>
        </button>
      </header>

      <main className="app-content" id="main-content">
        <Outlet />
      </main>

      <nav aria-label="Primary" className="bottom-navigation">
        {primaryNavigation.map((item) => (
          <NavLink className={navigationClass} end={item.end} key={item.to} to={item.to}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {menuOpen ? (
        <div className="sheet-backdrop" onMouseDown={() => setMenuOpen(false)}>
          <section
            aria-label="More destinations"
            aria-modal="true"
            className="navigation-sheet"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="navigation-sheet__header">
              <div>
                <p className="eyebrow">Around the app</p>
                <h2>More</h2>
              </div>
              <button aria-label="Close menu" className="icon-button" onClick={() => setMenuOpen(false)} type="button">
                <Icon name="close" />
              </button>
            </div>
            <nav aria-label="Secondary" className="secondary-navigation">
              {secondaryNavigation.map((item) => (
                <NavLink className={navigationClass} key={item.to} to={item.to}>
                  <span className="secondary-navigation__icon"><Icon name={item.icon} /></span>
                  <span>{item.label}</span>
                  <Icon className="secondary-navigation__chevron" name="chevron" />
                </NavLink>
              ))}
            </nav>
          </section>
        </div>
      ) : null}
    </div>
  );
}
