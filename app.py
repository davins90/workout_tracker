import streamlit as st
from datetime import datetime
from google.cloud import bigquery
from google.oauth2 import service_account
from config import WORKOUT_DATA

# Configurazione della pagina
st.set_page_config(
    page_title="Workout Tracker",
    page_icon="💪",
    layout="wide"
)

def connect_to_bq():
    """Connette a BigQuery usando le credenziali nei secrets"""
    try:
        credentials = service_account.Credentials.from_service_account_info(
            st.secrets["gcp_service_account"]
        )
        return bigquery.Client(credentials=credentials, project=credentials.project_id)
    except Exception as e:
        st.error(f"Errore di connessione a BigQuery: {e}")
        return None

def load_last_workout_data(client, workout_type):
    """Carica l'ultimo allenamento per ogni esercizio"""
    query = f"""
    WITH RankedWorkouts AS (
        SELECT 
            *,
            ROW_NUMBER() OVER (
                PARTITION BY exercise_name 
                ORDER BY date DESC
            ) as rn
        FROM `{st.secrets["bigquery"]["table_id"]}`
        WHERE workout_type = '{workout_type}'
    )
    SELECT 
        exercise_name,
        series1,
        series2,
        series3,
        series4
    FROM RankedWorkouts
    WHERE rn = 1
    """
    
    try:
        df = client.query(query).to_dataframe()
        if df.empty:
            return {}
        
        # Converti in dizionario
        last_weights = {}
        for _, row in df.iterrows():
            weights = [
                str(row['series1']) if pd.notna(row['series1']) else '',
                str(row['series2']) if pd.notna(row['series2']) else '',
                str(row['series3']) if pd.notna(row['series3']) else '',
                str(row['series4']) if pd.notna(row['series4']) else ''
            ]
            last_weights[row['exercise_name']] = weights
            
        return last_weights
    except Exception as e:
        st.error(f"Errore nel caricamento dati: {e}")
        return {}

def save_workout(client, date, workout_type, group, exercise, weights):
    """Salva l'allenamento in BigQuery"""
    # Prepara i valori delle serie, gestendo i valori vuoti
    series_values = weights + [''] * (4 - len(weights))
    series_values = [w if w != '' else 'NULL' for w in series_values]
    
    query = f"""
    INSERT INTO `{st.secrets["bigquery"]["table_id"]}`
    (date, workout_type, exercise_group, exercise_name, series1, series2, series3, series4)
    VALUES
    ('{date.strftime('%Y-%m-%d')}', '{workout_type}', '{group}', '{exercise}',
     {series_values[0]}, {series_values[1]}, {series_values[2]}, {series_values[3]})
    """
    
    try:
        client.query(query)
        return True
    except Exception as e:
        st.error(f"Errore nel salvataggio: {e}")
        return False

def load_workout_history(client):
    """Carica lo storico degli allenamenti"""
    query = f"""
    SELECT 
        date,
        workout_type,
        exercise_group,
        exercise_name,
        series1,
        series2,
        series3,
        series4
    FROM `{st.secrets["bigquery"]["table_id"]}`
    ORDER BY date DESC
    """
    
    try:
        return client.query(query).to_dataframe()
    except Exception as e:
        st.error(f"Errore nel caricamento dello storico: {e}")
        return pd.DataFrame()

def main():
    st.title("💪 Workout Tracker")
    
    # Connessione a BigQuery
    client = connect_to_bq()
    if client is None:
        return
    
    # Selezione del giorno e della data
    workout_type = st.selectbox("Seleziona il giorno", ["Giorno 1", "Giorno 2"])
    workout_date = st.date_input("Data dell'allenamento", datetime.now())
    
    # Carica gli ultimi dati inseriti per il pre-popolamento
    last_workout_data = load_last_workout_data(client, workout_type)
    
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
                    if save_workout(client, workout_date, workout_type, gruppo, esercizio["nome"], weights):
                        st.success(f"Pesi salvati per {esercizio['nome']}")
                
                st.markdown("---")
    
    # Visualizzazione storico
    st.header("📊 Storico Allenamenti")
    history_df = load_workout_history(client)
    
    if not history_df.empty:
        for date in history_df['date'].unique():
            with st.expander(f"Allenamento del {date}"):
                day_data = history_df[history_df['date'] == date]
                for tipo in day_data['workout_type'].unique():
                    st.subheader(tipo)
                    tipo_data = day_data[day_data['workout_type'] == tipo]
                    for gruppo in tipo_data['exercise_group'].unique():
                        st.write(f"**{gruppo}**")
                        gruppo_data = tipo_data[tipo_data['exercise_group'] == gruppo]
                        for _, row in gruppo_data.iterrows():
                            weights = [
                                str(row['series1']),
                                str(row['series2']),
                                str(row['series3'])
                            ]
                            if pd.notna(row['series4']):
                                weights.append(str(row['series4']))
                            weights = [w for w in weights if w != 'nan' and w != '']
                            st.write(f"- {row['exercise_name']}: {', '.join(weights)} kg")

if __name__ == "__main__":
    main()