import { useState, useEffect } from "react"
import useAuth from "./auth";
import { useRouter } from "next/navigation";
import Dialog from "./Dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Info, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";

export default function Files({ selectedTag, searchTerm }) {

  // State to track active menu and SOPs
  const [activeMenu, setActiveMenu] = useState(null);
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  // State to track selected SOP information
  const [selectedSop, setSelectedSop] = useState(null);
  const router = useRouter();

  // Get user's organization ID
  const { user, orgId, orgRole } = useAuth({ authPage: false, shouldRedirect: true });
  
  // Extract company ID from user object
  var organization = user?.publicMetadata?.companyId;

  // Fetch SOPs from database
  useEffect(() => {

    const fetchSops = async () => {

      // If no organization, return
      if (!organization) {

        // Set error and loading states
        setError('Organization ID not found. Please check your account settings.');
        setLoading(false);
        return;
      }

      try {

        setLoading(true);
        
        const accessLevel = orgRole === 'org:admin' ? 'organization' : 'user';

        const response = await fetch(`/api/listSops?organization=${organization}&accessLevel=${accessLevel}&email=${user.emailAddresses[0].emailAddress}`);
        
        // Check if the response is ok
        if (!response.ok) {
          throw new Error('Failed to fetch SOPs');
        }
        
        // Parse the response data and set it to state
        const data = await response.json();
        setSops(data);
        setError(null);

      } catch (err) {

        console.error('Error fetching SOPs:', err);
        setError('Failed to load SOPs. Please try again later.');
      
      } finally {

        // Stop the loading
        setLoading(false);
      }
    };

    fetchSops();

  }, [organization]);
  
// Function to delete a SOP
const deleteSop = async ({ id }) => {

  // Check if organization and id are present
  if (!organization || !id) {

    setError('Unable to delete SOP. Missing required information.');
    return;
  }

  try {

    // Make API call
    const response = await fetch(`/api/deleteSop`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id
      })
    });

    // Check if the response is ok
    if (!response.ok) {
      throw new Error('Failed to delete SOP');
    }

    // Remove the deleted SOP from state
    setSops(prevSops => prevSops.filter(sop => sop.id !== id));
    setError(null);

  } catch (err) {

    // Log the error
    console.error('Error deleting SOP:', err);
    setError('Failed to delete SOP. Please try again later.');
  }
};

  const handleMenuToggle = (index, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === index ? null : index);
  };


  // Navigate to the editor page
  const handleSopClick = (sop) => { router.push(`/editor/${sop.id}`) };

  // Delete the SOP
  const handleDeleteClick = (sop, e) => {
    
    // Stop default behavior
    e.stopPropagation();
    
    // Open the delete dialog
    setDeleteDialogOpen(true);

    // Set the SOP id to state
    setSelectedSop(sop);

  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (activeMenu !== null) {
      setActiveMenu(null);
    }
  };

  const handleInfoClick = (sop, e) => {
    // Stop default behavior
    e.stopPropagation();
    // Open the info dialog
    setInfoDialogOpen(true);
    // Set the SOP id to state
    setSelectedSop(sop);
  };

  // Filter SOPs based on selected tag and search term
  const filteredSops = sops.filter(sop => {

    // First, check if it matches the tag filter
    const matchesTag = !selectedTag || selectedTag === "all" || 
      (sop.tags && sop.tags.includes(selectedTag));

    // Check if it matches the search term
    const matchesSearch = !searchTerm || 
      sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sop.tags && sop.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // Return true only if both conditions are met
    return matchesTag && matchesSearch;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-pulse text-gray-500">Loading SOPs...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full" onClick={handleClickOutside}>
      {/* Affichage en cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredSops.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500">
            {selectedTag && selectedTag !== "all" 
              ? `No SOPs found with the \"${selectedTag}\" tag` 
              : "No SOPs found"}
          </div>
        ) : (
          filteredSops.map((sop, index) => (
            <div
              key={sop.id || index}
              className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition cursor-pointer flex flex-col justify-between p-5 relative group"
              onClick={() => handleSopClick(sop)}
            >
              {/* Menu d'actions en haut à droite */}
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <button className="p-1.5 rounded-full hover:bg-gray-200 focus:outline-none">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={e => handleInfoClick(sop, e)} className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={e => handleDeleteClick(sop, e)} 
                      className="flex items-center gap-2 text-gray-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Icône et titre */}
              <div className="flex items-center gap-3 mb-2">
                <Image src={"/sop-icon.svg"} width={28} height={28} className="w-7 h-7 m-0" alt="SOP icon" />
                <h4 className="truncate font-semibold text-lg">{sop.title}</h4>
              </div>
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {sop.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Date */}
              <div className="text-xs text-gray-400 mb-2">Last updated: {sop.updatedAt}</div>
              {/* Version (optionnel) */}
              {sop.version && (
                <div className="text-xs text-gray-300">v{sop.version}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onOpenChange={() => setInfoDialogOpen(false)}
        title="SOP Information"
      >
        {selectedSop && (
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">ID</span>
                <span>{selectedSop.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Version</span>
                <span>{selectedSop.version || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Created</span>
                <span>{selectedSop.createdAt}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Dialog */}
      {deleteDialogOpen && <Dialog
          open={deleteDialogOpen}
          onOpenChange={() => setDeleteDialogOpen(false)}
          title="Delete SOP"
          description="Are you sure you want to delete this SOP?"
        >
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              deleteSop(selectedSop);
              setDeleteDialogOpen(false);
            }}>
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </Dialog> }
    </div>
  )
}