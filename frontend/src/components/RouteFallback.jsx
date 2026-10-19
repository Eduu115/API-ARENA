import { useLocation } from "react-router-dom";
import { parsePathname } from "../lib/localeRoutes";
import Topbar from "./Topbar";

const CHROMELESS = new Set([
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

function showAppChrome(pathname) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  const { path } = parsePathname(pathname);
  if (CHROMELESS.has(path)) return false;
  return true;
}

/** Keep the nav visible while a lazy route chunk loads — blank fallback looked like a broken page. */
export default function RouteFallback() {
  const { pathname } = useLocation();
  const chrome = showAppChrome(pathname);
  return (
    <div className="route-fallback">
      {chrome ? <Topbar showSidebarToggle={false} /> : null}
      <div className="route-fallback__bar" aria-hidden="true" />
    </div>
  );
}
