"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import useAuth from "@/components/auth"
import Image from "next/image"


export default function LoginPage() {

	// Check if the user is already logged in
	const { user } = useAuth({authPage: true, shouldRedirect: true});

  // States
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  
  // Use clerk to sign in a user
  const { signIn, setActive } = useSignIn()
  
  // React Hook Form setup
  const { register, handleSubmit, formState: { errors }, setValue,watch} = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  })
  
  // Watch rememberMe value to use in UI
  const rememberMe = watch("rememberMe")

  // Handle checkbox change
  const handleCheckboxChange = (checked) => {
    setValue("rememberMe", checked)
  }

  // Form submission handler
  const onSubmit = async (data) => {

    // Set loading state
    setIsLoading(true)

    // Set API error state
    setApiError(null)

    try {

      // Attempt to sign in with password
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });
      
      // If successful, set the active session
      if (result.status === "complete") {

        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        // Redirect to main app after successful login
        router.push("/");

      } else {

        // Handle incomplete status (e.g., 2FA required)
        console.log("Additional authentication steps required:", result);
        setApiError("Additional authentication steps required. Please contact support.");
      }
    } catch (error) {

      console.error(error);
      
		// Handle errors
		if (isClerkAPIResponseError(error)) {

			// Improved error handling with more specific messages
			const errorMessage = error.errors[0].message
			
			// Map common Clerk errors to user-friendly messages
			if (errorMessage.includes("not found") || errorMessage.includes("doesn't exist")) {
				setApiError("No account found with this email address. Please check your email or create a new account.")
			} else if (errorMessage.includes("password") || errorMessage.includes("credentials")) {
				setApiError("Incorrect password. Please try again or reset your password.")
			} else if (errorMessage.includes("email") || errorMessage.includes("invalid")) {
				setApiError("Please enter a valid email address")
			} else if (errorMessage.includes("is invalid")) {
				// Handle generic "is invalid" messages
				if (error.errors[0].code === "form_identifier_not_found") {
					setApiError("No account found with this email address")
				} else if (error.errors[0].code === "form_password_incorrect") {
					setApiError("Incorrect password. Please try again")
				} else {
					setApiError("Please check your email and password")
				}
			} else {
				// Fallback to original message if it's not empty
				setApiError(errorMessage || "Sign in failed. Please try again.")
			}

		} else {

			setApiError("Sign in failed. Please check your connection and try again.");
		}
    }

	// Stop the loading state
    setIsLoading(false);

  }

  return (

    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">

		{/* Header */}
        <div className="text-center">
		  <Image src={"/logo.png"} width={456} height={120} alt="Logo that says 'Flowbrave SOPs'" className="w-40 mx-auto" />

		  {/* Title and description */}
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">Enter your credentials to access your account</p>

        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">

			{/* Form */}
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				
				{/* API Error message */}
				{apiError && (
				
				<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
					{apiError}
				</div>

				)}
				
				{/* Email field */}
				<div className="space-y-2">

					{/* Label */}
					<label htmlFor="email" className="text-sm font-medium text-gray-700">
						Email address
					</label>

					{/* Email */}
					<Input
						id="email"
						type="email"
						autoComplete="email"
						className={errors.email ? "border-red-300" : ""}
						placeholder="name@company.com"
						{...register("email", { 
						required: "Email is required", 
						pattern: {
							value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
							message: "Please enter a valid email address"
						},
						validate: {
							notEmpty: (value) => value.trim() !== "" || "Email cannot be empty",
							validFormat: (value) => {
								const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
								return emailRegex.test(value) || "Please enter a valid email address"
							}
						}
						})}
					/>

					{/* Display error message */}
					{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
				</div>

				{/* Password field */}
				<div className="space-y-2">
					{/* Password label and forgot password link */}
					<div className="flex items-center justify-between">
						<label htmlFor="password" className="text-sm font-medium text-gray-700">
							Password
						</label>
						<Link href="/auth/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
							Forgot password?
						</Link>
					</div>
					
					{/* Password input with show/hide toggle */}
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							className={errors.password ? "border-red-300 pr-10" : "pr-10"}
							placeholder="••••••••"
							{...register("password", { 
								required: "Password is required" 
							})}
						/>
						
						{/* Toggle password visibility button */}
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					
					{/* Display password error message */}
					{errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
				</div>

				{/* Remember me checkbox */}
				<div className="flex items-center space-x-2">

					{/* Checkbox component */}
					<Checkbox 
						id="rememberMe" 
						checked={rememberMe} 
						onCheckedChange={handleCheckboxChange} 
					/>
					
					{/* Checkbox label */}
					<label
						htmlFor="rememberMe"
						className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Remember me
					</label>
				</div>

				{/* Submit button */}
				<Button type="submit" className="w-full" disabled={isLoading}>

					{/* Show loading spinner or sign in text based on state */}
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Signing in...
						</>
					) : (
						"Sign in"
					)}
				</Button>
			</form>
        </div>

        {/* Sign up link */}
        <div className="text-center text-sm">

          <p className="text-gray-600">
            Don't have an account?{" "}
            
			<Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>

          </p>
        </div>
      </div>
    </div>
  )
}

