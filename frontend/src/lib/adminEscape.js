// Temporary "let the admin browse the normal site" flag (per tab). When unset, admins are
// bounced back to /admin from any normal route. Entering /admin re-seals (clears) it.
const KEY = "apiarena_admin_escape";

export function setAdminEscape() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* empty */
  }
}

export function clearAdminEscape() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* empty */
  }
}

export function isAdminEscaping() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
