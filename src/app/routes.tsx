import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { CalendarPage } from "../pages/CalendarPage";
import { CarPage } from "../pages/CarPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EventDetailPage } from "../pages/EventDetailPage";
import { EventFormPage } from "../pages/EventFormPage";
import { ExportPage } from "../pages/ExportPage";
import { ImportPage } from "../pages/ImportPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PeoplePage } from "../pages/PeoplePage";
import { PersonDetailPage } from "../pages/PersonDetailPage";
import { PlacesPage } from "../pages/PlacesPage";
import { PlaceFormPage } from "../pages/PlaceFormPage";
import { PrepPage } from "../pages/PrepPage";
import { RoutinesPage } from "../pages/RoutinesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { TodayPage } from "../pages/TodayPage";
import { WeekPage } from "../pages/WeekPage";

export const requiredRoutePaths = [
  "/",
  "/today",
  "/week",
  "/calendar",
  "/car",
  "/prep",
  "/people",
  "/people/:memberId",
  "/routines",
  "/templates",
  "/places",
  "/settings",
  "/settings/import",
  "/settings/export",
] as const;

export const trancheOneRoutePaths = [
  "/events/new",
  "/events/:eventId",
  "/events/:eventId/edit",
  "/places/new",
  "/places/:placeId/edit",
] as const;

export const router = createBrowserRouter([
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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
