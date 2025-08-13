"use client";

// React components
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

// Custom components
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import Files from "@/components/Files";
import useAuth from "@/components/auth";
import Loading from "@/components/Loading";
import Filters from "@/components/Filters";

// Others
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import CreateNewForm from "@/components/CreateNewForm";
import TrialDialog from "@/components/TrialDialog";
import BillingCheck from "@/components/BillingCheck";

// Component definition
export default function FileManager() {

  // Add search term state
  const [searchTerm, setSearchTerm] = useState("");

  // State to handle selected tag
  const [selectedTag, setSelectedTag] = useState("");

  // State to store tags
  const [tags, setTags] = useState([]);

  // State to control the create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Use the auth hook to protect this page
  const { fallback, user } = useAuth({ authPage: false, shouldRedirect: true });
  
  // Fetch tags when organization changes
  useEffect(() => {

    const fetchTags = async () => {
      
      const organization = user?.organizationMemberships?.[0]?.organization;

      if (organization?.id) {

        try {

          const response = await fetch(`/api/getTags?organization=${organization.id}`);

          if (response.ok) {

            const data = await response.json();

            setTags(data.tags);

          } else {

            console.error('Failed to fetch tags');
          }

        } catch (error) {

          console.error('Error fetching tags:', error);

        }
      }
    };

    fetchTags();

  }, []);

  // Show loading state while auth is being checked
  if (fallback) {

    return <Loading screen/>;

  }

  // Get user's full name
  const userName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  // Handle create new SOP
  const handleCreateNew = () => { setShowCreateDialog(true) };

  // Handle tag change
  const handleTagChange = (value) => { setSelectedTag(value) };

  // Add search handler
  const handleSearch = (e) => { setSearchTerm(e.target.value) };

  return (

    <SidebarProvider>

      {/* Main */}
      <div className="w-full flex h-screen bg-white">

        {/* Sidebar Menu */}
        <AppSidebar user={user} />

        {/* Content */}
        <div className="w-full flex flex-1 flex-col overflow-hidden">

          {/* Header */}
          <Header userName={userName} />
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 md:p-12 w-full">
            
            <div className="mb-6 flex flex-col md:flex-row justify-between overflow-x-auto">

              <div className="flex gap-2 flex-col md:flex-row">
                
                {/* Search bar to search by name */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search SOPs..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="h-10 w-72 px-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Filters to select tags */}
                <Filters 
                  tags={tags} 
                  onTagChange={handleTagChange} 
                  selectedTag={selectedTag} 
                />

              </div>

              {/* Create new SOP button */}
              <Button className="gap-2" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 font-heading" />
                Create new
              </Button>
            </div>
            
            {/* Display all the SOPs */}
            <Files selectedTag={selectedTag} searchTerm={searchTerm} />

          </div>

        </div>

      </div>

      {/* For Trial use case handling */}
      <TrialDialog user={user} />

      {/* For checking user billing status */}
      <BillingCheck user={user} />

      <CreateNewForm showCreateDialog={showCreateDialog} setShowCreateDialog={setShowCreateDialog} tags={tags} />
      
    </SidebarProvider>
  )
}
