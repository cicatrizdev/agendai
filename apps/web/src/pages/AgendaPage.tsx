import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AgendaEntry, StaffMember } from "@agendai/shared";
import { api } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { HOUR_PX, blockBox, dayWindow, formatMinuteLabel, minutesInZone, weekdayIn } from "../day-sheet";
import type { DayWindow } from "../day-sheet";
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
  const hours = useQuery(["hours"], api.businessHours);
  const agenda = useQuery(["agenda", date], () => api.agenda(date));
  const cancel = useMutation(api.cancelBooking, {
    onSuccess: () => queryClient.invalidateQueries(["agenda"]),
  });

  const loading = agenda.isLoading || staff.isLoading || hours.isLoading;
  const todaysHours = hours.data?.find((row) => row.weekday === weekdayIn(date, timeZone));
  const spans =
    agenda.data?.map((entry) => ({
      start: minutesInZone(entry.startsAt, timeZone),
      end: minutesInZone(entry.endsAt, timeZone),
    })) ?? [];
  const sheet = dayWindow(todaysHours, spans);
  const failed = agenda.isError || staff.isError || hours.isError;

  return (
    <section>
      <div className="toolbar">
        <h1>Agenda do dia</h1>
        <Input type="date" className="w-auto" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Data" />
      </div>
      {cancel.isError && <p className="error">{(cancel.error as Error).message}</p>}
      {failed ? (
        <p className="error">Não foi possível carregar a agenda.</p>
      ) : loading ? (
        <p>Carregando...</p>
      ) : sheet === null ? (
        <p className="muted">Fechado neste dia.</p>
      ) : (
        <DaySheet
          staff={staff.data ?? []}
          entries={agenda.data ?? []}
          sheet={sheet}
          timeZone={timeZone}
          cancelling={cancel.isLoading}
          onCancel={(id) => cancel.mutate(id)}
        />
      )}
    </section>
  );
}

interface DaySheetProps {
  staff: StaffMember[];
  entries: AgendaEntry[];
  sheet: DayWindow;
  timeZone: string;
  cancelling: boolean;
  onCancel: (id: string) => void;
}

function DaySheet({ staff, entries, sheet, timeZone, cancelling, onCancel }: DaySheetProps) {
  const lanePx = ((sheet.close - sheet.open) / 60) * HOUR_PX;
  const ticks: number[] = [];
  for (let minute = sheet.open; minute <= sheet.close; minute += 60) ticks.push(minute);

  return (
    <div className="sheet-scroll">
      <div
        className="day-sheet"
        style={{ gridTemplateColumns: `3.5rem repeat(${Math.max(staff.length, 1)}, minmax(12rem, 1fr))` }}
      >
        <div className="day-corner" />
        {staff.map((member) => (
          <h2 key={member.id} id={`day-${member.id}`} className="day-name">
            {member.displayName}
          </h2>
        ))}
        <div className="ruler" style={{ height: lanePx }} aria-hidden="true">
          {ticks.map((minute, index) => (
            <span key={minute} className={index === ticks.length - 1 ? "tick end" : "tick"} style={{ top: ((minute - sheet.open) / 60) * HOUR_PX }}>
              {formatMinuteLabel(minute)}
            </span>
          ))}
        </div>
        {staff.map((member) => (
          <StaffLane
            key={member.id}
            member={member}
            entries={entries.filter((entry) => entry.staffMemberId === member.id)}
            sheet={sheet}
            lanePx={lanePx}
            timeZone={timeZone}
            cancelling={cancelling}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
}

interface StaffLaneProps {
  member: StaffMember;
  entries: AgendaEntry[];
  sheet: DayWindow;
  lanePx: number;
  timeZone: string;
  cancelling: boolean;
  onCancel: (id: string) => void;
}

function StaffLane({ member, entries, sheet, lanePx, timeZone, cancelling, onCancel }: StaffLaneProps) {
  const ordered = entries.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <ul className="lane" aria-labelledby={`day-${member.id}`} style={{ height: lanePx, backgroundSize: `100% ${HOUR_PX}px` }}>
      {ordered.length === 0 && <li className="lane-empty">Sem reservas.</li>}
      {ordered.map((entry) => {
        const start = minutesInZone(entry.startsAt, timeZone);
        const end = minutesInZone(entry.endsAt, timeZone);
        const box = blockBox(start, end, sheet);
        return (
          <li
            key={entry.id}
            className={`block ${entry.status}`}
            style={{ top: box.top + 2, height: Math.max(box.height - 4, 28) }}
          >
            <span className="when">
              {formatTime(entry.startsAt, timeZone)}–{formatTime(entry.endsAt, timeZone)}
            </span>
            <span className="who">
              {entry.serviceName} · {entry.clientName}
            </span>
            <span className="status">{STATUS_LABELS[entry.status]}</span>
            {entry.status === "confirmed" && (
              <Button type="button" variant="link" disabled={cancelling} onClick={() => onCancel(entry.id)}>
                Cancelar
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
