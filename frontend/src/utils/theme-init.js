/**
 * Aplica el tema guardado (localStorage) al <html> antes de que React pinte.
 *por eso lo importo en main.jsx, antes que App.jsx porque sino, daba problemas de no cargar el tema.
 */
(function () {
    const STORAGE_KEY = "apiarena_theme";
    const theme = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "dark" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
})();
