import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from './ui/sidebar';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  UserCheck,
  CreditCard,
  Building,
  Settings,
} from 'lucide-react';

export const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  customNavItems,
  role = 'BLOCKER',
  verificationCode,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Default navigation items based on role
  const defaultNavItems =
    role === 'ADMIN'
      ? [
          { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard },
          { id: 'blockers', label: 'Pending Blockers', icon: UserCheck },
          { id: 'listings', label: 'Listing Approvals', icon: Building },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
        ]
      : [
          { id: 'listings', label: 'My Listings', icon: LayoutDashboard },
          { id: 'add', label: 'Add New Property', icon: PlusCircle },
          { id: 'subscription', label: 'Pro Subscription', icon: CreditCard },
        ];

  const items = customNavItems || defaultNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName =
    user?.name ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    (role === 'ADMIN' ? 'Super Admin' : 'Pierre (Blocker)');

  const displaySubtitle =
    role === 'ADMIN'
      ? 'Administrator'
      : `Blocker · ${verificationCode || 'K7X2PM'}`;

  return (
    <Sidebar className="border-r border-brand-line border-b-2 border-[#1E4038] bg-[#0F2C26] text-[#CFE0D9]">
      {/* Sidebar Header: Centered, bolder text elements without any icon */}
      <SidebarHeader className="p-4 py-5 border-b border-[#1E4038] flex flex-col items-center justify-center text-center">
        <b className="text-white text-base sm:text-lg font-bold tracking-tight block text-center leading-snug">
          {displayName}
        </b>
        <span className="text-xs font-bold text-[#8FAF9F] mt-1 block text-center uppercase tracking-wider">
          {displaySubtitle}
        </span>
      </SidebarHeader>

      {/* Sidebar Content: Navigation Menu with button-colored background, reduced radius, white text & icons */}
      <SidebarContent className="p-3 space-y-2">
        <SidebarMenu className="gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full h-10 px-3 rounded-[6px] text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2.5 text-white ${
                    isActive
                      ? 'bg-brand-green shadow-xs ring-1 ring-white/20'
                      : 'bg-brand-green/85 hover:bg-brand-green hover:shadow-xs'
                  } [&_svg]:text-white`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0 text-white" />}
                  <span className="truncate text-white font-bold">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/25 text-white">
                      {item.badge}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer: Visible bottom border with Logout */}
      <SidebarFooter className="p-3 border-t border-[#1E4038] border-b-2 border-[#1E4038]">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full h-9 px-3 rounded-[6px] text-xs font-bold text-red-300 hover:text-white hover:bg-red-900/40 transition-colors cursor-pointer flex items-center gap-2 [&_svg]:text-red-300"
            >
              <LogOut className="w-4 h-4 text-red-300" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
