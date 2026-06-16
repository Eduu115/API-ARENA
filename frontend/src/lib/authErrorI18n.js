/**
 * Maps known API auth error messages (English) to i18n keys.
 * Unknown messages are returned as-is until backend sends error codes.
 */
export function translateAuthError(message, t) {
  if (!message || typeof message !== "string") {
    return t("errors.signIn");
  }

  const lower = message.toLowerCase();

  if (lower.includes("email not verified")) {
    return t("errors.emailNotVerified");
  }
  if (message === "Sign-in error" || lower === "sign-in error") {
    return t("errors.signIn");
  }
  if (message === "Registration error" || lower === "registration error") {
    return t("errors.register");
  }

  return message;
}
