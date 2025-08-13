// Render customer portal
import React, { useEffect } from "react";
import { create } from "react-modal-promise"
import toast from "react-hot-toast";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

function CustomerPortal({ isOpen, onResolve, onReject, user }) {

    useEffect(() => {

        if (open) {

            // Load customer portal
            load();

        }
    }, [open]);

    // Function to load customer portal
    const load = async () => {

        // Send a request to the backend to create a new checkout session
        try {
          
            // Get user organization data
            var organization = user.organizationMemberships[0].organization

            // Send request to start trial
            const { data } = await axios.post("/api/billing", {

                organization: organization.id,
                userId: user.id
            
            });

            // Redirect to the checkout session URL
            window.location.href = data.url;

        } 
        catch (error) {

            console.log(error)

            toast.error(error.response?.data || "Failed to load customer portal.");

            // Reject the promise with error
            onResolve(error);

        }
    
    }

  return <Dialog open={isOpen}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Redirecting</DialogTitle>

        </DialogHeader>
        
        <div className="flex flex-col space-y-4">

          <p className="text-sm text-muted-foreground">Processing your request. You will be redirected to the billing portal shortly.</p>

          <div className="flex justify-center py-4">

            <Loader2 className="h-8 w-8 animate-spin" />

          </div>
        
        </div>

      </DialogContent>

    </Dialog>

}

// Render with Promise this
const openPortal = create(CustomerPortal);

export default openPortal;