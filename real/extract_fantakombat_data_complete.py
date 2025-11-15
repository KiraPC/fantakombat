#!/usr/bin/env python3
"""
Script per estrarre TUTTI i dati completi dal file Excel FantaKombat
con tutte le azioni e i punteggi corretti
"""

import pandas as pd
import json
import re
from datetime import datetime

def extract_points_from_action_name(action_name):
    """Estrae i punti dal nome dell'azione"""
    # Pattern per punti semplici come (+1pt) o (-0,5pt)
    simple_pattern = r'\(([+-]?\d+(?:[,.]\d+)?)\s*pt\)'
    match = re.search(simple_pattern, action_name)
    if match:
        points_str = match.group(1).replace(',', '.')
        return float(points_str)
    
    # Pattern per "Jolly notaio (+1pt dal mese)"
    if "Jolly notaio" in action_name:
        return 1.0
    
    # Pattern per "Punti extra settimana" positivi
    if "Punti extra settimana" in action_name and "(+0,5pt dopo 1 settimana di presenza)" in action_name:
        return 0.5  # Punti base, può variare
    
    # Pattern per "Punti extra settimana" negativi
    if "Punti extra settimana" in action_name and "(-0,5pt dopo 1settimana di seguito)" in action_name:
        return -0.5  # Punti base, può variare
    
    return 0.0

def parse_action_value(value_str):
    """Parsa il valore dell'azione dalle celle Excel"""
    if pd.isna(value_str) or value_str == '':
        return 0, 0.0
    
    value_str = str(value_str).strip()
    
    # Conta le occorrenze di 'v'
    count = value_str.count('v')
    
    # Gestisce i casi speciali per i punti extra
    if '(' in value_str and 'settimana' in value_str:
        # Estrai il numero di settimane
        week_match = re.search(r'(\d+)\s*settimana', value_str)
        if week_match:
            weeks = int(week_match.group(1))
            return count, weeks
    
    return count, 0.0

def calculate_points_extra_settimana(weeks, is_positive=True):
    """Calcola i punti per le azioni 'Punti extra settimana'"""
    if is_positive:
        # Punti positivi: +0.5, +1, +2, +3
        if weeks == 1:
            return 0.5
        elif weeks == 2:
            return 1.0
        elif weeks == 3:
            return 2.0
        elif weeks == 4:
            return 3.0
        else:
            return 0.5 * weeks  # Fallback
    else:
        # Punti negativi: -0.5, -1, -1.5, -2
        if weeks == 1:
            return -0.5
        elif weeks == 2:
            return -1.0
        elif weeks == 3:
            return -1.5
        elif weeks == 4:
            return -2.0
        else:
            return -0.5 * weeks  # Fallback

