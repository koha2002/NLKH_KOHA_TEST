# NLKH KOHA V4.3 — Password recovery + change password

Copy the contents of this overlay into the repository root after V4.2.

## Added
- Login: "Quên mật khẩu?" flow using Supabase `resetPasswordForEmail()`.
- New public route: `/account/reset-password`.
- Account page: password change form for authenticated users.
- Password change verifies the current password by signing in again, then calls `updateUser({ password })`.

## Supabase redirect URL
Add these to Authentication -> URL Configuration -> Redirect URLs:
- `http://localhost:3000/account/reset-password`
- `https://nguyenlekhanhhoa.com/account/reset-password`

Keep the existing callback URLs as well.

No database migration is required for this hotfix.
