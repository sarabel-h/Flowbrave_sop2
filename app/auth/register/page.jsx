"use client"

import { useState, Suspense, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { useForm } from "react-hook-form"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import useAuth from "@/components/auth"
import Image from "next/image"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
// Actual RegisterPage component without Suspens
function RegisterPageContent() {

  // Check if the user is already logged in
	const { user } = useAuth({authPage: true, shouldRedirect: false});
  
  // States
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState(null)
  
  // Get the ticket from the URL
  const ticket = searchParams.get('__clerk_ticket')
  const organization = searchParams.get('organization')
  
  // Use clerk to sign up a user and create organization
  const { isLoaded, signUp, setActive } = useSignUp()
  
  // React Hook Form setup
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: "",
      organization: "",
      password: "",
      companySize: "",
      role: ""
    }
  })

  useEffect(() => {
    
  })

  // Form submission handler
  const onSubmit = async (data) => {

    setIsLoading(true)
    setError(null)
    
    try {
      if (!isLoaded || !ticket) {
        setError("Invalid invitation link. Please request a new invitation.")
        setIsLoading(false)
        return
      }
      
      // Split full name into first and last name
      const names = data.fullName.trim().split(/\s+/)
      const firstName = names[0]
      const lastName = names.slice(1).join(' ') || ""
      
      // Create a new sign-up with the supplied invitation ticket
      const signUpAttempt = await signUp.create({
        strategy: "ticket",
        ticket,
        firstName,
        lastName,
        password: data.password
      })

      // If the sign-up was completed, set the session to active
      if (signUpAttempt.status === "complete") {
        
        // Set the active session
        await setActive({ session: signUpAttempt.createdSessionId })
        
        if(!organization) {

          // Create organization
          var onboarded = await fetch("/api/onboard", { method: "post", headers: { 'content-type': 'application/json', }, body: JSON.stringify({name: data.organization, role: data.role, companySize: data.companySize}) });
        
        }
        else {
        
          var onboarded = await fetch("/api/addToOrganization", { method: "post", headers: { 'content-type': 'application/json', }, body: JSON.stringify({organization, role: data.role }) });
        
        }
        
        // Parse and store the JSON response
        const onboard = await onboarded.json();

        const organizationId = onboard.data.publicMetadata.companyId;

        const userID = onboard.data.id;
      
        const checkoutResponse = await fetch("/api/trial", {

          method: "POST",
          
          headers: { "Content-Type": "application/json" },
          
          body: JSON.stringify({
          
            organization: organizationId,
            userId: userID
          
          })

        });

        if (!checkoutResponse.ok) {

          console.log("Failed to create checkout session");

          // And take user to home instead because we could not create a checkout session
          window.location.replace("/");
          
        }
        else {

          const { url } = await checkoutResponse.json();
        
          // change window href to window location
          window.location.replace(url);

        }

        setIsComplete(true)

      } 
      else {
        
        // If the status is not complete, check why
        console.error(JSON.stringify(signUpAttempt, null, 2))

        setError("Registration incomplete. Please try again.")

      }

    } 
    catch (error) {
      
      console.error(error)
      
      if (isClerkAPIResponseError(error)) {
    
        setError(error.errors[0].message)
    
      } 
      else {
      
        setError("Registration failed. Please try again.")
      
      }

    } 
    finally {
    
      setIsLoading(false)
    
    }
  }
  
  // If there is no invitation ticket, show error
  if (!ticket) {

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Invitation</h1>
            <p className="mt-2 text-sm text-gray-600">
              No invitation token found. Please use the link from your invitation email.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col space-y-2 w-full">
              <Button asChild>
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Image src={"/logo.png"} width={456} height={120} alt="Logo that says 'Flowbrave SOPs'" className="w-40 mx-auto" />

          {/* Title and description */}
          <h1 className="text-2xl font-bold text-gray-900">
            {isComplete ? "Registration Complete" : "Complete Your Registration"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isComplete 
              ? "Your account has been created successfully! Redirecting you to the dashboard..." 
              : "Please provide the following information to complete your account setup"}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {isComplete ? (
            // Success state
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-gray-600">You'll be redirected automatically in a few seconds.</p>
              <Button asChild className="mt-2">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            // Registration form
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              {/* Full Name field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  First Name / Last Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={errors.fullName ? "border-red-300" : ""}
                  placeholder="John Doe"
                  {...register("fullName", { required: "Full name is required" })}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>
              
              {!organization && <>
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
                    {...register("organization", { required: "Organization is required" })}
                  />
                  {errors.organization && <p className="text-xs text-red-500">{errors.organization.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                    Company Size
                  </label>
                  <Select
                    onValueChange={(value) => {
                      setValue("companySize", value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className={errors.companySize ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Solo (1 person)</SelectItem>
                      <SelectItem value="2-4">2-4 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="200-1000">200+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.companySize && <p className="text-xs text-red-500">{errors.companySize.message}</p>}
                </div>
              </>}

              {/* Role in the company */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role in the company
                </label>
                <Select
                  onValueChange={(value) => {
                    setValue("role", value, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className={errors.role ? "border-red-300" : ""}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder/ceo">Founder / CEO</SelectItem>
                    <SelectItem value="cto/technical-lead">CTO / Technical lead</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="developer/engineer">Developer / Engineer</SelectItem>
                    <SelectItem value="marketing/growth">Marketing / Growth</SelectItem>
                    <SelectItem value="sales/partnerships">Sales / Partnerships</SelectItem>
                    <SelectItem value="operations/coo">Operations / COO</SelectItem>
                    <SelectItem value="investor/advisor">Investor / Advisor</SelectItem>
                    <SelectItem value="other">Other (please specify)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
              </div>

              
              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={errors.password ? "border-red-300" : ""}
                  {...register("password", { 
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters"
                    }
                  })}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div id="clerk-captcha" />

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}