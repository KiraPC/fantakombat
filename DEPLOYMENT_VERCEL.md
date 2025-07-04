# 🚀 Deployment Step-by-Step Guide

## ⚡ Quick Deployment with Vercel (5 minutes)

### 1. Preparation

```bash
# Test local build
npm run build

# Generate a secure AUTH_SECRET
openssl rand -base64 32
# Copy the result for step 4
```

### 2. Database Setup

**Vercel Postgres (Recommended)**

1. Go to [vercel.com](https://vercel.com) and create account
2. Create new project → Import Git Repository
3. After first deploy, go to Storage → Create Database → Postgres
4. Copy the `DATABASE_URL` from Environment Variables

### 3. Automatic deployment

```bash
# Connect your GitHub repository to Vercel
# Deploy will be automatic on every push!
```

### 4. Configure environment variables

In Vercel dashboard → Settings → Environment Variables:

- `DATABASE_URL`: (from step 2)
- `AUTH_SECRET`: (from step 1)
- `NODE_ENV`: `production`

### 5. Initialize database

```bash
# In Vercel terminal or locally with production DATABASE_URL
npx prisma db push
npm run db:seed
```

### 6. Final test

- Open your deployment URL
- Register an account
- Verify all functionality

---

## 📋 Pre-Deploy Checklist

### Code

- [ ] `npm run build` works without errors
- [ ] Complete local testing
- [ ] Commit and push to GitHub

### Database

- [ ] Production database created
- [ ] `DATABASE_URL` configured
- [ ] Schema migrated (`prisma db push`)
- [ ] Seed data loaded (`npm run db:seed`)

### Security

- [ ] `AUTH_SECRET` generated and secure
- [ ] Environment variables configured
- [ ] `.env` in `.gitignore`

### Functionality

- [ ] Login/Register works
- [ ] Course creation
- [ ] Student management
- [ ] Point assignment
- [ ] Leaderboards
- [ ] Password change

---

## 🔧 Troubleshooting

### Common errors

- **Build fails**: `npm run build` for local debug
- **Database connection**: Verify `DATABASE_URL`
- **Auth errors**: Regenerate `AUTH_SECRET`
- **Prisma errors**: `npx prisma generate`

### Database reset

```bash
# Warning: deletes all data!
npx prisma db push --force-reset
npm run db:seed
```

---

## 🚀 After Deployment

### Monitoring

- Check logs for errors
- Verify all functionality
- Test on mobile devices

### Backup

- Configure automatic database backups
- Test restore process

### Custom domain

- Configure custom domain (if needed)
- Set up redirects

### Performance

- Check Core Web Vitals
- Optimize images if needed
