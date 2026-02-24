(function () {
    const STORAGE_KEY = "apiarena_theme";
    const theme = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "dark" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
})();
