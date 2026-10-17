export const metadata = {
  title: '301tajrobiroom',
  description: 'اتاق همکلاسی‌های ۳۰۱ تجربی',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Vazirmatn, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
