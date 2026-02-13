import { Link } from "react-router-dom";
import "./landing.css";

export default function Landing() {
    return (
        <div className="hero">
            <div className="hero-content">
                <div className="logo">APIArena</div>
                <div className="tagline">Compete. Code. Conquer.</div>
                <p className="text-text-secondary mb-10 text-lg max-w-2xl mx-auto">
                    La plataforma definitiva para competencias de desarrollo de APIs.<br />
                    Pon a prueba tus habilidades contra otros desarrolladores en tiempo real.
                </p>
                <div className="cta-buttons">
                    <Link to="/register" className="btn-primary glow no-underline">
                        Comenzar Ahora
                    </Link>
                    <Link to="/challenges" className="btn-secondary no-underline">
                        Ver Challenges
                    </Link>
                </div>
            </div>
        </div>
    );
}