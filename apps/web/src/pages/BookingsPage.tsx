import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api";
import { Button } from "../components/ui/button";
import { STATUS_LABELS, formatDateTime } from "../format";
import { useMe } from "../use-me";

const PAGE_SIZE = 10;

export function BookingsPage() {
  const me = useMe();
  // Cursors of the pages already visited, so "Anterior" can go back.
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const cursor = cursors.at(-1) ?? null;
  const page = useQuery(["bookings", cursor], () => api.bookings(cursor, PAGE_SIZE), { keepPreviousData: true });
  const timeZone = me.data?.tenant.timezone ?? "UTC";

  return (
    <section>
      <h1>Reservas</h1>
      {page.isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="hscroll">
        <table className="card">
          <thead>
            <tr>
              <th>Início</th>
              <th>Status</th>
              <th>Código</th>
            </tr>
          </thead>
          <tbody>
            {page.data?.items.map((booking) => (
              <tr key={booking.id}>
                <td>{formatDateTime(booking.startsAt, timeZone)}</td>
                <td>{STATUS_LABELS[booking.status]}</td>
                <td className="muted">{booking.id.slice(-6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <div className="pager">
        <Button type="button" disabled={cursors.length === 1} onClick={() => setCursors(cursors.slice(0, -1))}>
          Anterior
        </Button>
        <span>Página {cursors.length}</span>
        <Button
          type="button"
          disabled={!page.data?.nextCursor || page.isPreviousData}
          onClick={() => setCursors([...cursors, page.data?.nextCursor ?? null])}
        >
          Próxima
        </Button>
      </div>
    </section>
  );
}
