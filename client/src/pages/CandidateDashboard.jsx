import React, { useEffect, useState, useRef } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/common/sideBar";
import API from "../services/api";
import { getInterview } from "../services/api";
import { Briefcase, CheckCircle, Clock, Calendar, Bell, Brain } from "lucide-react"; 
import { toast } from "react-hot-toast";



const CandidateDashboard = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [stats, setStats] = useState({
    applied: 0,
    interviews: 0,
    underReview: 0,
    aiScore: 0
  });

  const [selectedResume, setSelectedResume] = useState(null);
  const [resumeJobs, setResumeJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());


  if (!token) return <Navigate to="/login" />;
  if (role !== "candidate") return <Navigate to="/" />;

 

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [appsRes, resumeRes, userRes] = await Promise.all([
          API.get("/applications/my-applications"),
          API.get("/resume/my-resumes"),
          API.get("/auth/me")
        ]);

        const apps = appsRes?.data || [];
        const resumes = resumeRes?.data || [];
        setUserData(userRes.data);

        setAppliedJobIds(new Set(apps.map(app => app.jobId?._id || app.jobId)));

        
        let dynamicAiScore = userRes.data?.aiScore || 0;
        if (resumes.length > 0) {
          setSelectedResume(resumes[0]); 
          
          dynamicAiScore = resumes[0].aiScore || dynamicAiScore; 
        }

        
        const interviews = apps.filter(a => 
          ["Interview Scheduled", "Shortlisted", "Completed", "Interview Completed", "Selected", "Accepted"].includes(a.status) || a.interviewScore
        ).length;

        
        const underReview = apps.filter(a => 
          ["Under Review", "Applied", "Pending"].includes(a.status)
        ).length;

        
        setStats({
          applied: apps.length,
          interviews,
          underReview,
          aiScore: dynamicAiScore
        });

        setRecentApplications(apps.slice(0, 3));

      } catch (error) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);



  useEffect(() => {

    const loadResumeJobs = async () => {

      if (!selectedResume) return;

      try {
        const res = await API.get(`/resume/recommend-jobs/${selectedResume._id}`);
        setResumeJobs(res.data.slice(0, 3));
      } catch {
        console.error("Resume jobs error");
      }

    };

    loadResumeJobs();

  }, [selectedResume]);



  const handleResumeUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {

      setUploading(true);

      const res = await API.post("/resume/analyze", formData, {

        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("📄 UPLOADED RESUME RESPONSE:", res.data);

      toast.success("Resume analyzed");
      console.log("RES DATA:", res.data);

      setSelectedResume(res.data); 

    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }

  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  

  return (

    <div className="flex h-screen bg-gray-50">

      <Sidebar />

      <div className="flex flex-1">

       
        <main className="flex-1 p-6 overflow-y-auto">

          <Header />

          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Applied"
              value={stats.applied}
              icon={<Briefcase size={18} />}
              color="blue"
            />

            <StatCard
              title="AI Score"
              value={`${stats.aiScore}%`}
              icon={<CheckCircle size={18} />}
              color="green"
            />

            <StatCard
              title="Interviews"
              value={stats.interviews}
              icon={<Calendar size={18} />}
              color="purple"
            />

            <StatCard
              title="Review"
              value={stats.underReview}
              icon={<Clock size={18} />}
              color="yellow"
            />
          </div>

          
          <div className="flex items-center justify-between mt-6 mb-4">
            <SectionTitle title="AI Recommended Jobs" />
            <button 
              onClick={() => navigate("/explore")}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              View more
            </button>
          </div>

          {selectedResume ? (
            <JobGrid
              jobs={resumeJobs}
              userSkills={selectedResume?.skills || []}
              user={userData}
              loading={loading}
              appliedJobIds={appliedJobIds}
            />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center mb-8">
              <Brain size={40} className="mx-auto text-blue-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-800">Unlock AI Recommendations</h3>
              <p className="text-sm text-gray-500 mt-1">Upload your resume in the right panel to see jobs perfectly matched to your skills.</p>
            </div>
          )}

          
          <SectionTitle title="Recently Applied" />
          <RecentList
            apps={recentApplications}
            user={userData}
          />

        </main>

       
        <AiPanel
          resume={selectedResume}
          uploading={uploading}
          onUpload={handleResumeUpload}
        />

      </div>

    </div>
  );
};



const Header = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [user, setUser] = useState(null);

  const bellRef = useRef(null);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null); 

  const handleSearch = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/jobs?search=${query}`);
    }
  };

  

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !bellRef.current.contains(e.target)
      ) {
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
      return {
        icon: "🎯",
        title: "Interview Scheduled!",
        subtitle: "Best of luck! You're one step closer 🚀",
        color: "bg-green-50 border-green-100"
      };
    }

    if (msg.includes("review")) {
      return {
        icon: "📄",
        title: "Application Under Review",
        subtitle: "Hang tight, updates coming soon 👀",
        color: "bg-blue-50 border-blue-100"
      };
    }

    return {
      icon: "🔔",
      title: n.message,
      subtitle: "",
      color: "bg-gray-50"
    };
  };

  const formatTime = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

    return "Yesterday";
  };

  return (
    <div className="sticky top-0 z-20 mb-6">
      <div className="flex justify-between items-center bg-white px-6 py-3 rounded-xl shadow-md border">

        
        <div className="flex items-center gap-2 w-1/2 bg-gray-100 px-3 py-2 rounded-lg">
          <span className="text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search jobs, skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        
        <div className="flex items-center gap-6">

          
          <div className="absolute -top-1 -right-1 z-50">

            <div
              ref={bellRef}
              className="relative cursor-pointer active:scale-90 transition"
              onClick={async (e) => {
                e.stopPropagation();

                
                if (!showDropdown) {
                  try {
                    const res = await API.get("/notifications");
                    setNotifications(res.data || []);
                  } catch {
                    console.error("Refresh failed");
                  }
                }

                setShowDropdown(prev => !prev);
              }}
            >
              <Bell
                size={22}
                className={`text-gray-700 transition ${unreadCount > 0 ? "animate-bounce text-blue-600" : ""
                  }`}
              />

              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-[4px] 
                                   flex items-center justify-center text-[10px] font-semibold 
                                     bg-red-500 text-white rounded-full">

                  {unreadCount > 9 ? "9+" : unreadCount}

                </span>
              )}
            </div>

            
            {showDropdown && (
              <div

                ref={dropdownRef}
                className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 
rounded-xl shadow-xl z-[9999] p-2
animate-[fadeIn_0.2s_ease]"
              >
                <div className="flex justify-between items-center px-3 py-2 border-b mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Notifications
                  </p>

                  {unreadCount > 0 && (
                    <span
                      onClick={async () => {
                        try {
                          await API.patch("/notifications/mark-all-read");

                          
                          setNotifications(prev =>
                            prev.map(n => ({ ...n, read: true }))
                          );

                        } catch {
                          console.error("Mark all failed");
                        }
                      }}
                      className="text-xs text-blue-500 font-medium cursor-pointer hover:underline"
                    >
                      Mark all as read
                    </span>
                  )}
                </div>



                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400">
                    <div className="p-6 text-center">
                      <p className="text-2xl">🎉</p>
                      <p className="text-sm text-gray-600 mt-2 font-medium">
                        All caught up!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        No new notifications right now
                      </p>
                    </div>
                  </p>
                ) : (
                  <>
                   
                    {unreadNotifications.length > 0 && (
                      <p className="text-xs text-gray-400 px-2 mb-1">NEW</p>
                    )}

                    {unreadNotifications.map((n) => {
                      const ui = formatNotification(n);

                      return (
                        <div
                          key={n._id}
                          onClick={async () => {
                            try {
                              await API.patch(`/notifications/${n._id}/read`);

                              setNotifications(prev =>
                                prev.map(item =>
                                  item._id === n._id
                                    ? { ...item, read: true }
                                    : item
                                )
                              );

                              setShowDropdown(false);
                            } catch {
                              console.error("Action failed");
                            }
                          }}
                          className={`p-3 mb-2 rounded-xl border cursor-pointer transition-all duration-200
                            hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
                            ${!n.read ? ui.color : "bg-white border-gray-100"}`}
                        >
                          <div className="flex gap-3 items-start">

                            <div className="text-lg">{ui.icon}</div>

                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {ui.title}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                {ui.subtitle}
                              </p>

                              <p className="text-[10px] text-gray-400 mt-1">
                                {n.createdAt ? formatTime(n.createdAt) : "Just now"}
                              </p>
                            </div>

                            {!n.read && (
                              <span className="w-2 h-2 mt-1 bg-blue-500 rounded-full animate-pulse"></span>
                            )}

                          </div>
                        </div>
                      );
                    })}

                    
                    {readNotifications.length > 0 && (
                      <p className="text-xs text-gray-400 px-2 mt-3 mb-1">EARLIER</p>
                    )}

                    {readNotifications.map((n) => {
                      const ui = formatNotification(n);

                      return (
                        <div
                          key={n._id}
                          className="p-3 mb-2 rounded-xl border bg-white border-gray-100"
                        >
                          <div className="flex gap-3 items-start">

                            <div className="text-lg">{ui.icon}</div>

                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {ui.title}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                {ui.subtitle}
                              </p>

                              <p className="text-[10px] text-gray-400 mt-1">
                                {n.createdAt ? formatTime(n.createdAt) : "Just now"}
                              </p>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          
          <div
            ref={profileRef}
            className="relative flex items-center gap-2 cursor-pointer profile-section pl-12"
          >
            <div
              className="flex items-center gap-2"
              onClick={() => setShowProfileCard(prev => !prev)}
            >
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow">
                {user?.name?.charAt(0) || "U"}
              </div>

              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold text-gray-700 leading-none">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  Verified Account
                </span>
              </div>
            </div>

            
            {showProfileCard && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-[fadeIn_0.2s_ease]">
                <div className="px-5 py-4 border-b border-gray-50 mb-2 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-black mb-2">
                    {user?.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <p className="text-sm font-bold text-gray-800 w-full truncate">{user?.email || "candidate@email.com"}</p>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-2">
                    {user?.role === "candidate" ? "Job Seeker" : "User"}
                  </span>
                </div>

                <button
                  onClick={() => { setShowProfileCard(false); navigate("/profile"); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <span className="text-base">👤</span> My Profile
                </button>


              </div>

            )}
          </div>

        </div>
      </div>
    </div>
  );
};





const AiPanel = ({ resume, uploading, onUpload }) => {
  const [open, setOpen] = useState(null);

  
  const aiScore = resume?.aiScore || 0;
  const confidenceScore = resume?.confidenceScore || 0;
  const marketLevel = resume?.marketLevel || "beginner";
  const mindsetBoost = resume?.mindsetBoost || "";
  const careerStrategy = resume?.careerStrategy || null;

  const safeInsights = {
    strengths: resume?.insights?.strengths || [],
    missingSkills: resume?.insights?.missingSkills || [],
    suggestions: resume?.insights?.suggestions || []
  };

  const currentData =
    open === "s" ? safeInsights.strengths
      : open === "m" ? safeInsights.missingSkills
        : open === "i" ? safeInsights.suggestions
          : [];

  const groupByCategory = (items = []) => {
    return items.reduce((acc, item) => {
      const cat = item.category ? item.category.toLowerCase() : "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  };

  const groupedData = groupByCategory(currentData);

  useEffect(() => {
    setOpen(null);
  }, [resume]);

  return (
    
    <div className="w-[340px] bg-white border-l p-5 h-screen sticky top-0 overflow-y-auto shadow-lg pb-24 z-40">

      <h2 className="font-bold text-lg mb-4 text-gray-800">✨ AI Career Coach</h2>

      
      {mindsetBoost && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Mentor Note</p>
          <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
            "{mindsetBoost}"
          </p>
        </div>
      )}

      
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Profile Score</p>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${marketLevel === 'top-tier' ? 'bg-purple-100 text-purple-700' :
              marketLevel === 'job-ready' ? 'bg-green-100 text-green-700' :
                marketLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
            }`}>
            {marketLevel.replace("-", " ")}
          </span>
        </div>

        <div className="flex items-end gap-3 mb-2">
          <h3 className="text-3xl font-extrabold text-gray-800">
            <span className="transition-all duration-700">{aiScore}</span><span className="text-lg text-gray-400">/100</span>
          </h3>
        </div>

        
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-medium">
            <span>Interview Confidence</span>
            <span>{confidenceScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${confidenceScore > 75 ? "bg-blue-500" : confidenceScore > 50 ? "bg-blue-400" : "bg-blue-300"
                }`}
              style={{ width: `${confidenceScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      
      <div className="mb-4">
        <label
          className={`block w-full border-2 border-dashed text-center py-4 rounded-xl transition ${uploading ? "bg-gray-100 border-gray-200 cursor-not-allowed" : "border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer"
            }`}
        >
          <p className="text-sm font-semibold text-blue-700">
            {uploading ? "Analyzing resume..." : "Update Resume"}
          </p>
          <input type="file" accept=".pdf" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      </div>

     
      {resume ? (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-5">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg shrink-0">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-700 truncate">
              {resume.fileName || "Resume.pdf"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : "Recently updated"}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-400 mb-5 border border-dashed rounded-xl p-3">
          No resume uploaded yet
        </div>
      )}

      {resume && <div className="border-t border-gray-200 mb-4"></div>}

      
      {resume && (
        <div className="space-y-3">
          <div onClick={() => setOpen("s")} className="p-3 bg-green-50 border border-green-100 rounded-xl cursor-pointer hover:shadow-md transition flex justify-between items-center group">
            <p className="text-sm font-semibold text-green-700 group-hover:translate-x-1 transition-transform">Strengths</p>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{safeInsights.strengths.length}</span>
          </div>

          <div onClick={() => setOpen("m")} className="p-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:shadow-md transition flex justify-between items-center group">
            <p className="text-sm font-semibold text-red-600 group-hover:translate-x-1 transition-transform">Missing Skills</p>
            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{safeInsights.missingSkills.length}</span>
          </div>

          <div onClick={() => setOpen("i")} className="p-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:shadow-md transition flex justify-between items-center group">
            <p className="text-sm font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">Suggestions</p>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{safeInsights.suggestions.length}</span>
          </div>

          
          {careerStrategy?.shortTerm && (
            <div onClick={() => setOpen("c")} className="p-3 bg-purple-50 border border-purple-100 rounded-xl cursor-pointer hover:shadow-md transition flex justify-between items-center group">
              <p className="text-sm font-semibold text-purple-700 group-hover:translate-x-1 transition-transform">Career Strategy</p>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-medium">Roadmap</span>
            </div>
          )}
        </div>
      )}

      
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setOpen(null)}>
          <div className="bg-white w-[550px] max-w-[95%] max-h-[85vh] overflow-y-auto pr-2 rounded-3xl p-8 shadow-2xl relative animate-[scaleIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>

            <button onClick={() => setOpen(null)} className="absolute top-5 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>

            
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <span className={`text-3xl ${open === "s" ? "text-green-500" : open === "m" ? "text-red-500" : open === "i" ? "text-blue-500" : "text-purple-500"}`}>
                {open === "s" ? "💪" : open === "m" ? "❌" : open === "i" ? "🚀" : "🗺️"}
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">
                  {open === "s" && "Your Core Strengths"}
                  {open === "m" && "Critical Missing Skills"}
                  {open === "i" && "Actionable Suggestions"}
                  {open === "c" && "Your Career Roadmap"}
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {open === "c" ? "Step-by-step strategy to level up" : "Deep analysis based on your latest resume"}
                </p>
              </div>
            </div>

            
            {open === "c" ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">

                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    1
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-blue-100 bg-blue-50 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-blue-800 text-sm">Phase 1: Short Term</div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">Next 30 Days</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed mt-2">{careerStrategy?.shortTerm}</div>
                  </div>
                </div>

               
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    2
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-purple-100 bg-purple-50 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-purple-800 text-sm">Phase 2: Mid Term</div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded uppercase">3-6 Months</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed mt-2">{careerStrategy?.midTerm}</div>
                  </div>
                </div>

                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    3
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-green-100 bg-green-50 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-green-800 text-sm">Phase 3: Long Term</div>
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded uppercase">The Goal</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed mt-2">{careerStrategy?.longTerm}</div>
                  </div>
                </div>

              </div>
            ) : (
              
              <div className="space-y-6">
                {Object.keys(groupedData).length > 0 ? (
                  Object.entries(groupedData).map(([category, items]) => (
                    <div key={category} className="mb-6">
                      <p className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest border-l-4 border-gray-300 pl-3">
                        {category}
                      </p>
                      <div className="space-y-4">
                        {items.map((item, i) => (
                          <div key={i} className={`p-5 rounded-2xl border ${open === "s" ? "bg-green-50/30 border-green-200" :
                              open === "m" ? "bg-red-50/30 border-red-200" :
                                "bg-blue-50/30 border-blue-200"
                            }`}>
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-bold text-gray-900 text-base leading-snug">{item.label}</h4>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest ml-2 shrink-0 ${item.impact === "high" || item.priority === "high" ? "bg-red-100 text-red-700 border border-red-200" :
                                  item.impact === "medium" || item.priority === "medium" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                    "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}>
                                {item.impact || item.priority || "Medium"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                              {item.reasoning || "Context not provided for this insight."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-4xl mb-4">😅</p>
                    <p className="text-gray-500 font-medium">No insights available in this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



const Dropdown = ({ title, data, open, setOpen, color = "blue" }) => {

  const colorMap = {
    green: "text-green-600",
    red: "text-red-500",
    blue: "text-blue-600"
  };

  return (
    <div className="border rounded-lg overflow-hidden">

      
      <div
        onClick={setOpen}
        className="flex justify-between items-center px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
      >
        <span className={`text-sm font-semibold ${colorMap[color]}`}>
          {title}
        </span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </div>

      
      <div className={`px-3 overflow-hidden transition-all duration-300 
          ${open ? "max-h-40 py-2" : "max-h-0"}`}>

        <div className="text-xs text-gray-600 space-y-1">
          {data.length > 0 ? (
            data.map((item, i) => <p key={i}>• {item.label}</p>)
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>

      </div>

    </div>
  );
};







const JobGrid = ({ jobs, userSkills = [], user = {}, loading, appliedJobIds = new Set() }) => {

  const [savedJobs, setSavedJobs] = useState([]);
  const [hiddenJobs, setHiddenJobs] = useState(() => {
    
    const savedHidden = localStorage.getItem("hiddenJobs");
    return savedHidden ? JSON.parse(savedHidden) : [];
  });

  
  useEffect(() => {
    localStorage.setItem("hiddenJobs", JSON.stringify(hiddenJobs));
  }, [hiddenJobs]);
  const [selectedJob, setSelectedJob] = useState(null);

  const navigate = useNavigate();

  
  useEffect(() => {
    if (user?.savedJobs) {
      
      const savedIds = user.savedJobs.map(job => typeof job === 'object' ? job._id : job);
      setSavedJobs(savedIds);
    }
  }, [user]);

  const getColor = (score) => {
    if (score > 75) return "text-green-600";
    if (score > 50) return "text-yellow-500";
    return "text-red-400";
  };

 
  const handleSave = async (jobId) => {
    
    const isCurrentlySaved = savedJobs.includes(jobId);
    setSavedJobs(prev => isCurrentlySaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);

    try {
      
      const res = await API.patch(`/users/save/${jobId}`);

      if (res.data.saved) {
        toast.success("Job Saved to Profile! ⭐");
      } else {
        toast.success("Removed from Saved Jobs");
      }
    } catch (error) {
      console.error("Save Error:", error);
      
      setSavedJobs(prev => isCurrentlySaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
      toast.error("Failed to save job");
    }
  };

  const handleHide = (jobId) => setHiddenJobs(prev => prev.includes(jobId) ? prev : [...prev, jobId]);

  const getExplanation = (jobSkills = [], matchedSkills = []) => {
    const missing = jobSkills.filter(skill => !matchedSkills.includes(skill));
    return {
      matchedCount: matchedSkills.length,
      total: jobSkills.length,
      missingSkills: missing.slice(0, 3)
    };
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm mb-2">No perfect matches yet!</p>
        <p className="text-gray-400 text-xs">Try improving your resume or adding more skills </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {jobs
          .filter(job => !hiddenJobs.includes(job._id))
          .map(job => {

            const matchedSkills = job.matchedSkills || [];
            const topSkills = matchedSkills.slice(0, 3);
            const skillScore = job.skillScore || 0;

            const isSaved = savedJobs.includes(job._id);
            const isApplied = appliedJobIds.has(job._id);

            return (
              <div
                key={job._id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-2 hover:border-blue-200 transition-all duration-200 flex flex-col"
              >

                <div className="flex justify-between items-start mb-3">
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug">
                      {job.title}
                    </h3>
                    
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      🏢 {job.companyName || "Not Specified"}
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full shrink-0">
                    {job.matchPercentage > 0 ? `${job.matchPercentage}% Match` : "AI Match"}
                  </span>
                </div>

                
                <p className="text-xs text-gray-500 mb-3">
                  📍 {job.location || "Remote"} {job.workplaceType ? `(${job.workplaceType})` : ""}
                </p>

                <div className="mb-3">
                  <p className="text-xs text-gray-600 font-medium mb-1">Matched because:</p>
                  {matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topSkills.map((skill, index) => (
                        <span key={index} className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full">
                          ✔ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">Few exact skills matched — check details</p>
                  )}
                </div>

                <div className="mb-3 space-y-1">
                  <p className={`text-[10px] font-bold ${getColor(skillScore)}`}>
                    ✔ Skills: {skillScore}% Match
                  </p>
                  <p className="text-[10px] font-bold text-gray-600">
                    ✔ Exp: {job.experienceRequired ? `${job.experienceRequired} Years` : "Fresher / Not Disclosed"}
                  </p>
                  <p className="text-[10px] font-bold text-gray-600">
                    ✔ Salary: {job.salary || "Not Disclosed"}
                  </p>
                </div>

                <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                  {job.description || "Good opportunity based on your profile"}
                </p>

                <div className="flex flex-wrap justify-between items-center gap-2 border-t border-gray-100 pt-4 mt-auto">

                  <button
                    disabled={isApplied}
                    onClick={() => navigate(`/job/${job._id}`)}
                    className={`text-sm font-semibold transition-all px-4 py-2 rounded-lg ${isApplied
                        ? "bg-green-50 text-green-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                  >
                    {isApplied ? "Applied ✅" : "View Details "}
                  </button>

                  
                  <button
                    onClick={() => handleSave(job._id)}
                    className={`text-xs transition hover:scale-105 ${isSaved ? "text-yellow-500 font-bold bg-yellow-50 px-3 py-1.5 rounded-md" : "text-gray-400 hover:text-gray-600 px-3 py-1.5"
                      }`}
                  >
                    {isSaved ? "Saved ⭐" : "Save ⭐"}
                  </button>

                </div>

                <div className="flex justify-between w-full mt-3">
                  <button onClick={() => handleHide(job._id)} className="text-[10px] font-semibold text-red-400 hover:text-red-600 transition hover:scale-105">
                    Not Interested ❌
                  </button>
                  <button onClick={() => setSelectedJob(job)} className="text-[10px] font-bold text-purple-600 hover:underline">
                    Why recommended?
                  </button>
                </div>

              </div>
            );
          })}
      </div>

      
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setSelectedJob(null)}>
          <div className="bg-white w-[320px] rounded-xl p-5 shadow-xl relative animate-[scaleIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedJob(null)} className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-sm">✕</button>
            <h2 className="text-sm font-semibold mb-3 text-gray-800">Why this job?</h2>

            {(() => {
              const exp = getExplanation(selectedJob.requiredSkills || [], selectedJob.matchedSkills || []);
              return (
                <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
                  <p className="text-green-600 font-bold">You match {exp.matchedCount}/{exp.total} key skills</p>
                  {exp.missingSkills.length > 0 && <p className="text-red-500 font-medium"> Missing: {exp.missingSkills.join(", ")}</p>}
                  <p className="text-blue-500 font-medium">Improve: Add more relevant projects or skills</p>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </>
  );
};






const JobCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm animate-pulse">

      
      <div className="h-3 w-2/3 skeleton rounded"></div>

      
      <div className="h-2 w-1/3 skeleton rounded mb-4"></div>

      
      <div className="flex gap-2 mb-3">
        <div className="h-2 w-10 skeleton rounded"></div>
        <div className="h-2 w-10 skeleton rounded"></div>
        <div className="h-2 w-10 skeleton rounded"></div>
      </div>

      
      <div className="space-y-2 mb-4">
        <div className="h-2 w-1/2 skeleton rounded"></div>
        <div className="h-2 w-1/3 skeleton rounded"></div>
        <div className="h-2 w-1/4 skeleton rounded"></div>
      </div>

      
      <div className="flex justify-between mt-4">
        <div className="h-3 w-16 skeleton rounded"></div>
        <div className="h-3 w-12 skeleton rounded"></div>
      </div>

    </div>
  );
};




const SmartInterviewButton = ({ jobId }) => {
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await getInterview(jobId);
        if (data) setInterviewData(data);
      } catch (error) {
        
        console.error("Failed to fetch interview status:", error);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchStatus();
  }, [jobId]);

  if (loading) {
    return <div className="animate-pulse h-6 w-24 bg-gray-200 rounded-md"></div>;
  }

 
  const isCompleted = interviewData?.status === "Completed" || interviewData?.score !== undefined;

  return (
    <Link
      to={`/interview/${jobId}`}
      className={`px-3 py-1.5 rounded-md font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 ${
        isCompleted
          ? "bg-emerald-500 text-white"
          : "bg-indigo-600 text-white animate-pulse"
      }`}
    >
      
      {isCompleted
        ? `View Report (${interviewData?.score || 0}%)`
        : "Take AI Interview"}
    </Link>
  );
};


const RecentList = ({ apps }) => {
  const navigate = useNavigate();

  
  if (!apps || apps.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-500 mb-2">
          You haven’t applied to any jobs yet 
        </p>
        <p className="text-xs text-gray-400">
          Start applying to track your progress 
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apps.map(app => {
        const job = app.jobId || {};
        const isDeleted = !job.title;

        
        const shouldShowInterviewButton = 
          app.status === "Shortlisted" ||
          app.status === "Interview Scheduled" ||
          app.status === "Completed" ||
          app.status === "Interview Completed" ||
          app.status === "Selected" ||
          app.status === "Accepted";

        return (
          <div
            key={app._id}
            onClick={() => !isDeleted && navigate(`/job/${job._id}`)}
            className={`relative bg-white border border-gray-100 rounded-2xl p-5 pl-8 shadow-sm 
                       hover:shadow-md hover:-translate-y-1 hover:border-blue-200 
                       transition-all duration-200 group
                       ${isDeleted ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
          >

            
            <div
              className={`absolute left-3 top-6 w-2.5 h-2.5 rounded-full 
              ${app.status === "Accepted" || app.status === "Selected"
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                  : app.status === "Rejected"
                    ? "bg-red-500"
                    : app.status === "Interview Scheduled" || app.status === "Shortlisted"
                      ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                }`}
            ></div>

            
            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
              <div className="flex items-start gap-3">
                <div>
                  <p className="font-bold text-gray-800 text-[15px] group-hover:text-blue-600 transition-colors">
                    {isDeleted ? "Job No Longer Available" : job.title}
                  </p>

                  
                  {!isDeleted && (
                    <p className="text-[13px] text-gray-600 font-semibold mt-0.5">
                      🏢 {job.companyName || "Not Specified"}
                    </p>
                  )}

                  
                  {!isDeleted && (
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      📍 {job.location || "Remote"} {job.workplaceType ? `(${job.workplaceType})` : ""}
                    </p>
                  )}
                </div>

                {!isDeleted && (
                  <span className="ml-2 text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full">
                    {app.fitmentScore ? `${app.fitmentScore}% Match` : "AI Ranked"}
                  </span>
                )}
              </div>

              <StatusBadge status={app.status} />
            </div>

           
            <div className="flex justify-between items-center mt-4">
              <p className="text-[11px] font-medium text-gray-400">
                📅 Applied on {new Date(app.createdAt).toLocaleDateString()}
              </p>

              
              {!isDeleted && (
                <div className="flex items-center gap-4">
                  
                  
                  {shouldShowInterviewButton && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <SmartInterviewButton jobId={job._id || job} />
                    </div>
                  )}

                  <div className="text-xs font-bold text-blue-600 group-hover:underline flex items-center gap-1 transition-all">
                    View Details →
                  </div>
                </div>
              )}
            </div>

            
            <div className="mt-4 pt-1 border-t border-gray-50">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out
                  ${app.status === "Accepted" || app.status === "Selected"
                      ? "w-full bg-green-500"
                      : app.status === "Interview Scheduled" || app.status === "Shortlisted"
                        ? "w-[75%] bg-blue-500"
                        : app.status === "Under Review"
                          ? "w-[40%] bg-yellow-500"
                          : app.status === "Rejected"
                            ? "w-[100%] bg-red-400"
                            : "w-[20%] bg-gray-400"
                    }`}
                ></div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};



const StatCard = ({ title, value, icon, color = "blue" }) => {

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600"
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between shadow-sm 
    hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 cursor-pointer">

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">
          {value}
        </p>
      </div>

      <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colorMap[color]}`}>
        {icon}
      </div>

    </div>
  );
};

const SectionTitle = ({ title }) => (
  <h2 className="text-lg font-semibold text-gray-800 mb-4 mt-6">
    {title}
  </h2>
);

const StatusBadge = ({ status }) => {

  const getStatusConfig = (status) => {

    switch (status) {

      case "Under Review":
        return {
          text: "Under Review",
          icon: "🟡",
          style: "bg-yellow-50 text-yellow-700 border border-yellow-200"
        };

      case "Interview Scheduled":
        return {
          text: "Interview",
          icon: "🔵",
          style: "bg-blue-50 text-blue-700 border border-blue-200"
        };

      case "Accepted":
        return {
          text: "Selected",
          icon: "🟢",
          style: "bg-green-50 text-green-700 border border-green-200"
        };

      case "Rejected":
        return {
          text: "Rejected",
          icon: "🔴",
          style: "bg-red-50 text-red-700 border border-red-200"
        };

      default:
        return {
          text: status,
          icon: "⚪",
          style: "bg-gray-100 text-gray-600"
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full ${config.style} transition-transform duration-200 hover:scale-105`}
    >
      <span>{config.icon}</span>
      {config.text}
    </span>
  );
};

export default CandidateDashboard;