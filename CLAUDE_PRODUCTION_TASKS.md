# LeadPro — מעבר לפרודקשן (המשך עבודה ל-Claude)

מסמך זה משלים את מה שכבר יושם בקוד: **הסרת דמו מהאדמין, לנדינג ותמחור**, ו-**API אדמין אמיתי** מול Firestore.

---

## מה כבר טופל בקוד

- **Admin**: משתמשים, סטטיסטיקות וספירות — מ-`/api/admin/overview` (קריאות `count()` ב-Firestore). עדכון `isActive` — `PATCH /api/admin/users/[userId]` (רק אדמין מזוהה מקוקי `__session`).
- **לוגים / מערכת**: הוסרו רשימות דמה; מוצגות הסברים לכיוון Cloud Logging / Firebase Console.
- **דף הבית**: הוסרו מונים מזויפים (2500 / 98% / 45K), ציטוטי &quot;לקוחות&quot; בדויים, ולינק `#demo`; נוספה סעיף &quot;למה LeadPro&quot; ללא שמות מומצאים.
- **תמחור / אימות**: הוסרו ניסוחים של &quot;אלפי לקוחות&quot; / &quot;2,500+&quot;; גרף דקורטיבי באימות — גבהים קבועים במקום `Math.random`.

---

## מה ש-Claude צריך לבדוק / להשלים בסביבה

1. **אינדקסים ב-Firestore**  
   אם ב-Logs מופיעות שגיאות על שאילתות `where('createdAt', '>=', …)` או `where('status','==','converted')`, צור אינדקס מורכב כפי ש-Firestore מציע בלינק מהשגיאה.

2. **הרשאות Service Account**  
   ה-Deploy (GitHub Actions / Cloud Run) חייב גישה ל-Firestore עם פעולות aggregate/count — בדרך כלל כבר קיים עם `roles/datastore.user` או `editor` לפרויקט.

3. **משתני סביבה**  
   - `FIREBASE_SERVICE_ACCOUNT_KEY` או Application Default Credentials ב-Runtime — כדי ש-`firebase-admin` ב-API routes יאמת טוקנים ויקרא Firestore.  
   - מפתחות Stripe / Anthropic / Facebook — כפי שב-`CURSOR_FULL_BRIEFING.md`; בלי זה התכונות לא &quot;אמיתיות&quot; בזמן ריצה.

4. **מיגרציה ל-Next 16**  
   אזהרת `middleware` → `proxy` — משימה נפרדת (`src/middleware.ts`).

5. **לוגים מרכזיים באפליקציה (אופציונלי)**  
   כרגע אין collection `audit_logs`. אם רוצים טבלה באדמין: לכתוב Cloud Function / Route שיכתוב אירועים ל-Firestore ולהציג לפי הרשאות.

6. **Footer / קישורי Placeholder**  
   בדף הבית עדיין יש קישורי `#` (אודות, בלוג). להחליף בכתובות אמיתיות או להסיר.

---

## הערות טכניות

- ספירת משתמשים: עד **500** מסמכים מ-`users` (ללא `orderBy` כדי לא להחריג מסמכים בלי `createdAt`).
- **שיעור המרה**: מחושב מיחס לידים עם `status === 'converted'` לכל הלידים (אם אין שדה `status` בחלק מהלידים, ייתכן צורך בהגדרת ברירת מחדל בשאילתה).
