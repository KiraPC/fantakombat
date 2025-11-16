import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'; // Assicurati di avere una funzione di hashing sicura
import * as fs from 'fs'

const prisma = new PrismaClient()

interface ActionData {
  name: string
  points: number
}

interface LessonData {
  lesson_number: number
  week_number: number
  day_number: number
  title: string
  date: string
}

interface StudentActionData {
  action: string
  count: number
  points: number
}

interface StudentLessonData {
  actions: StudentActionData[]
  total_points: number
}

interface ExtractedData {
  students: string[]
  lessons: LessonData[]
  actions: ActionData[]
  student_scores: Record<string, Record<string, StudentLessonData>>
}

async function main() {
  console.log('🚀 Avvio del seed del database...')

  // Leggi i dati estratti dal file JSON
  const dataPath = './real/fantakombat_data.json'
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const data: ExtractedData = JSON.parse(rawData)

  console.log(`📊 Dati caricati: ${data.students.length} studenti, ${data.lessons.length} lezioni, ${data.actions.length} azioni`)

  // Pulisci il database
  console.log('🧹 Pulizia del database...')
  await prisma.score.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.action.deleteMany()
  await prisma.academicYearEnrollment.deleteMany()
  await prisma.academicYear.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  // Crea un utente admin (insegnante)
  console.log('👤 Creazione utente admin...')
  const admin = await prisma.user.create({
    data: {
      email: 'angy@fantakombat.com',
      password: await hashPassword('password123'), // Assicurati di usare una funzione di hashing sicura
      name: 'Angela',
      role: 'INSEGNANTE'
    }
  })

  // Crea un corso
  console.log('🏫 Creazione corso...')
  const course = await prisma.course.create({
    data: {
      name: 'FantaKombat 2025 / 2026',
      description: 'Corso di Fit&Box con sistema di punti',
      ownerId: admin.id
    }
  })

  // Crea un anno accademico
  console.log('📅 Creazione anno accademico...')
  const academicYear = await prisma.academicYear.create({
    data: {
      name: 'Anno 2025 / 2026',
      courseId: course.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-31')
    }
  })

  // Crea gli studenti (come utenti iscritti)
  console.log('🎓 Creazione studenti...')
  const students = await Promise.all(
    data.students.map(async (studentName) => {
      const user = await prisma.user.create({
        data: {
          name: studentName,
          email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@fantakombat.com`,
          role: 'ISCRITTO'
        }
      })
      
      // Iscrivi lo studente all'anno accademico
      await prisma.academicYearEnrollment.create({
        data: {
          userId: user.id,
          academicYearId: academicYear.id
        }
      })
      
      return user
    })
  )

  console.log(`✅ ${students.length} studenti creati`)

  // Crea le azioni
  console.log('⚡ Creazione azioni...')
  // Crea prima le azioni automatiche con categoria
  console.log('⚙️  Creazione azioni automatiche...')
  const automaticActions = [
    {
      name: 'Presenza',
      points: 1.0,
      type: 'BONUS' as const,
      actionCategory: 'SINGLE_PRESENCE' as const,
      isAutomatic: true
    },
    {
      name: 'Assenza',
      points: -0.5,
      type: 'MALUS' as const,
      actionCategory: 'SINGLE_ABSENCE' as const,
      isAutomatic: true
    },
    {
      name: 'Bonus Presenze Consecutive',
      points: 0.5,
      type: 'BONUS' as const,
      actionCategory: 'STREAK_PRESENCE' as const,
      isAutomatic: true
    },
    {
      name: 'Malus Assenze Consecutive',
      points: -0.5,
      type: 'MALUS' as const,
      actionCategory: 'STREAK_ABSENCE' as const,
      isAutomatic: true
    }
  ]

  await Promise.all(
    automaticActions.map(async (actionData) => {
      return await prisma.action.create({
        data: {
          name: actionData.name,
          points: actionData.points,
          courseId: course.id,
          type: actionData.type,
          actionCategory: actionData.actionCategory,
          isAutomatic: actionData.isAutomatic
        }
      })
    })
  )

  // Crea le azioni custom dal file
  const actions = await Promise.all(
    data.actions.map(async (actionData) => {
      return await prisma.action.create({
        data: {
          name: actionData.name,
          points: actionData.points,
          courseId: course.id,
          type: actionData.points >= 0 ? 'BONUS' : 'MALUS',
          isAutomatic: false
        }
      })
    })
  )

  console.log(`✅ ${actions.length} azioni create`)

  // Crea le lezioni
  console.log('📚 Creazione lezioni...')
  const lessons = await Promise.all(
    data.lessons.map(async (lessonData) => {
      // Crea una data valida basata sul numero della settimana
      const baseDate = new Date('2025-01-13') // Data di inizio corso
      const weekOffset = (lessonData.week_number - 1) * 7
      const dayOffset = lessonData.day_number - 1
      const lessonDate = new Date(baseDate.getTime() + (weekOffset + dayOffset) * 24 * 60 * 60 * 1000)
      
      return await prisma.lesson.create({
        data: {
          title: lessonData.title,
          date: lessonDate,
          academicYearId: academicYear.id
        }
      })
    })
  )

  console.log(`✅ ${lessons.length} lezioni create`)

  // Crea i punteggi
  console.log('🏆 Creazione punteggi...')
  let scoreCount = 0

  // Crea mappe per facilitare il lookup
  const studentMap = new Map(students.map(s => [s.name, s]))
  const actionMap = new Map(actions.map(a => [a.name, a]))
  const lessonMap = new Map(lessons.map(l => [l.title, l]))

  for (const [studentName, studentData] of Object.entries(data.student_scores)) {
    const student = studentMap.get(studentName)
    if (!student) {
      console.warn(`⚠️  Studente non trovato: ${studentName}`)
      continue
    }

    for (const [lessonKey, lessonData] of Object.entries(studentData)) {
      // Estrai il numero della lezione dal lessonKey (formato: "10_L10")
      const lessonNumber = parseInt(lessonKey.split('_')[0])
      const lesson = lessons.find(l => l.title && l.title.includes(`Lezione ${lessonNumber}`))
      
      if (!lesson) {
        console.warn(`⚠️  Lezione non trovata: ${lessonKey}`)
        continue
      }

      // Crea un punteggio per ogni azione
      for (const actionData of lessonData.actions) {
        const action = actionMap.get(actionData.action)
        if (!action) {
          console.warn(`⚠️  Azione non trovata: ${actionData.action}`)
          continue
        }

        // Crea un punteggio per ogni occorrenza dell'azione
        for (let i = 0; i < actionData.count; i++) {
          await prisma.score.create({
            data: {
              points: actionData.points / actionData.count,
              userId: student.id,
              lessonId: lesson.id,
              actionId: action.id,
              assignedBy: admin.id
            }
          })
          scoreCount++
        }
      }
    }
  }

  console.log(`✅ ${scoreCount} punteggi creati`)

  // Statistiche finali
  console.log('\n📈 Statistiche finali:')
  console.log(`👥 Studenti: ${await prisma.user.count({ where: { role: 'ISCRITTO' } })}`)
  console.log(`⚡ Azioni: ${await prisma.action.count()}`)
  console.log(`📚 Lezioni: ${await prisma.lesson.count()}`)
  console.log(`🏆 Punteggi: ${await prisma.score.count()}`)

  // Calcola la classifica
  console.log('\n🏅 Top 10 studenti:')
  const topStudents = await prisma.user.findMany({
    where: { role: 'ISCRITTO' },
    select: {
      name: true,
      scores: {
        select: {
          points: true
        }
      }
    },
    orderBy: {
      scores: {
        _count: 'desc'
      }
    },
    take: 10
  })

  topStudents.forEach((student, index) => {
    const totalPoints = student.scores.reduce((sum, score) => sum + score.points, 0)
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${student.name}: ${totalPoints.toFixed(1)} punti`)
  })

  console.log('\n🎉 Seed completato con successo!')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


