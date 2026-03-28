import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/sideBar'; 
import CandidateTable from '../components/recruiter/CandidateTable';
import CreateJobModal from '../components/recruiter/CreateJobModal';
import { 
  Users, Briefcase, Plus, 
  ChevronDown, Target, BarChart3, Clock, Bell, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API, { fetchMyJobs, getApplications } from '../services/api';



function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  
 
  const [stats, setStats] = useState({ totalCandidates: 0, avgMatchRate: 0, shortlistRate: 0 });
  

  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetchMyJobs();
      const jobList = response.data || [];
      setJobs(jobList);
      setSelectedJobId((prevId) => (!prevId && jobList.length > 0 ? jobList[0]._id : prevId));
    } catch (error) {
      toast.error("Failed to load active roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    const fetchStats = async () => {
     
      if (!selectedJobId) {
        setStats({ totalCandidates: 0, avgMatchRate: 0, shortlistRate: 0 });
        return;
      }
      try {
        const response = await API.get(`/applications/stats/${selectedJobId}`);
        const { total, shortlisted, avgScore } = response.data;
        
        let shortlistPercentage = 0;
        if (total > 0) {
          shortlistPercentage = Math.round((shortlisted / total) * 100);
        }

        setStats({
          totalCandidates: total || 0,
          avgMatchRate: avgScore || 0,
          shortlistRate: shortlistPercentage
        });
      } catch (error) {
        console.error("Failed to fetch job stats", error);
      }
      
    };
    fetchStats();
  }, [selectedJobId]);

  
  const getInsightMessage = () => {
    if (stats.totalCandidates === 0) {
      return "Your job post is live! Waiting for the first set of candidates to apply.";
    } else if (stats.avgMatchRate >= 70) {
      return `Strong Pipeline: ${stats.totalCandidates} applicants are averaging an excellent ${stats.avgMatchRate}% match. Start shortlisting top profiles today!`;
    } else if (stats.totalCandidates > 5 && stats.avgMatchRate < 50) {
      return `High volume (${stats.totalCandidates} applicants) but low fitment (${stats.avgMatchRate}% avg). Consider updating your Required Skills to filter better.`;
    } else {
      return `Steady flow: You have ${stats.totalCandidates} applicants averaging a ${stats.avgMatchRate}% match. Time to review the pipeline.`;
    }
  };
  

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        
        <RecruiterHeader 
          jobs={jobs}
          selectedJobId={selectedJobId}
          setSelectedJobId={setSelectedJobId}
          setIsModalOpen={setIsModalOpen}
        />

        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            
           
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Roles</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{jobs.length}</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase size={22} />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Applicants</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCandidates}</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={22} />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. AI Match</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgMatchRate}%</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target size={22} />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div>
                  <p className="text-sm text-gray-500 font-medium">System Status</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">Live</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                  <Clock size={22} />
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <Users size={18} className="text-blue-500" /> Applicant Pipeline
                  </h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                   {loading ? (
                     <div className="flex justify-center items-center h-64 text-gray-400 flex-col gap-3">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Loading Pipeline...</p>
                     </div>
                   ) : jobs.length === 0 ? (
                     <div className="flex justify-center items-center h-64 text-gray-400 flex-col gap-3">
                        <Briefcase size={32} className="text-gray-300"/>
                        <p className="text-sm font-medium">Create a role to see candidates</p>
                     </div>
                   ) : (
                     <CandidateTable jobId={selectedJobId} />
                   )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <BarChart3 size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">Recruiter Assistant</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Market Insight</p>
                    
                    <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                      "{getInsightMessage()}"
                    </p>
                    
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-5">Pipeline Health</h3>
                  <div className="space-y-4">
                     
                     <HealthMetric label="Shortlist Rate" value={`${stats.shortlistRate}%`} color="bg-blue-500 text-blue-700 bg-blue-50" />
                     <HealthMetric label="Total Evaluated" value={`${stats.totalCandidates}`} color="bg-green-500 text-green-700 bg-green-50" />
                     <HealthMetric label="Pipeline Status" value={stats.totalCandidates > 0 ? "Active" : "Waiting"} color="bg-purple-500 text-purple-700 bg-purple-50" />
                     
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onJobCreated={loadJobs} 
      />
    </div>
  );
}