def extract_all_data():
    """Estrae tutti i dati dal file Excel"""
    
    # Carica il file Excel
    file_path = 'FantaKombat.xls'
    xls = pd.ExcelFile(file_path)
    
    # Definizione delle azioni complete
    actions = [
        {"name": "Presenza (+1pt)", "points": 1.0},
        {"name": "Assenza (-0,5pt)", "points": -0.5},
        {"name": "Allenamento ottimale(+1pt)", "points": 1.0},
        {"name": "Sacco con Angy (+0,5pt)", "points": 0.5},
        {"name": "Footwork tutta la settimana (+0,5pt)", "points": 0.5},
        {"name": "Punti extra settimana (+0,5pt dopo 1 settimana di presenza) (+1pt dopo 2 settimana di presenza) (+2pt dopo 3 settimana di presenza) (+3pt dopo 4 settimana di presenza)", "points": 0.5},
        {"name": "Jolly notaio (+1pt dal mese)", "points": 1.0},
        {"name": "Ritardo Inizio Lezione  (-0,5pt)", "points": -0.5},
        {"name": "Imbruttire ad Angy (-0,5pt)", "points": -0.5},
        {"name": "Non Urlo tutta la settimana (-0,5pt)", "points": -0.5},
        {"name": "Allenamento Schifoso(-0,5pt)", "points": -0.5},
        {"name": "Punti extra settimana (-0,5pt dopo 1settimana di seguito) (-1pt dopo 2 settimane di seguito) (-1,5pt dopo 3 settimane di seguito) (-2pt dopo 4 settimane di seguito)", "points": -0.5}
    ]
    
    # Mappa delle colonne standard
    column_mapping = {
        2: "Presenza (+1pt)",
        3: "Assenza (-0,5pt)",
        4: "Allenamento ottimale(+1pt)",
        5: "Sacco con Angy (+0,5pt)",
        6: "Footwork tutta la settimana (+0,5pt)",
        7: "Punti extra settimana (+0,5pt dopo 1 settimana di presenza) (+1pt dopo 2 settimana di presenza) (+2pt dopo 3 settimana di presenza) (+3pt dopo 4 settimana di presenza)",
        8: "Jolly notaio (+1pt dal mese)",
        9: "Ritardo Inizio Lezione  (-0,5pt)",
        10: "Imbruttire ad Angy (-0,5pt)",
        11: "Non Urlo tutta la settimana (-0,5pt)",
        12: "Allenamento Schifoso(-0,5pt)",
        13: "Punti extra settimana (-0,5pt dopo 1settimana di seguito) (-1pt dopo 2 settimane di seguito) (-1,5pt dopo 3 settimane di seguito) (-2pt dopo 4 settimane di seguito)"
    }
    
    students = set()
    lessons = []
    student_scores = {}
    
    # Processa ogni foglio (escludendo il totale)
    for sheet_idx, sheet_name in enumerate(xls.sheet_names):
        if 'totale' in sheet_name.lower():
            continue
        
        print(f"Processando foglio: {sheet_name}")
        
        try:
            df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
            
            # Crea le lezioni per questa settimana (3 lezioni per settimana)
            week_number = sheet_idx + 1
            for day in range(3):
                lesson_number = (week_number - 1) * 3 + day + 1
                lessons.append({
                    "lesson_number": lesson_number,
                    "week_number": week_number,
                    "day_number": day + 1,
                    "title": f"Lezione {lesson_number} - Settimana {week_number} - Giorno {day + 1}",
                    "date": sheet_name.split()[0] if day == 0 else 
                           sheet_name.split()[1] if day == 1 and len(sheet_name.split()) > 1 else 
                           sheet_name.split()[2] if day == 2 and len(sheet_name.split()) > 2 else 
                           sheet_name
                })
            
            # Processa i dati degli studenti
            for row_idx in range(1, len(df)):
                row = df.iloc[row_idx]
                
                # Nome studente (colonna 1)
                student_name = row.iloc[1]
                if pd.isna(student_name) or student_name == '':
                    continue
                
                student_name = str(student_name).strip()
                students.add(student_name)
                
                if student_name not in student_scores:
                    student_scores[student_name] = {}
                
                # Calcola i punti per ogni lezione della settimana
                for day in range(3):
                    lesson_number = (week_number - 1) * 3 + day + 1
                    lesson_key = f"{lesson_number:02d}_L{lesson_number}"
                    
                    lesson_actions = []
                    total_points = 0.0
                    
                    # Processa ogni azione
                    for col_idx, action_name in column_mapping.items():
                        if col_idx < len(row):
                            cell_value = row.iloc[col_idx]
                            if pd.notna(cell_value) and cell_value != '':
                                count, extra_info = parse_action_value(cell_value)
                                if count > 0:
                                    # Calcola i punti
                                    base_points = next(a["points"] for a in actions if a["name"] == action_name)
                                    
                                    # Gestione speciale per i punti extra
                                    if "Punti extra settimana" in action_name:
                                        if "presenza" in action_name:
                                            points = calculate_points_extra_settimana(extra_info, True)
                                        else:
                                            points = calculate_points_extra_settimana(extra_info, False)
                                    else:
                                        points = base_points * count
                                    
                                    lesson_actions.append({
                                        "action": action_name,
                                        "count": count,
                                        "points": points
                                    })
                                    total_points += points
                    
                    student_scores[student_name][lesson_key] = {
                        "actions": lesson_actions,
                        "total_points": total_points
                    }
        
        except Exception as e:
            print(f"Errore nel processare il foglio {sheet_name}: {e}")
    
    # Converti i set in liste
    students = sorted(list(students))
    
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
        "student_scores": student_scores
    }
    
    return result

def generate_report(data):
    """Genera un report dettagliato"""
    report = []
    report.append("=" * 80)
    report.append("REPORT ESTRAZIONE DATI FANTAKOMBAT - COMPLETO")
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
    
    # Elenco studenti
    report.append("ELENCO STUDENTI:")
    for i, student in enumerate(data['students'], 1):
        report.append(f"{i:2d}. {student}")
    report.append("")
    
    # Elenco azioni
    report.append("ELENCO AZIONI:")
    for i, action in enumerate(data['actions'], 1):
        report.append(f"{i:2d}. {action['name']} ({action['points']:+.1f} punti)")
    report.append("")
    
    # Statistiche per studente
    report.append("STATISTICHE PER STUDENTE:")
    for student_name, student_data in data['student_scores'].items():
        total_student_points = sum(lesson['total_points'] for lesson in student_data.values())
        lessons_count = len(student_data)
        avg_points = total_student_points / lessons_count if lessons_count > 0 else 0
        report.append(f"- {student_name}: {total_student_points:.1f} punti totali, {lessons_count} lezioni, {avg_points:.1f} punti/lezione")
    report.append("")
    
    # Distribuzione azioni
    action_usage = {}
    for student_data in data['student_scores'].values():
        for lesson_data in student_data.values():
            for action_data in lesson_data['actions']:
                action_name = action_data['action']
                if action_name not in action_usage:
                    action_usage[action_name] = 0
                action_usage[action_name] += action_data['count']
    
    report.append("DISTRIBUZIONE AZIONI:")
    for action_name, count in sorted(action_usage.items(), key=lambda x: x[1], reverse=True):
        report.append(f"- {action_name}: {count} volte")
    report.append("")
    
    report.append("=" * 80)
    
    return '\n'.join(report)

def main():
    print("Estrazione dati completa da FantaKombat.xls...")
    
    # Estrai i dati
    data = extract_all_data()
    
    # Salva i dati JSON
    with open('fantakombat_data_complete.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Dati salvati in: fantakombat_data_complete.json")
    
    # Genera e salva il report
    report = generate_report(data)
    with open('fantakombat_report_complete.txt', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Report salvato in: fantakombat_report_complete.txt")
    print(f"Studenti estratti: {data['total_students']}")
    print(f"Lezioni estratte: {data['total_lessons']}")
    print(f"Azioni estratte: {data['total_actions']}")

if __name__ == "__main__":
    main()
