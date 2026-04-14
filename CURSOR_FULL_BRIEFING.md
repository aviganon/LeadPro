# 🎯 LeadPro — Cursor Full Briefing

> עודכן: 14 אפריל 2026  
> סטטוס: ✅ **פרודקשן חי** — https://leadpro-394810890087.me-west1.run.app

---

## ⚠️ אזהרה קריטית — אסור לגעת

### 🔒 קבצים מוגנים — לא לשנות לעולם

```
.github/workflows/deploy.yml     ← CI/CD pipeline מוגדר ועובד
Dockerfile                       ← Docker build מוגדר ועובד
firebase.json                    ← Firebase config
firestore.rules                  ← Security rules
firestore.indexes.json           ← Firestore indexes
.env.local                       ← LOCAL ONLY, לא ל-commit
```

### 🔒 GitHub Secrets — לא לגעת, לא ליצור מחדש

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID        = leadpro-cef15
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
GCP_PROJECT_ID                         = leadpro-cef15
GCP_SA_KEY                             = firebase-adminsdk JSON
NEXTAUTH_SECRET
FIREBASE_TOKEN
ANTHROPIC_API_KEY
```

### 🔒 GCP Secret Manager — secrets קיימים, לא ליצור שוב

```
NEXTAUTH_SECRET
ANTHROPIC_API_KEY
FACEBOOK_APP_SECRET         (placeholder — לעדכן עם ערך אמיתי)
STRIPE_SECRET_KEY           (placeholder — לעדכן עם ערך אמיתי)
STRIPE_WEBHOOK_SECRET       (placeholder — לעדכן עם ערך אמיתי)
TELEGRAM_BOT_TOKEN          (placeholder — לעדכן עם ערך אמיתי)
```

---

## 🏗️ תשתית פרודקשן — כל מה שמוגדר

### Firebase Project: `leadpro-cef15`

| שירות | סטטוס |
|---|---|
| Authentication — Email/Password | ✅ מופעל |
| Firestore (default, europe-west1) | ✅ פעיל |
| Web App `leadpro-web` | ✅ רשום |
| Service Account: `firebase-adminsdk-fbsvc@leadpro-cef15.iam.gserviceaccount.com` | ✅ |

### GCP APIs מופעלים

| API | סטטוס |
|---|---|
| Artifact Registry | ✅ |
| Cloud Run Admin | ✅ |
| Secret Manager | ✅ |
| Container Registry | ✅ |

### IAM Roles — Service Account

| Role | Purpose |
|---|---|
| `artifactregistry.writer` | Push Docker images |
| `artifactregistry.createOnPushWriter` | Create registry on push |
| `run.admin` | Deploy Cloud Run |
| `iam.serviceAccountUser` | Run services |
| `iam.serviceAccountTokenCreator` | Token creation |
| `secretmanager.secretAccessor` | Read secrets |
| `firebase.sdkAdminServiceAgent` | Firebase admin |
| `firebaseauth.admin` | Firebase auth |

### IAM Roles — Compute Service Account

| Role | Purpose |
|---|---|
| `roles/editor` | General access |
| `secretmanager.secretAccessor` | Read secrets at runtime |

### Cloud Run Service

```
Service: leadpro
Region: me-west1 (Tel Aviv)
URL: https://leadpro-394810890087.me-west1.run.app
Memory: 512Mi | CPU: 1 | Min: 0 | Max: 10
```

### Admin User (Firestore + Firebase Auth)

```
Email: ganonavi@gmail.com
UID: iBoh0xhBnMWPXBI0QtJKuJd24dw1
Firestore: users/iBoh0xhBnMWPXBI0QtJKuJd24dw1
role: "admin"
```

---

## ✅ מה שנבנה (לפי הקוד הקיים)

### עמודים

| עמוד | נתיב | סטטוס |
|---|---|---|
| Landing Page | `/` | ✅ קיים |
| Login / Register / Reset | `/auth` | ✅ קיים ועובד |
| Dashboard (6 טאבים) | `/dashboard` | ✅ קיים |
| Admin Panel | `/admin` | ✅ קיים |
| Pricing | `/pricing` | ✅ קיים |

### API Routes

| Route | תיאור | סטטוס |
|---|---|---|
| `/api/facebook/callback` | OAuth callback | ✅ |
| `/api/facebook/groups` | ניהול קבוצות | ✅ |
| `/api/posts/publish` | פרסום לקבוצות | ✅ |
| `/api/posts/analytics` | אנליטיקה | ✅ |
| `/api/leads/scrape` | סקרייפינג לידים | ✅ |
| `/api/ai/generate-post` | Claude AI לפוסטים | ✅ |
| `/api/billing` | Stripe checkout + webhook | ✅ |

### Lib Files

| קובץ | תיאור |
|---|---|
| `src/lib/firebase.ts` | Firebase client init |
| `src/lib/db.ts` | Firestore CRUD |
| `src/lib/facebook.ts` | Facebook Graph API |
| `src/lib/scrapers.ts` | Yad2, Google Alerts, Telegram |
| `src/lib/templates.ts` | Post template engine |
| `src/lib/crypto.ts` | Token encryption AES-256 |
| `src/lib/rateLimit.ts` | API rate limiting |

---

## 📋 TODO — מה עוד צריך לבנות / לתקן

### 🔴 דחוף — פונקציונליות לא מחוברת

#### 1. Facebook OAuth — חיבור אמיתי

```
מה חסר:
- Facebook App ID אמיתי (כרגע env ריק)
- Facebook App Secret אמיתי ב-GCP Secret Manager
- הגדרת OAuth redirect URI ב-Meta Developer Console:
  https://leadpro-394810890087.me-west1.run.app/api/facebook/callback

