#!/usr/bin/env python3
"""
Script per estrarre i dati dal file Excel FantaKombat.xls
e generare un file JSON strutturato per il seed del database.
"""

import pandas as pd
import json
import re
from datetime import datetime, timedelta
import calendar

def parse_sheet_dates(sheet_name):
    """
    Estrae le date da un nome di foglio come '13- 15 - 17 Gen 2025'
    Ritorna una lista di date nel formato YYYY-MM-DD
    """
    # Rimuovi spazi extra e normalizza
    sheet_name = re.sub(r'\s+', ' ', sheet_name.strip())
    
    # Casi speciali
    if '23 Aprile 2025' in sheet_name:
        return ['2025-04-23']
    
    if '04-06-Giugno 2025' in sheet_name:
        return ['2025-06-04', '2025-06-06', '2025-06-08']
    
    if 'X-18-20-special Giugno 2025' in sheet_name:
        return ['2025-06-16', '2025-06-18', '2025-06-20']
    
    if '30-02-04 Giugno 2025' in sheet_name:
        return ['2025-05-30', '2025-06-02', '2025-06-04']
    
    # Pattern per estrarre date e mese/anno
    patterns = [
        r'(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\d{1,2})\s+(\w+)\s+(\d{4})',  # es. 13- 15 - 17 Gen 2025
        r'(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\d{1,2})\s*\+?\s*\w*\s+(\w+)\s+(\d{4})',  # es. 18- 20 - 22 + OpenD Marzo 2025
        r'(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\w+)\s+(\d{4})',  # es. 04-06-Giugno 2025
        r'(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\d{1,2})\s+(\w+)\s+(\d{4})',  # variante
        r'(\d{1,2})\s+(\w+)\s+(\d{4})',  # es. 23 Aprile 2025
        r'(\d{1,2})[-\s]+(\d{1,2})[-\s]+(\d{1,2})\s+(\w+)\s+(\d{4})',  # caso generale
    ]
    
    # Mappa dei mesi italiani
    month_map = {
        'gen': 1, 'gennaio': 1,
        'febb': 2, 'febbraio': 2,
        'marzo': 3, 'mar': 3,
        'aprile': 4, 'apr': 4,
        'maggio': 5, 'mag': 5,
        'giugno': 6, 'giu': 6,
        'luglio': 7, 'lug': 7,
        'agosto': 8, 'ago': 8,
        'settembre': 9, 'set': 9,
        'ottobre': 10, 'ott': 10,
        'novembre': 11, 'nov': 11,
        'dicembre': 12, 'dic': 12
    }
    
    dates = []
    
    # Prova i pattern principali
    for pattern in patterns:
        match = re.search(pattern, sheet_name, re.IGNORECASE)
        if match:
            if len(match.groups()) == 5:  # 3 date + mese + anno
                day1, day2, day3, month_str, year = match.groups()
                month = month_map.get(month_str.lower())
                if month:
                    year = int(year)
                    
                    # Gestisci i casi dove il mese cambia
                    try:
                        dates.append(f"{year:04d}-{month:02d}-{int(day1):02d}")
                        dates.append(f"{year:04d}-{month:02d}-{int(day2):02d}")
                        
                        # Per il terzo giorno, controlla se è del mese successivo
                        if int(day3) < int(day2):
                            # Probabilmente è del mese successivo
                            next_month = month + 1 if month < 12 else 1
                            next_year = year if month < 12 else year + 1
                            dates.append(f"{next_year:04d}-{next_month:02d}-{int(day3):02d}")
                        else:
                            dates.append(f"{year:04d}-{month:02d}-{int(day3):02d}")
                    except ValueError:
                        continue
                    break
            elif len(match.groups()) == 3:  # 1 data + mese + anno
                day, month_str, year = match.groups()
                month = month_map.get(month_str.lower())
                if month:
                    dates.append(f"{int(year):04d}-{month:02d}-{int(day):02d}")
                    break
    
    # Se non abbiamo trovato date valide, restituisci date placeholder
    if not dates:
        print(f"⚠️ Impossibile parsare le date dal foglio: {sheet_name}")
        return []
    
    return dates

