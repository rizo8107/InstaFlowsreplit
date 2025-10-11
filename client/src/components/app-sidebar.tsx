import { Home, Workflow, Instagram, Activity, Settings, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Flows",
    url: "/flows",
    icon: Workflow,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Instagram,
  },
  {
    title: "Activity",
    url: "/activity",
    icon: Activity,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">InstaFlow</h2>
            <p className="text-xs text-muted-foreground">Automation Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" data-testid="link-settings">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
