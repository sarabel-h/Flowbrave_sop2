// Upgrade user
import React, { useEffect } from "react";
import { create } from "react-modal-promise"
import toast from "react-hot-toast";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

function RemoveMember({ isOpen, onResolve, onReject, user, member }) {

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

            // Remove the member
            if(member.status === "pending") {
    
                // Revoke invite
                await member.revoke();
            
            }
            else {
                
                const response = await fetch("/api/deleteMember", {

                    method: "DELETE",
                    
                    headers: {
                        "Content-Type": "application/json",
                    },
                    
                    body: JSON.stringify({

                        organization: organization.id,
                        email: member.email,
                        userId: member.userId,

                        // Since only lead can delete a member, logged in user must be the lead.
                        leadEmail: user.emailAddresses[0].emailAddress 

                    })

                });
        
                if (!response.ok) {

                    throw new Error("Failed to delete member");

                }

            }

            // Send request to downgrade the user plan
            const { data } = await axios.post("/api/downgrade", {

                organization: organization.id,
                userId: user.id
            
            });

            // Now resolve
            onResolve();

            toast.success("Member has been removed.");

        } 
        catch (error) {

            console.log(error)

            toast.error(error.response?.data || "Failed to remove member. Please try again.");

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

          <p className="text-sm text-muted-foreground">Processing your request. Member will be removed in a second.</p>

          <div className="flex justify-center py-4">

            <Loader2 className="h-8 w-8 animate-spin" />

          </div>
        
        </div>

      </DialogContent>

    </Dialog>

}

// Render with Promise this
const removeMember = create(RemoveMember);

export default removeMember;