import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // שולפים את שם המקום מתוך הכתובת
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    // אם לא שלחו כלום מחזירים תשובה ריקה בלי תמונה
    if (!q) {
      return NextResponse.json({ ok: true, imageUrl: null });
    }

    // חיפוש תמונה אמיתית בוויקופדיה
    try {
      const wikiUrl =
        "https://commons.wikimedia.org/w/api.php" +
        "?action=query&format=json&origin=*" +
        "&generator=search&gsrnamespace=6&gsrlimit=3" +
        `&gsrsearch=${encodeURIComponent(q + " landscape")}` +
        "&prop=imageinfo&iiprop=url";

      const r = await fetch(wikiUrl, {
        headers: { "User-Agent": "afeka-trips-2026/1.0" },
        cache: "no-store",
      });

      if (r.ok) {
        const data = await r.json();
        const pages = data?.query?.pages;

        if (pages) { 
          const pageKeys = Object.keys(pages);
          if (pageKeys.length > 0) {
            // Random selection from available images
            const randomIndex = Math.floor(Math.random() * pageKeys.length);
            const imageUrl = pages[pageKeys[randomIndex]]?.imageinfo?.[0]?.url;
           
            if (imageUrl) { 
              return NextResponse.json({ ok: true, imageUrl });
            }
          }
        }
      }
    } catch (wikiError) {
      console.log("Wikimedia failed, using fallback");
    }

    const hash = q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const id = Math.abs(hash) % 1000;
    const imageUrl = `https://picsum.photos/id/${id}/800/600`;

    return NextResponse.json({ ok: true, imageUrl });
  } catch (e: any) { 
    console.error("Image API error:", e);
    return NextResponse.json(
      { ok: false, imageUrl: null, message: String(e) },
      { status: 500 }
    );
  }
}