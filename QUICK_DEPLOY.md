# 🚀 Quick Deployment Guide

## ⚡ Deploy to Vercel in 5 minutes

### 1. Pre-deployment check
```bash
# Test the Vercel-specific build
npm run vercel-build

# Generate secure auth secret
openssl rand -base64 32
```

### 2. Deploy
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

### 3. Setup Database
1. In Vercel dashboard → Storage → Create Database → Postgres
2. Copy the `DATABASE_URL` connection string

### 4. Environment Variables
Add these in Vercel dashboard → Settings → Environment Variables:
- `DATABASE_URL`: (from step 3)
- `AUTH_SECRET`: (from step 1)
- `NODE_ENV`: `production`

### 5. Initialize Database
```bash
# Connect to production database and initialize
npx prisma db push
npm run db:seed
```

### 6. Test your app
- Visit your Vercel deployment URL
- Login with test credentials:
  - Teacher: `teacher@fantakombat.com` / `password123`
  - Student: `alice@student.com` / `password123`

## 🔧 Troubleshooting

### Common issues:
- **Prisma client outdated**: Already fixed with `vercel-build` script
- **Database connection fails**: Check `DATABASE_URL` in environment variables
- **Build fails**: Run `npm run vercel-build` locally to debug

### Need help?
- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

✅ **Your Fantakombat app is now live on Vercel!**
