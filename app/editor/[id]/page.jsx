// This is the editor page of the app
// All the SOPs are edited and managed
// on this page

"use client"

// React components
import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Custom components
import AppSidebar from "@/components/AppSidebar"
import Header from "@/components/Header"
import Editor from "@/components/Editor"

// Others
import { SidebarProvider } from "@/components/ui/sidebar"
import { Save, Trash2, FileText, PlusIcon, X, Edit, UserPlus } from "lucide-react"

// Add to imports section
import toast from "react-hot-toast"
import { useForm } from "react-hook-form"
import useAuth from "@/components/auth"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Protect } from "@clerk/nextjs"

import { accessControl, assignableRoles, getRole } from "@/lib/access-control";

// Component definition
export default function EditorPage() {
  
  // Router and params
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get edit value from query params
  const edit = searchParams.get('edit')
  const id = params.id

   // Use the auth hook to protect this page
   const { isSignedIn, fallback, user, orgId, orgRole } = useAuth({
    authPage: false,
    shouldRedirect: true
  });
  
  // Get user's full name
  const userName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  // Extract organization from user object
  const organization = user?.organizationMemberships?.[0]?.organization;

  // State management
  const [sop, setSop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState([])
  const [members, setMembers] = useState([])
  const [editable, setEditable] = useState(false)

  // React Hook Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      content: "",
      tags: [],
      assignedTo: []
    }
  })

  const { register: registerAssign, handleSubmit: handleSubmitAssign, setValue: setAssignValue, reset: resetAssign } = useForm({
    defaultValues: {
      email: "",
      role: "",
    }
  })

  // Initialize SOP data on component mount
  useEffect(() => {

    // Fetch the SOP data
    fetchSop();

    // Set editable state to true if edit is not null
    setEditable(edit !== null);

  }, [id, edit])

  // Update form when SOP data changes
  useEffect(() => {

    // Check if SOP data is available
    if (sop) {
      setValue("title", sop.title);
      setValue("content", sop.content);
      setValue("tags", sop.tags || []);
      setValue("assignedTo", sop.assignedTo || []);
    }

  }, [sop, setValue])

  // Fetch available tags when SOP data is loaded
  useEffect(() => {
    
    const fetchTags = async () => {
      
      try {
          
        // Make API request to get tags
        const response = await fetch(`/api/getTags?organization=${sop?.organization}`)
        
        // Check if the response is ok
        if (!response.ok) throw new Error('Failed to fetch tags')
        
        // Parse the response data
        const tags = await response.json()

        console.log("Tags", tags)
        setAvailableTags(tags.tags)

      } catch (error) {
        
        // Log the error
        console.error('Error fetching tags:', error)
      }
    }

    const fetchMembers = async () => {
      if (organization?.id) {
        try {
          // Fetching organization members from Clerk
          const memberships = await organization?.getMemberships();
          setMembers(memberships.data.filter(({ publicUserData: { identifier: email } }) => email != user.emailAddresses[0].emailAddress && !sop?.assignedTo.some(a => a.email === email)).map(({ publicUserData: { firstName, lastName, identifier: email, userId }, role }) => ({ firstName, lastName, email, userId, role})));
        } catch (error) {
          console.error('Error fetching members:', error);
        }
      }
    };
    
    console.log("Fetching tags", sop)
    // Only fetch tags when we have the organization id
    if (sop?.organization) {
      fetchTags();
      fetchMembers();
    }

  }, [sop])

  // Handle save SOP
  const assignUser = async (data) => {
    
    console.log("assignUser", data);
    try {
      
      // Make API request to assign the SOP
      const response = await fetch('/api/assignSop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sop.id,
          email: data.email,
          role: data.role || "viewer",
          organization: sop.organization,
        }),
      })
      
      // Check if the response is ok
      if (!response.ok) {
        throw new Error('Failed to update SOP')
      }
      
      // Parse the response data
      const result = await response.json();
      
      // Update the state with the new data
      setSop(result.data);
      
      // Show success message
      toast.success('SOP assigned to the user!');
      
      // Set editable to false
      setEditable(false);

      // Reset the assign form
      resetAssign();


    } catch (error) {

      // Log the error
      console.error('Error updating SOP:', error)
      toast.error('Failed assigning SOP!')
    }
  }

  const removeUserFromSop = async (data) => {

    try {
      const response = await fetch('/api/removeUserFromSop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sop.id,
          email: data.email,
        }),
      })
  
      if (!response.ok) {
        throw new Error('Failed to update SOP')
      }
  
      const result = await response.json();
      console.log("result", result);
      setSop(result.data);
      toast.success('SOP saved successfully');
      setEditable(false);
    } catch (error) {
      console.error('Error updating SOP:', error)
      toast.error('Failed to save SOP')
    }
  }
  
  // Handle save SOP
  const onSubmit = async (data) => {

    // Check if data is unchanged
    if (
      
      data.title === sop.title && 
      data.content === sop.content && 
      JSON.stringify(data.tags) === JSON.stringify(sop.tags)

    ) {

      router.push(`/editor/${id}`);
      return
    }

    try {

      // Show loading toast
      const loadingToast = toast.loading('Saving...');

      const response = await fetch('/api/updateSop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sop.id,
          organization: sop.organization,
          ...data,
        }),
      })
      
      const result = await response.json();
      
      if (!response.ok) {

        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        throw new Error('Failed to update SOP')
      }
  
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      
      setSop(result.data);
      toast.success('Saved');

      router.push(`/editor/${id}`);

    } catch (error) {
      
      console.error('Error updating SOP:', error)
      toast.error('Failed to save SOP')
    }
  }

  // Add autosave state
  const [isSaving, setIsSaving] = useState(false);
  
  // Update the handleEditorChange function to handle autosave
  const handleEditorChange = (content, isAutosave = false) => {

    setValue("content", content);
    
    // If this is an autosave, trigger the save operation
    if (isAutosave && editable) {
      handleAutosave(content);
    }
  }
  
  // Add a new function for autosaving
  const handleAutosave = async (content) => {

    console.log("Sop", sop);
    console.log("Content", content);

    // Prevent multiple simultaneous saves
    if (isSaving) return;
    
    // Only save if content has changed
    if (content === sop.content) return;
    
    setIsSaving(true);

    var loadingToast = toast.loading('Saving...');
    
    try {
      const response = await fetch('/api/updateSop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sop.id,
          organization: organization.id,
          title: watch("title"),
          content: content,
          updatedAt: new Date(),
          tags: watch("tags") || [],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to autosave SOP');
      }
      
      const result = await response.json();
      setSop(result.data);
      
      // Hide loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Saved!');

      console.log("Editable", editable);
      
    } catch (error) {

      toast.dismiss(loadingToast);
      console.error('Error autosaving SOP:', error);
      toast.error('Failed to save changes');

    } finally {

      toast.dismiss(loadingToast);
      setIsSaving(false);
    }
  }

  // Fetch SOP data from API
  const fetchSop = async () => {

    // Start loading state
    setLoading(true)

    try {
      // Make API request to get SOP data
      const response = await fetch(`/api/getSop?sopId=${id}`)
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to fetch SOP')
      }
      
      // Parse the response data
      const data = await response.json()

      // Create SOP data object with required fields
      const sopData = {
        id: data.id,
        title: data.title,
        content: data.content,
        tags: data.tags,
        updatedAt: data.updatedAt,
        organization: data.organization,
        assignedTo: data.assignedTo,
        version: data.version || "1.0", // Add version
        createdAt: data.createdAt || data.updatedAt // Add creation date
      }
      
      // Update the state with SOP data
      setSop(sopData)
      
    } catch (error) {

      // Log any errors that occur
      console.error('Error fetching SOP:', error)
    } finally {

      // Stop loading state regardless of outcome
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {

    // In the loading state return
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full bg-white">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto p-4 md:p-6 md:px-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Loading SOP...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // Not found state
  if (!sop) {

    // In the not found state return
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full bg-white">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto p-4 md:p-6 md:px-12 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-gray-600">SOP not found</p>
                <Button className="mt-4" onClick={() => router.push("/")}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      {/* Main */}
      <div className="flex h-screen w-full bg-white">
        {/* Sidebar Menu */}
        <AppSidebar user={user} />

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Header */}
          {/* <Header userName={userName} /> */}

          {/* Main Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto p-4 md:py-3 md:px-12">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex-1 flex-col gap-4">
                
                {/* SOP Title Input */}
                <div className="flex-1 relative">
                  <div className={`flex items-center rounded-md border bg-white transition-shadow duration-300 ease-in-out\ ${!editable ? "shadow-sm" : "shadow-lg"}`}>
                    <div className="flex-1 flex items-center gap-2">
                      { editable ? <Input
                        {...register("title", { required: "Title is required" })}
                        placeholder="Untitled"
                        className="text-md font-bold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      /> : <Label htmlFor="editor" className="flex items-center font-bold h-10 w-full rounded-md bg-background px-3 py-2 text-base md:text-sm">{sop.title}</Label>}
                      <div className="flex gap-2 px-2">
                        {watch("tags")?.map((tag) => (
                          <span
                            key={tag}
                            type="button"
                            className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs inline-flex items-center gap-1 group"
                          >
                            {tag}
                            { editable && <button type="button" onClick={() => {
                                const newTags = watch("tags").filter(t => t !== tag)
                                setValue("tags", newTags)
                              }}><X 
                              className="h-3 w-3 text-gray-400 hover:text-gray-700 transition-colors" 
                            /> </button> }
                          </span>
                        ))}
                        { editable && <Popover>
                          <PopoverTrigger asChild>
                            <button 
                              type="button"
                              className="rounded-full bg-gray-200 text-black px-3 py-1 text-xs hover:bg-gray-200 flex items-center gap-1 whitespace-nowrap"
                            >
                              <PlusIcon className="h-3 w-3" />
                              Add tags
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60 p-3">
                            <div>
                              <h3 className="text-xs font-medium mb-2">Available Tags</h3>
                              <div className="flex flex-wrap gap-2">
                                {availableTags
                                  .filter(tag => !watch("tags")?.includes(tag))
                                  .map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => {
                                        const currentTags = watch("tags") || []
                                        setValue("tags", [...currentTags, tag])
                                      }}
                                      className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-xs inline-flex items-center gap-1"
                                    >
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover> }
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pr-2">

                        <Protect condition={(has) => accessControl[getRole(orgRole, user?.emailAddresses[0].emailAddress, sop)].includes("assign")}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" side="bottom" className="w-full p-6 my-2 shadow-lg">
                              <div className="flex flex-col gap-2">
                                <h3 className="text-xs font-medium mb-2">Assign this SOP</h3>
                                <form onSubmit={handleSubmitAssign(assignUser)} className="flex gap-2 w-full">
                                  <Select 
                                    {...registerAssign("email")}
                                    onValueChange={(value) => setAssignValue("email", value)}
                                    className="w-full"
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Select a member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {members.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                          No Members Found
                                        </SelectItem>
                                      ) : (
                                        members.map((member) => (
                                          <SelectItem 
                                            key={member.email} 
                                            value={member.email}
                                          >
                                            {member.firstName} {member.lastName} ({ member.email })
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <Button type="submit" className="h-8">
                                    Assign
                                  </Button>
                                </form>
                              </div>
                              <div className="mt-4">
                              <div className="space-y-3">
                                {sop?.assignedTo?.map((user, index) => (

                                  <div key={index} className="grid grid-cols-7 items-center gap-3 p-2 rounded-lg border border-gray-200 bg-gray-50">
                                    <div className="text-sm font-medium col-span-4 text-gray-700">{user.email}</div>

                                    <Select defaultValue={user.role} onValueChange={(role) => assignUser({ email: user.email, role })}>
                                      <SelectTrigger className="col-span-2 h-9 px-3 py-1 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 focus:ring-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white shadow-md rounded-lg">
                                        {assignableRoles.map((role) => (
                                          <SelectItem
                                            key={role.toLowerCase()}
                                            value={role.toLowerCase()}
                                            className="text-sm px-4 py-2 hover:bg-gray-100"
                                          >
                                            {role}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <Button
                                      type="button"
                                      onClick={() => removeUserFromSop({ email: user.email, role: 'delete' })}
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-red-500 hover:text-red-600 transition"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              </div>
                            </PopoverContent>
                          </Popover>
                        </Protect>
                        <Protect condition={(has) => accessControl[getRole(orgRole, user?.emailAddresses[0].emailAddress, sop)].includes("edit")}>
                          
                          { editable ?
                            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8"><Save className="h-4 w-4" /></Button> :
                            <Button type="button" onClick={(e) => {e.preventDefault(); router.push(`/editor/${id}/?edit`);}} variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                          }

                        </Protect>
                    </div>
                  </div>
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                  
                  {/* SOP Metadata - ID, Version, Created Date */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 px-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span> <b>ID:</b> {sop?.id}</span>
                    </div>
                    <div><b>Version:</b> {sop?.version || "1.0"}</div>
                    <div><b>Created:</b> {sop?.createdAt ? new Date(sop.createdAt).toLocaleDateString() : "N/A"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Component */}
            <Editor 
              id="editor" 
              content={sop.content} 
              onChange={handleEditorChange} 
              editable={editable} 
              sopId={sop?.id}
              autoSave={editable} // Only enable autosave when in edit mode
            />
            
            
            {/* Last Updated Info */}
            <div className="mt-4 text-sm text-gray-500">
              { !editable && sop?.updatedAt && <p>Last updated: {sop?.updatedAt}</p> }
            </div>
          </form>
        </div>
      </div>
    </SidebarProvider>
  )
}

