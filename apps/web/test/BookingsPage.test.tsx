import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/api";
import { BookingsPage } from "../src/pages/BookingsPage";
import { booking, ownerMe } from "./fixtures";
import { renderWithQueryClient } from "./render";

vi.mock("../src/api", () => ({ api: { me: vi.fn(), bookings: vi.fn() } }));

describe("BookingsPage", () => {
  beforeEach(() => {
    vi.mocked(api.me).mockResolvedValue(ownerMe);
    vi.mocked(api.bookings).mockImplementation(async (cursor) =>
      cursor === null
        ? { items: [booking(1, "2026-03-02T13:00:00Z")], nextCursor: "cursor-2" }
        : { items: [booking(2, "2026-03-03T13:00:00Z")], nextCursor: null },
    );
  });

  it("loads the next page with the cursor returned by the API", async () => {
    renderWithQueryClient(<BookingsPage />);
    expect(await screen.findByText("000001")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Página 2")).toBeInTheDocument();
    expect(await screen.findByText("000002")).toBeInTheDocument();
    expect(api.bookings).toHaveBeenLastCalledWith("cursor-2", 10);
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("goes back to the previous page", async () => {
    renderWithQueryClient(<BookingsPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await screen.findByText("Página 2");

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));

    expect(await screen.findByText("Página 1")).toBeInTheDocument();
    expect(await screen.findByText("000001")).toBeInTheDocument();
  });
});
