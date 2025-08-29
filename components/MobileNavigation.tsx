import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon, 
  HomeIcon, 
  UserIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsOpen: () => void;
  onInsightsOpen: () => void;
}

export default function MobileNavigation({ 
  activeTab, 
  onTabChange, 
  onSettingsOpen, 
  onInsightsOpen 
}: MobileNavigationProps) {
  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: ChatBubbleLeftRightIcon,
      action: () => onTabChange('chat')
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: ChartBarIcon,
      action: () => onInsightsOpen()
    },
    {
      id: 'diary',
      label: 'Diary',
      icon: BookOpenIcon,
      action: () => onTabChange('diary')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      action: () => onSettingsOpen()
    }
  ];

  return (
    <nav className="nav-mobile">
      <div className="flex items-center justify-around px-4 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'text-[#FFAB40] bg-white/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
