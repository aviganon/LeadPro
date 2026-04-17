# ApexLeads — מה בוצע בקוד + מה נשאר (לקלוד / ממשיכים בפיתוח)

מסמך נקודתי לעבודה עם Cursor/Claude. עודכן: אפריל 2026.

---

## סטטוס כללי

| אזור | מצב |
|------|-----|
| ליבת האפליקציה (Next.js 16, Firebase Auth, Firestore) | עובד |
| איסוף לידים (Yad2, RSS, טלגרם, Reddit, stubs) | עובד + הרחבות חלקיות |
| OAuth Facebook | דורש App ID/Secret + Redirect URIs ב-Meta |
| Stripe / בילינג | דורש מפתחות + Webhook |
| AI פוסטים + ציון לידים (Claude) | קוד קיים; ציון לידים אופציונלי עם `LEAD_AI_SCORING=1` |

---

## מה כבר מומש בקוד (סשנים אחרונים)

1. **`createUser` (Firestore)** — לא דורס משתמש קיים (כולל admin); תיעוד ב-`db.ts`.
2. **`proxy.ts`** — הוחלף `middleware.ts` (מוסכם Next.js 16).
3. **דה-דופ לידים** — `createLeadsFromScrape` משתמש במזהה מסמך יציב + עדכון אם ציון גבוה יותר.
4. **Reddit** — חיפוש ב-`r/Israel` בנדל״ן/כללי/גיוס.
5. **Madlan / Autoscout** — פונקציות stub (מחזירות ריק) מחוברות ל-dispatcher; מוכנות למילוי API.
6. **RSS** — `LEAD_RSS_FEED_URLS` + `LEAD_RSS_STRICT_KEYWORDS`.
7. **קטגוריית `recruitment`** — תצורה, UI, איסוף (RSS/טלגרם/Reddit).
8. **`scrapeVertical` + `LEAD_AI_SCORING`** — משתני סביבה ב-`.env.local.example`.
9. **ציון לידים ב-AI** — `src/lib/aiLeadScoring.ts` + קריאה ב-`/api/leads/scrape` כש-`LEAD_AI_SCORING=1`.
10. **GitHub Actions** — הערה על `NEXT_PUBLIC_*` ב-build; לא נוספו סודות שעלולים לשבור deploy.

---

## מה נשאר — דחוף / תשתית

### סביבה וסודות (לא קוד בלבד)

- [ ] **`NEXT_PUBLIC_*` ב-Docker/Cloud Build** — לוודא שכל משתני ה-public זמינים כ-`build-arg` ב-`Dockerfile` וב-Workflow (כבר חלקית; להשוות לרשימה ב-`.env.local.example`).
- [ ] **`TOKEN_ENCRYPTION_KEY`** ב-Cloud Run / Secret Manager — חובה לצפנת טוקני פייסבוק בפעולות שרת; להוסיף ל-`gcloud run --set-secrets` כשהסוד קיים.
- [ ] **Meta Facebook** — App ID, Secret, OAuth Redirect URI בדיוק כמו `NEXTAUTH_URL/api/facebook/callback`.
- [ ] **איפוס סיסמה** — משתמשים שנוצרו ידנית ב-Console: איפוס דרך Firebase Auth.

### באגים / שיפורים קטנים

- [ ] **ייצוא Excel אמיתי** — כרגע יש CSV ב-`/api/leads/export`; להוסיף `.xlsx` (למשל `exceljs`/`sheetjs`) אם נדרש.
- [ ] **ייצוא PDF** — לא קיים; דורש ספרייה (או הדפסת דפדפן).

---

## פיצ’רים מוצר — בינוני מאמץ

- [ ] **Kanban לידים** — טאב לידים היום רשימה; לבנות עמודות `new → contacted → qualified → converted` עם גרירה (`@dnd-kit` וכו’).
- [ ] **פעולות מרובות על לידים** — בחירת מספר לידים → שליחה / שינוי סטטוס.
- [ ] **Madlan אמיתי** — לאחר בדיקת ToS ונתיב API יציב: למלא `scrapeMadlanListings`.
- [ ] **Autoscout / Carwiz** — מילוי `scrapeAutoscoutListings` או מקור ישראלי נוסף עם הרשאות.
- [ ] **ניטור Reddit נוסף** — subreddits נוספים, rate limit, שמירת `permalink` לדה-דופ טוב יותר.

---

## פיצ’רים גדולים / אסטרטגיים (ממסמך המקורי)

הפריטים הבאים **לא מומשו** — דורשים ארכיטקטורה, משפטי שימוש ב-API, או שירותים בתשלום.

### נתונים ממשלתיים / data.gov.il

- [ ] הוצאה לפועל / כינוס נכסים  
- [ ] רשם חברות / מכרזים  
- [ ] מavat / תמ"א — תכניות בנייה  
- כל אלה: סינון dataset, תדירות עדכון, התאמה ל-`Lead` schema.

### מסרים וסוציאל

- [ ] **WhatsApp** (Green API / Twilio / Meta Cloud API) — Webhook → לידים  
- [ ] **ניטור קבוצות פייסבוק** מעבר לפרסום — מוגבל ב-Graph API; דורש מוצר והרשאות  
- [ ] **תגובות אוטומטיות AI** לפוסטים — webhook + מדיניות פייסבוק

### ורטיקלים חדשים

- [ ] `solar_energy`, `insurance`, `mortgage`, `legal`, `accounting` — הרחבת `VERTICAL_CONFIG`, UI הרשמה, סקרייפרים, תבניות פוסט.

### צוותים והרשאות

- [ ] Multi-user / ארגון / הרשאות ברמת צוות — מודל נתונים + UI.

### אנליטיקס ו-ROI

- [ ] השוואת קבוצות פייסבוק לפי לידים  
- [ ] Smart Scheduling לפי שעות פעילות — נדרש נתוני engagement  

---

## הערות טכניות לקלוד

- **ציון AI (`LEAD_AI_SCORING`)** — כבה כברירת מחדל; כשמדליקים, בודקים עלות Haiku לפי כמות לידים באצוות של 12.
- **Reddit** — עלול להחזיר 429; להוסיף backoff או להגביל תדירות.
- **Facebook** — `publish_to_groups` דורש אישור אפליקציה מסוג Business.
- **Firestore indexes** — אם מוסיפים שאילתות חדשות על `leads`, לבדוק `firestore.indexes.json`.

---

## צ’קליסט קצר לסשן הבא

1. לאמת deploy מקצה לקצה (build-args, secrets, `NEXTAUTH_URL`).  
2. להחליט אם להפעיל `LEAD_AI_SCORING` בפרודקשן ולהגדיר תקרת עלות.  
3. לבחור מקור אחד למימוש “עמוק” (Madlan מול Gov API מול WhatsApp).  
4. אם דרוש Kanban — לפרק ל-UI קומפוננטות + עדכון `status` קיים ב-`Lead`.

---

*סוף המסמך — להעתקה ל-Claude או לפתיחת משימה חדשה ב-Cursor.*
