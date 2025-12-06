# Panoptes CVE Security Bot 🛡️

**A self-hosted, AI-powered CVE monitoring and alerting system built with Laravel and React**

Panoptes automatically monitors the NVD (National Vulnerability Database) for new CVEs, analyzes them using OpenAI's GPT models, and sends intelligent security alerts via Telegram based on your configured preferences.

## ✨ Features

- 🔍 **Automated CVE Monitoring** - Fetches latest vulnerabilities from NVD API
- 🤖 **AI-Powered Analysis** - Uses OpenAI GPT-4o-mini to analyze threat levels
- 📱 **Telegram Bot** - Real-time alerts and CVE queries
- 🎯 **Smart Filtering** - Subscribe to vendors/products, set severity thresholds
- 📊 **Modern Dashboard** - React UI with search, pagination, CSV/PDF export
- 🐳 **Docker Support** - Easy deployment

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+ | MySQL 8.0+ | Composer | Node.js 18+
- OpenAI API key | Telegram Bot Token

### Installation

```bash
# 1. Install dependencies
composer install
cd frontend && npm install && cd ..

# 2. Configure
cp .env.example .env
php artisan key:generate

# 3. Setup database
mysql -u root -p -e "CREATE DATABASE panoptes;"
php artisan migrate

# 4. Add to .env:
OPENAI_API_KEY=sk-proj-...
TELEGRAM_BOT_TOKEN=123456:ABC...

# 5. Start services (4 terminals)
php artisan serve --host=127.0.0.1 --port=8001  # Backend
cd frontend && npm run dev                       # Frontend
php artisan queue:work                           # Queue worker
php artisan bot:poll-telegram                    # Telegram bot
```

Access: `http://localhost:5173`

## 🎯 Telegram Bot Commands

- `/start` - Welcome & introduction
- `/subscribe keyword <vendor>` - Subscribe to alerts (e.g., `/subscribe keyword Microsoft`)
- `/unsubscribe keyword <vendor>` - Remove subscription
- `/subscriptions` - View your subscriptions
- `/setseverity <level>` - Set min severity (Low/Medium/High/Critical)
- `/latest` - Show 5 recent CVEs
- `/cve <CVE-ID>` - Get CVE details (e.g., `/cve CVE-2025-12345`)
- `/help` - Show all commands

## 📊 Dashboard Features

- Search & filter CVEs by ID, summary, severity, type
- Select individual or all CVEs
- Export to CSV or PDF
- Pagination (10 items per page)

## 🐳 Docker Deployment

```bash
docker-compose up -d
docker-compose exec app php artisan migrate
docker-compose exec app php artisan queue:work &
docker-compose exec app php artisan bot:poll-telegram &
```

## ⚙️ Configuration

### Scheduled CVE Fetching

Add to crontab for auto-fetching every 15 minutes:
```bash
* * * * * cd /path/to/panoptes && php artisan schedule:run >> /dev/null 2>&1
```

### Manual CVE Fetch

```bash
php artisan cve:fetch-recent --limit=10
php artisan cve:fetch-recent --start=2025-12-01 --end=2025-12-06
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_CONNECTION` | Database driver (mysql/pgsql) | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_DATABASE` | Database name | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `OPENAI_MODEL` | Model (default: gpt-4o-mini) | No |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `NVD_API_KEY` | NVD key (optional, for higher limits) | No |

## 📁 Project Structure

```
panoptes/
├── app/
│   ├── Console/Commands/       # CLI commands
│   ├── Http/Controllers/Api/   # API endpoints
│   ├── Models/                 # Eloquent models
│   ├── Services/               # Business logic
│   └── Jobs/                   # Queue jobs
├── database/migrations/
├── frontend/src/              # React app
└── docker-compose.yml
```

## 📝 API Endpoints

- `GET /api/cves` - List CVEs (filters: severity, type, vendor, q, per_page)
- `GET /api/cves/{cve_id}` - CVE details
- `GET /api/setup/status` - Setup status
- `POST /api/setup/save` - Save configuration

## 🔒 Security

- Never commit `.env`
- Use HTTPS in production
- Strong database passwords
- Non-root queue workers
- Input validation enabled

## 📄 License

MIT License

---

**Built for the security community** 🛡️
