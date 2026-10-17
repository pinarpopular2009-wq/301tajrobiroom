import jalaali from 'jalaali-js'

// زمان تهران (تقریبی +3:30)
export function getTehranNow() {
  const now = new Date()
  // تبدیل به زمان تهران (ساده)
  const tehranOffset = 3.5 * 60 // دقیقه
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (tehranOffset * 60000))
}

// آیا الان بعد از ساعت ۷ صبح تهران هستیم؟
export function isAfter7AM() {
  const tehran = getTehranNow()
  return tehran.getHours() >= 7
}

// تاریخ میلادی امروز بر اساس منطق ۷ صبح
export function getCurrentPollDate() {
  const tehran = getTehranNow()
  if (tehran.getHours() < 7) {
    // هنوز روز قبلی حساب می‌شود
    tehran.setDate(tehran.getDate() - 1)
  }
  return tehran.toISOString().split('T')[0] // YYYY-MM-DD
}

// تاریخ فردا به شمسی (برای نمایش زیر نظرسنجی)
export function getTomorrowJalali() {
  const tehran = getTehranNow()
  // اگر قبل از ۷ صبح هستیم، "فردا" همان امروز است از نظر نظرسنجی
  if (tehran.getHours() < 7) {
    // نظرسنجی هنوز برای "امروز" به عنوان فردا است
  } else {
    tehran.setDate(tehran.getDate() + 1)
  }
  
  const j = jalaali.toJalaali(tehran.getFullYear(), tehran.getMonth() + 1, tehran.getDate())
  const month = String(j.jm).padStart(2, '0')
  const day = String(j.jd).padStart(2, '0')
  return `${j.jy}/${month}/${day}`
}

// day_key برای چت و ریست
export function getDayKey() {
  return getCurrentPollDate()
}
