import { useTheme } from "../context/ThemeContext";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";

export default function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={
                "p-2 rounded-full border border-primary-20 bg-background-tertiary hover:border-primary-40 transition focus:outline-none focus:ring-2 focus:ring-primary-30 " +
                className
            }
            title={isDark ? "Modo claro" : "Modo oscuro"}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        >
            {isDark ? (
                <SunIcon className="w-5 h-5 text-primary" />
            ) : (
                <MoonIcon className="w-5 h-5 text-primary" />
            )}
        </button>
    );
}
