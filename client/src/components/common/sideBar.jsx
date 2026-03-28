import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Search
} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';



const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group
      ${
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
      }
    `}
  >
    
    {active && (
      <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full"></div>
    )}

    
    <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition ${
      active ? "bg-blue-100" : "group-hover:bg-slate-100"
    }`}>
      <Icon size={18} />
    </div>

   
    <span className="font-medium text-sm tracking-wide">
      {label}
    </span>
  </div>
);



const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const isDashboardActive =
    location.pathname === '/admin' || location.pathname === '/dashboard';

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col p-4 shadow-sm">

      <div className="flex items-center gap-3 px-2 mb-10">

        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">S</span>
        </div>

        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Smart<span className="text-blue-600">Recruit</span>
        </h1>

      </div>

      
      <nav className="flex flex-col gap-2 flex-1">

        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={isDashboardActive}
          onClick={() => {
            if (role === 'recruiter') navigate('/admin');
            else navigate('/dashboard');
          }}
        />

        {role === 'recruiter' && (
          <>
            <SidebarItem
              icon={Briefcase}
              label="Jobs"
              active={location.pathname === '/jobs'}
              onClick={() => navigate('/jobs')}
            />

            <SidebarItem
              icon={Users}
              label="Candidates"
              active={location.pathname.startsWith('/recruiter/candidates')}
              onClick={() => navigate('/recruiter/candidates')}
            />

            <SidebarItem
              icon={UserCheck}
              label="AI Ranking"
              active={location.pathname.startsWith('/recruiter/ai-ranking')}
              onClick={() => navigate('/recruiter/ai-ranking')}
            />

            <SidebarItem
              icon={BarChart3}
              label="Analytics"
              active={location.pathname.startsWith('/recruiter/analytics')}
              onClick={() => navigate('/recruiter/analytics')}
            />
          </>
        )}

        {role === 'candidate' && (
          <>
            <SidebarItem
              icon={Search}
              label="Browse Jobs"
              active={location.pathname === '/explore'}
              onClick={() => navigate('/explore')}
            />

            <SidebarItem
              icon={Briefcase}
              label="My Applications"
              active={location.pathname === '/my-applications'}
              onClick={() => navigate('/my-applications')}
            />
          </>
        )}

      </nav>

      
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">

        
        <SidebarItem
          icon={Settings}
          label="Settings"
          onClick={() => {
            const role = localStorage.getItem("role");
            if (role === "recruiter") {
              navigate('/recruiter/settings');
            } else {
              navigate('/settings'); 
            }
          }}
        />

        <SidebarItem
          icon={LogOut}
          label="Logout"
          onClick={handleLogout}
        />

      </div>

    </div>
  );
};

export default Sidebar;