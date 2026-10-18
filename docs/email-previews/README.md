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

Samples use `https://apiarena.net` and the token `preview-token`. They are not live credentials.

Regenerate from `backend/auth-service`:

```bash
mvn -Dtest=EmailDispatchServiceTest#writesEnglishPreviews test
```

The password reminder uses the four-month wording from `fix/password-reminder-4-months`. Force-reset reuses the password-reset email. The administrator password-changed email is wrapped in the same layout.
