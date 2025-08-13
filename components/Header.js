import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"


export default function Header({ userName }) {

  return (
    
    <header className="flex items-center justify-between border-b px-4 py-3 md:px-12 md:py-4">
      
      <div className="flex items-center gap-2">
        
        {/* For mobile */}
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        <div className="relative w-full max-w-md">
          
          {
            userName ? 
              <h2 className="text-xl font-bold">
                Welcome, {userName?.split(' ')[0]}!
              </h2>
              :
              <></>
          }
          

        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Profile */}
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <h2 className="text-sm font-medium text-black">
            {userName ? userName.split(' ').map(name => name[0]).join('').toUpperCase() : ''}
          </h2>
        </div>
      </div>
    </header>
  )
}