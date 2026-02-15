import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-blue-500/20 shadow-2xl p-8">
          
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-wide bg-gradient-to-r from-blue-400 via-blue-500 to-red-500 bg-clip-text text-transparent"> APIArena --- logo? </h1>
            <p className="mt-3 text-sm text-blue-200 font-light italic"> Descripcion? </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-sm text-blue-300 mb-2 font-medium tracking-wide"> Email </label>
              <input
                type="email"
                placeholder="ej@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-xl px-4 py-3 bg-slate-800 text-white placeholder:text-slate-500 border border-blue-500/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-300 mb-2 font-medium tracking-wide"> Contraseña </label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl px-4 py-3 bg-slate-800 text-white placeholder:text-slate-500 border border-blue-500/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 outline-none transition"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-red-400 hover:text-red-500 font-medium transition"> ¿Has olvidado tu contraseña? </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3 font-bold tracking-wide bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-red-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Entrando…" : "Entrar al Reto"}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-blue-300"> ¿No tienes una cuenta?{" "}
            <Link to="/register" className="text-red-400 hover:text-red-500 font-semibold transition"> Registrarse </Link>
          </div>
        </div>
      </div>
    </div>
  );
}





/* como en el pdf */ 
/*
export default function Login() {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="rounded-2xl bg-background-secondary border border-primary/20 shadow-glow p-8">

          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl text-primary"> APIArena --- logo? </h1>
            <p className="mt-2 text-sm text-text-secondary"> Descripcion? </p>
          </div>

          <form className="space-y-5">

            <div>
              <label className="block text-sm text-text-secondary mb-2"> Email </label>
              <input type="email" placeholder="ej@test.com"
                className=" w-full rounded-lg px-4 py-3 bg-background-tertiary text-text-primary placeholder:text-text-muted border border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition "/>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2"> Contraseña </label>
              <input type="password" placeholder="••••••"
                className="w-full rounded-lg px-4 py-3 bg-background-tertiary text-text-primary placeholder:text-text-muted border border-primary/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"/>
            </div>

            <div className="flex items-center ">
              <button type="button" className="text-sm text-primary hover:text-accent transition"> ¿Has olvidado tu contraseña? </button>
            </div>

            <button type="submit" className="w-full rounded-lg py-3 font-semibold bg-primary text-background-primary hover:shadow-glow-lg transition"> Entrar al Reto </button>
          </form>


          <div className="mt-6 text-center text-sm text-text-secondary"> ¿No tienes una cuenta?{" "}
            <button type="button" className="text-accent hover:underline"> Registrarse </button>
          
          </div>
        </div>
      </div>
    </div>
  );
}

*/

