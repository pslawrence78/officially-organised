import { createBrowserRouter, Outlet, type RouteObject } from "react-router-dom";
import { AppShell } from "./AppShell";
import { CalendarPage } from "../pages/CalendarPage";
import { CarPage } from "../pages/CarPage";
import { CelebrationsPage } from "../pages/CelebrationsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EventDetailPage } from "../pages/EventDetailPage";
import { EventFormPage } from "../pages/EventFormPage";
import { ExportPage } from "../pages/ExportPage";
import { BetaReadinessPage } from "../pages/BetaReadinessPage";
import { HubPage } from "../pages/HubPage";
import { HubWallboardPage } from "../pages/HubWallboardPage";
import { HouseholdAdminPage } from "../pages/HouseholdAdminPage";
import { ImportPage } from "../pages/ImportPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PeoplePage } from "../pages/PeoplePage";
import { PersonDetailPage } from "../pages/PersonDetailPage";
import { PlacesPage } from "../pages/PlacesPage";
import { PlaceFormPage } from "../pages/PlaceFormPage";
import { PrepPage } from "../pages/PrepPage";
import { RoutinesPage } from "../pages/RoutinesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SyncConflictsPage } from "../pages/SyncConflictsPage";
import { SchoolCalendarPage } from "../pages/SchoolCalendarPage";
import { SchoolHalfTermPage } from "../pages/SchoolHalfTermPage";
import { SchoolPage } from "../pages/SchoolPage";
import { CountdownsPage } from "../pages/CountdownsPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { TodayPage } from "../pages/TodayPage";
import { WeekPage } from "../pages/WeekPage";

export const requiredRoutePaths = [
  "/",
  "/today",
  "/week",
  "/hub",
  "/hub/wallboard",
  "/calendar",
  "/car",
  "/prep",
  "/school",
  "/celebrations",
  "/household-admin",
  "/people",
  "/people/:memberId",
  "/routines",
  "/templates",
  "/places",
  "/settings",
  "/settings/import",
  "/settings/export",
  "/settings/sync",
  "/settings/beta-readiness",
  "/settings/school-calendar",
  "/settings/school-half-terms",
  "/settings/countdowns",
] as const;

export const trancheOneRoutePaths = [
  "/events/new",
  "/events/:eventId",
  "/events/:eventId/edit",
  "/places/new",
  "/places/:placeId/edit",
] as const;

export function normalizeRouterBasename(baseUrl: string) {
  const pathname = new URL(baseUrl, "https://app.local").pathname;
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

export const routerBasename = normalizeRouterBasename(import.meta.env.BASE_URL);

export const appRoutes: RouteObject[] = [
  {
    path: "/hub",
    element: <Outlet />,
    children: [
      { index: true, element: <HubPage /> },
      { path: "wallboard", element: <HubWallboardPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "today", element: <TodayPage /> },
      { path: "week", element: <WeekPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "car", element: <CarPage /> },
      { path: "prep", element: <PrepPage /> },
      { path: "school", element: <SchoolPage /> },
      { path: "celebrations", element: <CelebrationsPage /> },
      { path: "household-admin", element: <HouseholdAdminPage /> },
      { path: "events/new", element: <EventFormPage /> },
      { path: "events/:eventId", element: <EventDetailPage /> },
      { path: "events/:eventId/edit", element: <EventFormPage /> },
      { path: "people", element: <PeoplePage /> },
      { path: "people/:memberId", element: <PersonDetailPage /> },
      { path: "routines", element: <RoutinesPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "places", element: <PlacesPage /> },
      { path: "places/new", element: <PlaceFormPage /> },
      { path: "places/:placeId/edit", element: <PlaceFormPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/import", element: <ImportPage /> },
      { path: "settings/export", element: <ExportPage /> },
      { path: "settings/sync", element: <SyncConflictsPage /> },
      { path: "settings/beta-readiness", element: <BetaReadinessPage /> },
      { path: "settings/school-calendar", element: <SchoolCalendarPage /> },
      { path: "settings/school-half-terms", element: <SchoolHalfTermPage /> },
      { path: "settings/countdowns", element: <CountdownsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes, { basename: routerBasename });
