# 🚀 Quick Setup Instructions

Your fitness tracker is ready! Follow these steps to get it running:

## ✅ Step 1: Prisma Client (Already Done!)

The Prisma client has been generated. ✓

## 📝 Step 2: Set Up Environment Variables

Update your `.env` file with real values:

```env
# 1. Database - Get from Neon.tech
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/fitness_tracker?sslmode=require"

# 2. NextAuth URL
NEXTAUTH_URL="http://localhost:3000"

# 3. NextAuth Secret - Generate a random secret
NEXTAUTH_SECRET="your-super-secret-key-here"

# 4. Optional: Google OAuth (can skip for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### How to Get These Values:

#### DATABASE_URL (Neon.tech)
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Click "Connection Details"
5. Copy the connection string
6. Paste it in `.env`

#### NEXTAUTH_SECRET
Run this command and paste the output:
```bash
openssl rand -base64 32
```

## 🗄️ Step 3: Initialize Database

Run these commands in order:

```bash
# Push the schema to your database
npx prisma db push

# Seed the database with 35+ exercises
npx prisma db seed
```

You should see: ✅ Created 35 exercises

## 🎉 Step 4: Start the App

```bash
npm run dev
```

Visit: http://localhost:3000

## 🧪 Test the Complete Flow

1. **Sign Up**
   - Create an account at `/signup`
   - Watch the password strength indicator!
   - Complete the 4-step onboarding

2. **Browse Exercises**
   - Click "Browse Exercises" from dashboard
   - Try searching and filtering

3. **Start a Workout**
   - Click "Start Workout"
   - Add exercises (search dialog)
   - Log sets with reps and weight
   - Try the rest timer (circular countdown!)
   - Finish the workout

4. **View History**
   - Check "Workout History"
   - See your workout on the calendar
   - Click to view full details

5. **Check PRs**
   - Go to "Personal Records"
   - See your automatically detected PRs!

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Database Connection Error
- Make sure your `DATABASE_URL` is correct
- Check that you're connected to the internet
- Verify your Neon.tech database is active

### No exercises showing up
```bash
npx prisma db seed
```

### Can't log in after signup
- Make sure you completed onboarding
- Try signing out and back in
- Check browser console for errors

## 📊 What You Can Do Now

✅ Complete user authentication
✅ Browse 35+ exercises with search/filters
✅ Log workouts with sets, reps, weight
✅ Use the circular rest timer
✅ View workout history with calendar
✅ Track personal records (auto-detected!)
✅ View your profile and stats

## 🔧 Optional: Set Up Google OAuth

If you want Google sign-in:

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

## 🚀 Deploy to Production (Optional)

When ready to deploy:

1. Push to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables (same as `.env`)
5. Update `NEXTAUTH_URL` to your production domain
6. Deploy!

---

**Need help? Check the comprehensive docs:**
- [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md) - Full feature list
- [README.md](README.md) - Complete documentation
- [QUICK_START.md](QUICK_START.md) - Detailed setup guide

**Your fitness tracker is ready to use! 💪**
