import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createServiceInput, describeZodError } from "@agendai/shared";
import { api } from "../api";
import { formatPrice } from "../format";
import { useMe } from "../use-me";

export function ServicesPage() {
  const me = useMe();
  const services = useQuery(["services"], api.services);
  const timeZone = me.data?.tenant.timezone ?? "UTC";

  return (
    <section>
      <h1>Serviços</h1>
      <ul className="card list">
        {services.data?.map((service) => (
          <li key={service.id}>
            <strong>{service.name}</strong> · {service.durationMinutes} min · {formatPrice(service.priceCents, timeZone)}
            {!service.active && <span className="muted"> (inativo)</span>}
          </li>
        ))}
      </ul>
      {me.data?.role === "owner" ? <NewServiceForm /> : <p className="muted">Apenas o dono cadastra serviços.</p>}
    </section>
  );
}

export function NewServiceForm() {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<string[]>([]);
  const create = useMutation(api.createService, {
    onSuccess: () => queryClient.invalidateQueries(["services"]),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createServiceInput.safeParse({
      name: form.get("name") || undefined,
      durationMinutes: Number(form.get("durationMinutes")),
      priceCents: Math.round(Number(form.get("price")) * 100),
    });
    if (!parsed.success) {
      setErrors(describeZodError(parsed.error));
      return;
    }
    setErrors([]);
    create.mutate(parsed.data);
    event.currentTarget.reset();
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Novo serviço</h2>
      <label>
        Nome
        <input name="name" />
      </label>
      <label>
        Duração (min)
        <input name="durationMinutes" type="number" defaultValue={30} />
      </label>
      <label>
        Preço
        <input name="price" type="number" step="0.01" defaultValue={0} />
      </label>
      {errors.length > 0 && (
        <ul className="error" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={create.isLoading}>
        {create.isLoading ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
