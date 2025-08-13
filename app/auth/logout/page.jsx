"use client"

// Imports
import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import Head from "next/head"

// Component
export default function LogoutPage() {

  // Get signout helper function
  const { signOut } = useClerk()

  // On load 
  useEffect(() => {

    // Trigger signout
    signOut({ redirectUrl: "/auth/login" })

  }, [signOut])

  // Markup
  return <div className="py-20 px-4 md:mx-0 w-full h-screen overflow-y-auto flex flex-col items-center">

    {/* Title */}
    <Head><title>Logout</title></Head>

    {/* Loading indicator */}
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Logging you out...</p>
    </div>

  </div>
}