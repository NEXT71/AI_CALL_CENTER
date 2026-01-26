# Manual Payment System

This application now uses a manual payment system instead of automated Stripe payments. Here's how it works:

## For Users (Customers)

1. **Select Plan**: Users can choose from Free, Starter ($49/month), Professional ($99/month), or Enterprise ($249/month) plans.

2. **Free Plan**: Activated immediately without payment.

3. **Paid Plans**: When users select a paid plan, they receive payment instructions with:
   - Plan details and pricing
   - Contact information for support
   - Payment methods (Bank Transfer, PayPal, Payoneer, etc.)
   - Instructions to email support@yourcompany.com

4. **Payment Process**:
   - User contacts support with payment details
   - Makes payment through agreed method
   - Support team receives payment
   - Admin manually activates subscription

## For Admins

1. **Monitor Pending Payments**: Check the dashboard for pending activation requests.

2. **View Pending Requests**: Click "Check Pending Payments" to see users waiting for activation.

3. **Manual Activation**: Once payment is confirmed, use the admin API to activate subscriptions.

### Admin API Endpoints

- `GET /api/subscriptions/pending-payments` - View pending requests
- `POST /api/subscriptions/admin-activate` - Activate subscription

Example activation request:
```json
{
  "userId": "user_id_here",
  "planType": "professional",
  "paymentMethod": "bank_transfer",
  "notes": "Payment received via bank transfer on 2026-01-27"
}
```

## Configuration

Set `PAYMENT_MODE=manual` in your `.env` file to enable manual payments.

## Benefits

- ✅ No payment processor fees during development
- ✅ Full control over payment verification
- ✅ Support for any payment method
- ✅ Easy transition to automated payments later

## Transition to Automated Payments

To switch back to Stripe or another processor:

1. Change `PAYMENT_MODE` to desired processor
2. Configure API keys
3. Update frontend payment flow
4. Test thoroughly

## Security Notes

- Admin endpoints require Admin role verification
- All subscription changes are logged in audit trail
- Manual verification prevents automated fraud