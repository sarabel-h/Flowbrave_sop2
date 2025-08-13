import {Cpu, Edit, X} from "lucide-react";
import Dialog from "@/components/Dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation" 
import { useForm } from "react-hook-form"
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import useAuth from "./auth";

export default function CreateNewForm({ showCreateDialog, setShowCreateDialog, tags }) {
  // React Hook Form setup for main form
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({ shouldUnregister: true, defaultValues: { id: "SOP-" + Date.now() } });
  
  // React Hook Form setup for AI form
  const { register: registerAi, handleSubmit: handleSubmitAi  } = useForm();
  
  // Router to navigate between pages
  const router = useRouter();

  // State to control the AI generation form dialog
  const [showAIForm, setShowAIForm] = useState(false);

  // Add loading state
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Add state for selected tags in creation form
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Add form error state
  const [formError, setFormError] = useState("");

  var [sopCreationData, setSopCreationData] = useState({});
  
  // Use the auth hook to protect this page
  const { fallback, user } = useAuth({
    authPage: false,
    shouldRedirect: true
  });

  // Extract organization from user object
  const organization = user?.organizationMemberships?.[0]?.organization;

  // Handle if AI or manual is selected
  var createNew = (data, event) => {

    // Determine which handler to call based on button pressed
    if (event?.nativeEvent?.submitter?.name === 'ai') {
      handleGenerateWithAI(data);
    } else {
      handleWriteManually(data);
    }
  };

  // Handle AI generation option
  const handleGenerateWithAI = (data) => {

    console.log("With AI", data)
    
    // Save data in the state
    setSopCreationData(data);

    // Close the dialog
    // setShowCreateDialog(false);

    // Open the AI form
    setShowAIForm(true);
  };

  // Handle manual creation option
  const handleWriteManually = async (data) => {

    console.log("Manually", data)

    // Reset form error
    setFormError("");

    // Set is generating state
    setIsGenerating(true);

    // Create new SOP with the provided data
    const sopData = {
      title: data.title,

      // Check if ID has spaces in it
      // If so, repalce them with hyphen
      id: data.id.replace(/\s+/g, '-'),
      assignedTo: [{
        email: user?.emailAddresses[0].emailAddress,
        role: "owner"
      }],
      tags: selectedTags || [],
      version: data.version || "1.0",
      organization: organization.id,
    };
    
    try {

      // Send the data to the API to create the SOP
      const response = await fetch('/api/createSop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sopData)
      });
      
      // Parse the response data
      const createdSop = await response.json();

      // Check if the response is ok
      if (createdSop.code == 409) {

        // Show form error
        setFormError("SOP ID already exists");
        return;
      }
      
      // Navigate to editor with the new SOP ID
      router.push(`/editor/${createdSop.data.id}?edit`);
      
    } catch (error) {

      // Log the error
      console.error('Error creating SOP:', error);
      setFormError("Failed to create SOP. Please try again.");
    }
  };

  // Handle tag selection in creation form
  const handleTagSelection = (tag) => {

    // Check if the tag is already selected
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Update the AI form submission handler
  const onSubmitAIForm = async (data) => {

    setShowCreateDialog(false);

    // Start loading
    setIsGenerating(true);
    
    // Combine the data
    const combinedData = {
      ...sopCreationData,
      
      // Get the AI data
      ...data,

      // Organization ID
      organization: organization.id,
    };

    try {

      // Send the data to the API
      const response = await fetch('/api/generateSopWithAi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combinedData)
      });
      
      // Check if the response is ok
      if (!response.ok) throw new Error('Failed to generate');
      
      // Parse the response data
      const result = await response.json();
      
      // Check if the response is successful
      if (!result.status >= 300) throw new Error('Failed to generate');

      // Parse and save the response data
      const newSOP = JSON.parse(result.content);
      
      // Create new SOP with the generated content
      const sopData = {
        title: sopCreationData.title,
        content: newSOP.content,
        id: sopCreationData.id.replace(/\s+/g, ''),
        assignedTo: [{
          email: user?.emailAddresses[0].emailAddress,
          role: "owner"
        }],
        tags: selectedTags || [],
        version: sopCreationData.version || "1.0",
        organization: organization.id,
      };
      
      try {

        // Send the data to the API
        const newSopResponse = await fetch('/api/createSop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sopData)
        });

        // Check if the response is ok
        if (!newSopResponse.ok) throw new Error('Failed to create SOP');

        // Check if the response is successful
        if (!newSopResponse.success >= 300) throw new Error('Failed to create SOP');
        
        // Parse the response data
        const createdSop = await newSopResponse.json();

        // Check if the response indicates a duplicate ID
        if (createdSop.code === 409) {

          // Hide AI form dialog
          setShowAIForm(false);
          
          // Show create dialog
          setShowCreateDialog(true);
          
          // Show form error
          setFormError("SOP ID already exists");
          
          // Stop loading
          setIsGenerating(false);
          return;
        }

        // Redirect to the new SOP
        router.push(`/editor/${createdSop.data.id}?edit`);

      } catch (error) {

        console.error('Error creating SOP:', error);
        
        // Hide AI form dialog
        setShowAIForm(false);
        
        // Show create dialog with error
        setShowCreateDialog(true);
        setFormError("Failed to create SOP. Please try again.");

      }
    } catch (error) {
      
      // Log the error
      console.error('Generation Error:', error);
      
      // Show error in the AI form
      setFormError("Failed to generate SOP content. Please try again.");

    } finally {
      
      // Stop loading regardless of outcome
      setIsGenerating(false);
    }
  };



  async function checkDuplicateId({ target: { value } }) {
    console.log("checkDuplicateId", value)
    if(!value.length) {
      setFormError("");
      return;
    }
    // Send the data to the API
    const response = await fetch(`/api/checkDuplicateSopId?organization=${organization?.id}&id=${value}`);
    
    // Parse the response data
    const idValidation = await response.json();

    // Check if the response indicates a duplicate ID
    if (idValidation.code === 409) {

      // Hide AI form dialog
      setShowAIForm(false);
      
      // Show create dialog
      setShowCreateDialog(true);
      
      // Show form error
      setFormError("SOP ID already exists");
      
      // Stop loading
      setIsGenerating(false);
      return;
    }
    setFormError("");
  }

  return <>
    {/* Creation Dialog */}
    <Dialog
      open={showCreateDialog}
      onOpenChange={() => setShowCreateDialog(false)}
      title="Create New SOP"
      description="Enter the details for your new SOP"
    >

      <form onSubmit={handleSubmit(createNew, (errs) => console.log(errs))}>
        <div className="space-y-4 py-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              placeholder="Enter SOP title" 
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>



          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Enter SOP description" 
              {...register("description", { required: false })}
            />
            {/* {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>} */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input 
              id="id" 
              placeholder="Enter SOP ID" 
              {...register("id", { onBlur: checkDuplicateId })}
            />
            {errors.id && <p className="text-sm text-red-500">{errors.id.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 border p-2 rounded-md">
              {tags.map((tag) => (
                <Button 
                  key={tag} 
                  type="button"
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="rounded-full px-4 py-1 h-auto text-sm"
                  onClick={() => handleTagSelection(tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </Button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input 
              id="version" 
              placeholder="Enter SOP version (e.g. 1.0)" 
              {...register("version")}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button 
            type="submit" 
            name="manual"
            disabled={formError.length > 0}
            className="gap-2"
          >
            
              {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    
                    <Edit className="h-4 w-4" />
                    Create Manually
                  </>
              )}
          </Button>
          
          <Button 
            type="submit" 
            name="ai"
            disabled={formError.length > 0}
            className="gap-2"
          >
            <Cpu className="h-4 w-4" />
            Create with AI
          </Button>
        </AlertDialogFooter>
      </form>
              
    </Dialog>

    {/* AI Generation Form Dialog */}
    <Dialog
      open={showAIForm}
      onOpenChange={() => setShowAIForm(false)}
      title="Generate SOP with AI"
      description="Provide additional information for AI generation"
    >
      <form onSubmit={handleSubmitAi(onSubmitAIForm)}>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="draft">Draft</Label>
            <Textarea 
              id="draft" 
              placeholder="A raw draft for your SOP" 
              className="min-h-[80px]"
              {...registerAi("draft", { required: false })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea 
              id="instructions" 
              placeholder="Instruct the AI on what to keep in mind while generating your SOP" 
              className="min-h-[80px]"
              {...registerAi("instructions", { required: false })}
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setShowAIForm(false)}
            disabled={isGenerating}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </AlertDialogCancel>
          <Button 
            type="submit"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </form>
    </Dialog>
  </>;
}