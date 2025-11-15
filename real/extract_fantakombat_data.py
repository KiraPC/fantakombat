#!/usr/bin/env python3
"""
Script per estrarre i dati del FantaKombat dal file Excel e organizzarli in formato strutturato.
"""

import pandas as pd
import json
from datetime import datetime

def extract_fantakombat_data():
    """Estrae tutti i dati dal file FantaKombat.xls e li organizza in una struttura dati comprensibile."""
    
    file_path = '/Users/pasqualecarminecarbone/Projects/personal/fantakombat_new/FantaKombat.xls'
    
    # Leggi tutti i fogli del file Excel
    df_dict = pd.read_excel(file_path, sheet_name=None)
    
    # Lista delle settimane (escludendo il foglio totale)
    weekly_sheets = [sheet for sheet in df_dict.keys() if sheet != 'totale FANTAKombat']
    
    # Estrai le azioni e i loro punteggi dalla prima settimana
    actions = extract_actions_and_scores(df_dict[weekly_sheets[0]])
    
    # Estrai tutti gli studenti dalla tabella totale
    students = extract_students(df_dict['totale FANTAKombat'])
    
    # Estrai le lezioni (settimane con 3 lezioni ciascuna)
    lessons = extract_lessons(weekly_sheets)
    
    # Estrai i punteggi dettagliati per ogni studente per ogni settimana
    weekly_scores = extract_weekly_scores(df_dict, weekly_sheets)
    
    # Estrai i totali finali
    final_totals = extract_final_totals(df_dict['totale FANTAKombat'])
    
    # Organizza tutto in una struttura dati
    fantakombat_data = {
        'course_info': {
            'name': 'FantaKombat Fit&Box',
            'year': '2025',
            'start_date': '2025-01-13',
            'end_date': '2025-07-04',
            'lessons_per_week': 3,
            'total_weeks': len(weekly_sheets)
        },
        'actions': actions,
        'students': students,
        'lessons': lessons,
        'weekly_scores': weekly_scores,
        'final_totals': final_totals
    }
    
    return fantakombat_data

def extract_actions_and_scores(first_week_df):
    """Estrae le azioni e i relativi punteggi dalle colonne del primo foglio."""
    
    actions = []
    columns = first_week_df.columns.tolist()
    
    # Mappa delle azioni con i loro punteggi
    action_mapping = {
        'Presenza (+1pt)': {'name': 'Presenza', 'points': 1, 'type': 'BONUS'},
        'Assenza (-0,5pt)': {'name': 'Assenza', 'points': -0.5, 'type': 'MALUS'},
        'Allenamento ottimale(+1pt)': {'name': 'Allenamento ottimale', 'points': 1, 'type': 'BONUS'},
        'Sacco con Angy (+0,5pt)': {'name': 'Sacco con Angy', 'points': 0.5, 'type': 'BONUS'},
        'Footwork tutta la settimana (+0,5pt)': {'name': 'Footwork tutta la settimana', 'points': 0.5, 'type': 'BONUS'},
        'Jolly notaio (+1pt dal mese)': {'name': 'Jolly notaio', 'points': 1, 'type': 'BONUS'},
        'Ritardo Inizio Lezione  (-0,5pt)': {'name': 'Ritardo Inizio Lezione', 'points': -0.5, 'type': 'MALUS'},
        'Imbruttire ad Angy (-0,5pt)': {'name': 'Imbruttire ad Angy', 'points': -0.5, 'type': 'MALUS'},
        'Non Urlo tutta la settimana (-0,5pt)': {'name': 'Non Urlo tutta la settimana', 'points': -0.5, 'type': 'MALUS'},
        'Allenamento Schifoso(-0,5pt)': {'name': 'Allenamento Schifoso', 'points': -0.5, 'type': 'MALUS'},
    }
    
    for col in columns:
        if col in action_mapping:
            actions.append(action_mapping[col])
    
    # Aggiungi le azioni per i punti extra (che variano in base alle settimane consecutive)
    actions.extend([
        {'name': 'Punti extra presenza (1 settimana)', 'points': 0.5, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (2 settimane)', 'points': 1, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (3 settimane)', 'points': 2, 'type': 'BONUS'},
        {'name': 'Punti extra presenza (4 settimane)', 'points': 3, 'type': 'BONUS'},
        {'name': 'Punti extra malus (1 settimana)', 'points': -0.5, 'type': 'MALUS'},
        {'name': 'Punti extra malus (2 settimane)', 'points': -1, 'type': 'MALUS'},
        {'name': 'Punti extra malus (3 settimane)', 'points': -1.5, 'type': 'MALUS'},
        {'name': 'Punti extra malus (4 settimane)', 'points': -2, 'type': 'MALUS'},
    ])
    
    return actions

