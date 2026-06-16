import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";

export default function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation("common");
    const isDark = theme === "dark";
    const label = isDark ? t("topbar.lightMode") : t("topbar.darkMode");

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={
                "p-2 rounded-full border border-primary-20 bg-background-tertiary hover:border-primary-40 transition focus:outline-none focus:ring-2 focus:ring-primary-30 " +
                className
            }
            title={label}
            aria-label={label}
        >
            {isDark ? (
                <SunIcon className="w-5 h-5 text-primary" />
            ) : (
                <MoonIcon className="w-5 h-5 text-primary" />
            )}
        </button>
    );
}
