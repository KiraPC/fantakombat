import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'ISCRITTO') {
    throw error(403, 'Accesso negato. Solo gli studenti possono visualizzare le classifiche.');
  }

  const yearId = url.searchParams.get('year');

  try {
    // Get all academic years the student is enrolled in
    const enrollments = await db.academicYearEnrollment.findMany({
      where: {
        userId: locals.user.id
      },
      include: {
        academicYear: {
          include: {
            course: true
          }
        }
      }
    });

    // Get all academic years from enrolled courses
    const availableYears = enrollments.map(enrollment => ({
      id: enrollment.academicYear.id,
      name: enrollment.academicYear.name,
      courseName: enrollment.academicYear.course.name,
      courseId: enrollment.academicYear.course.id,
      startDate: enrollment.academicYear.startDate.toISOString(),
      endDate: enrollment.academicYear.endDate?.toISOString(),
      isActive: enrollment.academicYear.isActive
    }));

    // If no year is selected, use the most recent active year
    let selectedYear: string | null = yearId;
    if (!selectedYear && availableYears.length > 0) {
      const activeYear = availableYears.find(year => year.isActive);
      selectedYear = activeYear?.id || availableYears[0].id;
    }

    let rankings: any[] = [];
    let selectedYearInfo: any = null;

    if (selectedYear) {
      selectedYearInfo = availableYears.find(year => year.id === selectedYear);
      
      // Get all users enrolled in the same academic year
      const academicYearEnrollments = await db.academicYearEnrollment.findMany({
        where: {
          academicYearId: selectedYear
        },
        include: {
          user: true
        }
      });

      // Get all scores for the selected academic year
      const scores = await db.score.findMany({
        where: {
          lesson: {
            academicYearId: selectedYear
          }
        },
        include: {
          user: true,
          action: true,
          lesson: true
        }
      });

      // Calculate rankings
      const userScores = new Map<string, {
        userId: string;
        userName: string;
        userEmail: string;
        totalPoints: number;
        bonusPoints: number;
        malusPoints: number;
        totalLessons: number;
        scoresCount: number;
      }>();

      // Initialize all enrolled users with zero scores
      academicYearEnrollments.forEach((enrollment: any) => {
        if (enrollment.user.role === 'ISCRITTO') {
          userScores.set(enrollment.user.id, {
            userId: enrollment.user.id,
            userName: enrollment.user.name,
            userEmail: enrollment.user.email,
            totalPoints: 0,
            bonusPoints: 0,
            malusPoints: 0,
            totalLessons: 0,
            scoresCount: 0
          });
        }
      });

      // Calculate scores from lessons
      const lessonsByUser = new Map<string, Set<string>>();
      
      scores.forEach(score => {
        if (score.user.role === 'ISCRITTO') {
          const userScore = userScores.get(score.user.id);
          if (userScore) {
            userScore.totalPoints += score.points;
            userScore.scoresCount++;
            
            if (score.points > 0) {
              userScore.bonusPoints += score.points;
            } else {
              userScore.malusPoints += Math.abs(score.points);
            }

            // Track lessons attended
            if (!lessonsByUser.has(score.user.id)) {
              lessonsByUser.set(score.user.id, new Set());
            }
            lessonsByUser.get(score.user.id)!.add(score.lesson.id);
          }
        }
      });

      // Update lesson counts
      lessonsByUser.forEach((lessons, userId) => {
        const userScore = userScores.get(userId);
        if (userScore) {
          userScore.totalLessons = lessons.size;
        }
      });

      // Convert to array and sort by total points
      rankings = Array.from(userScores.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((user, index) => ({
          ...user,
          position: index + 1
        }));
    }

    return {
      rankings,
      availableYears: availableYears.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
      selectedYear,
      selectedYearInfo,
      currentUser: {
        id: locals.user.id,
        name: locals.user.name
      }
    };
  } catch (err) {
    console.error('Error loading rankings:', err);
    throw error(500, 'Errore nel caricamento delle classifiche');
  }
};
