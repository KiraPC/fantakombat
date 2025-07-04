// Leaderboard server load function
import type { PageServerLoad } from './$types';
import { getLeaderboard } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Get leaderboard
    const leaderboard = await getLeaderboard();
    
    // Find user's position (only for students)
    let userPosition = null;
    if (user.role === 'ISCRITTO') {
      userPosition = leaderboard.findIndex(entry => entry.user.id === user.id) + 1;
      if (userPosition === 0) userPosition = null;
    }
    
    return {
      user,
      leaderboard,
      userPosition,
    };
  } catch (error) {
    console.error('Leaderboard load error:', error);
    
    // Return fallback data
    return {
      user,
      leaderboard: [],
      userPosition: null,
    };
  }
};
