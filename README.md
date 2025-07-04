# 🥊 Fantakombat - Fit&Box Points Game

Fantakombat is a web application for managing points in a fit&box course. Users can be "teachers" (admin) who manage actions and assign points, or "students" who can view their performance and the general leaderboard.

## 🚀 Features

### 👨‍🏫 Teachers (Admin)
- ✅ Action management (bonus/malus)
- ✅ Lesson creation and management
- ✅ Point assignment to students
- ✅ Student management
- ✅ Leaderboard and statistics visualization

### 🥊 Students (Users)
- ✅ General leaderboard view
- ✅ Personal points history
- ✅ Dashboard with personal statistics
- ✅ User profile

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5 + TypeScript
- **UI**: TailwindCSS + custom components
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Authentication**: Custom session-based auth
- **Hosting**: Vercel ready

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fantakombat_new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="your-secret-key-here"
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma db push
   
   # Seed database with test data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 🔐 Test Credentials

After running `npm run db:seed`, you can use these accounts:

**Teacher (Admin):**
- Email: `teacher@fantakombat.com`
- Password: `password123`

**Students:**
- Email: `alice@student.com` / Password: `password123`
- Email: `bob@student.com` / Password: `password123`
- Email: `charlie@student.com` / Password: `password123`
- Email: `diana@student.com` / Password: `password123`
- Email: `eva@student.com` / Password: `password123`

## 📊 Database Management

```bash
# View database
npm run db:studio

# Reset and repopulate database
npm run db:push
npm run db:seed
```

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Authentication utilities
│   └── db.ts            # Database utilities
├── routes/
│   ├── +layout.svelte   # Main layout
│   ├── +page.svelte     # Homepage
│   ├── login/           # Login page
│   ├── register/        # Registration page
│   ├── dashboard/       # User dashboard
│   ├── actions/         # Actions management (admin)
│   ├── lessons/         # Lessons management (admin)
│   ├── users/           # User management (admin)
│   ├── leaderboard/     # Leaderboard
│   └── profile/         # User profile
├── app.css              # Global styles
└── app.html             # HTML template
```

## 🎨 Design System

The application uses a design system based on TailwindCSS with:
- **Primary colors**: Pink/Magenta for main actions
- **Secondary colors**: Blue for information
- **Mobile-first**: Responsive design optimized for mobile
- **Accessibility**: Screen reader support and keyboard navigation

## 📱 Responsive Design

- **Mobile**: < 768px - Vertical layout, hamburger menu
- **Tablet**: 768px - 1024px - Adaptive layout
- **Desktop**: > 1024px - Full horizontal layout

## 🔒 Security

- Hashed passwords with bcrypt
- Secure server-side sessions
- Server-side input validation
- Role-based route protection
- Data sanitization

## 🚀 Deployment

### Quick deployment with Vercel

1. **Prepare the project**
   ```bash
   npm run build  # Test local build
   ```

2. **Setup production database**
   - Create a PostgreSQL database (Vercel Postgres recommended)
   - Update `DATABASE_URL` in production

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

4. **Configure environment variables**
   - `DATABASE_URL`: Production database URL
   - `AUTH_SECRET`: Secure secret key (generate with `openssl rand -base64 32`)
   - `NODE_ENV`: "production"

📖 **Complete guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📊 Database Structure

// ...existing code...
