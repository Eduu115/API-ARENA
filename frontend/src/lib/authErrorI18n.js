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
  if (message === "Verification completed." || lower === "verification completed.") {
    return t("errors.verifyCompleted");
  }
  if (message === "Verification failed." || lower === "verification failed.") {
    return t("errors.verifyFailed");
  }
  if (
    lower.includes("could not reset password") ||
    lower.includes("link may have expired")
  ) {
    return t("errors.resetFailed");
  }
  if (message === "Could not send email." || lower === "could not send email.") {
    return t("errors.sendEmailFailed");
  }
  if (message === "Enter your email address." || lower === "enter your email address.") {
    return t("errors.emailRequired");
  }
  if (message === "Password must be at least 6 characters long." || lower.includes("at least 6 characters")) {
    return t("errors.passwordMin");
  }
  if (message === "Passwords do not match." || lower === "passwords do not match.") {
    return t("errors.passwordMismatch");
  }

  return message;
}
