import "./globals.css";
export const metadata= {
  title: 'DocumentInterpreter',
  description: 'Interprentar  y extraer los campos de cualquier archivo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
