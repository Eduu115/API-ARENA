import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result?.success) navigate("/dashboard", { replace: true });
  }

  return (
    <div className="relative min-h-screen bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 10%, var(--arena-primary-20), transparent 45%), radial-gradient(circle at 80% 30%, var(--arena-success-10), transparent 40%), radial-gradient(circle at 50% 90%, var(--arena-primary-10), transparent 55%)",
        }}
      />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Link
          to="/"
          className="p-2 rounded-full border border-primary-20 bg-background-tertiary hover:border-primary-40 transition focus:outline-none focus:ring-2 focus:ring-primary-30"
          title="Volver a la landing"
          aria-label="Volver a la landing"
        >
          <ArrowRightIcon className="w-5 h-5 text-primary rotate-180" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <div className="w-full">
          <div className="grid w-full grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 no-underline">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="font-display text-xl font-black tracking-tight">
                  <span className="text-primary">API</span>Arena
                </span>
              </Link>

              <div className="mt-10">
                <div className="text-xs font-mono uppercase tracking-[0.45em] text-text-muted">
                  // Login
                </div>
                <h1 className="mt-4 text-5xl font-display font-black uppercase leading-[0.95] tracking-[-0.02em]">
                  Vuelve a la{" "}
                  <span className="text-gradient">Arena</span>
                </h1>
                <p className="mt-5 max-w-xl font-mono text-sm leading-7 text-text-secondary">
                  Compite en retos de APIs, escala el leaderboard y mejora tu ELO.{" "}
                  <span className="text-text-primary">Sin ruido, directo al combate.</span>
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.35em] border border-primary text-primary bg-primary-5 hover:bg-primary-10 transition no-underline"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                    }}
                  >
                    Crear cuenta
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/challenges"
                    className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary hover:text-primary transition no-underline"
                  >
                    Ver challenges →
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-x-4 -inset-y-6"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--arena-primary-20), transparent)",
                  opacity: 0.5,
                }}
              />

              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.45em] text-text-muted">
                      // Credenciales
                    </div>
                    <h2 className="mt-3 text-2xl font-display font-bold">
                      Iniciar sesión
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    {submitting ? "// autenticando…" : "// listo"}
                  </div>
                </div>

                {error && (
                  <div
                    className="mt-6 border border-error-30 bg-error-10 px-4 py-3 text-sm text-error"
                    role="alert"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                    >
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                    >
                      Contraseña
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary hover:text-primary transition"
                        onClick={() => {}}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-10 w-full px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.45em] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--arena-primary), var(--arena-secondary))",
                    clipPath:
                      "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                  }}
                >
                  {submitting ? "Entrando…" : "Entrar"}
                </button>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-primary-10 pt-6">
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-muted">
                    ¿No tienes cuenta?
                  </p>
                  <Link
                    to="/register"
                    className="font-mono text-xs uppercase tracking-[0.35em] text-primary hover:text-text-primary transition no-underline"
                  >
                    Regístrate →
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
