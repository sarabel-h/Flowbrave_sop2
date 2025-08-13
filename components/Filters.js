import { useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function Filters({ tags = [], onTagChange, selectedTag = "" }) {
  
  const [open, setOpen] = useState(false)
  
  const handleTagSelect = (tag) => {
    onTagChange(tag)
    setOpen(false)
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedTag === "all" ? "default" : "outline"}
              className="rounded-full px-4 py-1 h-auto text-sm"
              onClick={() => handleTagSelect("all")}
            >
              All Tags
            </Button>
            
            {tags.map((tag) => (
              <Button 
                key={tag} 
                variant={selectedTag === tag ? "default" : "outline"}
                className="rounded-full px-4 py-1 h-auto text-sm"
                onClick={() => handleTagSelect(tag)}
              >
                {tag.charAt(0) + tag.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}