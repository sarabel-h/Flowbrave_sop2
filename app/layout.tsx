import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import { PostHogProvider } from '@/components/Providers'
import { getClerkConfig, logClerkConfig } from '@/lib/clerk-config'

export const metadata: Metadata = {
  title: 'Flowbrave SOPs',
  description: 'SOPs at your fingertips',
  generator: 'Flowbrave SOPs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Obtient la configuration Clerk selon l'environnement
  const clerkConfig = getClerkConfig()
  
  // Affiche la configuration pour debug
  logClerkConfig()

  return (
    <ClerkProvider publishableKey={clerkConfig.publishableKey}>
      <html lang="en">
        <body>
          <PostHogProvider>
            {children}
          </PostHogProvider>
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
