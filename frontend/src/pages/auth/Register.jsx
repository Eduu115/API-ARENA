import { Link } from "react-router-dom";
import "./register.css";

export default function Register() {
  function handleSubmit(e) {
    e.preventDefault();
    // TODO: implementar registro
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-main">
        {/* Panel izquierdo - Switch */}
        <div className="auth-switch">
          <div className="auth-switch__circle auth-switch__circle--1" />
          <div className="auth-switch__circle auth-switch__circle--2" />
          <div className="auth-switch__content">
            <h2 className="auth-switch__title">¡Bienvenido de nuevo!</h2>
            <p className="auth-switch__description">
              Mantente conectado con nosotros iniciando sesión con tu información personal
            </p>
            <Link to="/login" className="auth-switch__button no-underline">
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Panel derecho - Formulario Register */}
        <div className="auth-form-container">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form__title">Crear cuenta</h2>
            <div className="auth-form__icons">
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
              <div className="auth-form__icon" title="OAuth" aria-hidden />
            </div>
            <span className="auth-form__span">o usa email para registrarte</span>
            <input
              type="text"
              className="auth-form__input"
              placeholder="Usuario"
              autoComplete="username"
              required
            />
            <input
              type="email"
              className="auth-form__input"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <input
              type="password"
              className="auth-form__input"
              placeholder="Contraseña"
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              className="auth-form__input"
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
              required
            />
            <button type="submit" className="auth-form__button">
              Registrarse
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
