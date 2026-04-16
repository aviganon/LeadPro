# ApexLeads

Next.js (App Router) אפליקציה לניהול לידים, פרסום בקבוצות פייסבוק ו-AI ליצירת תוכן.

## התחלה מהירה

```bash
npm install
cp .env.example .env.local
# מלא משתני סביבה (Firebase, Stripe, וכו')
npm run dev
```

פתחו [http://localhost:3000](http://localhost:3000).

## סקריפטים

- `npm run dev` — שרת פיתוח
- `npm run build` — בנייה לפרודקשן
- `npm run start` — הרצת build
- `npm run lint` — ESLint

## אבטחה (חשוב בפרודקשן)

- **Session**: מסלולי `/api/*` דורשים עוגיית `__session` (מסונכרנת ב-`SessionSync`). בקשות ללא סשן מקבלות `401` JSON (לא הפניה ל-HTML).
- **זהות**: בנתיבי API עם `userId` בגוף או ב-query, השרת מאמת ש-`userId` תואם ל-UID מהטוקן (`verifyApiAuth` + `requireMatchingUser`).
- **Rate limiting**: עם `UPSTASH_REDIS_REST_URL` ו-`UPSTASH_REDIS_REST_TOKEN` משתמשים ב-Upstash; בלי זה — מגבלה בזיכרון (מתאים בעיקר לפיתוח / מופע יחיד).
- **כותרות אבטחה**: מוגדרות ב-`next.config.ts` (frameguard, nosniff, וכו').
- **טוקנים**: טוקני פייסבוק נשמרים מוצפנים (AES-GCM); מפתח ב-`TOKEN_ENCRYPTION_KEY` או `ENCRYPTION_KEY`.

## קבצי סביבה

ראו `.env.example` ו-`.env.local.example` לרשימת משתנים.

## מבנה עיקרי

- `src/app` — דפים ו-API routes
- `src/lib` — Firebase Admin, אימות API, rate limit, הצפנה
- `src/hooks` — `useLeads`, `usePosts`, `useDebouncedValue`, וכו'

## רישיון

פרטי הרישיון לפי המאגר שלכם.
