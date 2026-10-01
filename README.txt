SHRI KALIKA PEETHAM — PREMIUM WEBSITE V7

Open index.html in a browser.

V7 refinements:
- Rebalanced home hero into a premium two-column composition.
- Hero photograph is now a true landscape frame (16:10 desktop, 16:9 tablet).
- Removed stretch/crop behaviour that made the image appear portrait-like.
- Added a subtle gold frame treatment without creating empty space.
- Kept all three CTAs aligned: Volunteer | Premium Membership | Member.
- Premium CTA remains highlighted with gold glow/shine.
- Added mobile-specific hero sizing and button stacking to prevent overflow.
- Preserved Premium Seva, Sadhu Seva, Bhaktamandali Trustee, Media & Events, About Swamiji and About Kalika Peetham pages.

V9 UPDATE — Seed Plant for Prosperity
- Added new premium page: seed-plant.html
- Added short navbar item: “Seed Plant” across all pages.
- Page content follows the supplied “Seed Plant for Prosperity | Prakriti Sanathan” website-content PDF.
- Added the supplied tree-planting campaign artwork and a focused Swamiji planting crop under assets/.
- Added responsive green/gold page styling for desktop, tablet and mobile.
- Added a static enquiry-preview form for temple registration, sponsorship, site assessment and partner/general enquiry. It does not transmit data until a backend/WhatsApp/email action is connected.
- The illustrative 50-sapling value table keeps its disclaimer immediately below the table.


V10 update:
- Replaced Seed Plant hero with plants-only premium temple-garden image.
- Replaced Prakriti Sanathan About image with user-provided real planting photograph.
- Replaced main homepage hero image with user-provided real ceremony photograph.
- Refined desktop/mobile navbar spacing, single-line links and Seed Plant hero proportions.


V11 / VERCEL + RAZORPAY TEST INTEGRATION
- Added Vercel serverless API endpoints under /api.
- Premium membership now launches Razorpay Subscriptions checkout.
- Sadhu Seva plan: ₹128/month.
- Bhaktamandali Trustee plan: ₹1,028/month.
- Checkout response is verified server-side using HMAC-SHA256.
- Added verified webhook endpoint scaffold: /api/razorpay-webhook.
- Added /api/health to confirm whether Razorpay env configuration is present.
- Real API secrets are NOT stored in GitHub.

VERCEL SETUP
1. Import GitHub repository xansar1/kalika-peetham into Vercel.
2. Deploy the feature/vercel-razorpay branch first as Preview.
3. In Razorpay Dashboard TEST MODE, create two monthly plans:
   - Sadhu Seva: ₹128 / month
   - Bhaktamandali Trustee: ₹1,028 / month
4. In Vercel Project > Settings > Environment Variables add:
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET
   RAZORPAY_WEBHOOK_SECRET
   RAZORPAY_PLAN_SADHU_SEVA
   RAZORPAY_PLAN_TRUSTEE
   RAZORPAY_SUBSCRIPTION_CYCLES=120
5. Redeploy Preview.
6. Test Premium Membership checkout with Razorpay Test Mode.
7. Configure Razorpay webhook URL:
   https://YOUR-VERCEL-DOMAIN/api/razorpay-webhook
8. Use a separate webhook secret and set the same value in Vercel.
9. After test verification, merge the PR to main and deploy Production.

IMPORTANT
- Never place RAZORPAY_KEY_SECRET or RAZORPAY_WEBHOOK_SECRET in HTML/JS.
- Razorpay subscriptions require a finite billing count. Current default is 120 monthly cycles (10 years), configurable by env.
- The webhook is signature-verified but does not persist events yet because a database has not been connected.
- Regular Member / Volunteer submissions are still frontend-only until the database step.

Vercel project connected to GitHub; preview branch trigger.


SUPABASE DATABASE INTEGRATION
- Supabase project created in ap-south-1 (Mumbai region): kalika-peetham
- Tables:
  members
  volunteers
  subscriptions
  payments
  seed_plant_enquiries
- RLS enabled on all tables.
- Website submissions go through Vercel serverless endpoints, not directly from the browser to database tables.
- Regular member and volunteer registration now persist via /api/register.
- Seed Plant enquiries now persist via /api/seed-enquiry.
- Razorpay subscription creation records the subscription in Supabase.
- Verified Razorpay webhook events update subscription/payment records.

Additional Vercel environment variables required:
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
  SUPABASE_BACKEND_TOKEN

Health endpoint now reports both razorpayConfigured and supabaseConfigured.
