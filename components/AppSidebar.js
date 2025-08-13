import { Building, LayoutGrid, LogOut, OrigamiIcon, Route, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClerk, Protect, useOrganizationList } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { accessControl, getRole } from "@/lib/access-control";
import useAuth from "./auth";
import { useEffect, useState } from "react";
import Image from "next/image";

function NavItem({ href, icon, children, active, onClick }) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn("flex hover:bg-gray-200 items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg w-full text-left", active && "bg-gray-200 text-gray-900 font-medium")}
      >
        {icon}
        <span>{children}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={cn("flex hover:bg-gray-200 items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg", active && "bg-gray-200 text-gray-900 font-medium")}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default function AppSidebar({ user }) {

  const router = useRouter();
  
  const pathname = usePathname();
  
  const { signOut } = useClerk();

  const { setActive } = useOrganizationList();
  
  const { orgId, orgRole } = useAuth({ authPage: false, shouldRedirect: true });

  const [organization, setOrganization] = useState(user?.organizationMemberships[0]?.organization || null);

  const handleSignOut = async () => {

    await signOut();
    
    router.push("/auth/login");

  };

  useEffect(() => {

    if (user) {

      setActive({ organization: organization.id })

    }

  }, []);

  return (

    <Sidebar variant="sidebar" collapsible="offcanvas">

      {/* Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Image src={"/logo.png"} width={456} height={120} alt="Logo that says 'Flowbrave SOPs'" className="w-40" />
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <nav className="space-y-1 px-2">
          <NavItem
            href="/"
            icon={<LayoutGrid className="h-4 w-4" />}
            active={pathname === '/'}
          >
            Home
          </NavItem>
          <NavItem
            href="/copilot"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            active={pathname === '/copilot'}
          >
            SOPs Copilot
          </NavItem>
          <Protect condition={(has) => accessControl[getRole(orgRole, user?.emailAddresses[0].emailAddress)].includes("settings")}>
            <NavItem
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              active={pathname === '/settings'}
            >
              Settings
            </NavItem>
          </Protect>
        </nav>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t p-4">
        <div className="space-y-4">
          {/* Current Organization */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{organization?.name || 'Organization'}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button variant="outline" onClick={handleSignOut} className="w-full justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
