// Hook for auth status
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Updated to next/navigation for app router

/**
 * @typedef {Object} Auth
 * @property {Object} user
 * @property {boolean} isSignedIn - Use is logged in
 * @property {boolean} fallback - Whether render the ui or not
 * @property {string} orgId - Organization ID
 * @property {string} orgRole - Organization Role
 */

/**
 * @typedef {Object} AuthOptions
 * @property {boolean} authPage - Whether to use auth pages
 * @property {(boolean|function)} shouldRedirect - Either a boolean or function that determines if redirect should occur
 * @property {function} bouncer - Function that can either return null (to continue) or a URL string to redirect to
 */

/**
 * @param {AuthOptions} options - Authentication options
 * @returns {Auth} auth - Authentication object
 */

export default function useAuth({ authPage = false, shouldRedirect = true, bouncer = () => null }) { 

    // Get router for navigation
    const router = useRouter();

    // Get auth status
    const { isLoaded, isSignedIn, user } = useUser();
    const { orgId, orgRole } = useClerkAuth();

    // State for controlling fallback
    const [fallback, setFallback] = useState(true);

    // Function to check if redirect is allowed
    const checkRedirect = () => {
        if (typeof shouldRedirect === "function") {
          return shouldRedirect(user);
        }
        return shouldRedirect;
    };

    // Handle redirect
    const redirect = (url) => {
        
        // First check if redirect is allowed
        if (checkRedirect()) {
            // Then redirect
            return router.push(url || "/");
        }
    }

    // Monitor auth case and redirect if required
    useEffect(() => {
        const auth = () => {
            // Wait for the clerk to complete loading
            if (!isLoaded) return;

            // Optional flag
            if (authPage) {
                // Logic for auth pages (e.g., login/signup)
                if (isSignedIn && checkRedirect()) return redirect();
                setFallback(false);
            }
            else {
                // Logic for protected pages
                if (!isSignedIn) return redirect("/auth/login"); 

                // Additional checks from bouncer function
                const redirectUrl = bouncer(user);

                // And if yes then redirect
                if (redirectUrl) return redirect(redirectUrl);
                
                setFallback(false);
            }
        }

        auth();
        
    }, [isLoaded, isSignedIn, user]);

    // Return status
    return { isSignedIn, fallback, user, orgId, orgRole }
}