import type { FormEvent } from "react";

type LoginViewProps = {
  apiBaseUrl: string;
  error: string | null;
  message: string | null;
  submitting: boolean;
  loginValues: {
    email: string;
    password: string;
  };
  onChange: (field: "email" | "password", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginView({
  apiBaseUrl,
  error,
  message,
  submitting,
  loginValues,
  onChange,
  onSubmit,
}: LoginViewProps) {
  return (
    <div className="login-wrap">
      <div className="login-shell">
        <section className="login-side">
          <p className="eyebrow">Gatekeeper AI</p>
          <h1 className="title">Web Console</h1>
          <p className="subtitle">
            Admin access for Sprint 1 data setup, room/device registration, and academic master
            data input.
          </p>

          <div className="kpis">
            <div className="kpi">
              <strong>9</strong>
              <span>Core datasets connected to the same API contract.</span>
            </div>
            <div className="kpi">
              <strong>JWT</strong>
              <span>Admin and lecturer sessions aligned with the NestJS auth module.</span>
            </div>
            <div className="kpi">
              <strong>CRUD</strong>
              <span>Ready for onboarding master data before schedule sync and attendance logic.</span>
            </div>
          </div>
        </section>

        <section className="login-form">
          <p className="eyebrow">Sign In</p>
          <h2 className="title">Start Session</h2>
          <p className="subtitle">Use the credentials provisioned in the API database.</p>

          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                autoComplete="email"
                value={loginValues.email}
                onChange={(event) => onChange("email", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={loginValues.password}
                onChange={(event) => onChange("password", event.target.value)}
              />
            </div>

            {error ? <div className="message error">{error}</div> : null}
            {message ? <div className="message">{message}</div> : null}

            <button className="button primary" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
            <p className="helper">API base: {apiBaseUrl}</p>
          </form>
        </section>
      </div>
    </div>
  );
}
