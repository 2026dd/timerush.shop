# Time Rush — Online Orders + Admin Dashboard (No WhatsApp)

The storefront keeps its existing design. When a customer places an order, the order and its item details are saved in Supabase. The customer receives an on-screen order confirmation and order number. The store owner signs in to the private Admin Dashboard to view and manage orders. This version does not use WhatsApp, open WhatsApp, or expose a store phone number to customers.

## 1) Create the database

1. Create a project at https://supabase.com/ and open **SQL Editor → New query**.
2. Paste and run the complete file `supabase/schema.sql`.
3. In **Authentication → Providers → Email**, keep Email enabled. In **Authentication → Settings**, turn OFF public sign-ups. This prevents customers from creating dashboard accounts.
4. In **Authentication → Users**, create one user for the store owner (your admin email and a strong password). Only give this account to the store owner.

## 2) Connect the website

1. In Supabase open **Project Settings → API**.
2. Copy the **Project URL** and the **anon / publishable key** (never the `service_role` key).
3. Edit `assets/js/supabase-config.js` and replace `YOUR-PROJECT` and `YOUR_SUPABASE_ANON_PUBLIC_KEY` with those values.

The anon key is intended for browser use. The database Row Level Security policies ensure public visitors can submit orders through the RPC but cannot read customer orders. Authenticated admin users can read and update orders.

## 3) Publish the website

Upload the complete updated folder contents to the same hosting used by `timerush.shop` (including `admin.html`, `assets/js` additions, and the `supabase/schema.sql` file for your setup reference). The SQL file is run in Supabase separately; simply uploading the website does not create the database tables or connect the project.

## 4) Use the dashboard

Open `https://timerush.shop/admin.html`, sign in with the admin user created in step 1, and use Refresh or the status selector to manage orders:

- Pending
- Confirmed
- Shipped
- Delivered
- Cancelled

Do not add the admin login link to the public navigation. The dashboard is protected by Supabase Auth and database policies, not by hiding its URL.

## Important notes

- The current storefront product catalogue remains in the website's existing product data/local browser storage. Order items save a snapshot of the product name, quantity, image path, and displayed price at checkout. Confirm price and availability with the customer before marking an order Confirmed. For fully tamper-resistant pricing and inventory, the next upgrade is to move the product catalogue into Supabase too.
- This is an order-request / cash-on-delivery workflow, not an online card-payment gateway.
- Keep the Supabase service-role key private. Only the Supabase URL and anon/publishable key belong in `supabase-config.js`.
- Orders are stored online only after the Supabase project is configured and the SQL schema has been run. Until then, checkout will show a connection error rather than silently claiming an order was received.
