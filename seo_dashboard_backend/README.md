# SEO Analytics Backend API

A Django REST Framework backend API that connects to Google Analytics 4 and provides analytics data for frontend dashboards.

## Features

- **Real-time Google Analytics Data**: Fetches live data from Google Analytics 4
- **RESTful API**: Clean REST endpoints for frontend consumption
- **Service Account Authentication**: Secure authentication using Google Service Account
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Configured for Angular frontend integration

## API Endpoints

### Overview Data
```
GET /api/analytics/overview/
```

Returns overview metrics:
```json
{
  "sessions": 1250,
  "users": 890,
  "pageViews": 3420,
  "bounceRate": 45.2
}
```

### Traffic Data
```
GET /api/analytics/traffic/?days=30
```

Returns traffic over time:
```json
[
  {
    "date": "2026-03-20",
    "sessions": 120
  }
]
```

### Pages Data
```
GET /api/analytics/pages/?limit=10
```

Returns top pages:
```json
[
  {
    "page": "/home",
    "views": 450
  }
]
```

### Sync All Data
```
POST /api/analytics/sync/
```

Returns complete dataset:
```json
{
  "overview": {...},
  "traffic": [...],
  "pages": [...],
  "last_updated": "2026-03-23T23:21:00Z"
}
```

### Health Check
```
GET /api/analytics/health/
```

## Installation

1. **Clone and Setup**
```bash
cd seo_dashboard_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure Google Analytics**

   - Place your service account JSON file as `service_account.json`
   - Update `PROPERTY_ID` in `config/settings.py`
   - Ensure the service account has access to your Google Analytics property

4. **Run Migrations**
```bash
python manage.py migrate
```

5. **Start Server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/analytics/`

## Configuration

### Google Analytics Setup

1. **Create a Google Cloud Project**
2. **Enable Google Analytics Data API**
3. **Create a Service Account**
4. **Download the JSON key file** as `service_account.json`
5. **Add the service account email** to your Google Analytics property with "Read & Analyze" permissions

### Settings Configuration

In `config/settings.py`:
```python
# Update these values
PROPERTY_ID = "YOUR_PROPERTY_ID"  # Your Google Analytics Property ID
SERVICE_ACCOUNT_FILE = BASE_DIR / "service_account.json"
```

### CORS Configuration

For Angular frontend development, update CORS settings:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",  # Angular default port
]
```

## Security Notes

- **Never commit** `service_account.json` to version control
- **Add** `service_account.json` to `.gitignore`
- **Use environment variables** for sensitive configuration in production
- **Restrict API access** in production environments

## Frontend Integration

Your Angular dashboard can call:

```typescript
// Overview data
fetch('http://localhost:8000/api/analytics/overview/')
  .then(response => response.json())
  .then(data => console.log(data));

// Traffic data
fetch('http://localhost:8000/api/analytics/traffic/?days=30')
  .then(response => response.json())
  .then(data => console.log(data));

// Pages data
fetch('http://localhost:8000/api/analytics/pages/?limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// Sync all data
fetch('http://localhost:8000/api/analytics/sync/', {
  method: 'POST'
})
  .then(response => response.json())
  .then(data => console.log(data));
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Google Analytics API errors or service issues

## Logging

All API calls and errors are logged. Check Django logs for debugging.

## Development

### Running Tests
```bash
python manage.py test
```

### Code Structure

```
analytics/
├── services.py      # Google Analytics integration
├── views.py         # API view functions
├── serializers.py   # Data serialization
├── urls.py          # URL routing
└── models.py        # Database models (not used in this API)
```

## Production Deployment

1. **Set DEBUG = False** in settings
2. **Configure environment variables** for sensitive data
3. **Set up proper CORS** for your frontend domain
4. **Use HTTPS** for all API calls
5. **Configure logging** for monitoring

## License

This project is licensed under the MIT License.
