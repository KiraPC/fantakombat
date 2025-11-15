#!/usr/bin/env python3
"""
Script per estrarre i dati corretti dal foglio totale FantaKombat
"""

import pandas as pd
import json
from datetime import datetime, timedelta

def extract_correct_data():
    """Estrae i dati corretti dal foglio totale"""
    
    # Carica il file Excel
    file_path = 'FantaKombat.xls'
    xls = pd.ExcelFile(file_path)
    
    # Leggi il foglio totale
    df = pd.read_excel(xls, sheet_name='totale FANTAKombat', header=None)
    
    # Estrai i nomi degli studenti e i loro punteggi
    students = []
    student_scores = {}
    
    for i in range(2, len(df)):
        row = df.iloc[i]
        student_name = row.iloc[0]
        
        if pd.notna(student_name):
            student_name = str(student_name).strip()
            students.append(student_name)
            student_scores[student_name] = {}
            
            # Estrai i punteggi per ciascuna settimana (colonne 1-25)
            for week in range(1, 26):
                if week < len(row) and pd.notna(row.iloc[week]):
                    points = float(row.iloc[week])
                    student_scores[student_name][f'week_{week}'] = points
    
    # Crea le lezioni (3 per settimana)
    lessons = []
    base_date = datetime(2025, 1, 13)  # Data di inizio corso
    
    for week in range(1, 26):
        for day in range(1, 4):
            lesson_number = (week - 1) * 3 + day
            lesson_date = base_date + timedelta(days=(week - 1) * 7 + (day - 1))
            
            lessons.append({
                'lesson_number': lesson_number,
                'week_number': week,
                'day_number': day,
                'title': f'Lezione {lesson_number} - Settimana {week} - Giorno {day}',
                'date': lesson_date.strftime('%Y-%m-%d')
            })
    
    # Definisci le azioni standard (dalle analisi precedenti)
    actions = [
        {"name": "Presenza (+1pt)", "points": 1.0},
        {"name": "Assenza (-0,5pt)", "points": -0.5},
        {"name": "Allenamento ottimale(+1pt)", "points": 1.0},
        {"name": "Sacco con Angy (+0,5pt)", "points": 0.5},
        {"name": "Footwork tutta la settimana (+0,5pt)", "points": 0.5},
        {"name": "Punti extra settimana (positivi)", "points": 1.0},
        {"name": "Jolly notaio (+1pt dal mese)", "points": 1.0},
        {"name": "Ritardo Inizio Lezione  (-0,5pt)", "points": -0.5},
        {"name": "Imbruttire ad Angy (-0,5pt)", "points": -0.5},
        {"name": "Non Urlo tutta la settimana (-0,5pt)", "points": -0.5},
        {"name": "Allenamento Schifoso(-0,5pt)", "points": -0.5},
        {"name": "Punti extra settimana (negativi)", "points": -1.0}
    ]
    
    # Converti i punteggi settimanali in punteggi per lezione
    # Ogni punteggio settimanale viene distribuito equamente tra le 3 lezioni
    lesson_scores = {}
    
    for student_name, week_scores in student_scores.items():
        lesson_scores[student_name] = {}
        
        for week_key, week_points in week_scores.items():
            week_number = int(week_key.split('_')[1])
            
            # Distribuisci i punti tra le 3 lezioni della settimana
            points_per_lesson = week_points / 3
            
            for day in range(1, 4):
                lesson_number = (week_number - 1) * 3 + day
                lesson_key = f"{lesson_number:02d}_L{lesson_number}"
                
                # Crea un'azione generica che rappresenta i punti della settimana
                lesson_scores[student_name][lesson_key] = {
                    'actions': [{
                        'action': 'Punteggio Settimanale',
                        'count': 1,
                        'points': points_per_lesson
                    }],
                    'total_points': points_per_lesson
                }
    
    # Aggiungi l'azione per il punteggio settimanale
    actions.append({
        "name": "Punteggio Settimanale",
        "points": 0.0  # Variabile
    })
    
    # Crea il risultato finale
    result = {
        "extraction_date": datetime.now().isoformat(),
        "file_name": "FantaKombat.xls",
        "total_students": len(students),
        "total_lessons": len(lessons),
        "total_actions": len(actions),
        "students": students,
        "lessons": lessons,
        "actions": actions,
        "student_scores": lesson_scores
    }
    
    return result

def generate_report(data):
    """Genera un report dettagliato"""
    report = []
    report.append("=" * 80)
    report.append("REPORT ESTRAZIONE DATI FANTAKOMBAT - CORRETTI DAL FOGLIO TOTALE")
    report.append("=" * 80)
    report.append(f"Data estrazione: {data['extraction_date']}")
    report.append(f"File sorgente: {data['file_name']}")
    report.append("")
    
    # Statistiche generali
    report.append("STATISTICHE GENERALI:")
    report.append(f"- Studenti totali: {data['total_students']}")
    report.append(f"- Lezioni totali: {data['total_lessons']}")
    report.append(f"- Azioni totali: {data['total_actions']}")
    report.append("")
    
    # Statistiche per studente
    report.append("TOTALI PER STUDENTE:")
    for student_name, student_data in data['student_scores'].items():
        total_student_points = sum(lesson['total_points'] for lesson in student_data.values())
        report.append(f"- {student_name}: {total_student_points:.1f} punti")
    report.append("")
    
    report.append("=" * 80)
    
    return '\n'.join(report)

def main():
    print("Estrazione dati corretti dal foglio totale FantaKombat...")
    
    # Estrai i dati
    data = extract_correct_data()
    
    # Salva i dati JSON
    with open('fantakombat_data_corrected.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Dati salvati in: fantakombat_data_corrected.json")
    
    # Genera e salva il report
    report = generate_report(data)
    with open('fantakombat_report_corrected.txt', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Report salvato in: fantakombat_report_corrected.txt")
    print(f"Studenti estratti: {data['total_students']}")
    print(f"Lezioni estratte: {data['total_lessons']}")
    print(f"Azioni estratte: {data['total_actions']}")
    
    # Verifica i totali
    print("\nVerifica totali:")
    for student_name, student_data in data['student_scores'].items():
        total_points = sum(lesson['total_points'] for lesson in student_data.values())
        print(f"{student_name}: {total_points:.1f} punti")

if __name__ == "__main__":
    main()
