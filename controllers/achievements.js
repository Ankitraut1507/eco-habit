const Achievement = require('../models/Achievement');
const HabitProgress = require('../models/HabitProgress');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user achievements
// @route   GET /api/achievements
// @access  Private
exports.getAchievements = asyncHandler(async (req, res, next) => {
  try {
    console.log(`Fetching achievements for user: ${req.user.id}`);
    let achievement = await Achievement.findOne({ user: req.user.id });

    // If no achievement record exists, create one with default values
    if (!achievement) {
      console.log('No achievements found, creating default record');
      achievement = await Achievement.create({
        user: req.user.id,
        earnedBadges: 0,
        totalPoints: 0,
        nextMilestone: {
          title: "Eco Warrior",
          description: "Complete 50 eco-friendly actions",
          progress: 0,
          total: 50,
          reward: "Gold Badge + 500 Points"
        },
        // Note: badge icons use MaterialCommunityIcons names, not Ionicons
        categories: [
          {
            id: '1',
            name: 'Recycling',
            color: '#4CAF50',
            icon: 'recycle',
            badges: [
              {
                id: 'r1',
                title: 'Recycling Rookie',
                description: 'Recycle for 7 consecutive days',
                icon: 'recycle', // MaterialCommunityIcons name
                progress: 0,
                unlocked: false
              },
              {
                id: 'r2',
                title: 'Recycling Pro',
                description: 'Recycle for 30 consecutive days',
                icon: 'recycle', // MaterialCommunityIcons name
                progress: 0,
                unlocked: false
              }
            ]
          },
          {
            id: '2',
            name: 'Water Conservation',
            color: '#2196F3',
            icon: 'water',
            badges: [
              {
                id: 'w1',
                title: 'Water Saver',
                description: 'Save 100L of water',
                icon: 'water', // MaterialCommunityIcons name
                progress: 0,
                unlocked: false
              },
              {
                id: 'w2',
                title: 'Water Guardian',
                description: 'Save 500L of water',
                icon: 'water', // MaterialCommunityIcons name
                progress: 0,
                unlocked: false
              }
            ]
          },
          {
            id: '3',
            name: 'Energy Saving',
            color: '#FFC107',
            icon: 'flash',
            badges: [
              {
                id: 'e1',
                title: 'Energy Conscious',
                description: 'Reduce energy usage by 10%',
                icon: 'flash', // MaterialCommunityIcons name
                progress: 0,
                unlocked: false
              }
            ]
          }
        ],
        leaderboard: [
          {
            id: req.user.id,
            name: 'You',
            points: 0,
            rank: 1
          }
        ]
      });
      console.log('Default achievement record created');
    }

    try {
      // Update achievements based on user's progress - but handle errors gracefully
      const updatedAchievement = await updateAchievements(achievement);
      
      res.status(200).json({
        success: true,
        data: updatedAchievement || achievement // Fallback to original if update fails
      });
    } catch (updateError) {
      console.error('Error updating achievements, returning original data:', updateError);
      // Return the achievement data even if the update fails
      res.status(200).json({
        success: true,
        data: achievement,
        warning: 'Could not update achievement progress'
      });
    }
  } catch (error) {
    console.error('Error in getAchievements controller:', error);
    return next(new ErrorResponse('Failed to retrieve achievements', 500));
  }
});

// @desc    Update achievement progress
// @route   PUT /api/achievements/:id
// @access  Private
exports.updateAchievement = asyncHandler(async (req, res, next) => {
  const achievement = await Achievement.findOne({ user: req.user.id });

  if (!achievement) {
    return next(new ErrorResponse('Achievement not found', 404));
  }

  // Update the achievement based on the request
  if (req.body.progress !== undefined) {
    // Find the badge in the categories
    for (let category of achievement.categories) {
      const badge = category.badges.find(b => b.id === req.params.id);
      if (badge) {
        badge.progress = req.body.progress;
        if (badge.progress >= 100 && !badge.unlocked) {
          badge.unlocked = true;
          badge.date = Date.now();
          achievement.earnedBadges += 1;
          achievement.totalPoints += 100; // Points for unlocking a badge
        }
        break;
      }
    }
  }

  await achievement.save();

  res.status(200).json({
    success: true,
    data: achievement
  });
});

