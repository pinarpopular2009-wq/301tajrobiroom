import { toJalaali } from 'jalaali-js'

// زمان تهران (تقریبی +3:30)
export function getTehranNow() {
  const now = new Date()
  const tehranOffset = 3.5 * 60 // دقیقه
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (tehranOffset * 60000))
}

// تاریخ میلادی امروز بر اساس منطق ۷ صبح
export function getCurrentPollDate() {
  const tehran = getTehranNow()
  if (tehran.getHours() < 7) {
    tehran.setDate(tehran.getDate() - 1)
  }
  return tehran.toISOString().split('T')[0]
}

// تاریخ فردا به شمسی
export function getTomorrowJalali() {
  const tehran = getTehranNow()
  if (tehran.getHours() >= 7) {
    tehran.setDate(tehran.getDate() + 1)
  }
  
  const j = toJalaali(tehran.getFullYear(), tehran.getMonth() + 1, tehran.getDate())
  const month = String(j.jm).padStart(2, '0')
  const day = String(j.jd).padStart(2, '0')
  return `\( {j.jy}/ \){month}/${day}`
}

// day_key برای چت
export function getDayKey() {
  return getCurrentPollDate()
}
