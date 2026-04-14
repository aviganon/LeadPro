# ⚠️ IMPORTANT: Do NOT overwrite these files or values

מסמך זה משלב הנחיות קודמות (Claude / Cursor). **אל תמחק ואל תשנה שמות של משתנים או סודות** שהוגדרו ב-GitHub או כאן — רק הוסף או הבהר כשיש אישור בעלים.

**תדריך מלא (פרודקשן, TODO, routes, GCP):** [`CURSOR_FULL_BRIEFING.md`](./CURSOR_FULL_BRIEFING.md)

---

## Protected environment variables (set as GitHub Secrets)

These values are configured in GitHub Actions and must **NOT** be hardcoded in application source or committed to the repo:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = leadpro-cef15 *(ערך אמיתי רק ב-Secrets / env מקומי)*
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GCP_PROJECT_ID` = leadpro-cef15
- `GCP_SA_KEY` (service account JSON — תוכן מלא ב-Secret בלבד)
- `NEXTAUTH_SECRET`
- `ANTHROPIC_API_KEY`
- `FIREBASE_TOKEN`

**כלל:** שמות הסודות ב-GitHub חייבים להתאים בדיוק לשמות ב-workflow (`${{ secrets.NAME }}`). אל תשנה שמות בלי לעדכן גם ב-GitHub.

---

## Protected files — do NOT modify (ברירת מחדל)

- `.github/workflows/deploy.yml` — CI/CD pipeline *(שינוי רק אחרי אישור בעלים, ורק לתיקון ממוקד — למשל auth)*
- `firebase.json` — Firebase config
- `firestore.rules` — security rules
- `firestore.indexes.json` — database indexes
- `Dockerfile` — Cloud Run container
- `.env.local` — local only, never commit; **never create or overwrite** in automation

---

## Firebase Project

- Project ID: `leadpro-cef15`
- Region: `europe-west1`
- Firestore: default database

---

## GitHub Actions — `google-github-actions/auth@v2`

אם מופיעה השגיאה: *must specify exactly one of `workload_identity_provider` or `credentials_json`*:

1. **Service Account JSON (Secret `GCP_SA_KEY`)** — בצעד האימות חייב להופיע **אחד** מהבאים בלבד:
   - `credentials_json: ${{ secrets.GCP_SA_KEY }}`
   - או Workload Identity: `workload_identity_provider` + `service_account` (בלי `credentials_json` באותו צעד).

2. **ערך ריק:** ודא שה-Secret קיים ב-Repository ושה-workflow לא רץ מ-fork/Dependabot בלי סודות — ב-PR מ-fork ו-Dependabot ברירת המחדל היא **לא** להעביר `secrets` של ה-repo, ואז הקלט יוצא ריק וה-action נכשל.

3. **לא לדרוס:** בעת תיקון workflow, אל תסיר secrets או jobs אחרים; רק הוסף/תקן את בלוק `auth@v2`.

---

## Scope for AI / Cursor (קוד)

- שינויי קוד יישומי: בעיקר תחת **`src/`** בלבד.
- **אל** לשנות קונפיגורציית deployment ללא סקירה עם בעל הפרויקט.
- **אל** ליצור או לדרוס `.env.local`.
- מסמך זה (`CURSOR_INSTRUCTIONS.md`) — עדכון מותר כשבעל הפרויקט מאשר, בלי למחוק רשימת משתנים קיימת.

---

*משולב מעדכונים קודמים (Claude) + תיקון תיעוד ל-auth ב-GitHub Actions.*
