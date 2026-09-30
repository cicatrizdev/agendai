import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { formatTime, todayIn } from "../format";
import { useMe } from "../use-me";

/** Booking wizard: service → staff member → slot → client. */
export function NewBookingPage() {
  const me = useMe();
  if (!me.data) return <p>Carregando...</p>;
  return <NewBookingForm timeZone={me.data.tenant.timezone} />;
}

function NewBookingForm({ timeZone }: { timeZone: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => todayIn(timeZone));
  const [slot, setSlot] = useState("");
  const [clientId, setClientId] = useState("");

  const services = useQuery(["services"], api.services);
  const staff = useQuery(["staff"], api.staff);
  const clients = useQuery(["clients"], api.clients);
  const availability = useQuery(["availability", serviceId, staffId, date], () => api.availability(serviceId, staffId, date), {
    enabled: Boolean(serviceId && staffId && date),
  });

  const create = useMutation(api.createBooking, {
    onSuccess: () => {
      void queryClient.invalidateQueries(["agenda"]);
      navigate("/");
    },
  });

  const canSubmit = serviceId && staffId && slot && clientId && !create.isLoading;

  return (
    <section>
      <h1>Nova reserva</h1>
      <div className="card form">
        <label>
          Serviço
          <select value={serviceId} onChange={(event) => { setServiceId(event.target.value); setSlot(""); }}>
            <option value="">Escolha...</option>
            {services.data?.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </label>
        <label>
          Profissional
          <select value={staffId} onChange={(event) => { setStaffId(event.target.value); setSlot(""); }}>
            <option value="">Escolha...</option>
            {staff.data?.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data
          <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSlot(""); }} />
        </label>
        <fieldset>
          <legend>Horário</legend>
          {availability.isFetching && <p>Buscando horários...</p>}
          {availability.data?.slots.length === 0 && <p className="muted">Nenhum horário livre.</p>}
          <div className="slots">
            {availability.data?.slots.map((s) => (
              <button key={s} type="button" className={s === slot ? "slot selected" : "slot"} onClick={() => setSlot(s)}>
                {formatTime(s, timeZone)}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Cliente
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Escolha...</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {create.isError && <p className="error">{(create.error as Error).message}</p>}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => create.mutate({ serviceId, staffMemberId: staffId, clientId, startsAt: slot })}
        >
          {create.isLoading ? "Reservando..." : "Confirmar reserva"}
        </button>
      </div>
    </section>
  );
}
