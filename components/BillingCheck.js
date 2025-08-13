import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import axios from "axios"; 
import { toast } from "react-hot-toast";

function BillingCheck({ user }) {

  // State 
  const [loading, setLoading] = useState(false);

  // For dialog state
  const [open, trigger] = useState(false);

  // On load check for billing status
  useEffect(() => {

     // Exit if user is not loaded
     if (!user) return;

    // Get user organization data
    var organization = user.organizationMemberships?.[0]?.organization

    // Get billing details of the user
    var billing = organization?.publicMetadata?.billing

    // Trigger when user is not on a valid plan
    if (billing?.status === "canceled")

      trigger(true)

  }, [])

  // Handle the trial start process
  const start = async () => {

    // Send a request to the backend to create a new checkout session
    try {
      
      // Start loading
      setLoading(true);

      // Get user organization data
      var organization = user.organizationMemberships[0]?.organization

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

      toast.error(error.response?.data || "Failed to process billing request");

      setLoading(false);

    }
    
  };

  return <Dialog open={open} modal={true}>

    <DialogContent className="sm:max-w-md">
    
      <DialogHeader>

        <DialogTitle>Billing Issue Detected</DialogTitle>

      </DialogHeader>

      <div className="flex flex-col space-y-4">

        <p className="text-sm text-muted-foreground">
          Your organization does not have an active subscription. This may be due to a failed payment or a canceled plan. To regain access to the platform, please review and update your billing information.
        </p>

        <div className="flex justify-center py-4">

          <Button onClick={start} disabled={loading} className="w-full">
          
          {
          
          loading ? 

            "Loading..."
          
          : 

            "Check Billing"

          }

          </Button>

        </div>

      </div>

    </DialogContent>

  </Dialog>
}

export default BillingCheck;
