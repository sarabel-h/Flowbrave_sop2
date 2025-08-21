"use client"

import { useEffect, useState } from "react"
import { useSignUp, useSignIn } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState("loading")
  const [error, setError] = useState(null)
  const { signUp, setActive } = useSignUp()
  const { signIn } = useSignIn()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Attempt to verify email
        const result = await signUp?.attemptEmailAddressVerification({
          code: new URLSearchParams(window.location.search).get("__clerk_ticket") || "",
        })

        if (result?.status === "complete") {
          // Email verified successfully
          setVerificationStatus("success")
          
          // Set the user as active
          await setActive({ session: result.createdSessionId })
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            window.location.href = "/"
          }, 2000)
        } else {
          setVerificationStatus("error")
          setError("Email verification failed. Please try again.")
        }
      } catch (err) {
        console.error("Verification error:", err)
        setVerificationStatus("error")
        setError("Email verification failed. Please check your email and try again.")
      }
    }

    if (signUp) {
      verifyEmail()
    }
  }, [signUp, setActive])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Image 
            src={"/logo.png"} 
            width={456} 
            height={120} 
            alt="Logo that says 'Flowbrave SOPs'" 
            className="w-40 mx-auto" 
          />
          
          <h1 className="text-2xl font-bold text-gray-900">
            Email Verification
          </h1>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 text-center">
                Verifying your email address...
              </p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Email Verified Successfully!
              </h2>
              <p className="text-sm text-gray-600 text-center">
                Your account has been created and verified. You will be redirected to the home page shortly.
              </p>
              <Button asChild>
                <Link href="/">Go to Home Page</Link>
              </Button>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Verification Failed
              </h2>
              <p className="text-sm text-gray-600 text-center">
                {error || "There was an error verifying your email address."}
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/auth/signup">Try Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="text-center text-sm">
          <p className="text-gray-600">
            Need help?{" "}
            <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
