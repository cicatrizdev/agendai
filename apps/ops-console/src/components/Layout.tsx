import { NavLink, Outlet } from "react-router-dom";
import { currentOperator } from "../data/static";

const LINKS = [
  { to: "/", label: "Execuções", end: true },
  { to: "/approvals", label: "Aprovações" },
  { to: "/scoreboard", label: "Placar" },
  { to: "/errors", label: "Análise de erros" },
  { to: "/costs", label: "Custos" },
];

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <strong className="brand">AutoFix Agent Ops</strong>
        <nav>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="operator">
          {currentOperator.email}
          <br />
          <span className="muted">{currentOperator.role === "tech_lead" ? "Tech lead" : "Developer"}</span>
        </p>
      </aside>
      <main>
        <p className="notice" role="note">
          Dados de exemplo (estáticos). O curso liga estas telas ao Supabase a partir da Aula 4.
        </p>
        <Outlet />
      </main>
    </div>
  );
}