מה לעשות:
1. צור Facebook App ב-https://developers.facebook.com
2. קבל App ID ו-App Secret
3. הוסף GitHub Secret: NEXT_PUBLIC_FACEBOOK_APP_ID = YOUR_APP_ID
4. עדכן GCP Secret: FACEBOOK_APP_SECRET = YOUR_SECRET
5. בקש הרשאות: pages_manage_posts, groups_access_member_info, publish_to_groups
```

#### 2. Stripe — תשלומים

```
מה חסר:
- Stripe Secret Key אמיתי
- Stripe Publishable Key
- Stripe Webhook Secret

מה לעשות:
1. צור חשבון ב-https://stripe.com
2. קבל API keys מ-Dashboard
3. עדכן GCP Secret: STRIPE_SECRET_KEY = sk_live_...
4. עדכן GCP Secret: STRIPE_WEBHOOK_SECRET = whsec_...
5. הוסף GitHub Secret: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
6. הגדר Webhook URL ב-Stripe Dashboard:
   https://leadpro-394810890087.me-west1.run.app/api/billing/webhook
```

#### 3. Anthropic API Key — AI לפוסטים

```
מה חסר:
- ANTHROPIC_API_KEY אמיתי (יכול להיות placeholder כרגע)

מה לעשות:
עדכן GCP Secret Manager:
gcloud secrets versions add ANTHROPIC_API_KEY \
  --data-file=- --project=leadpro-cef15
(הדבק את המפתח האמיתי)
```

#### 4. Middleware — "proxy" במקום "middleware"

```
אזהרה בלוג: "The 'middleware' file convention is deprecated. Use 'proxy' instead"
מה לעשות: שנה את שם הקובץ src/middleware.ts → src/proxy.ts
```

### 🟡 בינוני — שיפורים מומלצים

#### 5. Dashboard — 6 טאבים לבדיקה

```
בדוק שכל טאב עובד:
□ לידים — הצגת רשימת לידים מ-Firestore
□ פרסום — יצירה ופרסום פוסטים לפייסבוק
□ קבוצות — ניהול קבוצות מחוברות
□ אנליטיקה — גרפים וסטטיסטיקות
□ AI — יצירת פוסטים עם Claude
□ הגדרות — הגדרות משתמש
```

#### 6. Admin Panel — ניהול משתמשים

```
בדוק שהאדמין רואה:
□ רשימת כל המשתמשים
□ סטטוס subscription
□ אפשרות לשנות roles
□ סטטיסטיקות כלל-מערכת
```

#### 7. Telegram Scraper

```
מה חסר: TELEGRAM_BOT_TOKEN אמיתי
עדכן GCP Secret: TELEGRAM_BOT_TOKEN = YOUR_BOT_TOKEN
```

### 🟢 נמוך — לאחר כל השאר

#### 8. Custom Domain

```
אפשרי ב-Cloud Run → Domain Mappings
הוסף: leadpro.co.il או כל דומיין שתרצה
```

#### 9. Firebase App Check

```
מניעת שימוש לרעה ב-Firestore
הפעל ב-Firebase Console → App Check
```

#### 10. Error Monitoring

```
הוסף Sentry לדיווח שגיאות אוטומטי
npm install @sentry/nextjs
```

---

## 🚀 Deploy — איך לפרוס עדכונים

```bash
# כל push ל-main מפרוס אוטומטית!
cd ~/Downloads/leadpro
git add .
git commit -m "your message"
git push

# GitHub Actions יריץ אוטומטית:
# Build Docker → Push to GCR → Deploy to Cloud Run
```

**עמוד GitHub Actions:**  
https://github.com/aviganon/LeadPro/actions

---

## 🔧 פיתוח מקומי

```bash
cd ~/Downloads/leadpro
npm install
npm run dev
# → http://localhost:3000
```

`.env.local` כבר קיים — לא ליצור מחדש!

---

## 📁 מבנה הפרויקט (לא לגעת בשורש)

```
LeadPro/
├── .github/workflows/deploy.yml   🔒 אסור
├── src/
│   ├── app/                       ✅ בטוח לשנות
│   ├── lib/                       ✅ בטוח לשנות
│   ├── components/                ✅ בטוח לשנות
│   ├── hooks/                     ✅ בטוח לשנות
│   ├── context/                   ✅ בטוח לשנות
│   └── types/                     ✅ בטוח לשנות
├── Dockerfile                     🔒 אסור
├── firebase.json                  🔒 אסור
├── firestore.rules                🔒 אסור
├── firestore.indexes.json         🔒 אסור
├── package.json                   ⚠️ שנה רק dependencies
└── .env.local                     🔒 אסור לcommit
```
