# Fitness Tracker - Full-Featured Progressive Web App

A comprehensive fitness tracking application built with Next.js 14+, TypeScript, Tailwind CSS, and Prisma. Track workouts, set goals, monitor progress, and achieve your fitness objectives with a beautiful, mobile-first PWA.

## Features

### Phase 1: Core Workout Tracking (Current)
- ✅ User authentication (Email/Password, Google OAuth)
- ✅ Comprehensive exercise database (300+ exercises with GIFs)
- ✅ Workout logging with rest timer
- ✅ Personal Records (PRs) tracking
- ✅ Workout history and analytics
- ✅ Dashboard with quick stats

### Phase 2: Goals, Measurements & Nutrition (Coming Soon)
- Goal setting and tracking
- Body measurements and progress photos
- Nutrition tracking with macro counting
- Workout programs and templates

### Phase 3: Social & Gamification (Future)
- Social features (friends, sharing achievements)
- Leaderboards and challenges
- Achievement badges and leveling system
- Push notifications

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Neon.tech account (free tier available)
- Google OAuth credentials (optional)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd fitness-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your database**

   - Go to [Neon.tech](https://neon.tech) and create a free account
   - Create a new project
   - Copy your connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

4. **Configure environment variables**

   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update your `.env` file:
   ```env
   DATABASE_URL="your-neon-connection-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="run: openssl rand -base64 32"

   # Optional: Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

5. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as your `NEXTAUTH_SECRET` in `.env`

6. **Push database schema**
   ```bash
   npx prisma db push
   ```

7. **Seed the database** (optional - will add exercise data)
   ```bash
   npx prisma db seed
   ```

8. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

9. **Run the development server**
   ```bash
   npm run dev
   ```

10. **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format Prisma schema
npx prisma format

# Open Prisma Studio (Database GUI)
npx prisma studio

# Create a migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Project Structure

```
fitness-tracker/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── workouts/
│   │   └── exercises/
│   ├── dashboard/         # Main dashboard
│   ├── workouts/          # Workout pages
│   │   ├── active/        # Active workout screen
│   │   ├── history/
│   │   └── [id]/
│   ├── exercises/         # Exercise library
│   ├── progress/          # Progress tracking
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── workout/          # Workout-specific components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeder
├── public/               # Static assets
└── types/                # TypeScript types
```

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User**: User accounts and fitness profiles
- **Exercise**: Exercise database with 300+ exercises
- **Workout**: Workout sessions
- **WorkoutExercise**: Exercises within a workout
- **WorkoutSet**: Individual sets (reps, weight, etc.)
- **PersonalRecord**: Personal bests tracking
- **FavoriteExercise**: User's favorite exercises

See [prisma/schema.prisma](prisma/schema.prisma) for the complete schema.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)

4. Deploy!

### Set up Neon.tech for Production

1. Your Neon database will automatically work in production
2. Make sure to use the connection string with `?sslmode=require`
3. Consider upgrading to a paid plan for production use

## PWA Configuration

This app is configured as a Progressive Web App (PWA):

- Installable on mobile and desktop
- Offline support (coming in Phase 3)
- Push notifications (coming in Phase 3)
- Add to home screen functionality

## Contributing

This is a comprehensive fitness tracking application. Contributions are welcome!

### Development Phases

**Phase 1** (Current): Core workout tracking, exercise database, PRs
**Phase 2**: Goals, measurements, nutrition tracking
**Phase 3**: Social features, gamification, notifications

## License

MIT License - feel free to use this project for your own fitness tracking needs!

## Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation in `/docs`

---

Built with ❤️ for the fitness community
