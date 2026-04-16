import { NextResponse } from "next/server";

// Open-Meteo 
export async function GET(req: Request) {
  // קריאת נתוני המיקום
  // האפליקציה שולחת נ"צ של הטיול שיצרנו קודם
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat"); // רוחב 
  const lon = searchParams.get("lon"); // אורך
  if (!lat || !lon) {
    return NextResponse.json({ message: "Missing lat/lon" }, { status: 400 });
  }

  // בניית בקשה ל אפיאי חיצוני
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&timezone=auto`; // מתאים את התחזית אוטמטית לאזור הזמן של יעד הטיול

  // שליחת הבקשה
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ message: "Weather fetch failed" }, { status: 500 });
  }

  // חילוץ וסינון הנתונים
  const data = await res.json();
  const daily = data.daily || {};

  // מפה של 3 ימים קדימה עם הנתונים הרלוונטיים 
  const out = (daily.time || []).slice(0, 3).map((date: string, i: number) => ({
    date, // תאריך
    tMax: daily.temperature_2m_max?.[i], // טמפרטורת מקסימום
    tMin: daily.temperature_2m_min?.[i], // טמפרטורת מינימום
    rainChance: daily.precipitation_probability_max?.[i], // סיכוי לגשם
    weathercode: daily.weathercode?.[i], // קוד מצב השמיים
  }));
  
  // החזרת תשובה נקייה למשתמש
  return NextResponse.json({ days: out });
}