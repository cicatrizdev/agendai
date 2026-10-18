import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Button } from "../components/ui/button";
import { Input, Select } from "../components/ui/input";
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
          <Select value={serviceId} onChange={(event) => { setServiceId(event.target.value); setSlot(""); }}>
            <option value="">Escolha...</option>
            {services.data?.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </Select>
        </label>
        <label>
          Profissional
          <Select value={staffId} onChange={(event) => { setStaffId(event.target.value); setSlot(""); }}>
            <option value="">Escolha...</option>
            {staff.data?.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Data
          <Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSlot(""); }} />
        </label>
        <fieldset>
          <legend>Horário</legend>
          {availability.isFetching && <p>Buscando horários...</p>}
          {availability.data?.slots.length === 0 && <p className="muted">Nenhum horário livre.</p>}
          <div className="slots">
            {availability.data?.slots.map((s) => (
              <Button key={s} type="button" size="slot" variant={s === slot ? "default" : "outline"} aria-pressed={s === slot} onClick={() => setSlot(s)}>
                {formatTime(s, timeZone)}
              </Button>
            ))}
          </div>
        </fieldset>
        <label>
          Cliente
          <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Escolha...</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        {create.isError && <p className="error">{(create.error as Error).message}</p>}
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => create.mutate({ serviceId, staffMemberId: staffId, clientId, startsAt: slot })}
        >
          {create.isLoading ? "Reservando..." : "Confirmar reserva"}
        </Button>
      </div>
    </section>
  );
}
