# RSP Stories Studio

A full-stack interactive story publishing platform with tiered access control, built with modern DevSecOps practices for deployment on Hetzner VPS.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Tiered Access Control**: FREE, BRONZE, SILVER, GOLD, PLATINUM tiers
- **Story Management**: Create, publish, and manage interactive stories
- **Rich Media Support**: Upload images and videos to chapters
- **Responsive Frontend**: Next.js with TypeScript and Tailwind CSS
- **RESTful API**: Express.js backend with Prisma ORM
- **Cloud Storage**: Minio (S3-compatible) for media files
- **Monitoring**: Prometheus + Grafana + Loki
- **Security**: Rate limiting, CORS, Helmet, CSP headers
- **CI/CD**: GitHub Actions with automated deployment
- **Infrastructure as Code**: Terraform + Ansible
- **Automated Backups**: Database backups with Restic + Backblaze B2

## 📋 Tech Stack

### Backend
- Node.js 20
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Minio (S3-compatible storage)

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios

### DevOps
- Docker & Docker Compose
- Caddy (reverse proxy with auto HTTPS)
- Prometheus (metrics)
- Grafana (dashboards)
- Loki (log aggregation)
- GitHub Actions (CI/CD)
- Terraform (infrastructure)
- Ansible (configuration management)

## 🏗️ Architecture

```
┌─────────────┐
│  Cloudflare │ (DNS + WAF)
└──────┬──────┘
       │
┌──────▼──────┐
│    Caddy    │ (Reverse Proxy + HTTPS)
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌─▼────┐
│ Next │ │ API  │
│  JS  │ │Express│
└──────┘ └─┬────┘
           │
      ┌────┼────┐
      │    │    │
   ┌──▼─┐ │ ┌──▼──┐
   │ PG │ │ │Minio│
   └────┘ │ └─────┘
        ┌─▼──┐
        │Redis│
        └────┘
```

## 🚦 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-ORG/rsp-studio.git
   cd rsp-studio
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Check service status**
   ```bash
   docker-compose ps
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Minio Console: http://localhost:9001
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090

### Database Migrations

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

## 📦 Production Deployment

### Step 1: Provision Infrastructure (Terraform)

```bash
cd infra/terraform
cp variables.tfvars.example variables.tfvars
# Edit variables.tfvars with your values

terraform init
terraform plan
terraform apply
```

### Step 2: Configure Server (Ansible)

```bash
cd infra/ansible
# Update inventory.ini with your server IP

ansible-playbook -i inventory.ini playbook.yml
```

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository:
- `VPS_IP`: Your server's IP address
- `VPS_SSH_USER`: SSH user (usually `root`)
- `VPS_SSH_KEY`: SSH private key
- `DOCKER_REGISTRY_USERNAME`: Docker Hub username
- `DOCKER_REGISTRY_PASSWORD`: Docker Hub password

### Step 4: Deploy

```bash
git push origin main
# GitHub Actions will automatically deploy
```

## 🔒 Security Features

- **HTTPS**: Automatic SSL/TLS via Caddy
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 100 requests/minute per IP
- **CORS**: Whitelist-based cross-origin requests
- **Security Headers**: Helmet.js + CSP
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization
- **Cloudflare WAF**: DDoS protection and bot mitigation

## 📊 Monitoring

### Prometheus Metrics
- API response times
- Request rates
- Error rates
- Database connections
- System resources (CPU, memory, disk)

### Grafana Dashboards
- Application performance
- Infrastructure health
- User activity
- Error tracking

### Loki Logs
- Centralized log aggregation
- Full-text search
- Log filtering and analysis

## 💾 Backups

### Automated Database Backups

Set up a cron job for nightly backups:
```bash
chmod +x infra/backup/backup-database.sh
crontab -e
# Add: 0 2 * * * /opt/rsp-studio/infra/backup/backup-database.sh
```

### Restic with Backblaze B2

```bash
chmod +x infra/backup/setup-restic.sh
./infra/backup/setup-restic.sh
```

### Restore Database

```bash
chmod +x infra/backup/restore-database.sh
./infra/backup/restore-database.sh /backup/db_20240101_120000.sql.gz
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing
```bash
# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get stories (requires auth token)
curl http://localhost:5000/api/v1/stories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 API Documentation

### Authentication

#### POST /api/v1/auth/register
Register a new user.

#### POST /api/v1/auth/login
Login and receive access token.

#### POST /api/v1/auth/refresh
Refresh access token.

#### POST /api/v1/auth/logout
Logout and invalidate refresh token.

### Stories

#### GET /api/v1/stories
List all accessible stories for the authenticated user.

#### GET /api/v1/stories/:id
Get a specific story with chapters and media.

#### POST /api/v1/stories
Create a new story (authenticated users only).

#### PUT /api/v1/stories/:id
Update a story (owner only).

#### DELETE /api/v1/stories/:id
Delete a story (owner only).

### Chapters

#### POST /api/v1/chapters/:storyId
Add a chapter to a story.

#### POST /api/v1/chapters/:chapterId/media
Upload media (image/video) to a chapter.

#### GET /api/v1/chapters/:storyId
List all chapters for a story.

#### DELETE /api/v1/chapters/:chapterId
Delete a chapter and its media.

## 🛠️ Development

### Project Structure

```
rsp-studio/
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   └── utils/          # Utility functions
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities (API, store)
│   └── Dockerfile.prod
├── infra/
│   ├── terraform/         # Infrastructure as Code
│   ├── ansible/          # Configuration management
│   ├── monitoring/       # Prometheus/Grafana configs
│   └── backup/          # Backup scripts
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml
├── Caddyfile
└── README.md
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories.

## 📈 Scaling

When traffic grows, consider:

1. **Horizontal Scaling**: Add more VPS instances behind a load balancer
2. **Managed Database**: Switch to Hetzner Cloud Database
3. **CDN**: Use Cloudflare CDN for static assets
4. **Object Storage**: Migrate from Minio to AWS S3 or Backblaze B2
5. **Redis Cluster**: For distributed caching
6. **Kubernetes**: For container orchestration

## 💰 Cost Breakdown

- Hetzner CX11 VPS: €3.49/month
- Cloudflare: Free
- GitHub: Free (public repos)
- Backblaze B2: ~$0.50/month (minimal storage)
- Domain: ~$10/year

**Total: ~€4/month + domain**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built following the RSP Stories Studio DevSecOps Roadmap
- Deployed on Hetzner Cloud infrastructure
- Secured with Cloudflare
- Monitored with Prometheus & Grafana

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ for the storytelling community**
