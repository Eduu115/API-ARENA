import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Cabecera reutilizable con título del proyecto y avatar/usuario.
 * Usa el usuario del AuthContext para las iniciales cuando hay sesión.
 */
export default function Header({ title = "APIArena" }) {
  const { user } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "?";

  return (
    <header className="border-b border-primary/10 bg-background-secondary">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="text-2xl font-display text-primary hover:opacity-90 transition">
          {title}
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-background-tertiary border border-primary/20 flex items-center justify-center text-sm hover:border-primary/40 transition"
            title={user ? user.username || user.email : "Perfil"}
            aria-label="Ir al perfil"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
