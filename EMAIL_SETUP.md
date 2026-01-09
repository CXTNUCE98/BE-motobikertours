# Email Service Setup

Add these environment variables to your `.env` file:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Motobike Tours" <noreply@motobiketours.com>
```

## Gmail App Password Setup

If using Gmail:

1. Go to Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate app password for "Mail"
5. Use generated password as `SMTP_PASS`

## Other Email Providers

### SendGrid:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### AWS SES:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

## Email Features Implemented

✅ **Booking Confirmation** - Sent when booking is created
✅ **Payment Success** - Sent when payment completes
✅ **Booking Cancellation** - Sent when booking is cancelled

All emails include:

- Professional HTML templates
- Booking details
- Responsive design
- Brand colors and styling
