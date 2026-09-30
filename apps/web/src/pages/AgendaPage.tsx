import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AgendaEntry } from "@agendai/shared";
import { api } from "../api";
import { STATUS_LABELS, formatTime, todayIn } from "../format";
import { useMe } from "../use-me";

export function AgendaPage() {
  const me = useMe();
  if (!me.data) return <p>Carregando...</p>;
  return <Agenda timeZone={me.data.tenant.timezone} />;
}

function Agenda({ timeZone }: { timeZone: string }) {
  const [date, setDate] = useState(() => todayIn(timeZone));
  const queryClient = useQueryClient();
  const staff = useQuery(["staff"], api.staff);
  const agenda = useQuery(["agenda", date], () => api.agenda(date));
  const cancel = useMutation(api.cancelBooking, {
    onSuccess: () => queryClient.invalidateQueries(["agenda"]),
  });

  return (
    <section>
      <div className="toolbar">
        <h1>Agenda do dia</h1>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Data" />
      </div>
      {cancel.isError && <p className="error">{(cancel.error as Error).message}</p>}
      {agenda.isLoading || staff.isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="columns">
          {staff.data?.map((member) => (
            <div key={member.id} className="column card">
              <h2>{member.displayName}</h2>
              <StaffAgenda
                entries={agenda.data?.filter((entry) => entry.staffMemberId === member.id) ?? []}
                timeZone={timeZone}
                cancelling={cancel.isLoading}
                onCancel={(id) => cancel.mutate(id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface StaffAgendaProps {
  entries: AgendaEntry[];
  timeZone: string;
  cancelling: boolean;
  onCancel: (id: string) => void;
}

function StaffAgenda({ entries, timeZone, cancelling, onCancel }: StaffAgendaProps) {
  if (entries.length === 0) return <p className="muted">Sem reservas.</p>;
  return (
    <ul className="entries">
      {entries.map((entry) => (
        <li key={entry.id} className={`entry ${entry.status}`}>
          <span className="time">
            {formatTime(entry.startsAt, timeZone)}–{formatTime(entry.endsAt, timeZone)}
          </span>
          <span>
            {entry.serviceName} · {entry.clientName}
          </span>
          <span className="status">{STATUS_LABELS[entry.status]}</span>
          {entry.status === "confirmed" && (
            <button type="button" className="link" disabled={cancelling} onClick={() => onCancel(entry.id)}>
              Cancelar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
