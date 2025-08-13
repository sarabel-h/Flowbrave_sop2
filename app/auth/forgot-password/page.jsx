"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, KeyRound } from "lucide-react"
import Link from "next/link"
import { useSignIn } from '@clerk/nextjs'
import useAuth from "@/components/auth"
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successfulCreation, setSuccessfulCreation] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [secondFactor, setSecondFactor] = useState(false)

  // React Hook Form setup for initial email form
  const { register: registerEmail, handleSubmit: handleSubmitEmail, formState: { errors: emailErrors } } = useForm({
    defaultValues: { email: "" }
  })

  // React Hook Form setup for reset password form
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors } } = useForm({
    defaultValues: { password: "", code: "" }
  })

  const router = useRouter()

  // Check if the user is already logged in
  const { user } = useAuth({authPage: true, shouldRedirect: true});

  const { isLoaded, signIn, setActive } = useSignIn()

  // Send the password reset code to the user's email
  async function onSendResetCode(data) {
    setIsLoading(true)
    setError("")

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      })
      setEmail(data.email)
      setSuccessfulCreation(true)
    } catch (err) {
      console.error('error', err.errors[0].longMessage)
      setError(err.errors[0].longMessage || "Failed to send reset code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the user's password
  async function onResetPassword(data) {
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: data.code,
        password: data.password,
      })

      if (result.status === 'needs_second_factor') {
        setSecondFactor(true)
      } else if (result.status === 'complete') {

        // Set the active session
        await setActive({ session: result.createdSessionId })
        
        setResetComplete(true)
        
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      console.error('error', err.errors[0].longMessage)
      setError(err.errors[0].longMessage || "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {resetComplete ? "Password Reset Complete" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {resetComplete 
              ? "Your password has been reset successfully!" 
              : successfulCreation
                ? "Enter your new password and the verification code sent to your email"
                : "Enter your email and we'll send you instructions to reset your password"}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {resetComplete ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Password reset successful</h3>
                <p className="text-sm text-gray-600">
                  You'll be redirected to the dashboard in a moment
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          ) : secondFactor ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <KeyRound className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Two-factor authentication required</h3>
                <p className="text-sm text-gray-600">
                  Please complete the two-factor authentication process
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/auth/login">Return to login</Link>
              </Button>
            </div>
          ) : successfulCreation ? (
            <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  {...registerReset("password", { 
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" }
                  })}
                  placeholder="Enter your new password"
                  className={resetErrors.password ? "border-red-300" : ""}
                />
                {resetErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{resetErrors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  {...registerReset("code", { 
                    required: "Verification code is required" 
                  })}
                  placeholder="Enter the code from your email"
                  className={resetErrors.code ? "border-red-300" : ""}
                />
                {resetErrors.code && (
                  <p className="mt-1 text-xs text-red-500">{resetErrors.code.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitEmail(onSendResetCode)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  {...registerEmail("email", { 
                    required: "Email is required",
                    pattern: { 
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                      message: "Invalid email address" 
                    }
                  })}
                  placeholder="name@company.com"
                  className={emailErrors.email ? "border-red-300" : ""}
                />
                {emailErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{emailErrors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset code"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

