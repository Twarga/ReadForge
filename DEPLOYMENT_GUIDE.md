# RSP Stories Studio - Complete Deployment Guide

This guide walks you through deploying RSP Stories Studio from zero to production on a Hetzner VPS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 0: Foundation](#phase-0-foundation)
3. [Phase 1: Local Development](#phase-1-local-development)
4. [Phase 2-3: Backend & Frontend](#phase-2-3-backend--frontend)
5. [Phase 4: Security](#phase-4-security)
6. [Phase 5: CI/CD](#phase-5-cicd)
7. [Phase 6: Infrastructure as Code](#phase-6-infrastructure-as-code)
8. [Phase 7: Monitoring](#phase-7-monitoring)
9. [Phase 8: Backups](#phase-8-backups)
10. [Phase 9: CDN & WAF](#phase-9-cdn--waf)
11. [Phase 10: Production Deployment](#phase-10-production-deployment)
12. [Phase 11: Ongoing Maintenance](#phase-11-ongoing-maintenance)

## Prerequisites

- GitHub account
- Hetzner Cloud account
- Domain name (from Namecheap, Porkbun, etc.)
- Cloudflare account (free)
- Docker Hub account (free)
- Basic knowledge of Linux, Docker, and Git

## Phase 0: Foundation

### Step 1: Get a Hetzner VPS

1. Go to [Hetzner Cloud](https://www.hetzner.com/cloud)
2. Create an account and add payment method
3. Create a new project
4. Create a CX11 server:
   - Location: Germany (Nuremberg or Falkenstein)
   - OS: Ubuntu 22.04
   - SSH key: Create and add your SSH key
   - Name: `rsp-studio-prod`
5. Note the server's IP address

### Step 2: Initial Server Setup

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Run initial setup:
```bash
# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y docker.io docker-compose git curl wget ufw fail2ban

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Start Docker
systemctl enable docker
systemctl start docker

# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
```

### Step 3: Set up Cloudflare DNS

1. Go to [Cloudflare](https://www.cloudflare.com/)
2. Add your domain
3. Update nameservers at your domain registrar
4. Wait for DNS propagation (can take up to 24 hours)
5. Create DNS A record:
   - Type: A
   - Name: @ (or your subdomain)
   - IPv4 address: YOUR_SERVER_IP
   - Proxy status: Proxied (orange cloud)
   - TTL: Auto

### Step 4: Clone Project on Server

```bash
mkdir -p /opt/rsp-studio
cd /opt/rsp-studio
git clone https://github.com/YOUR-ORG/rsp-studio.git .
```

## Phase 1: Local Development

### Test Locally First

On your local machine:

```bash
# Clone repository
git clone https://github.com/YOUR-ORG/rsp-studio.git
cd rsp-studio

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Access services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Minio: http://localhost:9001 (minioadmin/minioadmin)
- Grafana: http://localhost:3001 (admin/admin)

## Phase 2-3: Backend & Frontend

The code is already implemented! Key features:

### Backend (Express.js + Prisma)
- ✅ JWT authentication with refresh tokens
- ✅ User registration and login
- ✅ Story CRUD operations
- ✅ Chapter management
- ✅ Media upload (Minio)
- ✅ Tier-based access control
- ✅ Rate limiting
- ✅ Security headers

### Frontend (Next.js + TypeScript)
- ✅ Auth pages (login/register)
- ✅ Story gallery
- ✅ Story detail viewer
- ✅ Chapter viewer with media
- ✅ Responsive design
- ✅ State management (Zustand)

## Phase 4: Security

### Already Implemented:
- ✅ HTTPS via Caddy (auto SSL)
- ✅ Rate limiting (100 req/min)
- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ JWT token rotation
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ SQL injection protection (Prisma)

### Configure Cloudflare Security:

1. **SSL/TLS Settings**
   - SSL/TLS encryption mode: Full (strict)
   - Always Use HTTPS: On
   - Minimum TLS Version: 1.2

2. **Firewall Rules**
   - Security → WAF
   - Enable OWASP Core Ruleset
   - Create rate limiting rule: 50 requests/minute per IP

3. **Bot Fight Mode**
   - Security → Bots
   - Enable Bot Fight Mode

4. **DDoS Protection**
   - Automatically enabled with proxy

## Phase 5: CI/CD

### Set Up GitHub Actions

1. **Create GitHub Repository**
   ```bash
   # On your local machine
   git remote add origin https://github.com/YOUR-ORG/rsp-studio.git
   git branch -M main
   git push -u origin main
   ```

2. **Add GitHub Secrets**
   
   Go to: Repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `VPS_IP`: Your server IP
   - `VPS_SSH_USER`: `root`
   - `VPS_SSH_KEY`: Your private SSH key (entire content)
   - `DOCKER_REGISTRY_USERNAME`: Docker Hub username
   - `DOCKER_REGISTRY_PASSWORD`: Docker Hub password

3. **Create Docker Hub Repositories**
   - Go to [Docker Hub](https://hub.docker.com/)
   - Create repositories: `rsp-backend` and `rsp-frontend`

4. **Test CI/CD**
   ```bash
   git add .
   git commit -m "feat: initial deployment"
   git push origin main
   ```
   
   Watch the Actions tab on GitHub for deployment progress.

## Phase 6: Infrastructure as Code

### Option A: Terraform (Automated)

```bash
cd infra/terraform

# Copy example variables
cp variables.tfvars.example variables.tfvars

# Edit with your values
nano variables.tfvars

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply (creates VPS)
terraform apply
```

### Option B: Ansible (Configuration)

```bash
cd infra/ansible

# Update inventory with your server IP
nano inventory.ini

# Run playbook
ansible-playbook -i inventory.ini playbook.yml
```

This will:
- Install all dependencies
- Clone repository
- Configure Caddy
- Start Docker services
- Run database migrations

## Phase 7: Monitoring

### Already Set Up:
- ✅ Prometheus (metrics collection)
- ✅ Grafana (dashboards)
- ✅ Loki (log aggregation)

### Access Monitoring:

**Local:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

**Production:**
- Set up subdomain: `grafana.your-domain.com`
- Update Caddyfile with your domain
- Access: https://grafana.your-domain.com

### Configure Grafana Dashboards:

1. Login (admin/admin)
2. Add Prometheus datasource (http://prometheus:9090)
3. Import dashboards:
   - Node Exporter Full (ID: 1860)
   - Docker Dashboard (ID: 893)

## Phase 8: Backups

### Set Up Automated Backups

```bash
# On server
cd /opt/rsp-studio

# Make scripts executable
chmod +x infra/backup/*.sh

# Set up Restic (for Backblaze B2)
./infra/backup/setup-restic.sh

# Test backup
source .restic-env
./infra/backup/backup-database.sh

# Schedule daily backups (2 AM)
crontab -e
# Add this line:
0 2 * * * /opt/rsp-studio/infra/backup/backup-database.sh >> /var/log/backup.log 2>&1
```

### Test Restore

```bash
# List backups
restic snapshots

# Restore
./infra/backup/restore-database.sh /backup/db_YYYYMMDD_HHMMSS.sql.gz
```

## Phase 9: CDN & WAF

### Cloudflare Configuration

1. **Caching**
   - Caching → Configuration
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours

2. **Page Rules**
   - Create rule: `your-domain.com/api/*`
   - Cache Level: Bypass

3. **Speed Optimizations**
   - Speed → Optimization
   - Auto Minify: CSS, JS, HTML
   - Brotli: On

4. **Firewall Rules**
   - Create rule: Block bad bots
   - Create rule: Rate limit API (50 req/min)

## Phase 10: Production Deployment

### Final Production Setup

1. **Update Environment Variables**
   ```bash
   # On server
   cd /opt/rsp-studio
   nano backend/.env
   ```
   
   Update:
   - `NODE_ENV=production`
   - `JWT_SECRET=<GENERATE_STRONG_SECRET>`
   - `JWT_REFRESH_SECRET=<GENERATE_STRONG_SECRET>`
   - `DATABASE_URL=postgresql://...` (with strong password)

2. **Update Caddyfile**
   ```bash
   nano Caddyfile
   ```
   
   Replace `your-domain.com` with your actual domain

3. **Deploy**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Start services
   docker-compose up -d
   
   # Run migrations
   docker-compose exec backend npx prisma migrate deploy
   
   # Check status
   docker-compose ps
   ```

4. **Verify Deployment**
   ```bash
   # Health check
   curl https://your-domain.com/health
   
   # Should return: {"status":"ok","timestamp":"...","uptime":...}
   ```

5. **Test HTTPS**
   - Visit https://your-domain.com
   - Verify SSL certificate (should show Cloudflare)

### Enable HSTS

In Cloudflare:
1. SSL/TLS → Edge Certificates
2. Enable HSTS
3. Max Age: 12 months
4. Include subdomains: Yes
5. Preload: Yes (optional)

## Phase 11: Ongoing Maintenance

### Daily Tasks
- Check monitoring dashboards
- Review logs for errors
- Monitor disk space

### Weekly Tasks
- Review security logs
- Check backup status
- Update dependencies if needed

### Monthly Tasks
- Run security audit:
  ```bash
  npm audit
  docker scan rsp-backend:latest
  ```
- Review and rotate credentials
- Update system packages:
  ```bash
  apt update && apt upgrade -y
  ```
- Check Cloudflare analytics

### Set Up Alerts

In Grafana:
1. Create alert rules:
   - CPU > 80% for 5 minutes
   - Memory > 80% for 5 minutes
   - Disk space < 10%
   - API error rate > 1%

2. Configure notification channels:
   - Email
   - Slack (optional)
   - Telegram (optional)

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart

# Full restart
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres psql -U rsp_user -d rsp_studio -c "SELECT 1"

# Reset database (WARNING: deletes data)
docker-compose down -v
docker-compose up -d
```

### SSL Certificate Issues

```bash
# Check Caddy logs
docker-compose logs caddy

# Restart Caddy
systemctl restart caddy
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart services
docker-compose restart

# Clean Docker
docker system prune -af
```

## Performance Optimization

### When to Scale

Consider upgrading when:
- CPU consistently > 70%
- Memory consistently > 70%
- Disk space < 20%
- Response time > 500ms
- > 1000 active users

### Scaling Options

1. **Vertical Scaling** (Upgrade VPS)
   - CX11 → CX21 (2 vCPU, 4GB RAM)
   - CX21 → CX31 (2 vCPU, 8GB RAM)

2. **Horizontal Scaling** (Add servers)
   - Set up load balancer (HAProxy/Nginx)
   - Add application servers
   - Use managed PostgreSQL
   - Use external Redis cluster

3. **CDN Optimization**
   - Enable Cloudflare CDN for static assets
   - Use image optimization
   - Implement lazy loading

## Cost Optimization

- **Hetzner CX11**: €3.49/month
- **Cloudflare**: Free
- **GitHub Actions**: Free (2000 min/month)
- **Backblaze B2**: ~€0.50/month
- **Domain**: ~€10/year

**Total: ~€4/month**

### Reduce Costs:
- Use Docker image caching
- Optimize database queries
- Compress media files
- Enable Cloudflare caching
- Clean old backups regularly

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSH key-only authentication
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban enabled
- [ ] SSL/TLS certificates valid
- [ ] Regular backups tested
- [ ] Monitoring alerts configured
- [ ] Dependencies up to date
- [ ] 2FA enabled on GitHub
- [ ] 2FA enabled on Cloudflare
- [ ] API rate limiting active
- [ ] Database backups encrypted
- [ ] Secrets in environment variables
- [ ] No secrets in Git repository

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Review monitoring dashboards
3. Search GitHub issues
4. Open a new issue with details

## Next Steps

After successful deployment:
1. Create initial content
2. Test all user flows
3. Invite beta testers
4. Monitor performance
5. Gather feedback
6. Iterate and improve

---

**Congratulations! 🎉**

Your RSP Stories Studio is now live in production with full DevSecOps practices!
