// Badge definitions for gamification system

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "workout" | "streak" | "pr" | "goal" | "social" | "milestone";
  requirement: {
    type: "workout_count" | "streak_days" | "pr_count" | "goal_count" | "total_volume" | "friend_count";
    value: number;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
}

export const BADGES: Badge[] = [
  // Workout Count Badges
  {
    id: "first_workout",
    name: "First Steps",
    description: "Complete your first workout",
    icon: "🏃",
    category: "workout",
    requirement: { type: "workout_count", value: 1 },
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "10_workouts",
    name: "Getting Started",
    description: "Complete 10 workouts",
    icon: "💪",
    category: "workout",
    requirement: { type: "workout_count", value: 10 },
    rarity: "common",
    xpReward: 100,
  },
  {
    id: "50_workouts",
    name: "Dedicated",
    description: "Complete 50 workouts",
    icon: "🔥",
    category: "workout",
    requirement: { type: "workout_count", value: 50 },
    rarity: "rare",
    xpReward: 250,
  },
  {
    id: "100_workouts",
    name: "Century Club",
    description: "Complete 100 workouts",
    icon: "⭐",
    category: "workout",
    requirement: { type: "workout_count", value: 100 },
    rarity: "epic",
    xpReward: 500,
  },
  {
    id: "500_workouts",
    name: "Fitness Legend",
    description: "Complete 500 workouts",
    icon: "👑",
    category: "workout",
    requirement: { type: "workout_count", value: 500 },
    rarity: "legendary",
    xpReward: 2000,
  },

  // Streak Badges
  {
    id: "3_day_streak",
    name: "Consistency Starter",
    description: "Maintain a 3-day workout streak",
    icon: "📅",
    category: "streak",
    requirement: { type: "streak_days", value: 3 },
    rarity: "common",
    xpReward: 75,
  },
  {
    id: "7_day_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    icon: "🎯",
    category: "streak",
    requirement: { type: "streak_days", value: 7 },
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "30_day_streak",
    name: "Monthly Master",
    description: "Maintain a 30-day workout streak",
    icon: "🏅",
    category: "streak",
    requirement: { type: "streak_days", value: 30 },
    rarity: "epic",
    xpReward: 500,
  },
  {
    id: "100_day_streak",
    name: "Unstoppable",
    description: "Maintain a 100-day workout streak",
    icon: "🔱",
    category: "streak",
    requirement: { type: "streak_days", value: 100 },
    rarity: "legendary",
    xpReward: 1500,
  },

  // Personal Record Badges
  {
    id: "first_pr",
    name: "Record Breaker",
    description: "Set your first personal record",
    icon: "📈",
    category: "pr",
    requirement: { type: "pr_count", value: 1 },
    rarity: "common",
    xpReward: 100,
  },
  {
    id: "10_prs",
    name: "PR Machine",
    description: "Set 10 personal records",
    icon: "🚀",
    category: "pr",
    requirement: { type: "pr_count", value: 10 },
    rarity: "rare",
    xpReward: 300,
  },
  {
    id: "50_prs",
    name: "Strength Elite",
    description: "Set 50 personal records",
    icon: "💎",
    category: "pr",
    requirement: { type: "pr_count", value: 50 },
    rarity: "epic",
    xpReward: 750,
  },

  // Goal Badges
  {
    id: "first_goal",
    name: "Goal Setter",
    description: "Complete your first goal",
    icon: "🎪",
    category: "goal",
    requirement: { type: "goal_count", value: 1 },
    rarity: "common",
    xpReward: 100,
  },
  {
    id: "5_goals",
    name: "Achiever",
    description: "Complete 5 goals",
    icon: "🏆",
    category: "goal",
    requirement: { type: "goal_count", value: 5 },
    rarity: "rare",
    xpReward: 300,
  },
  {
    id: "20_goals",
    name: "Goal Master",
    description: "Complete 20 goals",
    icon: "🌟",
    category: "goal",
    requirement: { type: "goal_count", value: 20 },
    rarity: "epic",
    xpReward: 1000,
  },

  // Social Badges
  {
    id: "first_friend",
    name: "Making Friends",
    description: "Add your first friend",
    icon: "🤝",
    category: "social",
    requirement: { type: "friend_count", value: 1 },
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "10_friends",
    name: "Social Butterfly",
    description: "Add 10 friends",
    icon: "👥",
    category: "social",
    requirement: { type: "friend_count", value: 10 },
    rarity: "rare",
    xpReward: 200,
  },
];

// XP requirements for each level
export const LEVEL_XP_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1400,
  8: 1850,
  9: 2350,
  10: 2900,
  11: 3500,
  12: 4200,
  13: 5000,
  14: 5900,
  15: 6900,
  16: 8000,
  17: 9200,
  18: 10500,
  19: 12000,
  20: 13600,
  21: 15400,
  22: 17300,
  23: 19400,
  24: 21700,
  25: 24200,
  26: 27000,
  27: 30000,
  28: 33300,
  29: 36900,
  30: 40800,
  // Continue pattern for higher levels
};

// Calculate level from total XP
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (const [lvl, requiredXP] of Object.entries(LEVEL_XP_REQUIREMENTS)) {
    if (totalXP >= requiredXP) {
      level = parseInt(lvl);
    } else {
      break;
    }
  }
  return level;
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return LEVEL_XP_REQUIREMENTS[currentLevel + 1] || LEVEL_XP_REQUIREMENTS[30] + (currentLevel - 29) * 5000;
}

// XP rewards for actions
export const XP_REWARDS = {
  WORKOUT_COMPLETE: 25,
  PR_SET: 50,
  GOAL_COMPLETED: 100,
  STREAK_MILESTONE: 75,
  FRIEND_ADDED: 10,
  CHALLENGE_COMPLETED: 150,
};

// Check if user has earned a badge
export function checkBadgeEligibility(
  badge: Badge,
  stats: {
    workoutCount: number;
    streakDays: number;
    prCount: number;
    goalCount: number;
    friendCount: number;
  }
): boolean {
  switch (badge.requirement.type) {
    case "workout_count":
      return stats.workoutCount >= badge.requirement.value;
    case "streak_days":
      return stats.streakDays >= badge.requirement.value;
    case "pr_count":
      return stats.prCount >= badge.requirement.value;
    case "goal_count":
      return stats.goalCount >= badge.requirement.value;
    case "friend_count":
      return stats.friendCount >= badge.requirement.value;
    default:
      return false;
  }
}
