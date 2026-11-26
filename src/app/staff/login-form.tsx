"use client";

import { useActionState } from "react";
import { type LoginState, login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {} as LoginState);
  return (
    <form action={action} className="solid fade mx-auto mt-10 max-w-sm p-6">
      <h1 className="display text-[26px] font-bold text-brand">Porcafe staff</h1>
      <p className="mt-1 text-muted">Enter the staff password to see orders.</p>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-[15px] font-semibold">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="field"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "pw-error" : undefined}
          required
        />
      </label>
      {state.error && (
        <p id="pw-error" className="mt-1.5 text-[14px] text-danger" aria-live="polite">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
