import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const exercises = [
  // BARBELL - CHEST
  {
    name: 'Barbell Bench Press',
    description: 'The king of chest exercises. Lie on a flat bench and press the barbell from chest to full arm extension.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/Jkd2EX89N0W-Vq',
    instructions: [
      'Lie flat on the bench with feet planted firmly on the ground',
      'Grip the barbell slightly wider than shoulder-width',
      'Unrack the bar and position it above your chest with arms extended',
      'Lower the bar to your mid-chest in a controlled manner',
      'Press the bar back up to starting position',
      'Repeat for desired reps'
    ],
    tips: [
      'Keep your shoulder blades retracted throughout the movement',
      'Maintain a slight arch in your lower back',
      'Don\'t bounce the bar off your chest',
      'Keep your wrists straight'
    ],
    alternatives: []
  },
  {
    name: 'Incline Barbell Bench Press',
    description: 'Targets the upper chest. Performed on an incline bench set at 30-45 degrees.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'incline bench'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/7FUdvE2D7aXq5j',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Lie back and grip barbell slightly wider than shoulders',
      'Unrack and lower bar to upper chest',
      'Press back up to starting position'
    ],
    tips: [
      'Higher angle = more shoulder involvement',
      '30 degrees is optimal for upper chest',
      'Keep elbows at 45-degree angle to body'
    ],
    alternatives: []
  },

  // BARBELL - BACK
  {
    name: 'Barbell Deadlift',
    description: 'The ultimate full-body strength exercise. Lift the barbell from the ground to a standing position.',
    muscleGroups: ['back'],
    secondaryMuscles: ['legs', 'core', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/-LbhRICTNyMg4j',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend down and grip the bar just outside your legs',
      'Engage your lats, keep chest up and back straight',
      'Drive through your heels and extend your hips and knees',
      'Stand up fully, pulling shoulders back at the top',
      'Lower the bar back down with control'
    ],
    tips: [
      'Keep the bar close to your body throughout',
      'Don\'t round your back',
      'Engage your core before each rep',
      'Think "push the floor away" rather than "pull the bar up"'
    ],
    alternatives: []
  },
  {
    name: 'Barbell Row',
    description: 'Fundamental back thickness builder. Row the barbell to your torso while bent over.',
    muscleGroups: ['back'],
    secondaryMuscles: ['biceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/TKY-wRzg7NeCzO',
    instructions: [
      'Bend at hips with back straight, knees slightly bent',
      'Grip barbell slightly wider than shoulder-width',
      'Pull bar to lower chest/upper stomach',
      'Squeeze shoulder blades together at the top',
      'Lower with control'
    ],
    tips: [
      'Keep torso at 45-degree angle',
      'Pull with your back, not just arms',
      'Avoid using momentum'
    ],
    alternatives: []
  },

  // BARBELL - LEGS
  {
    name: 'Barbell Back Squat',
    description: 'The king of leg exercises. Squat down with barbell on your upper back.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['glutes', 'core', 'back'],
    equipment: ['barbell', 'squat rack'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/gBBRGT9Ey88I02',
    instructions: [
      'Position bar on upper traps (high bar) or rear delts (low bar)',
      'Unrack and step back with feet shoulder-width apart',
      'Descend by breaking at the knees and hips simultaneously',
      'Go down until thighs are at least parallel to ground',
      'Drive through your heels to return to starting position'
    ],
    tips: [
      'Keep chest up and core engaged',
      'Knees should track over toes',
      'Maintain neutral spine',
      'Go as deep as your mobility allows'
    ],
    alternatives: []
  },
  {
    name: 'Barbell Front Squat',
    description: 'Quad-dominant squat variation with barbell held on front shoulders.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['core', 'back'],
    equipment: ['barbell', 'squat rack'],
    difficulty: 'advanced',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/8N9tRY8YMI3nBp',
    instructions: [
      'Rest bar on front delts, crossed arms or clean grip',
      'Keep elbows high and torso upright',
      'Squat down keeping chest up',
      'Drive through heels to stand'
    ],
    tips: [
      'Requires good ankle and wrist mobility',
      'Keeps torso more upright than back squat',
      'More quad emphasis'
    ],
    alternatives: []
  },

  // BARBELL - SHOULDERS
  {
    name: 'Barbell Overhead Press',
    description: 'Press the barbell from shoulders to overhead. Essential shoulder builder.',
    muscleGroups: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/nIiQEsKrM1Y0zl',
    instructions: [
      'Start with bar at shoulder height, hands shoulder-width apart',
      'Brace core and glutes',
      'Press bar straight up, moving head back slightly',
      'Lock out arms at the top',
      'Lower with control back to shoulders'
    ],
    tips: [
      'Don\'t lean back excessively',
      'Squeeze glutes to protect lower back',
      'Bar path should be straight vertical'
    ],
    alternatives: []
  },

  // DUMBBELL - CHEST
  {
    name: 'Dumbbell Bench Press',
    description: 'Press dumbbells from chest level. Allows greater range of motion than barbell.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/n1-p0HjZTYYtPj',
    instructions: [
      'Lie flat on bench with dumbbells at chest level',
      'Press dumbbells up until arms are fully extended',
      'Lower dumbbells with control until they touch chest',
      'Press back up'
    ],
    tips: [
      'Allows deeper stretch than barbell',
      'Keep dumbbells parallel or angled slightly',
      'Control the descent'
    ],
    alternatives: []
  },
  {
    name: 'Dumbbell Flye',
    description: 'Isolation exercise for chest. Arc dumbbells out and down, then back up.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/yLDi3VpAE9HGAM',
    instructions: [
      'Lie on bench with dumbbells above chest, slight bend in elbows',
      'Arc dumbbells out to sides in a wide arc',
      'Feel stretch in chest, then reverse motion',
      'Squeeze chest at the top'
    ],
    tips: [
      'Keep slight bend in elbows throughout',
      'Focus on the stretch',
      'Don\'t go too heavy'
    ],
    alternatives: []
  },

  // DUMBBELL - BACK
  {
    name: 'Dumbbell Row',
    description: 'Single-arm rowing movement. Excellent for back development.',
    muscleGroups: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/YMBGqJI95y4M5F',
    instructions: [
      'Place one knee and hand on bench for support',
      'Let dumbbell hang with arm extended',
      'Row dumbbell to hip, pulling elbow back',
      'Squeeze shoulder blade at top',
      'Lower with control'
    ],
    tips: [
      'Keep back flat and parallel to ground',
      'Pull with your back, not just arm',
      'Don\'t rotate torso'
    ],
    alternatives: []
  },

  // DUMBBELL - SHOULDERS
  {
    name: 'Dumbbell Lateral Raise',
    description: 'Isolation exercise for side delts. Raise dumbbells out to the sides.',
    muscleGroups: ['shoulders'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/3w9P9l87YLr9bv',
    instructions: [
      'Stand with dumbbells at sides, slight bend in elbows',
      'Raise arms out to sides until parallel to ground',
      'Lower with control',
      'Repeat'
    ],
    tips: [
      'Lead with elbows, not hands',
      'Don\'t swing or use momentum',
      'Control the negative'
    ],
    alternatives: []
  },
  {
    name: 'Dumbbell Shoulder Press',
    description: 'Press dumbbells from shoulder height to overhead.',
    muscleGroups: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/NP35cDkx91HZPA',
    instructions: [
      'Sit on bench with back support, dumbbells at shoulder height',
      'Press dumbbells up until arms are extended',
      'Lower back to shoulders with control'
    ],
    tips: [
      'Can be done standing or seated',
      'Keep core engaged',
      'Don\'t arch back excessively'
    ],
    alternatives: []
  },

  // DUMBBELL - ARMS
  {
    name: 'Dumbbell Bicep Curl',
    description: 'Classic bicep exercise. Curl dumbbells from extended position to shoulders.',
    muscleGroups: ['arms'],
    secondaryMuscles: ['forearms'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/W61xFmVvkLCQ-3',
    instructions: [
      'Stand with dumbbells at sides, palms facing forward',
      'Curl dumbbells up to shoulders',
      'Squeeze biceps at the top',
      'Lower with control'
    ],
    tips: [
      'Keep elbows stationary',
      'Don\'t swing',
      'Control the eccentric'
    ],
    alternatives: []
  },
  {
    name: 'Dumbbell Tricep Extension',
    description: 'Overhead tricep isolation. Extend dumbbell overhead.',
    muscleGroups: ['arms'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/rMh5R7JgPvn-qE',
    instructions: [
      'Hold dumbbell overhead with both hands',
      'Lower dumbbell behind head by bending elbows',
      'Extend arms back to starting position'
    ],
    tips: [
      'Keep elbows pointing forward',
      'Don\'t flare elbows out',
      'Control the weight'
    ],
    alternatives: []
  },

  // DUMBBELL - LEGS
  {
    name: 'Dumbbell Lunges',
    description: 'Step forward into a lunge position with dumbbells.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/4lV3RYHJbnI8bX',
    instructions: [
      'Hold dumbbells at sides',
      'Step forward with one leg',
      'Lower hips until both knees are at 90 degrees',
      'Push back to starting position',
      'Alternate legs'
    ],
    tips: [
      'Keep front knee over ankle',
      'Don\'t let knee pass toes',
      'Maintain upright torso'
    ],
    alternatives: []
  },
  {
    name: 'Dumbbell Goblet Squat',
    description: 'Squat while holding a dumbbell at chest level.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['core'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/J0oQDvhSJw8R8j',
    instructions: [
      'Hold dumbbell vertically at chest, elbows pointing down',
      'Squat down between your legs',
      'Keep chest up and weight on heels',
      'Drive back up to standing'
    ],
    tips: [
      'Great for learning squat form',
      'Allows deep squat',
      'Keep elbows inside knees at bottom'
    ],
    alternatives: []
  },

  // BODYWEIGHT - CHEST
  {
    name: 'Push-up',
    description: 'Classic bodyweight chest exercise. Lower body to ground and push back up.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/8gm3Tt3UNJEKv7',
    instructions: [
      'Start in plank position, hands shoulder-width apart',
      'Lower body until chest nearly touches ground',
      'Keep body in straight line',
      'Push back up to starting position'
    ],
    tips: [
      'Keep core engaged throughout',
      'Don\'t let hips sag',
      'Full range of motion is important'
    ],
    alternatives: []
  },
  {
    name: 'Diamond Push-up',
    description: 'Push-up variation with hands close together forming a diamond shape.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/8HoLTPJaH46KlN',
    instructions: [
      'Place hands close together forming diamond with fingers',
      'Lower body keeping elbows close to sides',
      'Push back up'
    ],
    tips: [
      'More tricep emphasis',
      'Harder than regular push-ups',
      'Keep elbows tucked'
    ],
    alternatives: []
  },

  // BODYWEIGHT - BACK
  {
    name: 'Pull-up',
    description: 'Pull your body up until chin is over the bar. Ultimate back and bicep builder.',
    muscleGroups: ['back'],
    secondaryMuscles: ['biceps', 'core'],
    equipment: ['pull-up bar'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/OoNo8Nn1UMLaZy',
    instructions: [
      'Hang from bar with hands slightly wider than shoulders, palms away',
      'Pull yourself up until chin is over bar',
      'Lower with control back to full hang'
    ],
    tips: [
      'Pull with your back, not just arms',
      'Full range of motion is key',
      'Don\'t kip or swing'
    ],
    alternatives: []
  },
  {
    name: 'Chin-up',
    description: 'Pull-up variation with palms facing toward you. More bicep involvement.',
    muscleGroups: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['pull-up bar'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/3EjEwh-vBU6Wod',
    instructions: [
      'Hang from bar with palms facing you, shoulder-width grip',
      'Pull up until chin clears bar',
      'Lower back down with control'
    ],
    tips: [
      'Easier than pull-ups for most people',
      'More bicep activation',
      'Great for building pull-up strength'
    ],
    alternatives: []
  },

  // BODYWEIGHT - CORE
  {
    name: 'Plank',
    description: 'Hold a push-up position on forearms. Essential core stability exercise.',
    muscleGroups: ['core'],
    secondaryMuscles: ['shoulders', 'glutes'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/VvPIGZfHZNcIBT',
    instructions: [
      'Start on forearms and toes, body in straight line',
      'Engage core and glutes',
      'Hold position without letting hips sag or pike up',
      'Breathe normally'
    ],
    tips: [
      'Keep body in straight line',
      'Don\'t hold your breath',
      'Squeeze glutes and core',
      'Start with 30 seconds, work up to 2+ minutes'
    ],
    alternatives: []
  },
  {
    name: 'Crunches',
    description: 'Classic ab exercise. Lift shoulders off ground using core.',
    muscleGroups: ['core'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/6Xr3DjMaU2y9yj',
    instructions: [
      'Lie on back, knees bent, feet flat',
      'Hands behind head or crossed on chest',
      'Lift shoulders off ground using abs',
      'Lower back down with control'
    ],
    tips: [
      'Don\'t pull on your neck',
      'Focus on using abs, not momentum',
      'Exhale as you crunch up'
    ],
    alternatives: []
  },
  {
    name: 'Russian Twist',
    description: 'Seated core rotation exercise. Great for obliques.',
    muscleGroups: ['core'],
    secondaryMuscles: ['obliques'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/c9eO2FO6GZVnPz',
    instructions: [
      'Sit on ground, lean back slightly, feet off ground',
      'Hold weight or clasp hands',
      'Rotate torso side to side, touching ground on each side'
    ],
    tips: [
      'Keep feet off ground for more challenge',
      'Rotate from the core, not just arms',
      'Control the movement'
    ],
    alternatives: []
  },

  // BODYWEIGHT - LEGS
  {
    name: 'Bodyweight Squat',
    description: 'Fundamental squat pattern with no weight. Great for learning form.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/uD-BQFOevXf3A7',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower hips back and down as if sitting in a chair',
      'Keep chest up and knees tracking over toes',
      'Go down until thighs are parallel or lower',
      'Drive through heels to stand back up'
    ],
    tips: [
      'Perfect form before adding weight',
      'Can be done anywhere',
      'Great warm-up exercise'
    ],
    alternatives: []
  },
  {
    name: 'Jump Squat',
    description: 'Explosive squat variation. Squat down then jump up.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['glutes'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    exerciseType: 'plyometric',
    gifUrl: 'https://v2.exercisedb.io/image/hm7UQjQBK5rBg9',
    instructions: [
      'Start in squat position',
      'Explode up into a jump',
      'Land softly back in squat position',
      'Repeat immediately'
    ],
    tips: [
      'Land softly on balls of feet',
      'Great for power and explosiveness',
      'High impact on knees'
    ],
    alternatives: []
  },

  // CARDIO
  {
    name: 'Running',
    description: 'Classic cardiovascular exercise. Run at various paces for conditioning.',
    muscleGroups: ['full_body'],
    secondaryMuscles: ['legs', 'core'],
    equipment: ['none'],
    difficulty: 'beginner',
    exerciseType: 'cardio',
    gifUrl: 'https://v2.exercisedb.io/image/SJPkDO2sWVdSg0',
    instructions: [
      'Maintain upright posture',
      'Land mid-foot, not heel',
      'Swing arms naturally',
      'Breathe rhythmically'
    ],
    tips: [
      'Start slow if you\'re new',
      'Build up mileage gradually',
      'Good running shoes are important'
    ],
    alternatives: []
  },
  {
    name: 'Jump Rope',
    description: 'High-intensity cardio. Jump over a rope continuously.',
    muscleGroups: ['full_body'],
    secondaryMuscles: ['legs', 'shoulders', 'core'],
    equipment: ['jump rope'],
    difficulty: 'beginner',
    exerciseType: 'cardio',
    gifUrl: 'https://v2.exercisedb.io/image/6s5qV-CULDZaZe',
    instructions: [
      'Hold rope handles at sides',
      'Swing rope over head and jump as it passes under feet',
      'Land on balls of feet',
      'Keep jumps small and controlled'
    ],
    tips: [
      'Great for conditioning',
      'Improves coordination',
      'Adjust rope length to your height'
    ],
    alternatives: []
  },
  {
    name: 'Burpees',
    description: 'Full-body conditioning exercise. Drop to push-up, jump back up.',
    muscleGroups: ['full_body'],
    secondaryMuscles: ['chest', 'legs', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    exerciseType: 'cardio',
    gifUrl: 'https://v2.exercisedb.io/image/OKYgV2XhJ5EBsZ',
    instructions: [
      'Start standing',
      'Drop into push-up position',
      'Do a push-up',
      'Jump feet back to hands',
      'Jump up with arms overhead',
      'Repeat'
    ],
    tips: [
      'Brutal but effective',
      'Can modify by removing jump or push-up',
      'Great for fat loss'
    ],
    alternatives: []
  },

  // MACHINE EXERCISES
  {
    name: 'Leg Press',
    description: 'Machine-based leg exercise. Push weight sled with your feet.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['glutes'],
    equipment: ['machine'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/8cSFz1GV45z-F4',
    instructions: [
      'Sit in leg press machine, feet on platform shoulder-width apart',
      'Release safety bars',
      'Lower weight by bending knees',
      'Push through heels to extend legs',
      'Don\'t lock out knees'
    ],
    tips: [
      'Don\'t round your lower back',
      'Foot placement changes emphasis',
      'Safer than squats for some people'
    ],
    alternatives: []
  },
  {
    name: 'Lat Pulldown',
    description: 'Cable machine exercise for back. Pull bar down to chest.',
    muscleGroups: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/2R-cJoGRW8VdV7',
    instructions: [
      'Sit at lat pulldown machine, grip bar wider than shoulders',
      'Pull bar down to upper chest',
      'Squeeze shoulder blades together',
      'Control the weight back up'
    ],
    tips: [
      'Great for building pull-up strength',
      'Lean back slightly',
      'Pull with your back, not arms'
    ],
    alternatives: []
  },
  {
    name: 'Cable Chest Flye',
    description: 'Cable variation of dumbbell flyes. Provides constant tension.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['cable'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/lkqVUlKPIwZM6O',
    instructions: [
      'Set cables to chest height on both sides',
      'Grab handles and step forward',
      'Bring hands together in front of chest',
      'Control back to starting position'
    ],
    tips: [
      'Constant tension throughout movement',
      'Great for chest isolation',
      'Adjust height for different chest areas'
    ],
    alternatives: []
  },
  {
    name: 'Leg Extension',
    description: 'Machine isolation exercise for quadriceps.',
    muscleGroups: ['legs'],
    secondaryMuscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/C8E7R8p0cEU09S',
    instructions: [
      'Sit in machine, ankles behind pad',
      'Extend legs until straight',
      'Lower back down with control'
    ],
    tips: [
      'Pure quad isolation',
      'Don\'t use momentum',
      'Control the negative'
    ],
    alternatives: []
  },
  {
    name: 'Leg Curl',
    description: 'Machine isolation exercise for hamstrings.',
    muscleGroups: ['legs'],
    secondaryMuscles: ['hamstrings'],
    equipment: ['machine'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/DM5QBTWVLkXKyb',
    instructions: [
      'Lie face down on machine, ankles under pad',
      'Curl legs up toward glutes',
      'Lower back down with control'
    ],
    tips: [
      'Pure hamstring isolation',
      'Keep hips on pad',
      'Full range of motion'
    ],
    alternatives: []
  },

  // ADDITIONAL COMPOUND MOVEMENTS
  {
    name: 'Dips',
    description: 'Bodyweight exercise for chest and triceps. Lower body between parallel bars.',
    muscleGroups: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['dip bars'],
    difficulty: 'intermediate',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/4bYATbnLPq5q45',
    instructions: [
      'Grip parallel bars and support body with arms extended',
      'Lower body by bending arms',
      'Lean forward for chest emphasis, stay upright for triceps',
      'Push back up to starting position'
    ],
    tips: [
      'Lean forward = more chest',
      'Upright = more triceps',
      'Control the descent'
    ],
    alternatives: []
  },
  {
    name: 'Face Pull',
    description: 'Cable exercise for rear delts and upper back health.',
    muscleGroups: ['back'],
    secondaryMuscles: ['shoulders'],
    equipment: ['cable'],
    difficulty: 'beginner',
    exerciseType: 'strength',
    gifUrl: 'https://v2.exercisedb.io/image/fV7uLm4J0JX0WK',
    instructions: [
      'Set cable to face height with rope attachment',
      'Pull rope toward face, separating hands',
      'Squeeze shoulder blades together',
      'Control back to start'
    ],
    tips: [
      'Great for shoulder health',
      'Pull to eye level',
      'External rotation of shoulders at end'
    ],
    alternatives: []
  }
]

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing exercises (optional - comment out if you want to keep existing data)
  console.log('Clearing existing exercises...')
  await prisma.exercise.deleteMany()

  console.log('Creating exercises...')
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise,
    })
  }

  console.log(`✅ Created ${exercises.length} exercises`)
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
