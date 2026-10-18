import { useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useMe } from "../use-me";
import { Button } from "./ui/button";

export function Layout() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function logout() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="layout">
      <header className="topbar">
        <strong>Agendaí</strong>
        <span className="tenant">{me.data?.tenant.name}</span>
        <nav>
          <NavLink to="/" end>
            Agenda
          </NavLink>
          <NavLink to="/bookings/new">Nova reserva</NavLink>
          <NavLink to="/bookings" end>
            Reservas
          </NavLink>
          <NavLink to="/services">Serviços</NavLink>
        </nav>
        <Button type="button" variant="quiet" onClick={logout}>
          Sair
        </Button>
      </header>
      <main>
        {me.isError ? <p className="error">Não foi possível carregar sua conta.</p> : <Outlet />}
      </main>
    </div>
  );
}
