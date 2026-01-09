# Environment Variables for VNPay Integration

## Backend (.env)

```env
# VNPay Configuration
VNPAY_TMN_CODE=your_merchant_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_RETURN_URL=http://localhost:3001/api/payments/vnpay/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5000
```

## Frontend (.env)

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

## VNPay Sandbox Credentials

**For testing**, you can use VNPay sandbox:

- TMN Code: Provided by VNPay when you register sandbox account
- Secret Key: Provided by VNPay
- Test URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`

## How to Get VNPay Credentials

1. Visit: https://sandbox.vnpayment.vn/devreg (Registration page)
2. Fill registration form - VNPay will email credentials
3. Check email for TMN Code and Secret Key
4. API Docs: https://sandbox.vnpayment.vn/apis/
5. Merchant Portal: http://sandbox.vnpayment.vn/merchantv2/Users/Login.htm

## Production Setup

For production, change:

- `VNPAY_RETURN_URL` to your production callback URL
- Use production credentials instead of sandbox
- VNPay URL will be `https://vnpayment.vn/paymentv2/vpcpay.html`
