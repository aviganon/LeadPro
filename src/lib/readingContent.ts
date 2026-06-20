// תוכן לימוד קריאה לכיתה א' — מילים מנוקדות עם אימוג'י, מקובצות לפי נושא.
// משמש את משחקי הקריאה (ReadingGame). אימוג'י = "תמונה" ללא צורך בקבצים.

export interface ReadItem { word: string; emoji: string }
export interface ReadCategory { id: string; name: string; emoji: string; items: ReadItem[] }

export const READING_CATEGORIES: ReadCategory[] = [
  {
    id: 'animals', name: 'חַיּוֹת', emoji: '🐾',
    items: [
      { word: 'כֶּלֶב', emoji: '🐶' },
      { word: 'חָתוּל', emoji: '🐱' },
      { word: 'פִּיל', emoji: '🐘' },
      { word: 'אַרְיֵה', emoji: '🦁' },
      { word: 'דָּג', emoji: '🐟' },
      { word: 'צִפּוֹר', emoji: '🐦' },
      { word: 'סוּס', emoji: '🐴' },
      { word: 'פָּרָה', emoji: '🐄' },
      { word: 'דֹּב', emoji: '🐻' },
      { word: 'קוֹף', emoji: '🐵' },
      { word: 'אַרְנָב', emoji: '🐰' },
      { word: 'צָב', emoji: '🐢' },
    ],
  },
  {
    id: 'food', name: 'אֹכֶל', emoji: '🍎',
    items: [
      { word: 'תַּפּוּחַ', emoji: '🍎' },
      { word: 'בָּנָנָה', emoji: '🍌' },
      { word: 'לֶחֶם', emoji: '🍞' },
      { word: 'עוּגָה', emoji: '🍰' },
      { word: 'גְּלִידָה', emoji: '🍦' },
      { word: 'גֶּזֶר', emoji: '🥕' },
      { word: 'עֲנָבִים', emoji: '🍇' },
      { word: 'תּוּת', emoji: '🍓' },
      { word: 'בֵּיצָה', emoji: '🥚' },
      { word: 'גְּבִינָה', emoji: '🧀' },
      { word: 'לִימוֹן', emoji: '🍋' },
      { word: 'אֲבַטִּיחַ', emoji: '🍉' },
    ],
  },
  {
    id: 'objects', name: 'חֲפָצִים', emoji: '🎒',
    items: [
      { word: 'כִּסֵּא', emoji: '🪑' },
      { word: 'סֵפֶר', emoji: '📖' },
      { word: 'כַּדּוּר', emoji: '⚽' },
      { word: 'שָׁעוֹן', emoji: '⏰' },
      { word: 'מַפְתֵּחַ', emoji: '🔑' },
      { word: 'טֵלֵפוֹן', emoji: '📱' },
      { word: 'נַעַל', emoji: '👟' },
      { word: 'כּוֹבַע', emoji: '🧢' },
      { word: 'מַתָּנָה', emoji: '🎁' },
      { word: 'בָּלוֹן', emoji: '🎈' },
      { word: 'עִפָּרוֹן', emoji: '✏️' },
      { word: 'מִטְרִיָּה', emoji: '☂️' },
    ],
  },
  {
    id: 'nature', name: 'טֶבַע', emoji: '🌳',
    items: [
      { word: 'שֶׁמֶשׁ', emoji: '☀️' },
      { word: 'יָרֵחַ', emoji: '🌙' },
      { word: 'כּוֹכָב', emoji: '⭐' },
      { word: 'עֵץ', emoji: '🌳' },
      { word: 'פֶּרַח', emoji: '🌸' },
      { word: 'עָנָן', emoji: '☁️' },
      { word: 'גֶּשֶׁם', emoji: '🌧️' },
      { word: 'אֵשׁ', emoji: '🔥' },
      { word: 'קֶשֶׁת', emoji: '🌈' },
      { word: 'שֶׁלֶג', emoji: '❄️' },
    ],
  },
]