def extract_students(totals_df):
    """Estrae la lista degli studenti dalla tabella totale."""
    
    students = []
    
    # La prima colonna contiene i nomi degli studenti (esclusa la riga di intestazione)
    student_names = totals_df.iloc[1:, 0].dropna().tolist()
    
    for name in student_names:
        if name and name != 'NaN':
            students.append({
                'name': name,
                'email': f"{name.lower().replace(' ', '.').replace('(', '').replace(')', '')}@fantakombat.com",
                'role': 'ISCRITTO'
            })
    
    return students

def extract_lessons(weekly_sheets):
    """Estrae le informazioni sulle lezioni (3 lezioni per settimana)."""
    
    lessons = []
    
    for i, sheet_name in enumerate(weekly_sheets):
        # Estrai le date dalla denominazione del foglio
        week_dates = sheet_name.split(' ')[0].split('-')
        
        # Crea 3 lezioni per settimana
        for j, date_str in enumerate(week_dates[:3]):  # Prende solo le prime 3 date
            lesson_date = f"2025-{parse_date(date_str, sheet_name)}"
            
            lessons.append({
                'week': i + 1,
                'lesson_number': j + 1,
                'date': lesson_date,
                'title': f"Lezione {j + 1} - Settimana {i + 1}",
                'description': f"Lezione di Fit&Box - {sheet_name}"
            })
    
    return lessons

def parse_date(date_str, sheet_name):
    """Converte la stringa data nel formato corretto."""
    
    # Estrai il mese dal nome del foglio
    month_map = {
        'Gen': '01', 'Febb': '02', 'Marzo': '03', 'Aprile': '04',
        'Maggio': '05', 'Giugno': '06', 'Luglio': '07'
    }
    
    month = None
    for month_name, month_num in month_map.items():
        if month_name in sheet_name:
            month = month_num
            break
    
    if not month:
        month = '01'  # Default
    
    # Formatta il giorno
    day = date_str.zfill(2)
    
    return f"{month}-{day}"

def extract_weekly_scores(df_dict, weekly_sheets):
    """Estrae i punteggi settimanali per ogni studente."""
    
    weekly_scores = {}
    
    for week_num, sheet_name in enumerate(weekly_sheets, 1):
        df = df_dict[sheet_name]
        
        # Trova la colonna del nome e del totale
        name_col = None
        total_col = None
        
        for col in df.columns:
            if 'Partecipante' in str(col):
                name_col = col
            elif 'Tot Settimana' in str(col):
                total_col = col
        
        if name_col and total_col:
            # Estrai i dati per ogni studente
            for idx, row in df.iterrows():
                student_name = row[name_col]
                if pd.notna(student_name) and student_name != 'Partecipante':
                    weekly_total = row[total_col]
                    
                    if student_name not in weekly_scores:
                        weekly_scores[student_name] = {}
                    
                    weekly_scores[student_name][f'week_{week_num}'] = {
                        'total_points': weekly_total if pd.notna(weekly_total) else 0,
                        'actions': extract_student_actions_for_week(row, df.columns)
                    }
    
    return weekly_scores

def extract_student_actions_for_week(row, columns):
    """Estrae le azioni specifiche per uno studente in una settimana."""
    
    actions = []
    
    # Mappa delle colonne alle azioni
    action_columns = [
        'Presenza (+1pt)', 'Assenza (-0,5pt)', 'Allenamento ottimale(+1pt)',
        'Sacco con Angy (+0,5pt)', 'Footwork tutta la settimana (+0,5pt)',
        'Jolly notaio (+1pt dal mese)', 'Ritardo Inizio Lezione  (-0,5pt)',
        'Imbruttire ad Angy (-0,5pt)', 'Non Urlo tutta la settimana (-0,5pt)',
        'Allenamento Schifoso(-0,5pt)'
    ]
    
    for col in columns:
        if col in action_columns:
            value = row[col]
            if pd.notna(value) and value != 'NaN':
                actions.append({
                    'action': col,
                    'value': str(value),
                    'calculated_points': calculate_points_from_value(str(value), col)
                })
    
    return actions

