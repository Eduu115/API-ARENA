import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const { register: doRegister, error, clearError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setFieldError(null);
    if (password !== confirmPassword) {
      setFieldError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setFieldError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    const result = await doRegister(username, email, password, null);
    setSubmitting(false);
    if (result?.success) navigate("/dashboard", { replace: true });
  }

  const displayError = fieldError || error;

  return (
    <div className="relative min-h-screen bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 70% 20%, var(--arena-primary-20), transparent 45%), radial-gradient(circle at 25% 35%, var(--arena-success-10), transparent 40%), radial-gradient(circle at 50% 90%, var(--arena-primary-10), transparent 55%)",
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
            <div className="order-1 lg:order-2">
              <Link to="/" className="inline-flex items-center gap-3 no-underline">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="font-display text-xl font-black tracking-tight">
                  <span className="text-primary">API</span>Arena
                </span>
              </Link>

              <div className="mt-10">
                <div className="text-xs font-mono uppercase tracking-[0.45em] text-text-muted">
                  // Registro
                </div>
                <h1 className="mt-4 text-5xl font-display font-black uppercase leading-[0.95] tracking-[-0.02em]">
                  Crea tu{" "}
                  <span className="text-gradient">perfil</span>
                </h1>
                <p className="mt-5 max-w-xl font-mono text-sm leading-7 text-text-secondary">
                  Una cuenta, un nombre, y listo. Entras al dashboard y a pelear por el ELO.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.35em] border border-primary text-primary bg-primary-5 hover:bg-primary-10 transition no-underline"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                    }}
                  >
                    Ya tengo cuenta
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary hover:text-primary transition no-underline"
                  >
                    Ver leaderboard →
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative order-2 lg:order-1">
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
                      // Datos
                    </div>
                    <h2 className="mt-3 text-2xl font-display font-bold">
                      Crear cuenta
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    {submitting ? "// creando…" : "// listo"}
                  </div>
                </div>

                {displayError && (
                  <div
                    className="mt-6 border border-error-30 bg-error-10 px-4 py-3 text-sm text-error"
                    role="alert"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                    }}
                  >
                    {displayError}
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  <div>
                    <label
                      htmlFor="register-username"
                      className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                    >
                      Usuario
                    </label>
                    <input
                      id="register-username"
                      type="text"
                      className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                      placeholder="tuNick"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-email"
                      className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                    >
                      Email
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="register-password"
                        className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                      >
                        Contraseña
                      </label>
                      <input
                        id="register-password"
                        type="password"
                        className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="register-confirm"
                        className="block font-mono text-xs uppercase tracking-[0.35em] text-text-muted"
                      >
                        Confirmar
                      </label>
                      <input
                        id="register-confirm"
                        type="password"
                        className="mt-3 w-full bg-transparent px-0 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted border-b border-primary-20 focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
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
                  {submitting ? "Creando cuenta…" : "Registrarse"}
                </button>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-primary-10 pt-6">
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-muted">
                    ¿Eres profesor?
                  </p>
                  <Link
                    to="/login"
                    className="font-mono text-xs uppercase tracking-[0.35em] text-primary hover:text-text-primary transition no-underline"
                  >
                    Inicia sesión (cuenta educativa) →
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
