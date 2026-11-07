import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema });

// Live deployments on Coolify (each simulator is a standalone app in its own repo).
const simulatorRows: (typeof schema.simulators.$inferInsert)[] = [
  {
    slug: "hv-edu",
    name: "HV-EDU: לוחות מיתוג מתח בינוני",
    description: "לוחות מיתוג SM6 בתלת־ממד: יחידות תפקוד, סימולציית הפעלה עם נעילות, תרגילי נוהל וחידון.",
    url: "https://hv-edu.haviv.pro",
    repo: "elad-haviv/hv-edu",
    level: "professional",
    topics: ["medium-voltage", "switchgear", "safety"],
    tier: "free",
    embeddable: true,
    sortOrder: 1,
  },
  {
    slug: "genset-edu",
    name: "GENSET ACADEMY: גנרטורים",
    description: "גנרטור דיזל בתלת־ממד, חדר גנרטור עם איתור מפגעים, תורת פעולה ובטיחות.",
    url: "https://genset-edu.haviv.pro",
    repo: "elad-haviv/genset-edu",
    level: "technician",
    topics: ["generators", "power-systems", "safety"],
    tier: "free",
    embeddable: true,
    sortOrder: 2,
  },
  {
    slug: "protect-edu",
    name: "הגנה בפני חשמול",
    description: "שבעה מודולים אינטראקטיביים: הארקת הגנה, איפוס, מפסק פחת, שנאי הפרדה, בידוד כפול, SELV/PELV ושוות פוטנציאל.",
    url: "https://protect-edu.haviv.pro",
    repo: "elad-haviv/protect-edu",
    level: "licensing",
    topics: ["protection", "earthing", "regulations"],
    tier: "free",
    embeddable: true,
    sortOrder: 3,
  },
  {
    slug: "agl-edu",
    name: "AGL: תאורת מסלולי המראה",
    description: "קורס שטח אינטראקטיבי על מערכות תאורת שדה תעופה (AGL) לחשמלאים, מהנדסים ומתכננים.",
    url: "https://agl-edu.haviv.pro",
    repo: "elad-haviv/agl-edu",
    level: "professional",
    topics: ["lighting", "series-circuits", "installations"],
    tier: "pro",
    embeddable: true,
    sortOrder: 4,
  },
];

const productRows: (typeof schema.products.$inferInsert)[] = [
  {
    slug: "license-exam",
    name: "סימולטור בחינות רישוי",
    tagline: "מתכוננים לבחינת הרישוי כמו בבחינה האמיתית",
    description: "מבחני תרגול מתוזמנים, בנק שאלות מתויג לפי נושאים ותקנות, הסברים מלאים ומעקב מוכנות לבחינה.",
    status: "coming_soon",
    featured: true,
    topics: ["regulations", "licensing"],
    sortOrder: 1,
  },
  {
    slug: "blue-grid",
    name: "Blue Grid",
    tagline: "כלי מקצועי לעולם רשתות החשמל",
    description: "Blue Grid הוא מוצר של Electricademy למקצועני חשמל. פרטים נוספים בקרוב.",
    url: null,
    status: "live",
    featured: true,
    topics: ["power-systems", "grid"],
    sortOrder: 2,
  },
];

const questionRows: (typeof schema.questions.$inferInsert)[] = [
  {
    topic: "ohms-law",
    level: "basics",
    prompt: "נגד של 46Ω מחובר למתח 230V. מה הזרם במעגל?",
    choices: ["0.2A", "5A", "10.6kA", "46A"],
    answerIndex: 1,
    explanation: "לפי חוק אוהם I = V / R = 230 / 46 = 5A.",
  },
  {
    topic: "power",
    level: "basics",
    prompt: "תנור 2kW עובד במתח 230V. מה הזרם בקירוב?",
    choices: ["2.3A", "8.7A", "11.5A", "460A"],
    answerIndex: 1,
    explanation: "I = P / V = 2000 / 230 ≈ 8.7A (עומס התנגדותי, cosφ = 1).",
  },
  {
    topic: "voltage-drop",
    level: "technician",
    prompt: "מה יקרה למפל המתח בכבל אם נכפיל את אורכו ונשאיר את החתך והזרם ללא שינוי?",
    choices: ["יקטן בחצי", "לא ישתנה", "יוכפל", "יגדל פי ארבעה"],
    answerIndex: 2,
    explanation: "ההתנגדות פרופורציונית לאורך, ולכן גם מפל המתח (ΔU = I·R) יוכפל.",
  },
];

await db.insert(schema.simulators).values(simulatorRows).onConflictDoUpdate({
  target: schema.simulators.slug,
  set: {
    name: sql`excluded.name`,
    description: sql`excluded.description`,
    level: sql`excluded.level`,
    topics: sql`excluded.topics`,
    // All four labs send no X-Frame-Options / frame-ancestors, so the hub can embed them.
    embeddable: sql`excluded.embeddable`,
    sortOrder: sql`excluded.sort_order`,
  },
});

await db.insert(schema.products).values(productRows).onConflictDoUpdate({
  target: schema.products.slug,
  set: {
    name: sql`excluded.name`,
    tagline: sql`excluded.tagline`,
    description: sql`excluded.description`,
    status: sql`excluded.status`,
    topics: sql`excluded.topics`,
  },
});

const [{ count }] = (await db.execute(sql`select count(*)::int as count from question`)) as unknown as [{ count: number }];
if (count === 0) await db.insert(schema.questions).values(questionRows);

// Demo community content, authored by a seed user.
const [author] = await db
  .insert(schema.users)
  .values({ email: "team@electricademy.local", name: "צוות Electricademy", role: "admin", level: "professional" })
  .onConflictDoUpdate({ target: schema.users.email, set: { name: sql`excluded.name` } })
  .returning();

const existingThreads = await db.select({ id: schema.threads.id }).from(schema.threads).limit(1);
if (author && existingThreads.length === 0) {
  const [welcome] = await db
    .insert(schema.threads)
    .values({
      title: "ברוכים הבאים לקהילת Electricademy ⚡",
      body: "כאן שואלים, עונים ולומדים יחד – מחוק אוהם ועד מערכות הספק. ספרו לנו מה אתם לומדים ולאיזו בחינה אתם מתכוננים!",
      tag: "general",
      authorId: author.id,
    })
    .returning();
  await db.insert(schema.threads).values({
    title: "איך בוחרים חתך כבל למעגל כוח של 32A?",
    body: "שאלה שחוזרת הרבה: מה השיקולים מעבר לטבלת זרם מותר? (שיטת התקנה, טמפרטורה, קיבוץ ומפל מתח)",
    tag: "installations",
    authorId: author.id,
    lessonPath: "basics/circuits/voltage-drop",
  });
  if (welcome) {
    await db.insert(schema.posts).values({
      threadId: welcome.id,
      authorId: author.id,
      body: "טיפ ראשון: התחילו מהמסלול \"יסודות החשמל\" – הוא בנוי בדיוק בשביל מי שמתחיל מאפס.",
    });
  }
}

await client.end();
console.log("Seed complete");