def calculate_points_from_value(value, action_col):
    """Calcola i punti effettivi basati sul valore nella cella."""
    
    if not value or value == 'NaN':
        return 0
    
    # Se c'è un valore numerico diretto, usalo
    try:
        # Controllo se è un numero diretto
        clean_value = str(value).replace(',', '.')
        if clean_value.replace('.', '').replace('-', '').isdigit():
            return float(clean_value)
    except:
        pass
    
    # Estrai il punteggio base dell'azione
    base_points = 0
    if '+1pt' in action_col:
        base_points = 1
    elif '+0,5pt' in action_col or '+0.5pt' in action_col:
        base_points = 0.5
    elif '-0,5pt' in action_col or '-0.5pt' in action_col:
        base_points = -0.5
    
    # Se non riusciamo a determinare il punteggio base, ritorna 0
    if base_points == 0:
        return 0
    
    # Conta le 'v' che rappresentano le spunte per l'azione
    v_count = str(value).lower().count('v')
    
    # Se ci sono delle 'v', calcola i punti basati su quelle
    if v_count > 0:
        # Per azioni bonus, ogni 'v' vale il punteggio positivo
        # Per azioni malus, ogni 'v' vale il punteggio negativo
        if base_points > 0:
            return v_count * base_points
        else:
            return v_count * base_points  # base_points è già negativo
    
    # Se non ci sono 'v', conta i numeri e i segni + e -
    value_str = str(value)
    
    # Conta occorrenze di numeri come "1+1+1"
    if '+' in value_str and not 'v' in value_str.lower():
        # Splitta per + e conta i numeri
        parts = value_str.split('+')
        total = 0
        for part in parts:
            try:
                if part.strip():
                    num = float(part.strip())
                    total += num
            except:
                continue
        return total * (1 if base_points > 0 else -1)
    
    # Se ci sono solo segni - 
    if '-' in value_str and not '+' in value_str and not 'v' in value_str.lower():
        minus_count = value_str.count('-')
        return minus_count * abs(base_points) * (-1)
    
    return 0

def extract_final_totals(totals_df):
    """Estrae i totali finali per ogni studente."""
    
    final_totals = {}
    
    # La prima colonna contiene i nomi, l'ultima il totale
    for idx, row in totals_df.iterrows():
        if idx == 0:  # Skip header
            continue
            
        student_name = row.iloc[0]
        total_points = row.iloc[-1]  # Ultima colonna è il totale
        
        if pd.notna(student_name) and student_name != 'NaN':
            final_totals[student_name] = {
                'total_points': total_points if pd.notna(total_points) else 0,
                'ranking': 0  # Verrà calcolato dopo
            }
    
    # Calcola le classifiche
    sorted_students = sorted(final_totals.items(), key=lambda x: x[1]['total_points'], reverse=True)
    for rank, (student_name, data) in enumerate(sorted_students, 1):
        final_totals[student_name]['ranking'] = rank
    
    return final_totals

def save_data_to_json(data, filename='fantakombat_data.json'):
    """Salva i dati in formato JSON."""
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Dati salvati in {filename}")

def print_summary(data):
    """Stampa un riassunto dei dati estratti."""
    
    print("\n=== RIASSUNTO DATI FANTAKOMBAT ===")
    print(f"Corso: {data['course_info']['name']}")
    print(f"Anno: {data['course_info']['year']}")
    print(f"Durata: {data['course_info']['start_date']} - {data['course_info']['end_date']}")
    print(f"Lezioni per settimana: {data['course_info']['lessons_per_week']}")
    print(f"Totale settimane: {data['course_info']['total_weeks']}")
    print(f"Totale lezioni: {len(data['lessons'])}")
    
    print(f"\nStudenti: {len(data['students'])}")
    for student in data['students'][:5]:  # Mostra primi 5
        print(f"  - {student['name']}")
    if len(data['students']) > 5:
        print(f"  ... e altri {len(data['students']) - 5} studenti")
    
    print(f"\nAzioni disponibili: {len(data['actions'])}")
    for action in data['actions'][:5]:  # Mostra prime 5
        print(f"  - {action['name']}: {action['points']} punti ({action['type']})")
    if len(data['actions']) > 5:
        print(f"  ... e altre {len(data['actions']) - 5} azioni")
    
    print("\nCLASSIFICA FINALE (Top 10):")
    top_students = sorted(data['final_totals'].items(), key=lambda x: x[1]['total_points'], reverse=True)[:10]
    for rank, (name, total_data) in enumerate(top_students, 1):
        print(f"  {rank}. {name}: {total_data['total_points']} punti")
    
    print("\n=== FINE RIASSUNTO ===\n")

if __name__ == "__main__":
    print("Estrazione dati FantaKombat in corso...")
    
    # Estrai tutti i dati
    fantakombat_data = extract_fantakombat_data()
    
    # Salva in JSON
    save_data_to_json(fantakombat_data)
    
    # Stampa riassunto
    print_summary(fantakombat_data)
    
    print("Estrazione completata!")
