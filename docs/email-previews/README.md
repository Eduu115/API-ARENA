# Transactional email previews

English HTML samples of the shared layout in `EmailDispatchService`. Open a file in a browser. Spanish uses the same shell with localized copy; the auth-service test renders both.

| File | Email |
|---|---|
| `verification.html` | Verify email |
| `welcome-beta.html` | Beta / legacy welcome |
| `first-steps.html` | First steps |
| `password-reminder.html` | Password rotation reminder |
| `password-reset.html` | Password reset |
| `account-deletion.html` | GDPR account deletion |
| `new-challenge.html` | New challenge published |
| `notification-mirror.html` | IMPORTANT notification mirror |
| `admin-password-changed.html` | Administrator changed the password |

Samples use `https://apiarena.net` and the token `preview-token`. They are not live credentials.

Regenerate from `backend/auth-service`:

```bash
mvn -Dtest=EmailDispatchServiceTest#writesEnglishPreviews test
```

The password reminder uses the four-month wording from `fix/password-reminder-4-months`. Force password reset reuses the password-reset email. `admin-password-changed.html` is the administrator set-password notice from `feat/admin-password-actions`, wrapped in this same layout. The message does not include the new password.
