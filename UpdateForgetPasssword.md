# Forgot Password — Follow-up Tasks

Implemented in this branch: password reset request/confirm flow (server routes,
model, service, mailer, migration script; client pages, service methods, routes).
The items below are still required before/after using it.

## Required before it works at all

- [ ] **Run the DB migration** to add the reset-token columns to `userac`:
  ```bash
  node server/migrations/run_add_password_reset_columns.js
  ```
  Adds `reset_password_token_hash` (VARCHAR(64)) and `reset_password_expires`
  (DATETIME) to `userac`.

- [ ] **Add email credentials to `server/.env`** (not committed — add manually):
  ```
  EMAIL_USER=
  EMAIL_PASS=
  RESET_PASSWORD_TOKEN_EXP_MIN=30
  ```
  `EMAIL_PASS` must be a Google **App Password**, not the account's real
  login password (Gmail blocks plain-password SMTP login by default).
  These same vars are also used by the existing receipt-email feature
  (`server/src/controllers/receiptController.js`), which currently has no
  values set either.

- [ ] Confirm `FRONTEND_URL` in `server/.env` is correct — it's used to build
  the reset link (`${FRONTEND_URL}/reset-password/:token`) that gets emailed.

## Hardening (not yet done)

- [ ] **Real rate limiting.** `server/src/middlewares/rateLimit.js` is an
  in-memory fixed-window limiter — per-process only, resets on restart, and
  does **not** share state across multiple instances (PM2 cluster, multiple
  servers behind a load balancer). Replace with `express-rate-limit` (+
  Redis store) if/when the app runs more than one instance.

- [ ] **Invalidate existing sessions on password reset.** A reset currently
  does not revoke previously issued JWTs — an attacker who stole an old
  token can keep using it after the victim resets their password. Add a
  `password_changed_at` column on `userac`, stamp it in `resetPassword`,
  and check it in `authenticateToken` (reject tokens issued before that
  timestamp).

- [ ] **Stronger password policy for resets.** Currently reuses the same
  6-character minimum as login/signup (`server/src/schemas/authSchema.js`).
  Consider a higher bar specifically for `resetPasswordSchema`.

- [ ] **CAPTCHA on the forgot-password form** to deter scripted
  email-bombing beyond what IP-based rate limiting catches.

- [ ] **Audit logging** for reset requests/completions (IP, timestamp,
  masked email) — none of the auth flows currently log this, useful for
  abuse detection.

- [ ] **Production email provider.** Gmail's `service: "gmail"` transporter
  (`server/src/utils/mailer.js`) is fine for low volume but gets
  rate-limited/flagged at scale. Consider SES, SendGrid, or Postmark before
  going to production.

- [ ] **Enforce HTTPS in production** so the reset token in the emailed URL
  isn't transmitted in cleartext.

## Reference — what was added

| File | Purpose |
|---|---|
| `server/migrations/run_add_password_reset_columns.js` | One-time migration for reset-token columns |
| `server/src/models/userModel.js` | `setResetToken`, `findUserByResetTokenHash`, `resetPasswordAndClearToken` |
| `server/src/schemas/authSchema.js` | `forgotPasswordSchema`, `resetPasswordSchema` |
| `server/src/utils/mailer.js` | Shared nodemailer transporter + `sendPasswordResetEmail` |
| `server/src/services/authService.js` | `requestPasswordReset`, `resetPassword` |
| `server/src/controllers/authController.js` | `forgotPassword`, `resetPassword` handlers |
| `server/src/routes/authRoutes.js` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| `server/src/middlewares/rateLimit.js` | In-memory limiter (see hardening note above) |
| `server/.env.example` | Documents new env vars |
| `client/src/services/authService.js` | `forgotPassword`, `resetPassword` |
| `client/src/pages/ForgotPasswordPage.jsx` | New page |
| `client/src/pages/ResetPasswordPage.jsx` | New page |
| `client/src/router/routes.jsx` | Registers `/forgot-password`, `/reset-password/:token` |
| `client/src/pages/LoginPage.jsx` | Wired the previously-dead "Forgot your password?" button |

### Security properties already in place

- Raw reset token is never stored — only its SHA-256 hash, so a DB read
  alone can't be replayed to reset a password.
- Token is single-use (cleared on successful reset) and time-limited
  (30 min default, `RESET_PASSWORD_TOKEN_EXP_MIN`).
- `forgot-password` always returns the same generic response whether or
  not the email is registered, and swallows internal errors to the same
  message — prevents account enumeration.
