# LeadPro — מדריך התקנה מלא

## 1. Firebase — יצירת פרויקט

1. פתח [console.firebase.google.com](https://console.firebase.google.com)
2. לחץ **Add project** → שם: `leadpro-prod`
3. הפעל **Firestore Database** (Production mode)
4. הפעל **Authentication** → Email/Password
5. שדרג ל-**Blaze plan** (נדרש לCloud Functions)

### הרשאות IAM נדרשות (לService Account של GitHub Actions)
```
Cloud Run Admin
Cloud Build Service Account
Storage Admin
Secret Manager Secret Accessor
Firebase Rules Admin
Service Usage Consumer
```

---

## 2. Facebook App — יצירה והגשה

1. פתח [developers.facebook.com](https://developers.facebook.com)
2. **My Apps → Create App → Business**
3. הוסף מוצר: **Facebook Login**
4. Settings → Basic:
   - App Domains: `your-domain.com`
   - Privacy Policy URL: נדרש לApp Review
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs: `https://your-domain.com/api/facebook/callback`

### הגשת App Review
בקש את ההרשאות הבאות:
- `publish_to_groups` — הסבר: "אפליקציה ל-social media management המאפשרת למשתמשים עסקיים לפרסם תוכן בקבוצות שלהם"
- `groups_access_member_info` — הסבר: "לצורך שליפת רשימת הקבוצות שהמשתמש חבר בהן"

⚠️ App Review לוקח 2-4 שבועות. בינתיים אפשר לעבוד עם Development mode (עד 100 users).

---

## 3. GitHub Secrets

הוסף את ה-Secrets הבאים ב-GitHub → Settings → Secrets and variables → Actions:

### GCP
| Secret | ערך |
|--------|-----|
| `GCP_PROJECT_ID` | ID של פרויקט ה-Firebase |
| `GCP_SA_KEY` | JSON key של Service Account |
| `FIREBASE_TOKEN` | `firebase login:ci` |

### Firebase (NEXT_PUBLIC)
| Secret | מאיפה לקחת |
|--------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |

### Facebook
| Secret | מאיפה לקחת |
|--------|------------|
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App → Settings → Basic |
| `FACEBOOK_APP_SECRET` | שם |

### אחרים
| Secret | |
|--------|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | |
| `STRIPE_WEBHOOK_SECRET` | אחרי יצירת webhook |

---

## 4. Stripe — הגדרת מוצרים

```bash
# צור products ו-prices ב-Stripe:
stripe products create --name="LeadPro Basic"
stripe prices create --product=<id> --unit-amount=9900 --currency=ils --recurring[interval]=month

stripe products create --name="LeadPro Pro"  
stripe prices create --product=<id> --unit-amount=29900 --currency=ils --recurring[interval]=month

stripe products create --name="LeadPro Enterprise"
stripe prices create --product=<id> --unit-amount=99900 --currency=ils --recurring[interval]=month
```

הוסף את ה-Price IDs ל-Secrets:
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PRO`  
- `STRIPE_PRICE_ENTERPRISE`

Webhook endpoint: `https://your-domain.com/api/billing/webhook`
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## 5. Cloud Secrets Manager

סוד-ים שנשמרים ב-Google Secret Manager (לא ב-GitHub):
```bash
echo -n "your-secret" | gcloud secrets create FACEBOOK_APP_SECRET --data-file=-
echo -n "your-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-key" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
echo -n "your-key" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
echo -n "your-secret" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

---

## 6. Deploy ראשון

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USER/leadpro.git
git push -u origin main
```

GitHub Actions יריץ את הpipeline אוטומטית.

---

## 7. אחרי Deploy

1. עדכן את ה-NEXTAUTH_URL ב-Secret ל-URL האמיתי של Cloud Run
2. עדכן את Facebook App → Valid OAuth Redirect URIs ל-URL החדש
3. הפעל Firebase Functions: `firebase deploy --only functions`
4. הגש App Review לפייסבוק
