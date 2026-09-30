import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../src/components/StatusBadge";
import { approvals, runs } from "../src/data/static";
import { ApprovalsPage } from "../src/pages/ApprovalsPage";
import { RunsPage } from "../src/pages/RunsPage";

describe("StatusBadge", () => {
  it("never relies on color alone: shows an icon and a label", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("✕")).toBeInTheDocument();
    expect(screen.getByText(/Falha/)).toBeInTheDocument();
  });
});

describe("RunsPage", () => {
  it("filters runs by family", async () => {
    render(
      <MemoryRouter>
        <RunsPage runs={runs} />
      </MemoryRouter>,
    );
    await userEvent.selectOptions(screen.getByLabelText("Família"), "bug");

    const rows = within(screen.getAllByRole("rowgroup")[1]!).getAllByRole("row");
    expect(rows).toHaveLength(runs.filter((r) => r.family === "bug").length);
  });
});

describe("ApprovalsPage", () => {
  it("does not let a developer approve a high-risk action", () => {
    render(<ApprovalsPage initialApprovals={approvals} operator={{ email: "dev@autofix.test", role: "developer" }} />);
    const highRisk = screen.getByText(/corrigir policy/).closest("li")!;
    expect(within(highRisk).getByRole("button", { name: "✓ Aprovar" })).toBeDisabled();
  });

  it("moves an approved request to the decided list", async () => {
    render(<ApprovalsPage initialApprovals={approvals} operator={{ email: "lead@autofix.test", role: "tech_lead" }} />);
    const highRisk = screen.getByText(/corrigir policy/).closest("li")!;
    await userEvent.click(within(highRisk).getByRole("button", { name: "✓ Aprovar" }));

    const decided = screen.getByRole("heading", { name: "Decididas" }).nextElementSibling as HTMLElement;
    expect(within(decided).getByText(/corrigir policy/).closest("li")).toHaveTextContent("✓ Aprovada por lead@autofix.test");
  });
});
