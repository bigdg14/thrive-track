# 🚀 Phase 2 Setup Guide

Quick guide to get Phase 2 features up and running.

---

## Prerequisites

- Phase 1 already set up and working
- Database connection configured
- Node.js and npm installed

---

## Step 1: Update Database Schema

The schema has been updated with Phase 2 models. Push the changes to your database:

```bash
cd fitness-tracker

# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

If you get a permission error on Windows (EPERM), this is normal - the schema was pushed successfully. Just restart your dev server.

---

## Step 2: Add USDA API Key (Optional but Recommended)

For nutrition food search to work properly:

1. **Get a Free API Key:**
   - Go to: https://fdc.nal.usda.gov/api-key-signup.html
   - Sign up (it's free!)
   - Copy your API key

2. **Add to `.env`:**
   ```bash
   # Add this line to your .env file
   USDA_API_KEY="your-api-key-here"
   ```

3. **For Testing (Limited):**
   - You can use `DEMO_KEY` for testing
   - Limited to 30 requests per hour
   - Already set in `.env.example`

---

## Step 3: Restart Development Server

```bash
npm run dev
```

---

## Step 4: Test Phase 2 Features

### Test Goals
1. Go to `/progress/goals`
2. Click "New Goal"
3. Create a weight or strength goal
4. Try marking it as achieved
5. View in different tabs

### Test Measurements
1. Go to `/progress/measurements`
2. Click "Add Measurement"
3. Add weight and a few body measurements
4. Add another measurement with a different date
5. View the charts in the Charts tab
6. Check the history

### Test Nutrition
1. Go to `/nutrition/log`
2. Click "Set Targets" first
   - Set daily calories (e.g., 2000)
   - Set macros (e.g., 150g protein, 200g carbs, 65g fat)
3. Click "Log Food"
4. Try searching for "chicken breast" or "rice"
5. Select a food from results
6. Or enter food manually
7. Watch the progress bars update!
8. Try different dates
9. Log foods for different meals

---

## New Routes Available

### Goals
- `/progress/goals` - Goals management page

### Body Measurements
- `/progress/measurements` - Measurements tracker with charts

### Nutrition
- `/nutrition/log` - Food logging and macro tracking

---

## API Endpoints Available

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `GET /api/goals/[id]` - Get specific goal
- `PATCH /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Delete goal

### Measurements
- `GET /api/measurements` - Get measurements
- `POST /api/measurements` - Add measurement
- `GET /api/measurements/[id]` - Get specific measurement
- `PATCH /api/measurements/[id]` - Update measurement
- `DELETE /api/measurements/[id]` - Delete measurement

### Nutrition
- `GET /api/nutrition/logs` - Get logs (with date filter)
- `POST /api/nutrition/logs` - Log food
- `DELETE /api/nutrition/logs/[id]` - Delete log
- `GET /api/nutrition/targets` - Get user's targets
- `POST /api/nutrition/targets` - Set targets
- `GET /api/nutrition/search?q=chicken` - Search foods

### Programs (API Ready, UI Coming)
- `GET /api/programs` - Get all programs
- `POST /api/programs` - Create program
- `GET /api/programs/user` - Get user's active programs
- `POST /api/programs/user` - Start program

---

## Database Models Added

- ✅ Goal
- ✅ BodyMeasurement
- ✅ ProgressPhoto
- ✅ NutritionTarget
- ✅ NutritionLog
- ✅ FavoriteFood
- ✅ WorkoutProgram
- ✅ ProgramWorkout
- ✅ UserProgram

---

## Troubleshooting

### Database Schema Issues

**Error:** "Column doesn't exist" or similar
```bash
# Reset and re-push schema
npx prisma db push --force-reset
npx prisma db seed
```

### Prisma Client Not Updated

**Error:** Type errors or missing models
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### USDA API Not Working

**Error:** "Failed to search foods"
- Check your API key in `.env`
- Make sure `.env` has `USDA_API_KEY`
- For testing, use `USDA_API_KEY="DEMO_KEY"`
- Note: DEMO_KEY has limits (30 requests/hour)

### Charts Not Displaying

**Issue:** Charts are blank
- Make sure you have at least 2 measurements with the same field
- Example: Add weight on two different dates
- Charts need multiple data points to render

---

## What's Working

✅ **Goals System:**
- Create, view, update, delete goals
- Multiple goal types
- Progress tracking
- Achievement celebration

✅ **Body Measurements:**
- Track 10+ measurements
- Beautiful line charts
- Trend indicators
- History view

✅ **Nutrition Tracking:**
- Food search (USDA database)
- Manual food entry
- Macro targets
- Daily progress bars
- Meal categorization

✅ **All APIs:**
- Fully functional REST APIs
- Authentication protected
- Input validation
- Error handling

---

## What's Next (To Be Built)

🚧 **Workout Programs UI:**
- Browse programs
- View program details
- Start/track programs
- Create custom programs

🚧 **Progress Photos:**
- Upload photos
- Gallery view
- Before/after comparison

🚧 **Dashboard Integration:**
- Show Phase 2 widgets
- Quick actions

---

## Quick Test Script

Here's a quick way to test all features:

1. **Goals** (2 min):
   - Create 2 goals (one weight, one strength)
   - Mark one as achieved
   - Delete it

2. **Measurements** (3 min):
   - Add today's measurement (weight + 2 others)
   - Add yesterday's measurement
   - View charts
   - Check trend indicator

3. **Nutrition** (5 min):
   - Set your targets
   - Search for "apple" - select one
   - Manually add "coffee" as a snack
   - Log 2-3 more foods
   - Watch progress bars update
   - Try different dates

---

## Need Help?

- Check [PHASE2_PROGRESS.md](./PHASE2_PROGRESS.md) for detailed feature list
- Check [README.md](./README.md) for general setup
- Check API routes in `/app/api/` for endpoint details

---

**Phase 2 is ~75% complete and ready to use! Enjoy tracking your fitness journey! 💪**
