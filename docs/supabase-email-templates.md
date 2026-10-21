# Supabase: email templates and settings

These are set **by hand** in the Supabase Dashboard; the code doesn't change them.

## Reset Password

**Authentication → Emails → Templates → Reset Password** (in older dashboards: Authentication → Email Templates).

**Subject:**

```
SpaceEdu — პაროლის აღდგენა
```

**Message body (HTML):**

```html
<div style="margin:0;padding:32px 16px;background:#f6f6f8;font-family:'Noto Sans Georgian',Arial,sans-serif;color:#18181b">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7">
    <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#18181b">SpaceEdu</p>
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:#18181b">პაროლის აღდგენა</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3f3f46">
      პაროლის შესაცვლელად დააჭირე ღილაკს. ბმული მოქმედებს 1 საათის განმავლობაში.
      თუ ეს შენ არ მოგითხოვია, უბრალოდ უგულებელყავი ეს წერილი.
    </p>
    <p style="margin:0 0 28px">
      <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
         style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px">
        ახალი პაროლის დაყენება
      </a>
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a">
      ღილაკი თუ არ მუშაობს, ეს ბმული ბრაუზერში ჩასვი:<br>
      <span style="word-break:break-all">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password</span>
    </p>
  </div>
</div>
```

### Why `token_hash` and not `{{ .ConfirmationURL }}`

- `{{ .ConfirmationURL }}` (the default) uses PKCE: the link only works in **the same browser** where the request was made. It fails if the request was on a computer and the email is opened on a phone.
- With `token_hash`, `/auth/callback` verifies the link on the server (`verifyOtp`), so it works on any device. The code supports both formats.
- **Previews:** `{{ .SiteURL }}` always points to the production domain. To test on a preview, temporarily use `{{ .ConfirmationURL }}` (and the same browser), or point Site URL at the preview.
- **If the link is ever reported as "already used"** right away, some mail filters (Outlook Safe Links) open links in advance. Then it's worth adding an intermediate „გაგრძელება“ page; that isn't needed yet.

## Dashboard steps

1. **Authentication → URL Configuration**
   - **Site URL:** `https://www.spaceedu.ge`
   - **Redirect URLs** (add; `**` covers the query string, e.g. `?next=/reset-password`):
     - `https://www.spaceedu.ge/auth/callback**`
     - `https://spaceedu.ge/auth/callback**` (if the domain without www is in use too)
     - previews: `https://*-salotateshvili-3377s-projects.vercel.app/auth/callback**`. Your team only, not just any `*.vercel.app`, so the link can't go to someone else's site
     - local: `http://localhost:3000/auth/callback**`
2. **Authentication → Emails → Templates → Reset Password:** the subject and HTML from above.
3. **Link lifetime:** Authentication → Providers → Email → **Email OTP Expiration** = `3600` (1 hour, which the email text promises).
4. **SMTP (Resend):** Project Settings → Authentication → **SMTP Settings** → Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend **API key** (Resend → API Keys, with "Sending access")
   - Sender email: e.g. `noreply@spaceedu.ge`. The domain must be verified in Resend (Domains → DNS records: SPF, DKIM, and DMARC recommended)
   - Sender name: `SpaceEdu`
5. **Rate limit:** Authentication → **Rate Limits** → "Rate limit for sending emails". With custom SMTP the default is low (about 30 per hour); raise it to suit your traffic. If the limit is hit, `/forgot-password` shows „ძალიან ბევრი მცდელობა. სცადე რამდენიმე წუთში.“
6. **Test:** `/forgot-password` → the email arrives from Resend → the link → `/reset-password` → the new password → the dashboard.

## Phone reset (not yet)

The code is ready for it (`NEXT_PUBLIC_PHONE_RESET_ENABLED`, off by default). Enabling it needs:

1. **Numbers:** adding a phone number at registration or in the profile, confirmed by SMS (`updateUser({ phone })` + OTP). Existing accounts don't have numbers.
2. **SMS provider:** Supabase → Authentication → Providers → **Phone** (Twilio, MessageBird, Vonage, Textlocal). Check delivery to Georgian numbers (+995) and that the sender ID is allowed.
3. **Price:** paid per SMS. For Twilio, Georgia is roughly **$0.25–0.35** per SMS (check the current rate); one reset is one SMS.
4. **Flow:** by phone Supabase sends not a link but a **6-digit code**: number → `signInWithOtp({ phone })` → code entry → `verifyOtp({ phone, token, type: "sms" })` → new password (`updateUser`).
