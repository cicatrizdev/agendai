import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { routerFuture, routes } from "../src/router";
import { getAccessToken, supabase } from "../src/supabase";

vi.mock("../src/supabase", () => ({
  getAccessToken: vi.fn(),
  supabase: { auth: { signInWithPassword: vi.fn(), signOut: vi.fn() } },
}));

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFuture });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryClientProvider>,
  );
  return router;
}

describe("routes", () => {
  it("sends visitors without a session to the login page", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);
    const router = renderAt("/bookings");

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("shows an error when the login fails", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("invalid") as never,
    } as never);
    renderAt("/login");

    screen.getByRole("button", { name: "Entrar" }).click();

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
  });
});
