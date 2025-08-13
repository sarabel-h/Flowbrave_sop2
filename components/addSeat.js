// Upgrade user
import React, { useEffect, useRef, useState } from "react";
import { create } from "react-modal-promise"
import toast from "react-hot-toast";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Loader2 } from "lucide-react";

// Component for loading billing breakdown
function BillingBreakdown({ user, seats }) {

  // Add state for loading
  const [breakdown, setBreakdown] = useState(null);

  var formatInvoiceBreakdown = (sortedCycles) => {

    const formatAmount = (amount) => `€ ${(amount / 100).toFixed(2)}`;

    // Output array
    var output = [];

    // Determine prorated amount for current cycle
    var cycle = sortedCycles[0];

    // Get label for current cycle, for that get the start date of earliest line item in the cycle
    var cycleDate = new Date(cycle.items[0].period.start * 1000);
    
    // Format cycle date to a readable format
    var cycleLabel = cycleDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Render cycle label
    output.push(<div key={`current-cycle-label`} className="font-bold mb-2">{ cycleLabel }</div>)

    // Render change in seats
    output.push(<div key={`new-seats`} className="mb-2">Seats: { seats } → { seats + 1 }</div>);

    // Determine total amount for the cycle
    var currentCycleTotal = cycle.items.reduce((sum, item) => sum + item.amount, 0);

    // Render the cycle amount
    output.push(<div key={`current-cycle-total`} className="mb-2">Total due: { formatAmount(currentCycleTotal) }</div>);

    // Get upcoming cycle
    cycle = sortedCycles[1];

    // If no upcoming cycle, return early
    if (!cycle) return <>{output}</>;

    // Get label for upcoming cycle
    cycleDate = new Date(cycle.items[0].period.start * 1000);
    
    // Format cycle date to a readable format
    cycleLabel = cycleDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Render cycle label
    output.push(<div key={`upcoming-cycle-label`} className="font-bold mt-4 mb-2">{ cycleLabel }</div>)

    // Show quantity 
    output.push(<div key={`total-seats`} className="mb-2">Seats: { seats + 1 }</div>);

    // Determine total amount
    var upcomingCycleTotal = 0;

    // Render breakdown
    cycle.items.forEach( (item, index) => {

      // Add to total
      upcomingCycleTotal += item.amount;

      // Render item
      output.push(<div key={`upcoming-cycle-${index}-item`}>- { item.description }</div>);

    });

    // Render the cycle amount
    output.push(<div key={`upcoming-cycle-total`} className="my-2">Total due: { formatAmount(upcomingCycleTotal) }</div>);

    // Render the total amount that will be charged at the start of the next cycle
    output.push(<div key={`cycle-next-billing`} className="mt-4">At the beginning of your next billing cycle ({ cycleDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' }) }), you will pay: <strong>{ formatAmount( currentCycleTotal + upcomingCycleTotal ) }</strong></div>);

    return <>{output}</>;

  };

  // Function to load billing breakdown
  const load = async () => {

    try {

      // Get user organization data
      var organization = user.organizationMemberships[0].organization

      // Send request to get billing breakdown
      const { data } = await axios.post("/api/preview", {

        organization: organization.id,
        userId: user.id,

      });
      

      // Set loading to false
      setBreakdown(formatInvoiceBreakdown(data.breakdown));

    } 
    catch (error) {

      console.error("Failed to load billing breakdown:", error);

      setLoading(false);

      toast.error("Failed to load billing breakdown. Please try again.");

    }

  }

  // On mount render
  useEffect(() => {
    
    // Send request to get billing breakdown
    load()

  }, [])

  return <div className="w-80 z-50 bg-white p-4 rounded-md shadow-sm border border-gray-200 flex justify-center">

    { 
    
      !breakdown ? 
    
        <Loader2 className="h-6 w-6 animate-spin text-primary" /> 

      :

        <div className="w-full">{ breakdown }</div>
    
    }
    
  </div>

}

function AddSeat({ isOpen, onResolve, onReject, user, seats, members = [] }) {

    // State 
    const [loading, setLoading] = useState(false);
    const _input = useRef(null)

    // Function to load customer portal
    const add = async () => {

      // Send a request to the backend to create a new checkout session
      try {

          // Get input value
          var email = _input.current.value.trim().toLowerCase();

          // Validate email
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email address.");

          if (members.some(member => member.email === email)) return toast.error("Member already exists");
        
          // Get user organization data
          var organization = user.organizationMemberships[0].organization

          // Start loading
          setLoading(true);

          // Send request to add a new seat
          const { data } = await axios.post("/api/upgrade", {

              organization: organization.id,
              userId: user.id,
              upgrade: 1
          
          });

          // Send invite to user
          await axios.post("/api/addMember", {

              organization: organization.id,
              email: email,
              leadEmail: user.emailAddresses[0].emailAddress
          
          });

          // Now resolve
          onResolve();

          toast.success("Member added successfully.");

          // Start loading
          setLoading(false);

      } 
      catch (error) {

          console.log(error)

          toast.error(error.response?.data || "Failed to upgrade. Please try again.");

          // Reject the promise with error
          onResolve(error);

          // Start loading
          setLoading(false);

      }
  
  }

  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onResolve() }}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Add New Member</DialogTitle>

        </DialogHeader>
        
        <div className="flex flex-col space-y-4">

          <div className="text-sm text-muted-foreground">
            
            You’re using {seats} seats now. To add someone new, just enter their email. You’ll be charged for {seats + 1} seats in your next billing. 
            
            {/* Render a billing breakdown */}
            <Popover>

              <PopoverTrigger asChild>

                <span className="text-black underline cursor-pointer ml-1">Cost Breakdown</span>

              </PopoverTrigger>

              <PopoverContent>

                <BillingBreakdown user={user} seats={seats} />
                
              </PopoverContent>

            </Popover>

          </div>

          <Input ref={_input} type="email" placeholder="Email address of the new member" />

          <div className="flex justify-center py-4">

            <Button onClick={add} disabled={loading} className="w-full">
          
              {
              
              loading ? 

                "Adding..."
              
              : 

                "Add Member"

              }

            </Button>

          </div>
        
        </div>

      </DialogContent>

    </Dialog>

}

// Render with Promise this
const addSeat = create(AddSeat);

export default addSeat;