def extract_fantakombat_data(file_path):
    """
    Estrae tutti i dati dal file Excel FantaKombat
    """
    print(f"📖 Leggendo il file Excel: {file_path}")
    
    # Leggi il file Excel
    xls = pd.ExcelFile(file_path)
    
    # Inizializza la struttura dati
    data = {
        'course_info': {
            'name': 'FantaKombat Fit&Box',
            'year': '2025',
            'start_date': '2025-01-13',
            'end_date': '2025-07-04',
            'lessons_per_week': 3,
            'total_weeks': 25
        },
        'actions': [],
        'students': [],
        'lessons': [],
        'weekly_scores': {},
        'final_totals': {}
    }
    
    # Estrai le azioni dal primo foglio
    first_sheet = pd.read_excel(file_path, sheet_name=0)
    
    # Definisci le azioni principali
    actions = [
        {'name': 'Presenza', 'points': 1, 'type': 'BONUS'},
        {'name': 'Assenza', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Allenamento ottimale', 'points': 1, 'type': 'BONUS'},
        {'name': 'Sacco con Angy', 'points': 0.5, 'type': 'BONUS'},
        {'name': 'Footwork tutta la settimana', 'points': 0.5, 'type': 'BONUS'},
        {'name': 'Jolly notaio', 'points': 1, 'type': 'BONUS'},
        {'name': 'Ritardo Inizio Lezione', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Imbruttire ad Angy', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Non Urlo tutta la settimana', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Allenamento Schifoso', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Punti extra presenza (1 settimana)', 'points': 0.5, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (2 settimane)', 'points': 1, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (3 settimane)', 'points': 2, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (4 settimane)', 'points': 3, 'type': 'BONUS'},
        {'name': 'Punti extra malus (1 settimana)', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Punti extra malus (2 settimane)', 'points': -1, 'type': 'MALUS'},
        {'name': 'Punti extra malus (3 settimane)', 'points': -1.5, 'type': 'MALUS'},
        {'name': 'Punti extra malus (4 settimane)', 'points': -2, 'type': 'MALUS'},
    ]
    
    data['actions'] = actions
    
    # Estrai studenti dai weekly_scores invece che dal foglio totale
    # Useremo i nomi che abbiamo già raccolto durante l'estrazione dei punteggi
    students = []
    
    # Prima passa per raccogliere i nomi degli studenti
    temp_students = set()
    
    for sheet_name in xls.sheet_names:
        if sheet_name == 'totale FANTAKombat':
            continue
            
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            for idx, row in df.iterrows():
                student_name = row.iloc[1] if len(row) > 1 else None
                
                if pd.notna(student_name) and isinstance(student_name, str):
                    student_name = student_name.strip()
                    if student_name and student_name not in ['Partecipante', 'TOTALE', 'Tot']:
                        temp_students.add(student_name)
        except Exception as e:
            continue
    
    # Crea la lista studenti
    for student_name in sorted(temp_students):
        # Crea email normalizzata
        email = re.sub(r'[^\w\.]', '.', student_name.lower())
        email = re.sub(r'\.+', '.', email)
        email = email.strip('.')
        email = f"{email}@fantakombat.com"
        
        students.append({
            'name': student_name,
            'email': email
        })
    
    data['students'] = students
    print(f"✅ Trovati {len(students)} studenti")
    
    # Estrai le lezioni e i punteggi
    lessons = []
    week_number = 1
    
    for sheet_name in xls.sheet_names:
        if sheet_name == 'totale FANTAKombat':
            continue
            
        print(f"📊 Processando foglio: {sheet_name}")
        
        # Estrai le date dal nome del foglio
        dates = parse_sheet_dates(sheet_name)
        
        if not dates:
            print(f"⚠️ Saltando foglio senza date valide: {sheet_name}")
            continue
        
        # Crea le lezioni per questa settimana
        for i, date in enumerate(dates):
            lesson = {
                'week': week_number,
                'lesson_number': i + 1,
                'date': date,
                'title': f'Lezione {i + 1} - Settimana {week_number}',
                'description': f'Lezione di Fit&Box - {sheet_name}'
            }
            lessons.append(lesson)
        
        # Leggi i dati del foglio
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Estrai i punteggi degli studenti
            for idx, row in df.iterrows():
                student_name = row.iloc[1] if len(row) > 1 else None
                
                if pd.notna(student_name) and isinstance(student_name, str):
                    student_name = student_name.strip()
                    if student_name and student_name not in ['Partecipante', 'TOTALE', 'Tot']:
                        
                        # Inizializza i dati dello studente se non esistono
                        if student_name not in data['weekly_scores']:
                            data['weekly_scores'][student_name] = {}
                        
                        week_key = f'week_{week_number}'
                        data['weekly_scores'][student_name][week_key] = {
                            'actions': [],
                            'total': 0
                        }
                        
                        # Estrai i punteggi dalle colonne
                        total_points = 0
                        col_idx = 2
                        
                        for action in actions[:10]:  # Prime 10 azioni principali
                            if col_idx < len(row):
                                cell_value = row.iloc[col_idx]
                                if pd.notna(cell_value):
                                    calculated_points = calculate_points(str(cell_value), action['points'])
                                    if calculated_points != 0:
                                        data['weekly_scores'][student_name][week_key]['actions'].append({
                                            'action': action['name'],
                                            'value': str(cell_value),
                                            'calculated_points': calculated_points
                                        })
                                        total_points += calculated_points
                            col_idx += 1
                        
                        data['weekly_scores'][student_name][week_key]['total'] = total_points
                        
        except Exception as e:
            print(f"⚠️ Errore nel processare il foglio {sheet_name}: {e}")
            continue
        
        week_number += 1
    
    data['lessons'] = lessons
    print(f"✅ Create {len(lessons)} lezioni")
    
    # Calcola i totali finali
    for student_name in data['weekly_scores']:
        total_points = sum(
            week_data['total'] 
            for week_data in data['weekly_scores'][student_name].values()
        )
        data['final_totals'][student_name] = {
            'total_points': total_points,
            'ranking': 0  # Verrà calcolato dopo
        }
    
    # Calcola le classifiche
    sorted_students = sorted(
        data['final_totals'].items(),
        key=lambda x: x[1]['total_points'],
        reverse=True
    )
    
    for rank, (student_name, student_data) in enumerate(sorted_students, 1):
        data['final_totals'][student_name]['ranking'] = rank
    
    print(f"✅ Dati estratti con successo!")
    print(f"📊 Riepilogo:")
    print(f"   - Studenti: {len(data['students'])}")
    print(f"   - Lezioni: {len(data['lessons'])}")
    print(f"   - Settimane: {week_number - 1}")
    print(f"   - Azioni: {len(data['actions'])}")
    
    return data

def calculate_points(value, base_points):
    """
    Calcola i punti in base al valore nella cella
    """
    if pd.isna(value) or value == '':
        return 0
    
    value_str = str(value).strip().lower()
    
    # Se è vuoto o 0, restituisci 0
    if not value_str or value_str == '0' or value_str == 'nan':
        return 0
    
    # Se contiene 'v', conta le occorrenze
    if 'v' in value_str:
        v_count = value_str.count('v')
        return base_points * v_count
    
    # Se contiene '+', somma i numeri
    if '+' in value_str:
        try:
            parts = value_str.split('+')
            total = 0
            for part in parts:
                part = part.strip()
                if part == 'v':
                    total += base_points
                elif part.replace('.', '').replace('-', '').isdigit():
                    total += float(part)
            return total
        except:
            pass
    
    # Se è un numero, restituiscilo
    try:
        return float(value_str)
    except:
        pass
    
    # Se tutto il resto fallisce, restituisci base_points se c'è qualcosa
    return base_points if value_str else 0

def main():
    file_path = 'FantaKombat.xls'
    
    try:
        # Estrai i dati
        data = extract_fantakombat_data(file_path)
        
        # Salva il file JSON
        output_file = 'fantakombat_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Dati salvati in: {output_file}")
        
        # Genera report
        report_file = 'fantakombat_report.txt'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("REPORT FANTAKOMBAT\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"📊 RIEPILOGO GENERALE\n")
            f.write(f"Studenti totali: {len(data['students'])}\n")
            f.write(f"Lezioni totali: {len(data['lessons'])}\n")
            f.write(f"Settimane: {len(set(lesson['week'] for lesson in data['lessons']))}\n")
            f.write(f"Azioni disponibili: {len(data['actions'])}\n\n")
            
            f.write("🏆 CLASSIFICA FINALE\n")
            f.write("-" * 30 + "\n")
            
            sorted_students = sorted(
                data['final_totals'].items(),
                key=lambda x: x[1]['total_points'],
                reverse=True
            )
            
            for rank, (student_name, student_data) in enumerate(sorted_students, 1):
                f.write(f"{rank:2d}. {student_name:20s} - {student_data['total_points']:6.1f} punti\n")
            
            f.write(f"\n📅 CALENDARIO LEZIONI\n")
            f.write("-" * 30 + "\n")
            
            for lesson in data['lessons']:
                f.write(f"Settimana {lesson['week']:2d} - Lezione {lesson['lesson_number']} - {lesson['date']} - {lesson['title']}\n")
        
        print(f"✅ Report salvato in: {report_file}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
