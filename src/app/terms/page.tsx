import type { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `תנאי שימוש · ${APP_NAME}`,
  description:
    'תנאי השימוש של ApexLeads — החובות והזכויות שלך בעת השימוש בפלטפורמה.',
}

const LAST_UPDATED = '18 באפריל 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              פרטיות
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              מחירים
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">תנאי שימוש</h1>
          <p className="text-sm text-muted-foreground">עודכן לאחרונה: {LAST_UPDATED}</p>
        </div>

        <p className="leading-relaxed">
          ברוכים הבאים ל-{APP_NAME} (&quot;השירות&quot;). שימוש בשירות כפוף לתנאים המפורטים להלן. עצם הרישום או
          השימוש באפליקציה מהווה הסכמה לתנאים אלה. אם אינך מסכים — הימנע מהשימוש בשירות.
        </p>

        <Section title="1. השירות">
          <p>
            {APP_NAME} היא פלטפורמת SaaS לאיסוף לידים, ניהולם ופרסום לקבוצות פייסבוק. השירות כולל רכיבי AI
            (Claude API), אינטגרציות עם פייסבוק, Stripe ו-Telegram, וכלים לניתוח ואוטומציה של תהליכי שיווק.
          </p>
        </Section>

        <Section title="2. חשבון משתמש">
          <ul>
            <li>נדרשת הרשמה עם אימייל תקף. אתה אחראי לשמירת פרטי ההתחברות.</li>
            <li>אסור לשתף חשבון עם משתמשים אחרים ללא רישיון מתאים (תוכנית צוות/ארגון).</li>
            <li>אנחנו רשאים להשהות או לבטל חשבון שהפר את התנאים, ללא הודעה מוקדמת במקרים חמורים.</li>
            <li>המשתמש מצהיר כי הוא בגיר (18+) ובעל סמכות חוקית להשתמש בשירות.</li>
          </ul>
        </Section>

        <Section title="3. שימוש מותר ושימוש אסור">
          <p>השימוש בשירות מחייב עמידה בחוקים החלים — בפרט חוק הגנת הפרטיות ותקנות ספאם.</p>
          <p>אסור בהחלט:</p>
          <ul>
            <li>לפרסם תוכן בלתי חוקי, פוגעני, מטעה, פורנוגרפי או מפר זכויות יוצרים.</li>
            <li>לפרסם ספאם, הונאות פישינג או תוכן שיווקי ללא הסכמת מקבל ההודעה.</li>
            <li>לאסוף נתונים אישיים של אנשים ללא בסיס חוקי (הסכמה, אינטרס לגיטימי וכד׳).</li>
            <li>לעקוף מגבלות טכניות של Meta, Reddit או פלטפורמות אחרות — הדבר מפר את תנאי השירות שלהן.</li>
            <li>לבצע reverse engineering, scraping אוטומטי של השירות עצמו, או התקפות על התשתית.</li>
          </ul>
          <p>
            המשתמש אחראי בלעדית לתוכן שהוא מפרסם באמצעות השירות ולעמידתו בתנאי השימוש של פייסבוק
            ושל כל פלטפורמה אחרת אליה הוא מפרסם.
          </p>
        </Section>

        <Section title="4. חיבור פייסבוק">
          <ul>
            <li>
              החיבור לפייסבוק נעשה דרך OAuth הרשמי. ההרשאות הנדרשות:
              <code className="px-1 rounded bg-muted mx-1">groups_access_member_info</code>,
              <code className="px-1 rounded bg-muted mx-1">publish_to_groups</code>.
            </li>
            <li>
              השימוש בטוקן כפוף ל-<a className="text-primary hover:underline" href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer">Meta Platform Terms</a>.
            </li>
            <li>אחסון הטוקן מוצפן. לפרטים ראה את <Link href="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</Link>.</li>
          </ul>
        </Section>

        <Section title="5. תשלומים ומנויים">
          <ul>
            <li>תוכניות בתשלום מנוהלות דרך Stripe. חיוב חודשי/שנתי לפי התוכנית שנבחרה.</li>
            <li>ניתן לבטל מנוי בכל עת — הביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית.</li>
            <li>אין החזרים לתקופות חיוב חלקיות, למעט במקרים המתחייבים על-פי חוק.</li>
            <li>במקרה של כשל בתשלום — החשבון עובר לתוכנית Free לאחר 7 ימי חסד.</li>
          </ul>
        </Section>

        <Section title="6. קניין רוחני">
          <ul>
            <li>
              הבעלות על הפלטפורמה ({APP_NAME}) — הקוד, העיצוב, השם והמותג — שייכת לנו בלעדית.
            </li>
            <li>
              הלידים, הפוסטים והתבניות שאתה יוצר שייכים לך. אנו מקבלים רישיון מוגבל לאחסן ולעבד אותם
              לצורך מתן השירות.
            </li>
            <li>
              אסור להעתיק, לשכפל או למכור חלקים מהשירות ללא אישור בכתב.
            </li>
          </ul>
        </Section>

        <Section title="7. AI ותכנים שנוצרו אוטומטית">
          <p>
            פיצ׳רים מסוימים (יצירת פוסטים, ציון לידים) משתמשים ב-Anthropic Claude API. תוצרים של AI ניתנים
            &quot;כפי שהם&quot; — אנחנו לא מתחייבים לדיוק מלא. חובת הבדיקה והאחריות על התוכן מוטלת על המשתמש.
          </p>
        </Section>

        <Section title="8. זמינות השירות">
          <p>
            אנו שואפים לזמינות של 99.5% אך לא מתחייבים לכך. השירות עשוי להיות בלתי זמין עקב תחזוקה, שדרוגים
            או סיבות מעבר לשליטתנו. לא נהיה אחראים לנזקים שנגרמו עקב אי-זמינות.
          </p>
        </Section>

        <Section title="9. הגבלת אחריות">
          <p>
            במלוא המותר בחוק, {APP_NAME} לא תהיה אחראית לכל נזק עקיף, מקרי, תוצאתי או מיוחד — כולל אובדן רווחים,
            לידים או מידע. סך האחריות במקרה כלשהו מוגבל לסכום ששולם על-ידי המשתמש ב-12 החודשים שלפני האירוע.
          </p>
        </Section>

        <Section title="10. שיפוי">
          <p>
            המשתמש מתחייב לשפות את {APP_NAME} בגין כל תביעה, הוצאה או נזק שינבעו מהפרת תנאי שימוש אלה, מהפרת
            חוקים על-ידו, או משימוש לרעה בפלטפורמה.
          </p>
        </Section>

        <Section title="11. שינויים בתנאים">
          <p>
            אנחנו רשאים לעדכן את התנאים מעת לעת. שינויים מהותיים יישלחו באימייל לפחות 30 ימים לפני כניסתם
            לתוקף. המשך שימוש לאחר עדכון מהווה הסכמה לתנאים החדשים.
          </p>
        </Section>

        <Section title="12. דין וסמכות שיפוט">
          <p>
            על תנאים אלה חלים דיני מדינת ישראל. סמכות השיפוט הייחודית נתונה לבתי המשפט המוסמכים במחוז תל
            אביב.
          </p>
        </Section>

        <Section title="13. יצירת קשר">
          <p>
            לשאלות על תנאי השימוש כתבו לנו: <a className="text-primary hover:underline" href="mailto:support@apexleads.vip">support@apexleads.vip</a>
          </p>
        </Section>

        <div className="border-t border-border pt-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">חזרה לעמוד הבית</Link>
          <Link href="/privacy" className="hover:text-foreground">מדיניות פרטיות ←</Link>
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
