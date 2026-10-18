import { Form, json, redirect, useActionData, useNavigation, type ActionFunctionArgs } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { supabase } from "../supabase";

export async function loginAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  return redirect("/");
}

export function LoginPage() {
  const result = useActionData() as { error: string } | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting" && navigation.formMethod === "POST";

  return (
    <div className="login">
      <h1>Agendaí</h1>
      <Form method="post" className="card">
        <label>
          E-mail
          <Input name="email" type="email" defaultValue="ana@belavista.test" required />
        </label>
        <label>
          Senha
          <Input name="password" type="password" defaultValue="agendai123" required />
        </label>
        {result?.error && <p className="error">{result.error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </Form>
    </div>
  );
}
