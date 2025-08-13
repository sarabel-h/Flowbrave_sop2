import { useState, useEffect, useRef } from "react"
// Add Dialog import
import Dialog from "@/components/Dialog"
import { Button } from "@/components/ui/button"
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
// Removed FloatingMenu import
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExtension from '@tiptap/extension-image'
import Dropcursor from "@tiptap/extension-dropcursor"

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"

import { put } from "@vercel/blob";
import useAuth from "./auth"

// Rich text editor toolbar button
function ToolbarButton({ icon, label, onClick, isActive }) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className="h-6 px-2 py-1"
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export default function Editor({ id, content, onChange, editable = true, sopId, autoSave = false }) {


  const sopTemplate = `
  <h2>1. Goal</h2>
  <p>Briefly describe the main objective of the procedure and the specific problem it addresses.</p>
  

  <h2>2. Scope</h2>
  <p>Define who this SOP applies to, in what context it should be used, and any relevant inclusions or exclusions.</p>
  

  <h2>3. Responsibilities</h2>
  <p>List the roles involved and describe what each is accountable for within this process.</p>
  

  <h2>4. Prerequisites</h2>
  <p>Identify tools, documents, access, training, or approvals required before the procedure can begin.</p>
  

  <h2>5. Procedure / Steps</h2>
  <p>Lay out the exact sequence of actions to be taken, using clear, numbered or bulleted steps, and include any tools or forms needed at each stage.</p>
  

  <h2>6. KPIs / Success Metrics</h2>
  <p>Specify how the performance or success of this procedure will be measured, tracked, or evaluated.</p>
  

  <h2>7. Exceptions</h2>
  <p>Mention any conditions or edge cases where this SOP does not apply and how to handle those cases.</p>
  

  <h2>8. Safety or Compliance Considerations (if applicable)</h2>
  <p>Note any legal, regulatory, safety, or data privacy requirements that must be followed during this process.</p>
  

  <h2>9. References</h2>
  <p>List any related SOPs, templates, policies, tools, or external standards that support or relate to this process.</p>
  

  <h2>10. Completion Checklist</h2>
  <p>Provide a final list of items or confirmations that must be completed before the procedure can be considered done.</p>
`;


  // Add state for dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  // Use the auth hook to protect this page
  const { isSignedIn, fallback, user } = useAuth({
    authPage: false,
    shouldRedirect: true
  });

  async function uploadImage(file) {
    const response = await put(`images/${sopId}/${Date.now()}`, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });

    console.log("response", response);
    return response.url;
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something …',
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      // Add these two extensions
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Bold,
      Italic,
      Strike,
      Code,
      CodeBlock,
      Blockquote,
      HorizontalRule,
      Underline,
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'w-2/3'
        }
      }),
      Dropcursor,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      })
    ],
    content: content || sopTemplate,

    onUpdate: ({ editor }) => {

      const newContent = editor.getHTML();
      onChange(newContent);
      
      // Trigger autosave if enabled
      if (autoSave) {
        // Add a debounced autosave callback
        if (editor.autoSaveTimeout) clearTimeout(editor.autoSaveTimeout);
        editor.autoSaveTimeout = setTimeout(() => {
          onChange(newContent, true); // Pass true to indicate this is an autosave
        }, 3000); // Debounce for 1 second
      }
    },

    editorProps: {

      handleDrop: (view, event, slice, moved) => {

        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) { // if dropping external files
          let file = event.dataTransfer.files[0]; // the dropped file
          let filesize = ((file.size/1024)/1024).toFixed(4); // get the filesize in MB
          if ((file.type === "image/jpeg" || file.type === "image/png") && filesize < 10) { // check valid image type under 10MB
            // check the dimensions
            let _URL = window.URL || window.webkitURL;
            let img = new Image(); /* global Image */
            img.src = _URL.createObjectURL(file);
            img.onload = function () {
              if (this.width > 5000 || this.height > 5000) {
                window.alert("Your images need to be less than 5000 pixels in height and width."); // display alert
              } else {
                // valid image so upload to server
                // uploadImage will be your function to upload the image to the server or s3 bucket somewhere
                uploadImage(file).then(function(url) { // response is the image url for where it has been saved
                  // place the now uploaded image in the editor where it was dropped
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.image.create({ src: url }); // creates the image element
                  const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
                  return view.dispatch(transaction);
                }).catch(function(error) {
                  if (error) {
                    console.error(error);
                    window.alert("There was a problem uploading your image, please try again.");
                  }
                });
              }
            };
          } else {
            window.alert("Images need to be in jpg or png format and less than 10mb in size.");
          }
          return true; // handled
        }
        return false; // not handled use default behaviour
      }
    }
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content) {
      // Only update if the content is different to avoid cursor jumping
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
      editor.setEditable(editable);
    }
  }, [content, editor, editable]);

  if (!editor) {
    return <div>Loading editor...</div>
  }


  const toolbarButtons = [
    {
      icon: <span className="font-bold">B</span>,
      label: "Bold",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: <span className="italic">I</span>,
      label: "Italic",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: <span className="underline">U</span>,
      label: "Underline",
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      icon: <span className="line-through">S</span>,
      label: "Strike",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    { type: 'divider' },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: "Link",
      onClick: () => setLinkDialogOpen(true),
      isActive: () => editor.isActive('link'),
    },
    {
      icon: <span className="font-bold text-sm">H1</span>,
      label: "Heading 1",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <span className="font-bold text-xs">H2</span>,
      label: "Heading 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    { type: 'divider' },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 11l3 3L22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: "Checklist",
      onClick: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList'),
    },

    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="4" cy="6" r="2" strokeWidth="2" />
          <circle cx="4" cy="12" r="2" strokeWidth="2" />
          <circle cx="4" cy="18" r="2" strokeWidth="2" />
        </svg>
      ),
      label: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="10" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="10" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="10" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="3" y="8" fontSize="9" fill="currentColor">1</text>
          <text x="3" y="14" fontSize="9" fill="currentColor">2</text>
          <text x="3" y="20" fontSize="9" fill="currentColor">3</text>
        </svg>
      ),
      label: "Numbered List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    }
  ]

  return (
    <>
      {editor && editable && (

        // Added sticky toolbar menu at the top
        <div className="sticky top-0 z-10 bg-white border-b mb-2 py-2 px-2">
          <div className="flex items-center justify-start -mx-2 gap-3 rounded-xl p-1">
            {toolbarButtons.map((button, index) => 
              button.type === 'divider' ? (
                <div key={index} className="mx-1 h-4 w-px bg-gray-200" />
              ) : (
                <ToolbarButton
                  key={index}
                  icon={button.icon}
                  label={button.label}
                  onClick={button.onClick}
                  isActive={button.isActive()}
                />
              )
            )}
          </div>
        </div>
      )}
    
      {/* TipTap Editor */}
      <div className="rounded-md">
        <EditorContent
          id={id}
          editor={editor} 
          className="h-full w-full rounded-md p-4 prose max-w-none focus:outline-none"
          style={{
            "--tw-prose-bullets": "currentColor",
            "--tw-prose-counters": "currentColor"
          }}
        />
      </div>

      <Dialog
        open={linkDialogOpen}
        onOpenChange={() => setLinkDialogOpen(false)}
        title="Insert Link"
        description="Enter the URL for the link"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const url = formData.get("url");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
          setLinkDialogOpen(false);
        }}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <input
                name="url"
                type="url"
                placeholder="https://example.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit">
              Insert
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </Dialog>
    </>
  )
}
