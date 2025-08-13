"use client"
import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/AppSidebar"
import useAuth from "@/components/auth"
import Loading from "@/components/Loading"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, UserPlus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import Dialog from "@/components/Dialog"
import TrialDialog from "@/components/TrialDialog";
import BillingCheck from "@/components/BillingCheck";
import toast from "react-hot-toast"
import openPortal from "@/components/openPortal"
import openBillingAlert from "@/components/openBillingAlert"
import openUpgrade from "@/components/openUpgrade"
import addSeat from "@/components/addSeat"
import removeMember from "@/components/removeMember"
import { Container as ModalContainer } from "react-modal-promise"

import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@/components/ui/alert-dialog"

export default function SettingsPage() {

  // Use the auth hook to protect this page
  const { fallback, user } = useAuth({ authPage: false, shouldRedirect: true });

  const { register, handleSubmit, reset } = useForm();
  
  // State to store tags
  const [tags, setTags] = useState([]);

  // State to store members
  const [members, setMembers] = useState([]);

  // State to store any errors
  const [errors, setErrors] = useState([]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("members");

  // Extract organization from user object
  const organization = user?.organizationMemberships?.[0]?.organization;

  const fetchTags = async () => {

    if (organization?.id) {

      try {

        setLoading(true);
        
        const response = await fetch(`/api/getTags?organization=${organization.id}`);
        
        if (response.ok) {
        
          const data = await response.json();
        
          setTags(data.tags);
        
        } 
        else {
        
          console.error('Failed to fetch tags');
        
        }
        
        setLoading(false);
      } 
      catch (error) {
      
        console.error('Error fetching tags:', error);
        setLoading(false);
      
      }
    }
  };

  const fetchMembers = async () => {

    if (organization?.id) {
    
      try {
    
        setLoading(true);
    
        // Fetching organization members from Clerk
        const memberships = await organization?.getMemberships();
    
        const invitations = await organization?.getInvitations({ status: "pending" });
    
        const members = memberships.data.map(({ publicUserData: { firstName, lastName, identifier: email, userId }, role }) => ({ firstName, lastName, email, userId, role}))
    
        const parsedInvitations = invitations.data.map(({ emailAddress: email, role, status, revoke }) => ({ email, role, status, revoke }));
    
        setMembers([...members, ...parsedInvitations]);
      } 
      catch (error) {
      
        console.error('Error fetching members:', error);
      
        setLoading(false);
      }
    }
  };

  // Fetch tags when organization changes
  useEffect(() => {

    if (!fallback) {

      fetchTags();
    
      fetchMembers();

    }

  }, [fallback]);

  // Handle tag deletion
  // Add new state for delete confirmation
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState({ tag: '', index: -1 });
  const [loading, setLoading] = useState(false);

  // Simplified handleAction for delete only
  const handleDeleteMember = (member, index, e) => {

    e.stopPropagation();

    // Get billing information
    var seats = organization.publicMetadata?.billing?.seats || 1;

    // Form message to show in alert
    var message = member.status != "pending" ?
      
      <span>Are you sure you want to remove or cancel <span className="font-semibold">{ member.email }</span>? Their access will end right away, their seat will be canceled, and your total seats will go from { seats } to { seats - 1 }. This can’t be undone.`</span> :
      
      <span>Are you sure you want to cancel the invitation for <span className="font-semibold">{ member.email }</span>? Doing so will immediately terminate that seat, reducing your total seats from { seats } to { seats - 1 }.</span>
    
    // Now the next step is to open an alert
    openBillingAlert({ message, action: { message: "Remove Member", trigger: async () => {

      // Trigger removing member
      await removeMember({ user, member})
      
      // Then reload members list
      await fetchMembers()

      // Stop loading
      setLoading(false);
    
    }} })

  };

  // Update the handleDeleteTag to show confirmation first
  const handleDeleteTag = (tag, index, e) => {

    e.stopPropagation();
    
    setTagToDelete({ tag, index });
    
    setDeleteTagDialogOpen(true);
  };

  // New function to handle actual deletion
  const handleConfirmDeleteTag = async () => {

    try {
    
      setLoading(true);
    
      const response = await fetch('/api/deleteTag', {
    
        method: 'DELETE',
    
        headers: {
          'Content-Type': 'application/json',
        },
    
        body: JSON.stringify({
    
          organization: organization.id,
          tagIndex: tagToDelete.index
    
        })
    
      });

      if (!response.ok) {

        throw new Error('Failed to delete tag');

      }

      const result = await response.json();

      toast.success('Tag deleted successfully');
      
      // Update the local state by removing the deleted tag
      setTags(tags.filter((_, i) => i !== tagToDelete.index));
      
      setDeleteTagDialogOpen(false);

      setLoading(false);
      
    } 
    catch (error) {
    
      console.error('Error deleting tag:', error);
    
      toast.error('Failed to delete tag');
    
      setLoading(false);
    
    }
  };

  // Add state to control dialog visibility
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);

  // Handle new tag submission
  var handleAddNewTag = async (data) => {

    console.log('Adding new tag:', data.tagName);

    // Check if the tag already exists
    if (tags.includes(data.tagName)) {

      reset();
      
      toast.error('Tag already exists');
      
      return;
    }

    setLoading(true);

    // Add new tag to db with API call
    const response = await fetch('/api/createTag', {

      method: 'POST',
      
      headers: {
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify({
      
        tagName: data.tagName,
        organization: organization.id,
      
      })

    });

    if (!response.ok) {
    
      setLoading(false);
    
      reset();
    
      throw new Error('Failed to add tag');
    
    }

    // Parse the response data
    const result = await response.json();

    toast.success('Tag added successfully');

    // Update the tags state with the new tag
    setNewTagDialogOpen(false);

    // After successful API call, you could update the tags state
    setTags([...tags, data.tagName]);
    
    setLoading(false);
    
    reset();

  };

  // Add a new member
  const addMember = async () => {

    // Now here add some validations based on billing
    var billing = organization.publicMetadata?.billing || { seats: 1 };

    // Add a new seat
    await addSeat({ user, seats: billing.seats, members });

    // Then reload members list
    await fetchMembers()

    // Stop loading
    setLoading(false);

  }

  // Function to handle use case when the customer want to upgrade from trial
  const upgradeTrial = async () => {

    // Open upgrade alert
    await openUpgrade({ user });

    // Once user process the upgrade, the trial will be cancelled, start add member flow
    await addMember()

  }

  // Handle opening add new member dialog
  const handleAddNewMember = async () => {

    // Now here add some validations based on billing
    var billing = organization.publicMetadata?.billing || { seats: 1 };

    // On trial we will only allow one member
    if (billing.status == "trialing") 

      return openBillingAlert({ message: `You’re currently on a trial. To add more members, you’ll need to upgrade to a full plan. We’ll upgrade you right now—this will end your trial and charge your card immediately.`, action: { message: "Upgrade", trigger: upgradeTrial } });
    
    // Check limit
    if (members.length >= billing.seats)

      // Add a new member
      return addMember()

  }

  // Show loading state while auth is being checked
  if (fallback) {

    return <Loading screen={true} />;

  }

  return (
    <SidebarProvider>

      <div className="w-full flex h-screen bg-white">

        {/* Sidebar and Header remain unchanged */}
        <AppSidebar user={user} />

        <div className="w-full flex flex-1 flex-col overflow-hidden">
                    
          <div className="flex-1 overflow-auto p-4 md:p-12 w-full">
            
            {/* Tabs for Members and Tags */}
            <Tabs value={activeTab} onValueChange={(value) => value !== "billing" ? setActiveTab(value) : null } className="mb-6">

              <TabsList>

                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>

                {/* Open billing portal */}
                <TabsTrigger value="billing" onClick={() => openPortal({ user })}>Billing</TabsTrigger>

              </TabsList>

            </Tabs>

            {/* Members Section */}
            {activeTab === "members" && (
              <div className="w-full">
                <div className="mb-6 flex justify-between overflow-x-auto">

                  <h2 className="text-lg font-semibold flex items-center">
                    
                    Members
                    
                    <span className="text-xs bg-gray-100 text-primary ml-2 font-normal py-1 px-2 rounded-lg font-sans tracking-normal">
                      
                      {
                      
                        organization?.publicMetadata?.billing?.status === 'trialing' ? "ℹ Your free trial is active."
                        
                        : 
                        
                        organization?.publicMetadata?.billing?.status === 'active' ? 
                        
                          `ℹ You will be billed for ${ organization?.publicMetadata?.billing?.seats } seats.`
                          
                        : 
                        
                        organization?.publicMetadata?.billing?.status === 'canceled'? 
                        
                          '❌ Your are not on an active plan.'
                          
                        : 
                        
                          ""
                        
                      }
                        
                    </span>
                    
                  </h2> 
                  
                  <Button className="gap-2" onClick={handleAddNewMember}>
                    <UserPlus className="h-4 w-4 font-heading" />
                    New Member
                  </Button>
                </div>

                {/* Modified header row */}
                <div className="grid grid-cols-12 gap-4 py-2 px-4 text-sm font-medium text-gray-900 border-b">
                  <div className="col-span-6 md:col-span-6">Email</div>
                  <div className="col-span-3 md:col-span-3">Role</div>
                  <div className="col-span-3 md:col-span-3"></div>
                </div>

                {/* Modified members list */}
                <div className="divide-y">
                  {members.map((member, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-5 px-4 hover:bg-gray-50 cursor-pointer items-center">
                      <div className="col-span-6 md:col-span-6 flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="truncate font-medium">{member.email}</div>
                        { member.status === "pending" && <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          {member.status}
                        </span> }
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          member.role === "org:admin" 
                            ? "bg-blue-50 text-blue-700 ring-blue-700/10"
                            : "bg-green-50 text-green-700 ring-green-600/20"
                        }`}>
                          {member.role === "org:admin" ? "Admin" : 'Member'}
                        </span>
                      </div>

                      {/* Simplified actions column */}
                      { member.email != user.emailAddresses[0].emailAddress && <div className="col-span-3 sm:col-span-3 md:col-span-3 flex justify-end">
                        <button 
                          onClick={(e) => handleDeleteMember(member, index, e)}
                          className="p-1.5 rounded-full hover:bg-gray-200 focus:outline-none text-red-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                      </div> }
                    </div>
                  ))}

                  {members.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No members found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {activeTab === "tags" && (

              <div className="w-full">
                <div className="mb-6 flex justify-between overflow-x-auto">
                  
                  <h2 className="text-lg font-semibold">
                    Tags
                  </h2>

                  <Button className="gap-2" onClick={() => setNewTagDialogOpen(true)}>
                    <Plus className="h-4 w-4 font-heading" />
                    New Tag
                  </Button>
                </div>

                {/* Tags header row */}
                <div className="grid grid-cols-12 gap-4 py-2 px-4 text-sm font-medium text-gray-900 border-b">
                  <div className="col-span-11 md:col-span-11">Name</div>
                  <div className="col-span-1 md:col-span-1"></div>
                </div>

                {/* Tags list */}
                <div className="divide-y">
                  {tags && tags.map((tag, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-5 px-4 hover:bg-gray-50 cursor-pointer items-center">
                      <div className="col-span-11 md:col-span-11 flex items-center gap-3">
                        <div className="truncate font-sm bg-gray-200 rounded-full px-3 py-0.5">{tag}</div>
                      </div>

                      {/* Delete tag button */}
                      <div className="col-span-1 md:col-span-1 flex justify-end">
                        <button 
                          onClick={(e) => handleDeleteTag(tag, index, e)}
                          className="p-1.5 rounded-full hover:bg-gray-200 focus:outline-none text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!tags || tags.length === 0) && (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No tags found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          { loading && <Loading screen={true} /> }
        </div>
      </div>

      {/* Tag Dialog */}
      <Dialog 
        open={newTagDialogOpen}
        onOpenChange={() => setNewTagDialogOpen(false)}
        title="Create New Tag"
        description="Enter a name for your new tag."
      >
        <form onSubmit={handleSubmit(handleAddNewTag)}>
          <div className="py-4">
            <Label htmlFor="tagName" className="text-right">
              Tag Name
            </Label>
            <Input
              id="tagName"
              {...register("tagName", { required: true })}
              placeholder="Enter tag name"
              className="mt-2"
            />
            {errors.tagName && (
              <p className="text-sm text-red-500 mt-1">Tag name is required</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              reset();
              setNewTagDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit">
              Create Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog 
        open={deleteTagDialogOpen}
        onOpenChange={() => setDeleteTagDialogOpen(false)}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${tagToDelete.tag}"? This action cannot be undone.`}
      >
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteTagDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDeleteTag}>
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </Dialog>

      {/* For Trial use case handling */}
      <TrialDialog user={user} />

      {/* For checking user billing status */}
      <BillingCheck user={user} />

      {/* For rendering modals */}
      <ModalContainer />

    </SidebarProvider>
  )
}