// Helper function to update achievements based on user's progress
async function updateAchievements(achievement) {
  try {
    // Get user's habit progress
    const habitProgress = await HabitProgress.find({ user: achievement.user }).populate('habit');
    console.log(`Found ${habitProgress.length} habit progress records for user: ${achievement.user}`);

    // Update recycling badges
    const recyclingProgress = habitProgress.filter(h => h.habit && h.habit.category === 'recycle');
    console.log(`Found ${recyclingProgress.length} recycling progress records`);
    
    const streaks = recyclingProgress.map(h => {
      // Check if streak object exists and has current property
      if (h.streak && typeof h.streak.current === 'number') {
        return h.streak.current;
      }
      return 0;
    });
    
    // Calculate recycling streak - max streak across recycling habits
    const recyclingStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    console.log(`Calculated recycling streak: ${recyclingStreak}`);
    
    let recyclingBadges = [];
    const recyclingCategory = achievement.categories.find(c => c.id === '1');
    if (recyclingCategory) {
      recyclingBadges = recyclingCategory.badges;
      
      if (recyclingBadges.length >= 1) {
        recyclingBadges[0].progress = Math.min((recyclingStreak / 7) * 100, 100);
        recyclingBadges[0].unlocked = recyclingStreak >= 7;
        console.log(`Recycling Rookie badge: progress=${recyclingBadges[0].progress}, unlocked=${recyclingBadges[0].unlocked}`);
      }
      
      if (recyclingBadges.length >= 2) {
        recyclingBadges[1].progress = Math.min((recyclingStreak / 30) * 100, 100);
        recyclingBadges[1].unlocked = recyclingStreak >= 30;
        console.log(`Recycling Pro badge: progress=${recyclingBadges[1].progress}, unlocked=${recyclingBadges[1].unlocked}`);
      }
    }

    // Update water conservation badges
    const waterProgress = habitProgress.filter(h => h.habit && h.habit.category === 'water');
    const waterSaved = waterProgress.reduce((total, h) => 
      total + ((h.completedChallenges && Array.isArray(h.completedChallenges)) 
        ? h.completedChallenges.length 
        : 0), 0) * 10; // 10L per challenge
    
    console.log(`Water saved calculation: ${waterSaved}L`);
    
    let waterBadges = [];
    const waterCategory = achievement.categories.find(c => c.id === '2');
    if (waterCategory) {
      waterBadges = waterCategory.badges;
      
      if (waterBadges.length >= 1) {
        waterBadges[0].progress = Math.min((waterSaved / 100) * 100, 100);
        waterBadges[0].unlocked = waterSaved >= 100;
        console.log(`Water Saver badge: progress=${waterBadges[0].progress}, unlocked=${waterBadges[0].unlocked}`);
      }
      
      if (waterBadges.length >= 2) {
        waterBadges[1].progress = Math.min((waterSaved / 500) * 100, 100);
        waterBadges[1].unlocked = waterSaved >= 500;
        console.log(`Water Guardian badge: progress=${waterBadges[1].progress}, unlocked=${waterBadges[1].unlocked}`);
      }
    }

    // Update energy saving badges
    const energyProgress = habitProgress.filter(h => h.habit && h.habit.category === 'energy');
    const energyReduction = energyProgress.reduce((total, h) => 
      total + ((h.completedChallenges && Array.isArray(h.completedChallenges)) 
        ? h.completedChallenges.length 
        : 0), 0) * 5; // 5% per challenge
    
    console.log(`Energy reduction calculation: ${energyReduction}%`);
    
    let energyBadges = [];
    const energyCategory = achievement.categories.find(c => c.id === '3');
    if (energyCategory) {
      energyBadges = energyCategory.badges;
      
      if (energyBadges.length >= 1) {
        energyBadges[0].progress = Math.min(energyReduction, 100);
        energyBadges[0].unlocked = energyReduction >= 10;
        console.log(`Energy Conscious badge: progress=${energyBadges[0].progress}, unlocked=${energyBadges[0].unlocked}`);
      }
    }

    // Calculate earned badges and total points
    const earnedBadges = achievement.categories.reduce((total, category) => 
      total + (category.badges ? category.badges.filter(b => b.unlocked).length : 0), 0);
    
    const totalPoints = earnedBadges * 100; // 100 points per badge
    console.log(`Earned badges: ${earnedBadges}, Total points: ${totalPoints}`);

    // Calculate next milestone progress
    const totalActions = habitProgress.reduce((total, h) => 
      total + ((h.completedChallenges && Array.isArray(h.completedChallenges)) 
        ? h.completedChallenges.length 
        : 0), 0);
    
    // Prepare leaderboard update
    let leaderboardUpdate;
    if (achievement.leaderboard && Array.isArray(achievement.leaderboard)) {
      const existingEntry = achievement.leaderboard.find(entry => 
        entry && entry.id && entry.id.toString() === achievement.user.toString());
      
      if (existingEntry) {
        // Update existing entry
        leaderboardUpdate = achievement.leaderboard.map(entry => {
          if (entry && entry.id && entry.id.toString() === achievement.user.toString()) {
            return { ...entry, points: totalPoints };
          }
          return entry;
        });
      } else {
        // Add new entry
        leaderboardUpdate = [
          ...achievement.leaderboard,
          {
            id: achievement.user.toString(),
            name: 'You',
            points: totalPoints,
            rank: achievement.leaderboard.length + 1
          }
        ];
      }
      
      // Sort by points
      leaderboardUpdate.sort((a, b) => b.points - a.points);
      
      // Update ranks
      leaderboardUpdate.forEach((entry, index) => {
        if (entry) entry.rank = index + 1;
      });
    } else {
      // Initialize leaderboard
      leaderboardUpdate = [{
        id: achievement.user.toString(),
        name: 'You',
        points: totalPoints,
        rank: 1
      }];
    }

    // Use findOneAndUpdate to avoid version conflicts
    const result = await Achievement.findOneAndUpdate(
      { _id: achievement._id },
      {
        $set: {
          earnedBadges,
          totalPoints,
          categories: achievement.categories,
          'nextMilestone.progress': totalActions,
          leaderboard: leaderboardUpdate
        }
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    console.log(`Achievement update successful for user: ${achievement.user}`);
    return result;
  } catch (error) {
    console.error('Error updating achievements:', error);
    // Return the original achievement to avoid breaking the flow
    return achievement;
  }
} 