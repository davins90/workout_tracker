# Workout Tracker

A Streamlit web application for tracking gym workouts and progress. The app allows you to log exercises, weights, and track your progress over time using Google BigQuery as the backend database.

## Features

- 🏋️ Track exercises and weights for two different workout days
- 💾 Automatic data persistence in BigQuery
- 🔄 Pre-loads your last workout's weights
- 📊 View your workout history
- 📱 Mobile-friendly interface

## Tech Stack

- **Frontend**: Streamlit
- **Backend**: Google BigQuery
- **Language**: Python 3.12

## Exercise Configuration

All exercises are configured in `config.py` as a JSON structure. The configuration includes:
- Exercise name
- Number of sets
- Repetitions for each set
- Rest time between sets

Example structure:
```python
WORKOUT_DATA = {
    "Giorno 1": {
        "Gambe": [
            {
                "nome": "Hack Squat",
                "serie": 4,
                "ripetizioni": [12, 10, 8, 8],
                "recupero": 90
            },
            # ... other exercises
        ]
    }
}
```

To modify or add exercises, simply update the `WORKOUT_DATA` dictionary in `config.py`.

## Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/workout-tracker.git
cd workout-tracker
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up Google Cloud**
- Create a new GCP project
- Enable BigQuery API
- Create a service account with BigQuery permissions
- Download the service account key
- Create a BigQuery dataset and table using the provided schema

4. **Configure Streamlit secrets**
Create `.streamlit/secrets.toml` with your GCP credentials and BigQuery table information:
```toml
[gcp_service_account]
type = "service_account"
project_id = "your-project-id"
private_key_id = "..."
private_key = "..."
client_email = "..."
# ... other service account details

[bigquery]
table_id = "project-id.dataset.table"
```

5. **Run the app**
```bash
streamlit run app.py
```

## BigQuery Schema

```sql
CREATE TABLE `project.dataset.table`
(
  date DATE,
  workout_type STRING,
  exercise_group STRING,
  exercise_name STRING,
  series1 FLOAT64,
  series2 FLOAT64,
  series3 FLOAT64,
  series4 FLOAT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
PARTITION BY date;
```

## Project Structure

```
workout_tracker/
│
├── app.py                    # Main application file
├── config.py                 # Workout configuration and exercises
├── requirements.txt          # Project dependencies
├── README.md                # Documentation
├── LICENSE                  # MIT License
│
└── .streamlit/
    └── secrets.toml         # Configuration secrets (not in repo)
```

## Required Python Packages

These are the main dependencies required to run the app:
```
streamlit
pandas
google-cloud-bigquery
google-cloud-bigquery-storage
db-dtypes
pyarrow
```

All dependencies are listed in `requirements.txt`.

## Deployment

The app can be deployed on Streamlit Cloud:
1. Push your code to GitHub
2. Connect your repository to Streamlit Cloud
3. Add your secrets in the Streamlit Cloud dashboard
4. Deploy!

## Local Development

To run the app locally:
1. Install dependencies: `pip install -r requirements.txt`
2. Set up your `.streamlit/secrets.toml` with your GCP credentials
3. Run: `streamlit run app.py`

## Contributing

Feel free to open issues or submit pull requests if you have suggestions for improvements!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.