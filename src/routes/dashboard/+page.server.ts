// Dashboard server load function
import type { PageServerLoad } from './$types';
import { getLeaderboard, getRecentActivity, getUserTotalPoints } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Get leaderboard
    const leaderboard = await getLeaderboard();
    
    // Get recent activity
    const recentActivity = await getRecentActivity(10);
    
    // Get user's total points
    const totalPoints = await getUserTotalPoints(user.id);
    
    // Calculate user's position in leaderboard
    const userPosition = leaderboard.findIndex(entry => entry.user.id === user.id) + 1;
    
    return {
      user,
      leaderboard,
      recentActivity,
      userStats: {
        totalPoints,
        position: userPosition > 0 ? userPosition : null,
      },
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    
    // Return fallback data
    return {
      user,
      leaderboard: [],
      recentActivity: [],
      userStats: {
        totalPoints: 0,
        position: null,
      },
    };
  }
};
