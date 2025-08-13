// Render customer portal
import React from "react";
import { create } from "react-modal-promise"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function BillingAlert({ isOpen, onResolve, onReject, message, action }) {

  var handleClick = () => {

    // Close this dialog
    onResolve()

    // And trigger user action
    action.trigger()

  }

  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onResolve() }}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Alert</DialogTitle>

        </DialogHeader>
        
        <div className="flex flex-col space-y-4">

          <p className="text-sm text-muted-foreground">{message}</p>

          <div className="flex justify-center py-4">

            { action && <Button onClick={handleClick} className="w-full">{ action.message }</Button> }

          </div>
        
        </div>

      </DialogContent>

    </Dialog>

}

// Render with Promise this
const openBillingAlert = create(BillingAlert);

export default openBillingAlert;