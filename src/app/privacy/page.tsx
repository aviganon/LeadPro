import type { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `מדיניות פרטיות · ${APP_NAME}`,
  description:
    'מדיניות הפרטיות של ApexLeads — מה אנחנו אוספים, למה, ואיך אנחנו שומרים על המידע שלך.',
}

const LAST_UPDATED = '18 באפריל 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              תנאי שימוש
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              מחירים
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">מדיניות פרטיות</h1>
          <p className="text-sm text-muted-foreground">עודכן לאחרונה: {LAST_UPDATED}</p>
        </div>

        <p className="leading-relaxed">
          {APP_NAME} (&quot;אנחנו&quot;, &quot;השירות&quot;) מכבדת את פרטיות המשתמשים שלה. מסמך זה מפרט אילו נתונים נאספים,
          כיצד נעשה בהם שימוש, כיצד הם מאוחסנים ומתי הם נמחקים. המסמך נכתב בהתאם לעקרונות GDPR ולתקנות הגנת הפרטיות
          בישראל (תקנות הגנת הפרטיות (אבטחת מידע), תשע״ז-2017).
        </p>

        <Section title="1. מידע שאנחנו אוספים">
          <p>בעת ההרשמה ושימוש בשירות אנחנו אוספים:</p>
          <ul>
            <li>פרטי חשבון — שם, אימייל, סיסמה מוצפנת (דרך Firebase Authentication).</li>
            <li>פרטי פרופיל עסקי — ורטיקל (נדל״ן / רכב / ביטוח וכו׳), תוכנית, תפקיד.</li>
            <li>
              טוקני פייסבוק — כאשר אתה מתחבר לפייסבוק דרך OAuth, אנו שומרים את ה-Access Token
              <strong> בצורה מוצפנת (AES-GCM 256-bit)</strong> לצורך סנכרון קבוצות ופרסום פוסטים מטעמך.
            </li>
            <li>לידים — נתונים ציבוריים בלבד שנאספים באמצעות Scrapers (Reddit, יד2 וכדומה) או מוזנים ידנית.</li>
            <li>מטריקות שימוש — Vercel Analytics ללא זיהוי אישי.</li>
          </ul>
        </Section>

        <Section title="2. כיצד אנחנו משתמשים במידע">
          <ul>
            <li>לספק את השירות — איסוף לידים, פרסום לקבוצות פייסבוק, ניתוח נתונים.</li>
            <li>לאימות זהות ולניהול הרשאות.</li>
            <li>לשפר את המוצר על בסיס נתוני שימוש מצטברים ואנונימיים.</li>
            <li>לשלוח התראות רלוונטיות (סטטוס פרסום, פגיעה במגבלת תוכנית).</li>
          </ul>
          <p>
            <strong>אנחנו לא מוכרים מידע אישי של משתמשים לצדדים שלישיים.</strong>
          </p>
        </Section>

        <Section title="3. שיתוף עם צדדים שלישיים">
          <p>המידע מאוחסן ו/או מעובד אצל ספקים הבאים (Data Processors):</p>
          <ul>
            <li>
              <strong>Google Cloud Firestore + Firebase Auth</strong> — אחסון נתונים, אימות משתמשים. אזור:
              <code className="px-1 mx-1 rounded bg-muted">me-west1</code> (ישראל).
            </li>
            <li>
              <strong>Meta Platforms (Facebook)</strong> — חיבור OAuth ופרסום בקבוצות. כפוף
              ל-<a className="text-primary hover:underline" href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer">מדיניות הפרטיות של Meta</a>.
            </li>
            <li>
              <strong>Anthropic (Claude API)</strong> — ציון לידים וייצור תוכן AI. טקסטים נשלחים ל-API ללא מזהים אישיים.
            </li>
            <li>
              <strong>Stripe</strong> — עיבוד תשלומים. אנחנו לא שומרים פרטי כרטיס אשראי — הם עוברים ישירות ל-Stripe.
            </li>
            <li>
              <strong>Vercel / Google Cloud Run</strong> — תשתית אירוח ומחשוב.
            </li>
          </ul>
        </Section>

        <Section title="4. טוקני פייסבוק">
          <p>
            כאשר אתה מחבר חשבון פייסבוק, אנחנו מבקשים הרשאות OAuth לקריאת קבוצות ופרסום
            (<code className="px-1 rounded bg-muted">groups_access_member_info</code>,
            <code className="px-1 rounded bg-muted">publish_to_groups</code>). הטוקן מוצפן לפני שמירה במפתח
            <code className="px-1 rounded bg-muted">TOKEN_ENCRYPTION_KEY</code> שמנוהל ב-Google Secret Manager.
            ניתן לנתק את חיבור הפייסבוק בכל רגע דרך הדאשבורד או דרך הגדרות החשבון בפייסבוק.
          </p>
        </Section>

        <Section title="5. Cookies ו-Sessions">
          <ul>
            <li>
              <strong>Session cookie</strong> — נקרא <code className="px-1 rounded bg-muted">__session</code>, מוצפן ו-HttpOnly, משמש לאימות.
            </li>
            <li>
              <strong>Local storage</strong> — משמש לשמירת העדפות UI (תצוגת קנבן/רשימה, מצב Sidebar).
            </li>
          </ul>
        </Section>

        <Section title="6. זכויותיך">
          <p>כמשתמש, לך הזכות:</p>
          <ul>
            <li>לעיין במידע האישי שלך.</li>
            <li>לבקש תיקון או מחיקה של המידע.</li>
            <li>לבטל את הסכמתך לעיבוד מידע.</li>
            <li>לקבל העתק מובנה של המידע שלך (ייצוא CSV/Excel דרך הדאשבורד).</li>
            <li>להגיש תלונה לרשות להגנת הפרטיות.</li>
          </ul>
          <p>למימוש זכויות — שלח אימייל ל-<a className="text-primary hover:underline" href="mailto:privacy@apexleads.vip">privacy@apexleads.vip</a>.</p>
        </Section>

        <Section title="7. שמירה ומחיקה">
          <p>
            נתונים נשמרים כל עוד החשבון פעיל. בעת מחיקת חשבון, כל הנתונים האישיים נמחקים תוך 30 ימי עסקים.
            גיבויי מערכת שנשמרים עד 90 ימים נוספים מוצפנים ואינם נגישים אלא במצב של שחזור אסון.
          </p>
        </Section>

        <Section title="8. אבטחה">
          <ul>
            <li>תקשורת HTTPS בלבד (TLS 1.2+).</li>
            <li>טוקני פייסבוק מוצפנים ב-AES-GCM 256-bit לפני אחסון.</li>
            <li>סיסמאות לא נשמרות אצלנו — מנוהלות ב-Firebase Auth (bcrypt).</li>
            <li>Firestore Security Rules מגבילות גישה למסמכים לפי זהות המשתמש.</li>
            <li>Rate limiting נגד התקפות brute-force דרך Upstash Redis.</li>
          </ul>
        </Section>

        <Section title="9. קטינים">
          <p>
            השירות אינו מיועד לשימוש מתחת לגיל 16. אנחנו לא אוספים ביודעין מידע ממשתמשים בגיל זה.
          </p>
        </Section>

        <Section title="10. שינויים במדיניות">
          <p>
            אנחנו עשויים לעדכן את המסמך הזה מעת לעת. שינויים מהותיים יישלחו באימייל וגם יוצגו בעמוד זה
            בתחילת תקופה של 30 ימים לפני כניסתם לתוקף.
          </p>
        </Section>

        <Section title="11. יצירת קשר">
          <p>
            שאלות לגבי מדיניות הפרטיות? כתבו לנו: <a className="text-primary hover:underline" href="mailto:privacy@apexleads.vip">privacy@apexleads.vip</a>
          </p>
        </Section>

        <div className="border-t border-border pt-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">חזרה לעמוד הבית</Link>
          <Link href="/terms" className="hover:text-foreground">תנאי שימוש ←</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="leading-relaxed space-y-3 text-muted-foreground [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:space-y-1.5 [&_ul]:text-foreground [&_p]:text-foreground">
        {children}
      </div>
    </section>
  )
}
