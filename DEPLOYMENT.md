# 🚀 Deployment Guide - Fantakombat

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Choose Vercel Postgres as database provider
- [ ] Create production database
- [ ] Update `DATABASE_URL` in environment variables
- [ ] Run migration: `npx prisma db push`
- [ ] Run seed: `npm run db:seed`

### 2. Environment Variables
- [ ] `DATABASE_URL` - Production database URL
- [ ] `AUTH_SECRET` - Secure secret key for authentication (generate a new one!)
- [ ] `NODE_ENV=production`

## � Vercel Deployment

### Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Database Configuration
1. **Vercel Postgres (Recommended)**:
   - Go to vercel.com → your project → Storage → Create Database
   - Select "Postgres"
   - Copy the `DATABASE_URL` to Environment Variables

### Environment Variables on Vercel
```bash
# Generate secure secret
AUTH_SECRET="$(openssl rand -base64 32)"

# Add via CLI
vercel env add AUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add NODE_ENV production
```

## �️ Project Preparation

### 1. Update dependencies
```bash
npm audit fix
npm update
```

### 2. Test local build
```bash
npm run build
npm run preview
```

### 3. Verify Prisma
```bash
npx prisma generate
npx prisma db push
```

### 4. Final commit
```bash
git add .
git commit -m "feat: prepare for deployment"
git push origin main
```

## 🔒 Production Security

### Generate new AUTH_SECRET
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach {Get-Random -Maximum 256}))
```

### Required environment variables
```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="your-secure-secret-key"
NODE_ENV="production"
```

## 📊 Post-Deploy Monitoring

### Verify functionality
- [ ] Login/Register
- [ ] Course creation
- [ ] Student management
- [ ] Point assignment
- [ ] Leaderboards
- [ ] Password change

### Logs and debugging
- Vercel: `vercel logs`
- Dashboard logs available in Vercel UI

## 🔄 Future Updates

### Recommended workflow
1. Develop locally
2. Complete testing
3. Commit and push
4. Auto-deploy (if configured)
5. Verify in production

### Rollback if needed
```bash
# Vercel
vercel --prod rollback
```

## 💡 Tips

1. **Start with Vercel** - It's the simplest for SvelteKit
2. **Free database** - Use Vercel Postgres to start
3. **Monitoring** - Configure error alerting
4. **Backup** - Schedule automatic database backups
5. **CDN** - Vercel includes automatic CDN
6. **SSL** - Automatic SSL certificate on Vercel

## 🆘 Troubleshooting

### Common errors
- **Build fails**: Check dependencies and TypeScript
- **Database connection**: Verify DATABASE_URL
- **Auth errors**: Generate new AUTH_SECRET
- **Prisma errors**: Run `npx prisma generate`

### Pre-deploy test
```bash
npm run build && npm run preview
```
