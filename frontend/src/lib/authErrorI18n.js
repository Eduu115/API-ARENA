const AUTH_CODE_KEYS = {
  AUTH_DOB_REQUIRED: "errors.codes.AUTH_DOB_REQUIRED",
  AUTH_DOB_PAST: "errors.codes.AUTH_DOB_PAST",
  AUTH_AGE_MIN: "errors.codes.AUTH_AGE_MIN",
  AUTH_TERMS_REQUIRED: "errors.codes.AUTH_TERMS_REQUIRED",
  AUTH_EMAIL_ALREADY_REGISTERED: "errors.codes.AUTH_EMAIL_ALREADY_REGISTERED",
  AUTH_USERNAME_TAKEN: "errors.codes.AUTH_USERNAME_TAKEN",
  AUTH_INVALID_ROLE: "errors.codes.AUTH_INVALID_ROLE",
  AUTH_EMAIL_NOT_VERIFIED: "errors.emailNotVerified",
};

function normalizeInput(errOrMessage) {
  if (errOrMessage && typeof errOrMessage === "object") {
    return {
      message: errOrMessage.message ?? errOrMessage.error ?? "",
      code: errOrMessage.code ?? errOrMessage.body?.code ?? null,
    };
  }
  return { message: errOrMessage ?? "", code: null };
}

/**
 * Maps API auth error codes or known English messages to i18n strings.
 */
export function translateAuthError(errOrMessage, t) {
  const { message, code } = normalizeInput(errOrMessage);

  if (code && AUTH_CODE_KEYS[code]) {
    const translated = t(AUTH_CODE_KEYS[code]);
    if (translated && translated !== AUTH_CODE_KEYS[code]) {
      return translated;
    }
  }

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
