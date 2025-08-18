import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Router } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios"; 
import { toast } from "react-hot-toast";

function TrialDialog({ user }) {

  // State 
  const [loading, setLoading] = useState(false);

  // For dialog state
  const [open, trigger] = useState(false);

  // On load check for billing status
  useEffect(() => {
     // Exit if user is not loaded
     if (!user) return;

    // STRIPE DISABLED - Trial dialog is disabled
    // No trial dialog will be shown

  }, [])

  // Handle the trial start process
  const start = async () => {

    // Send a request to the backend to create a new checkout session
    try {
      
      // Start loading
      setLoading(true);

      // Get user organization data
      var organization = user.organizationMemberships[0]?.organization
      console.log(organization)

      // Send request to start trial
      const { data } = await axios.post("/api/trial", {

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

        <DialogTitle>Ready to dive in?</DialogTitle>

      </DialogHeader>

      <div className="flex flex-col space-y-4">

        <p className="text-sm text-muted-foreground">You can start using the platform right now. Your free trial is just a click away—no strings attached. Go ahead, try it out!</p>

        <div className="flex justify-center py-4">

          <Button onClick={start} disabled={loading} className="w-full">
          
          {
          
          loading ? 

            "Loading..."
          
          : 

            "Start Free Trial"

          }

          </Button>

        </div>

      </div>

    </DialogContent>

  </Dialog>
}

export default TrialDialog;
