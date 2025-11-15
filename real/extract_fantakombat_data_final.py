#!/usr/bin/env python3
"""
Script finale per estrarre i dati da FantaKombat.xls
Mantiene esattamente i nomi come sono nell'Excel (inclusi spazi extra)
"""

import pandas as pd
import json
import re
from datetime import datetime

def calculate_points(value):
    """Calcola i punti basandosi sul valore nella cella"""
    if pd.isna(value) or value == '':
        return 0.0
    
    # Converte a stringa e rimuove spazi
    str_value = str(value).strip()
    
    # Gestisce i casi speciali
    if str_value.lower() == 'v':
        return 1.0
    elif str_value.lower() == 'v+v':
        return 2.0
    elif str_value == '':
        return 0.0
    
    # Prova a convertire in numero
    try:
        # Gestisce virgole come separatori decimali
        if ',' in str_value:
            str_value = str_value.replace(',', '.')
        return float(str_value)
    except ValueError:
        return 0.0

def normalize_date_string(date_str):
    """Normalizza le stringhe delle date dei fogli"""
    # Rimuove spazi extra
    date_str = date_str.strip()
    
    # Sostituisce abbreviazioni
    date_str = date_str.replace('Febb', 'Febbraio')
    date_str = date_str.replace('Marzo', 'Marzo')
    date_str = date_str.replace('Aprile', 'Aprile')
    date_str = date_str.replace('Maggio', 'Maggio')
    date_str = date_str.replace('Giugno', 'Giugno')
    
    return date_str

def extract_fantakombat_data():
    """Estrae tutti i dati dal file Excel"""
    
    # Leggi il file Excel
    xl = pd.ExcelFile('FantaKombat.xls')
    sheet_names = xl.sheet_names
    
    print(f"Fogli disponibili: {len(sheet_names)}")
    for i, name in enumerate(sheet_names):
        print(f"  {i}: {name}")
    
    # Rimuovi il foglio totale
    lesson_sheets = [name for name in sheet_names if 'totale' not in name.lower()]
    print(f"\nFogli lezioni: {len(lesson_sheets)}")
    
    # Strutture dati
    students = set()
    actions = {}
    lessons = []
    scores = []
    
    # Analizza ogni foglio settimanale
    for sheet_name in lesson_sheets:
        print(f"\nAnalizzando foglio: {sheet_name}")
        
        try:
            df = pd.read_excel('FantaKombat.xls', sheet_name=sheet_name)
            
            # Trova la colonna dei partecipanti
            participant_col = None
            for col in df.columns:
                if 'partecipante' in str(col).lower():
                    participant_col = col
                    break
            
            if participant_col is None:
                print(f"  Colonna partecipanti non trovata in {sheet_name}")
                continue
                
            # Trova le righe valide (con nomi di studenti)
            valid_rows = df[df[participant_col].notna()]
            
            if valid_rows.empty:
                print(f"  Nessun partecipante trovato in {sheet_name}")
                continue
            
            # Raccogli i nomi degli studenti ESATTAMENTE come sono nell'Excel
            sheet_students = []
            for name in valid_rows[participant_col]:
                if pd.notna(name):
                    # Mantieni il nome ESATTO, inclusi eventuali spazi extra
                    exact_name = str(name)
                    students.add(exact_name)
                    sheet_students.append(exact_name)
            
            print(f"  Studenti trovati: {len(sheet_students)}")
            
            # Trova le colonne delle azioni (escludendo colonne di sistema)
            action_columns = []
            for col in df.columns:
                col_str = str(col).strip()
                if (col_str != participant_col and 
                    'unnamed' not in col_str.lower() and
                    'settimana' not in col_str.lower() and
                    'tot' not in col_str.lower() and
                    col_str != ''):
                    action_columns.append(col)
            
            print(f"  Azioni trovate: {len(action_columns)}")
            
            # Estrai i punti delle azioni dal nome della colonna
            for action_col in action_columns:
                action_name = str(action_col).strip()
                
                # Estrai i punti dal nome dell'azione usando regex
                points_match = re.search(r'\(([+-]?\d+(?:[.,]\d+)?)\s*pt\)', action_name)
                if points_match:
                    points_str = points_match.group(1).replace(',', '.')
                    points = float(points_str)
                else:
                    points = 0.0
                
                if action_name not in actions:
                    actions[action_name] = points
                    print(f"    Azione: {action_name} -> {points} punti")
            
            # Crea l'oggetto lezione
            lesson = {
                'name': normalize_date_string(sheet_name),
                'date': sheet_name,  # Usa il nome del foglio come data
                'week': len(lessons) + 1
            }
            lessons.append(lesson)
            lesson_id = len(lessons)
            
            # Estrai i punteggi per ogni studente
            for idx, row in valid_rows.iterrows():
                student_name = str(row[participant_col])
                
                for action_col in action_columns:
                    action_name = str(action_col).strip()
                    cell_value = row[action_col]
                    
                    if pd.notna(cell_value):
                        points = calculate_points(cell_value)
                        
                        if points != 0.0:  # Solo se ha punti
                            score = {
                                'student': student_name,
                                'lesson': lesson['name'],
                                'lesson_id': lesson_id,
                                'action': action_name,
                                'points': points,
                                'original_value': str(cell_value)
                            }
                            scores.append(score)
                            
        except Exception as e:
            print(f"  Errore elaborando {sheet_name}: {e}")
            continue
    
    # Converti i set in liste
    students = sorted(list(students))
    actions_list = [{'name': name, 'points': points} for name, points in actions.items()]
    
    # Crea il risultato finale
    result = {
        'students': students,
        'actions': actions_list,
        'lessons': lessons,
        'scores': scores,
        'metadata': {
            'total_students': len(students),
            'total_actions': len(actions_list),
            'total_lessons': len(lessons),
            'total_scores': len(scores),
            'extracted_at': datetime.now().isoformat()
        }
    }
    
    return result

