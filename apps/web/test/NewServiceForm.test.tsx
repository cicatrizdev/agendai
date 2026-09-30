import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/api";
import { NewServiceForm } from "../src/pages/ServicesPage";
import { renderWithQueryClient } from "./render";

vi.mock("../src/api", () => ({ api: { createService: vi.fn() } }));

describe("NewServiceForm", () => {
  beforeEach(() => {
    vi.mocked(api.createService).mockReset();
  });

  it("shows the validation message when the name is missing", async () => {
    renderWithQueryClient(<NewServiceForm />);
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("name: Informe o nome do serviço");
    expect(api.createService).not.toHaveBeenCalled();
  });

  it("sends the price in cents", async () => {
    vi.mocked(api.createService).mockResolvedValue({
      id: "d0000000-0000-0000-0000-000000000009",
      tenantId: "b0000000-0000-0000-0000-000000000001",
      name: "Hidratação",
      durationMinutes: 30,
      priceCents: 4550,
      active: true,
    });
    renderWithQueryClient(<NewServiceForm />);

    await userEvent.type(screen.getByLabelText("Nome"), "Hidratação");
    await userEvent.clear(screen.getByLabelText("Preço"));
    await userEvent.type(screen.getByLabelText("Preço"), "45.50");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(vi.mocked(api.createService).mock.calls[0]?.[0]).toEqual({ name: "Hidratação", durationMinutes: 30, priceCents: 4550 });
  });
});
