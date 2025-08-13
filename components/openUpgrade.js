// Upgrade user
import React, { useEffect } from "react";
import { create } from "react-modal-promise"
import toast from "react-hot-toast";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

function UpgradeTrial({ isOpen, onResolve, onReject, user }) {

    useEffect(() => {

        // Load customer portal
        load();
        
    }, []);

    // Function to load customer portal
    const load = async () => {

        // Send a request to the backend to create a new checkout session
        try {
          
            // Get user organization data
            var organization = user.organizationMemberships[0].organization

            // Send request to start trial
            const { data } = await axios.post("/api/upgrade", {

                organization: organization.id,
                userId: user.id
            
            });

            // Now resolve
            onResolve();

            toast.success("You have been upgraded. You can now add more members.");

        } 
        catch (error) {

            console.log(error)

            toast.error(error.response?.data || "Failed to upgrade. Please try again.");

            // Reject the promise with error
            onResolve(error);

        }
    
    }

  return <Dialog open={isOpen}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Upgrading</DialogTitle>

        </DialogHeader>
        
        <div className="flex flex-col space-y-4">

          <p className="text-sm text-muted-foreground">Processing your request. You will be taken to portal for adding new members in a second.</p>

          <div className="flex justify-center py-4">

            <Loader2 className="h-8 w-8 animate-spin" />

          </div>
        
        </div>

      </DialogContent>

    </Dialog>

}

// Render with Promise this
const openUpgrade = create(UpgradeTrial);

export default openUpgrade;