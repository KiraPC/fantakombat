#!/usr/bin/env python3
"""
Script per creare un report dettagliato dei dati FantaKombat.
"""

import json
from datetime import datetime

def create_detailed_report():
    """Crea un report dettagliato dei dati FantaKombat."""
    
    # Carica i dati JSON
    with open('fantakombat_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    report = []
    
    # Intestazione
    report.append("=" * 80)
    report.append("REPORT DETTAGLIATO FANTAKOMBAT")
    report.append("=" * 80)
    report.append(f"Generato il: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    report.append("")
    
    # Informazioni corso
    report.append("INFORMAZIONI CORSO")
    report.append("-" * 40)
    course_info = data['course_info']
    report.append(f"Nome: {course_info['name']}")
    report.append(f"Anno: {course_info['year']}")
    report.append(f"Periodo: {course_info['start_date']} - {course_info['end_date']}")
    report.append(f"Lezioni per settimana: {course_info['lessons_per_week']}")
    report.append(f"Totale settimane: {course_info['total_weeks']}")
    report.append(f"Totale lezioni: {len(data['lessons'])}")
    report.append("")
    
    # Studenti
    report.append("LISTA STUDENTI")
    report.append("-" * 40)
    students = data['students']
    for i, student in enumerate(students, 1):
        report.append(f"{i:2d}. {student['name']}")
    report.append(f"\nTotale studenti: {len(students)}")
    report.append("")
    
    # Azioni e punteggi
    report.append("AZIONI E PUNTEGGI")
    report.append("-" * 40)
    
    # Azioni BONUS
    report.append("BONUS:")
    bonus_actions = [a for a in data['actions'] if a['type'] == 'BONUS']
    for action in bonus_actions:
        report.append(f"  • {action['name']}: +{action['points']} punti")
    
    report.append("\nMALUS:")
    malus_actions = [a for a in data['actions'] if a['type'] == 'MALUS']
    for action in malus_actions:
        report.append(f"  • {action['name']}: {action['points']} punti")
    
    report.append("")
    
    # Lezioni
    report.append("CALENDARIO LEZIONI")
    report.append("-" * 40)
    lessons = data['lessons']
    current_week = 0
    for lesson in lessons:
        if lesson['week'] != current_week:
            current_week = lesson['week']
            report.append(f"\nSETTIMANA {current_week}:")
        report.append(f"  Lezione {lesson['lesson_number']}: {lesson['date']} - {lesson['title']}")
    report.append("")
    
    # Classifica finale
    report.append("CLASSIFICA FINALE")
    report.append("-" * 40)
    final_totals = data['final_totals']
    sorted_students = sorted(final_totals.items(), key=lambda x: x[1]['total_points'], reverse=True)
    
    for rank, (name, total_data) in enumerate(sorted_students, 1):
        points = total_data['total_points']
        if points > 0:
            report.append(f"{rank:2d}. {name:<25} {points:>8.1f} punti")
        else:
            report.append(f"{rank:2d}. {name:<25} {points:>8.1f} punti")
    
    report.append("")
    
    # Statistiche
    report.append("STATISTICHE")
    report.append("-" * 40)
    points_list = [total_data['total_points'] for total_data in final_totals.values()]
    
    max_points = max(points_list)
    min_points = min(points_list)
    avg_points = sum(points_list) / len(points_list)
    
    positive_students = len([p for p in points_list if p > 0])
    negative_students = len([p for p in points_list if p < 0])
    zero_students = len([p for p in points_list if p == 0])
    
    report.append(f"Punteggio massimo: {max_points} punti")
    report.append(f"Punteggio minimo: {min_points} punti")
    report.append(f"Punteggio medio: {avg_points:.1f} punti")
    report.append(f"Studenti con punteggio positivo: {positive_students}")
    report.append(f"Studenti con punteggio negativo: {negative_students}")
    report.append(f"Studenti con punteggio zero: {zero_students}")
    report.append("")
    
    # Andamento settimanale per i top 5
    report.append("ANDAMENTO SETTIMANALE TOP 5")
    report.append("-" * 40)
    top_5 = sorted_students[:5]
    
    for rank, (name, _) in enumerate(top_5, 1):
        report.append(f"\n{rank}. {name}:")
        if name in data['weekly_scores']:
            weekly_data = data['weekly_scores'][name]
            week_points = []
            for week_num in range(1, 26):  # 25 settimane
                week_key = f'week_{week_num}'
                if week_key in weekly_data:
                    points = weekly_data[week_key]['total_points']
                    week_points.append(points)
                    if points != 0:
                        report.append(f"   Settimana {week_num:2d}: {points:>6.1f} punti")
                else:
                    week_points.append(0)
            
            # Calcola statistiche per questo studente
            non_zero_weeks = [p for p in week_points if p != 0]
            if non_zero_weeks:
                best_week = max(non_zero_weeks)
                worst_week = min(non_zero_weeks)
                avg_week = sum(non_zero_weeks) / len(non_zero_weeks)
                report.append(f"   Migliore settimana: {best_week} punti")
                report.append(f"   Peggiore settimana: {worst_week} punti")
                report.append(f"   Media settimanale: {avg_week:.1f} punti")
    
    report.append("")
    
    # Salva il report
    with open('fantakombat_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print("Report dettagliato salvato in fantakombat_report.txt")
    
    # Stampa anche un riassunto
    print("\n" + "=" * 50)
    print("RIASSUNTO ESTRAZIONE DATI")
    print("=" * 50)
    print(f"📊 Settimane analizzate: {course_info['total_weeks']}")
    print(f"🎯 Lezioni totali: {len(data['lessons'])}")
    print(f"👥 Studenti: {len(students)}")
    print(f"⚡ Azioni disponibili: {len(data['actions'])}")
    print(f"🏆 Primo classificato: {sorted_students[0][0]} ({sorted_students[0][1]['total_points']} punti)")
    print(f"📈 Punteggio medio: {avg_points:.1f} punti")
    print(f"📄 File JSON: fantakombat_data.json")
    print(f"📝 Report testuale: fantakombat_report.txt")
    
    return report

if __name__ == "__main__":
    create_detailed_report()