def generate_report(data):
    """Genera un report leggibile dei dati estratti"""
    report = []
    report.append("FANTAKOMBAT - REPORT DATI ESTRATTI")
    report.append("=" * 50)
    report.append(f"Data estrazione: {data['metadata']['extracted_at']}")
    report.append("")
    
    # Statistiche generali
    report.append("STATISTICHE GENERALI:")
    report.append(f"- Studenti: {data['metadata']['total_students']}")
    report.append(f"- Azioni: {data['metadata']['total_actions']}")
    report.append(f"- Lezioni: {data['metadata']['total_lessons']}")
    report.append(f"- Punteggi: {data['metadata']['total_scores']}")
    report.append("")
    
    # Lista studenti
    report.append("STUDENTI:")
    for i, student in enumerate(data['students'], 1):
        report.append(f"{i:2d}. \"{student}\"")
    report.append("")
    
    # Lista azioni
    report.append("AZIONI:")
    for i, action in enumerate(data['actions'], 1):
        report.append(f"{i:2d}. {action['name']} ({action['points']:+.1f} pt)")
    report.append("")
    
    # Lista lezioni
    report.append("LEZIONI:")
    for i, lesson in enumerate(data['lessons'], 1):
        report.append(f"{i:2d}. Settimana {lesson['week']}: {lesson['name']}")
    report.append("")
    
    # Analisi punteggi per studente
    report.append("ANALISI PUNTEGGI PER STUDENTE:")
    student_scores = {}
    for score in data['scores']:
        student = score['student']
        if student not in student_scores:
            student_scores[student] = {'total': 0.0, 'count': 0}
        student_scores[student]['total'] += score['points']
        student_scores[student]['count'] += 1
    
    sorted_students = sorted(student_scores.items(), key=lambda x: x[1]['total'], reverse=True)
    for i, (student, stats) in enumerate(sorted_students, 1):
        report.append(f"{i:2d}. {student}: {stats['total']:+.1f} pt ({stats['count']} azioni)")
    
    return "\n".join(report)

if __name__ == "__main__":
    print("Estrazione dati da FantaKombat.xls...")
    
    try:
        # Estrai i dati
        data = extract_fantakombat_data()
        
        # Salva il JSON
        with open('fantakombat_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Genera e salva il report
        report = generate_report(data)
        with open('fantakombat_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n✅ Estrazione completata!")
        print(f"📊 Dati salvati in: fantakombat_data.json")
        print(f"📄 Report salvato in: fantakombat_report.txt")
        print(f"\nRiepilogo:")
        print(f"- {data['metadata']['total_students']} studenti")
        print(f"- {data['metadata']['total_actions']} azioni")
        print(f"- {data['metadata']['total_lessons']} lezioni")
        print(f"- {data['metadata']['total_scores']} punteggi")
        
    except Exception as e:
        print(f"❌ Errore durante l'estrazione: {e}")
        import traceback
        traceback.print_exc()
