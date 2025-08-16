"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import useAuth from "@/components/auth"
import Image from "next/image"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function SignUpPage() {

  // Check if the user is already logged in
  const { user } = useAuth({authPage: true, shouldRedirect: true});

  // States
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  
  // Use clerk to sign up a user
  const { signUp, setActive } = useSignUp()
  
  // React Hook Form setup
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      organization: "",
      companySize: "",
      role: "",
      acceptTerms: false
    },
    mode: "onChange"
  })
  
  // Watch values for validation
  const password = watch("password")
  const acceptTerms = watch("acceptTerms")
  const companySize = watch("companySize")
  const role = watch("role")

  // Handle checkbox change
  const handleCheckboxChange = (checked) => {
    setValue("acceptTerms", checked)
  }

  // Handle Select changes with validation
  const handleCompanySizeChange = (value) => {
    setValue("companySize", value, { shouldValidate: true })
  }

  const handleRoleChange = (value) => {
    setValue("role", value, { shouldValidate: true })
  }

  // Form submission handler
  const onSubmit = async (data) => {

    // Set loading state
    setIsLoading(true)
    setApiError(null)

    // Enhanced validation before submission
    const validationErrors = []

    if (!data.firstName?.trim()) {
      validationErrors.push("First name is required")
    }

    if (!data.lastName?.trim()) {
      validationErrors.push("Last name is required")
    }

    if (!data.email?.trim()) {
      validationErrors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      validationErrors.push("Please enter a valid email address")
    }

    if (!data.organization?.trim()) {
      validationErrors.push("Company name is required")
    }

    if (!data.companySize) {
      validationErrors.push("Please select a company size")
    }

    if (!data.role) {
      validationErrors.push("Please select your role")
    }

    if (!data.password) {
      validationErrors.push("Password is required")
    } else if (data.password.length < 8) {
      validationErrors.push("Password must be at least 8 characters")
    } else if (!/[a-zA-Z]/.test(data.password)) {
      validationErrors.push("Password must contain at least one letter")
    } else if (!/\d/.test(data.password)) {
      validationErrors.push("Password must contain at least one number")
    }

    if (!data.confirmPassword) {
      validationErrors.push("Please confirm your password")
    } else if (data.password !== data.confirmPassword) {
      validationErrors.push("Passwords do not match")
    }

    if (!data.acceptTerms) {
      validationErrors.push("You must accept the terms and conditions")
    }

    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      setApiError(validationErrors[0])
      setIsLoading(false)
      return
    }

    try {

      // Create a new sign-up
      const signUpAttempt = await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
      })

      // Send email verification
      await signUpAttempt.prepareEmailAddressVerification({ strategy: "email_code" })

      // Create organization and complete onboarding
      if (signUpAttempt.status === "needs_email_verification") {
        
        // Create organization
        const onboarded = await fetch("/api/onboard", { 
          method: "post", 
          headers: { 'content-type': 'application/json' }, 
          body: JSON.stringify({
            name: data.organization, 
            role: data.role, 
            companySize: data.companySize
          }) 
        })
        
        if (onboarded.ok) {
          const onboard = await onboarded.json()
          const organizationId = onboard.data.publicMetadata.companyId
          const userID = onboard.data.id
      
          // Create trial checkout
          const checkoutResponse = await fetch("/api/trial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              organization: organizationId,
              userId: userID
            })
          })

          if (checkoutResponse.ok) {
            const { url } = await checkoutResponse.json()
            window.location.replace(url)
          } else {
            // If checkout fails, redirect to home
            window.location.replace("/")
          }
        }

        setIsComplete(true)
      } 
      else {
        setApiError("Registration incomplete. Please try again.")
      }

    } catch (error) {

      console.error(error)
      
      if (isClerkAPIResponseError(error)) {
        // Improved error handling with more specific messages
        const errorMessage = error.errors[0].message
        
        // Map common Clerk errors to user-friendly messages
        if (errorMessage.includes("email") || errorMessage.includes("invalid")) {
          setApiError("Please enter a valid email address")
        } else if (errorMessage.includes("password") || errorMessage.includes("weak")) {
          setApiError("Password must be at least 8 characters long and contain letters and numbers")
        } else if (errorMessage.includes("already exists") || errorMessage.includes("taken")) {
          setApiError("An account with this email already exists. Please try signing in instead.")
        } else if (errorMessage.includes("first name") || errorMessage.includes("last name")) {
          setApiError("Please enter your full name")
        } else if (errorMessage.includes("is invalid")) {
          // Handle generic "is invalid" messages
          if (error.errors[0].code === "form_identifier_not_found") {
            setApiError("Please enter a valid email address")
          } else if (error.errors[0].code === "form_password_pwned") {
            setApiError("This password is too common. Please choose a stronger password")
          } else {
            setApiError("Please check your information and try again")
          }
        } else {
          // Fallback to original message if it's not empty
          setApiError(errorMessage || "Registration failed. Please try again.")
        }
      } else {
        setApiError("Registration failed. Please check your connection and try again.")
      }
    }

    // Stop the loading state
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center">
          <Image src={"/logo.png"} width={456} height={120} alt="Logo that says 'Flowbrave SOPs'" className="w-40 mx-auto" />

          {/* Title and description */}
          <h1 className="text-2xl font-bold text-gray-900">
            {isComplete ? "Check Your Email" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isComplete 
              ? "We've sent you a verification email. Please check your inbox and click the verification link to complete your registration." 
              : "Get started with your free trial. No credit card required."}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {isComplete ? (
            // Success state
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Please check your email and click the verification link to complete your registration.
              </p>
              <Button asChild className="mt-2">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            // Registration form
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* API Error message */}
              {apiError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {apiError}
                </div>
              )}
              
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={errors.firstName ? "border-red-300" : ""}
                    placeholder="John"
                    {...register("firstName", { 
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters"
                    },
                    validate: {
                      notEmpty: (value) => value.trim() !== "" || "First name cannot be empty",
                      noSpecialChars: (value) => /^[a-zA-Z\s]+$/.test(value) || "First name should only contain letters"
                    }
                  })}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className={errors.lastName ? "border-red-300" : ""}
                    placeholder="Doe"
                    {...register("lastName", { 
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters"
                    },
                    validate: {
                      notEmpty: (value) => value.trim() !== "" || "Last name cannot be empty",
                      noSpecialChars: (value) => /^[a-zA-Z\s]+$/.test(value) || "Last name should only contain letters"
                    }
                  })}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>
              
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
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
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Organization field */}
              <div className="space-y-2">
                <label htmlFor="organization" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <Input
                  id="organization"
                  type="text"
                  autoComplete="organization"
                  className={errors.organization ? "border-red-300" : ""}
                  placeholder="Acme Inc."
                  {...register("organization", { 
                    required: "Company name is required",
                    minLength: {
                      value: 2,
                      message: "Company name must be at least 2 characters"
                    },
                    validate: {
                      notEmpty: (value) => value.trim() !== "" || "Company name cannot be empty",
                      validFormat: (value) => /^[a-zA-Z0-9\s&.-]+$/.test(value) || "Company name contains invalid characters"
                    }
                  })}
                />
                {errors.organization && <p className="text-xs text-red-500">{errors.organization.message}</p>}
              </div>
              
              {/* Company Size */}
              <div className="space-y-2">
                <label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                  Company Size
                </label>
                <Select
                  onValueChange={handleCompanySizeChange}
                >
                  <SelectTrigger className={errors.companySize ? "border-red-300" : ""}>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Solo (1 person)</SelectItem>
                    <SelectItem value="2-4">2-4 employees</SelectItem>
                    <SelectItem value="5-10">5-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
                {errors.companySize && <p className="text-xs text-red-500">{errors.companySize.message}</p>}
                {!companySize && !errors.companySize && (
                  <p className="text-xs text-gray-500">Please select your company size</p>
                )}
              </div>

              {/* Role in the company */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Your Role
                </label>
                <Select
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className={errors.role ? "border-red-300" : ""}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder/ceo">Founder / CEO</SelectItem>
                    <SelectItem value="cto/technical-lead">CTO / Technical Lead</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="developer/engineer">Developer / Engineer</SelectItem>
                    <SelectItem value="marketing/growth">Marketing / Growth</SelectItem>
                    <SelectItem value="sales/partnerships">Sales / Partnerships</SelectItem>
                    <SelectItem value="operations/coo">Operations / COO</SelectItem>
                    <SelectItem value="investor/advisor">Investor / Advisor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                {!role && !errors.role && (
                  <p className="text-xs text-gray-500">Please select your role</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={errors.password ? "border-red-300 pr-10" : "pr-10"}
                    placeholder="••••••••"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters"
                      },
                      validate: {
                        hasLetter: (value) => /[a-zA-Z]/.test(value) || "Password must contain at least one letter",
                        hasNumber: (value) => /\d/.test(value) || "Password must contain at least one number",
                        notCommon: (value) => {
                          const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123']
                          return !commonPasswords.includes(value.toLowerCase()) || "Please choose a stronger password"
                        }
                      }
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
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={errors.confirmPassword ? "border-red-300 pr-10" : "pr-10"}
                    placeholder="••••••••"
                    {...register("confirmPassword", { 
                      required: "Please confirm your password",
                      validate: value => value === password || "Passwords do not match"
                    })}
                  />
                  
                  {/* Toggle password visibility button */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              {/* Terms and conditions checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acceptTerms" 
                  checked={acceptTerms} 
                  onCheckedChange={handleCheckboxChange} 
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Sign in link */}
        <div className="text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