const RecruiterHeader = ({ jobs, selectedJobId, setSelectedJobId, setIsModalOpen }) => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [user, setUser] = useState(null);

  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data || []);
      } catch {
        console.error("Notification fetch failed");
      }
    };
    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch {
        console.error("User fetch failed");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !bellRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileCard(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const formatNotification = (n) => {
    const msg = n.message.toLowerCase();
    if (msg.includes("interview")) {
      return { icon: "🎯", title: "Interview Update", subtitle: n.message, color: "bg-blue-50 border-blue-100" };
    }
    if (msg.includes("applied") || msg.includes("application")) {
      return { icon: "📄", title: "New Application", subtitle: n.message, color: "bg-green-50 border-green-100" };
    }
    return { icon: "🔔", title: "System Alert", subtitle: n.message, color: "bg-gray-50 border-gray-100" };
  };

  const formatTime = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return "Yesterday";
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 justify-between shrink-0 shadow-sm z-30 relative">
      
      <div>
        <h2 className="text-xl font-bold text-gray-800">Recruiter Dashboard</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Manage roles and analyze AI candidate fitment</p>
      </div>

      <div className="flex items-center gap-5">
        
        <div className="flex items-center gap-3">
          {jobs.length > 0 ? (
            <div className="relative group hidden md:block">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 hover:border-blue-300 transition-all cursor-pointer">
                <Briefcase size={16} className="text-blue-600 mr-2" />
                <select 
                  className="bg-transparent text-sm font-semibold text-gray-700 outline-none appearance-none pr-8 cursor-pointer"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 text-gray-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
              </div>
            </div>
          ) : (
             <div className="text-xs text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 hidden md:block">
               No active roles
             </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden lg:inline">Post New Role</span>
            <span className="inline lg:hidden">Post</span>
          </button>
        </div>

        <div className="hidden md:block w-px h-8 bg-gray-200 mx-1"></div>

        
        <div className="relative z-50">
          <div
            ref={bellRef}
            className="relative cursor-pointer active:scale-90 transition p-2 rounded-full hover:bg-gray-50"
            onClick={async (e) => {
              e.stopPropagation();
              if (!showDropdown) {
                try {
                  const res = await API.get("/notifications");
                  setNotifications(res.data || []);
                } catch { console.error("Refresh failed"); }
              }
              setShowDropdown(prev => !prev);
            }}
          >
            <Bell size={22} className={`text-gray-600 transition ${unreadCount > 0 ? "animate-bounce text-blue-600" : ""}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-[4px] flex items-center justify-center text-[10px] font-semibold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {showDropdown && (
            <div ref={dropdownRef} className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] p-2 animate-[fadeIn_0.2s_ease]">
              <div className="flex justify-between items-center px-3 py-2 border-b mb-2">
                <p className="text-sm font-semibold text-gray-800">Activity</p>
                {unreadCount > 0 && (
                  <span
                    onClick={async () => {
                      try {
                        await API.patch("/notifications/mark-all-read");
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      } catch { console.error("Mark all failed"); }
                    }}
                    className="text-xs text-blue-600 font-bold cursor-pointer hover:underline"
                  >
                    Mark all as read
                  </span>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-2xl">👀</p>
                    <p className="text-sm text-gray-600 mt-2 font-medium">All clear!</p>
                    <p className="text-xs text-gray-400 mt-1">No new recruiter alerts</p>
                  </div>
                ) : (
                  <>
                    {unreadNotifications.length > 0 && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 mt-1">New</p>}
                    {unreadNotifications.map((n) => {
                      const ui = formatNotification(n);
                      return (
                        <div
                          key={n._id}
                          onClick={async () => {
                            try {
                              await API.patch(`/notifications/${n._id}/read`);
                              setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item));
                              setShowDropdown(false);
                            } catch { console.error("Action failed"); }
                          }}
                          className={`p-3 mb-2 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] ${ui.color}`}
                        >
                          <div className="flex gap-3 items-start">
                            <div className="text-lg">{ui.icon}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 leading-snug">{ui.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{ui.subtitle}</p>
                              <p className="text-[10px] font-bold text-blue-500 mt-1">{n.createdAt ? formatTime(n.createdAt) : "Just now"}</p>
                            </div>
                            <span className="w-2 h-2 mt-1 bg-blue-500 rounded-full animate-pulse shrink-0"></span>
                          </div>
                        </div>
                      );
                    })}

                    {readNotifications.length > 0 && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mt-4 mb-2">Earlier</p>}
                    {readNotifications.map((n) => {
                      const ui = formatNotification(n);
                      return (
                        <div key={n._id} className="p-3 mb-2 rounded-xl border bg-gray-50/50 border-gray-100">
                          <div className="flex gap-3 items-start">
                            <div className="text-lg opacity-60">{ui.icon}</div>
                            <div className="flex-1 opacity-70">
                              <p className="text-sm font-semibold text-gray-800 leading-snug">{ui.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ui.subtitle}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-1">{n.createdAt ? formatTime(n.createdAt) : "Just now"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        
        <div ref={profileRef} className="relative flex items-center cursor-pointer">
          <div className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors" onClick={() => setShowProfileCard(prev => !prev)}>
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || "R"}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-bold text-gray-800 leading-none">{user?.name || "Recruiter"}</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Hiring Manager</span>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </div>

          {showProfileCard && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-[fadeIn_0.2s_ease]">
              <div className="px-5 py-4 border-b border-gray-50 mb-2 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xl font-black mb-2 shadow-inner">
                  {user?.name?.charAt(0).toUpperCase() || "R"}
                </div>
                <p className="text-sm font-bold text-gray-900 w-full truncate">{user?.name || "Recruiter"}</p>
                <p className="text-xs text-gray-500 font-medium w-full truncate">{user?.email || "recruiter@company.com"}</p>
                <span className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-3">
                  {user?.role || "Recruiter"}
                </span>
              </div>

              
              <button
                onClick={() => { setShowProfileCard(false); navigate("/recruiter-profile"); }}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <span className="text-base">⚙️</span> Account Settings
              </button>
              
              <button
                onClick={() => { 
                  setShowProfileCard(false); 
                  localStorage.clear(); 
                  navigate("/login"); 
                }}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50"
              >
                <span className="text-base">🚪</span> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

const HealthMetric = ({ label, value, color }) => (
  <div className="flex justify-between items-center p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
    <p className="text-xs font-semibold text-gray-500">{label}</p>
    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${color}`}>
      {value}
    </div>
  </div>
);

export default Dashboard;