# Fix Authentication Error

## Problem
The 400 error when logging in is caused by an incorrect `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file.

## Solution

### Step 1: Get Your Actual Supabase Anon Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the value from the **anon/public** key field
4. It should look something like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Update Your Environment Variables

Replace the placeholder in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fcaynbfxglbcwjcuwrgz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

With your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fcaynbfxglbcwjcuwrgz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXluYmZ4Z2xiY3dqY3V3cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTM5NzAsImV4cCI6MjA1OTc4OTk3MH0.YOUR_ACTUAL_KEY_HERE
```

### Step 3: Verify Admin Email

Make sure your admin email in the database matches your Supabase user email:

1. In your Supabase SQL Editor, check the `is_admin()` function in `supabase/schema.sql`
2. Line 19 should have your admin email: `AND email = 'your-email@example.com'`
3. Update it if needed to match your Supabase user email

### Step 4: Restart Your Development Server

After updating the `.env.local` file:

```bash
npm run dev
```

## What This Fixes

- ✅ 400 error when trying to login
- ✅ Admin authentication and redirect to dashboard
- ✅ Customer authentication and redirect to homepage
- ✅ Proper Supabase authentication flow

## Testing

1. Visit `/login` page
2. Enter your admin email and password
3. You should be redirected to `/admin` dashboard
4. If you use a non-admin email, you should get an "unauthorized" error

## Need Help?

If you still get a 400 error after updating the anon key:
1. Double-check the anon key is copied correctly (no extra spaces)
2. Verify your Supabase project URL is correct
3. Check that your admin email in the schema matches your Supabase user email