import { createBrowserRouter, redirect, type RouteObject } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AgendaPage } from "./pages/AgendaPage";
import { BookingsPage } from "./pages/BookingsPage";
import { LoginPage, loginAction } from "./pages/LoginPage";
import { NewBookingPage } from "./pages/NewBookingPage";
import { ServicesPage } from "./pages/ServicesPage";
import { getAccessToken } from "./supabase";

async function requireSession() {
  const token = await getAccessToken();
  return token ? null : redirect("/login");
}

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage />, action: loginAction },
  {
    path: "/",
    element: <Layout />,
    loader: requireSession,
    children: [
      { index: true, element: <AgendaPage /> },
      { path: "bookings", element: <BookingsPage /> },
      { path: "bookings/new", element: <NewBookingPage /> },
      { path: "services", element: <ServicesPage /> },
    ],
  },
];

/** Opts into the v7 behaviours early so the console stays quiet. */
export const routerFuture = {
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_relativeSplatPath: true,
  v7_skipActionErrorRevalidation: true,
} as const;

export function createRouter() {
  return createBrowserRouter(routes, { future: routerFuture });
}
