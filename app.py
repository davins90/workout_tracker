# app.py
import streamlit as st
from datetime import datetime
import pandas as pd
from gspread_pandas import Spread
from config import WORKOUT_DATA

# Configurazione della pagina
st.set_page_config(
    page_title="Workout Tracker",
    page_icon="💪",
    layout="wide"
)

def connect_to_sheet():
    """Connette al foglio Google usando gspread-pandas"""
    try:
        # Usa l'URL dal secrets.toml
        spread = Spread(st.secrets["gsheets"]["spreadsheet_url"])
        return spread
    except Exception as e:
        st.error(f"Errore di connessione al foglio: {e}")
        return None

def load_last_workout_data(spread, workout_type):
    """Carica l'ultimo allenamento salvato"""
    try:
        # Carica il foglio come DataFrame
        df = spread.sheet_to_df(index=False)
        if df.empty:
            return {}
            
        # Filtra per tipo di allenamento e prendi l'ultima data
        filtered_data = df[df['Tipo_Allenamento'] == workout_type]
        if filtered_data.empty:
            return {}
            
        last_date = filtered_data['Data'].max()
        last_workout = filtered_data[filtered_data['Data'] == last_date]
        
        # Crea dizionario con gli ultimi pesi
        last_weights = {}
        for _, row in last_workout.iterrows():
            weights = [row['Serie1'], row['Serie2'], row['Serie3']]
            if 'Serie4' in row:
                weights.append(row['Serie4'])
            last_weights[row['Esercizio']] = weights
            
        return last_weights
    except Exception as e:
        st.error(f"Errore nel caricamento dati: {e}")
        return {}

def save_workout(spread, date, workout_type, group, exercise, weights):
    """Salva i dati dell'allenamento"""
    try:
        # Carica i dati esistenti
        existing_data = spread.sheet_to_df(index=False)
        
        # Crea nuova riga
        new_row = pd.DataFrame([{
            'Data': date.strftime('%Y-%m-%d'),
            'Tipo_Allenamento': workout_type,
            'Gruppo': group,
            'Esercizio': exercise,
            'Serie1': weights[0],
            'Serie2': weights[1],
            'Serie3': weights[2],
            'Serie4': weights[3] if len(weights) > 3 else ''
        }])
        
        # Concatena i dati
        updated_data = pd.concat([existing_data, new_row], ignore_index=True)
        
        # Salva tutto il DataFrame
        spread.df_to_sheet(updated_data, index=False, replace=True)
        return True
    except Exception as e:
        st.error(f"Errore nel salvataggio: {e}")
        return False

def main():
    st.title("💪 Workout Tracker")
    
    # Connessione al foglio
    spread = connect_to_sheet()
    
    if spread is None:
        st.error("Impossibile connettersi al foglio Google. Verifica l'URL nel file secrets.toml")
        return
    
    # Selezione del giorno e della data
    workout_type = st.selectbox("Seleziona il giorno", ["Giorno 1", "Giorno 2"])
    workout_date = st.date_input("Data dell'allenamento", datetime.now())
    
    # Carica gli ultimi dati inseriti per il pre-popolamento
    last_workout_data = load_last_workout_data(spread, workout_type)
    
    # Mostra gli esercizi per gruppo muscolare
    for gruppo, esercizi in WORKOUT_DATA[workout_type].items():
        with st.expander(f"{gruppo}", expanded=True):
            for esercizio in esercizi:
                st.subheader(esercizio["nome"])
                
                # Recupera gli ultimi pesi usati
                last_weights = last_workout_data.get(esercizio["nome"], [""] * esercizio["serie"])
                
                # Crea input per ogni serie
                cols = st.columns(esercizio["serie"])
                weights = []
                
                for idx in range(esercizio["serie"]):
                    with cols[idx]:
                        default_weight = str(last_weights[idx]) if idx < len(last_weights) else ""
                        weight = st.text_input(
                            f"Serie {idx + 1} ({esercizio['ripetizioni'][idx]} reps)",
                            value=default_weight,
                            key=f"{esercizio['nome']}_{idx}"
                        )
                        weights.append(weight)
                
                st.caption(f"⏱️ Recupero: {esercizio['recupero']} secondi")
                
                # Pulsante salva per questo esercizio
                if st.button(f"📝 Salva {esercizio['nome']}", key=f"save_{esercizio['nome']}"):
                    if save_workout(spread, workout_date, workout_type, gruppo, esercizio["nome"], weights):
                        st.success(f"Pesi salvati per {esercizio['nome']}")
                
                st.markdown("---")
    
    # Visualizzazione storico
    st.header("📊 Storico Allenamenti")
    try:
        data = spread.sheet_to_df(index=False)
        if not data.empty:
            data = data.sort_values('Data', ascending=False)
            for date in data['Data'].unique():
                with st.expander(f"Allenamento del {date}"):
                    day_data = data[data['Data'] == date]
                    for tipo in day_data['Tipo_Allenamento'].unique():
                        st.subheader(tipo)
                        tipo_data = day_data[day_data['Tipo_Allenamento'] == tipo]
                        for gruppo in tipo_data['Gruppo'].unique():
                            st.write(f"**{gruppo}**")
                            gruppo_data = tipo_data[tipo_data['Gruppo'] == gruppo]
                            for _, row in gruppo_data.iterrows():
                                weights = [str(row['Serie1']), str(row['Serie2']), str(row['Serie3'])]
                                if 'Serie4' in row and pd.notna(row['Serie4']):
                                    weights.append(str(row['Serie4']))
                                weights = [w for w in weights if w != 'nan' and w != '']
                                st.write(f"- {row['Esercizio']}: {', '.join(weights)} kg")
    except Exception as e:
        st.error(f"Errore nel caricamento dello storico: {e}")

if __name__ == "__main__":
    main()