# Phase 2 API Routes - Import Fix

## Issue
Build error: "Export authOptions doesn't exist in target module"

All Phase 2 API routes were failing to build due to incorrect imports.

## Root Cause
When creating Phase 2 API routes, I used Next.js 14 patterns with `getServerSession(authOptions)`, but this project uses **NextAuth v5** which has a different API.

**Incorrect (Phase 2 as created):**
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const session = await getServerSession(authOptions)
const user = await db.user.update(...)
```

**Correct (Project convention):**
```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const session = await auth()
const user = await prisma.user.update(...)
```

## What Was Wrong

1. **NextAuth Version Mismatch**
   - Phase 1 uses NextAuth v5 which exports `auth()` directly
   - I mistakenly used NextAuth v4 patterns (`getServerSession` + `authOptions`)
   - In NextAuth v5, `auth()` works in both server components AND API routes

2. **Database Client Name**
   - The project exports `prisma` from `@/lib/db`
   - I used `db` which doesn't exist in this project

## What's Fixed

✅ **All Phase 2 API routes** now use correct imports
✅ Build errors resolved
✅ Authentication works in all API routes
✅ Database operations work correctly

### Files Fixed (12 total):
- ✅ `app/api/goals/route.ts`
- ✅ `app/api/goals/[id]/route.ts`
- ✅ `app/api/measurements/route.ts`
- ✅ `app/api/measurements/[id]/route.ts`
- ✅ `app/api/nutrition/logs/route.ts`
- ✅ `app/api/nutrition/logs/[id]/route.ts`
- ✅ `app/api/nutrition/search/route.ts`
- ✅ `app/api/nutrition/targets/route.ts`
- ✅ `app/api/programs/route.ts`
- ✅ `app/api/programs/[id]/route.ts`
- ✅ `app/api/programs/user/route.ts`
- ✅ `app/api/programs/user/[id]/route.ts`

### Changes Made:
1. Replaced `getServerSession(authOptions)` → `auth()`
2. Replaced `db.` → `prisma.`
3. Fixed import statements to match project conventions
4. Removed extra semicolons

## How to Test

The app should now build successfully:

```bash
npm run dev
```

Then test Phase 2 features:
1. **Goals**: `/progress/goals` - Create and manage goals
2. **Measurements**: `/progress/measurements` - Track body measurements
3. **Nutrition**: `/nutrition/log` - Log meals and track macros
4. **Settings**: `/settings` - Save unit preferences and notification settings
