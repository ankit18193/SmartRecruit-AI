import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/sideBar";
import API from "../../services/api";
import { toast } from "react-hot-toast";
import { 
  User, Mail, MapPin, Phone, Briefcase, 
  Settings, Save, Loader2, Camera, X, Bookmark
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isEditing, setIsEditing] = useState(false);
  
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    phone: "",
    skills: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      
      const [userRes, jobsRes] = await Promise.all([
        API.get("/users/me"),
        API.get("/jobs")
      ]);

      const userData = userRes.data;
      const rawJobs = jobsRes.data;
      
      
      const allJobs = Array.isArray(rawJobs) ? rawJobs : (rawJobs?.jobs || rawJobs?.data || []);

      
      if (userData.savedJobs && userData.savedJobs.length > 0) {
        const mappedJobs = userData.savedJobs.map(item => {
          
          const id = typeof item === 'string' ? item : item._id;
          
          
          const foundJob = allJobs.find(j => j._id === id);
          
          
          return foundJob || (typeof item === 'object' && item.title ? item : {
            _id: id,
            title: "Saved Job",
            location: "Remote",
            description: "Details are still syncing with the server..."
          });
        });
        
        
        userData.savedJobs = mappedJobs;
      }

      setUser(userData);
      setFormData({
        name: userData.name || "",
        bio: userData.bio || "",
        location: userData.location || "",
        phone: userData.phone || "",
        skills: userData.skills?.join(", ") || ""
      });
      
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        skills: formData.skills.split(",").map(s => s.trim()).filter(s => s !== "")
      };
      await API.put("/users/update", updatedData);
      toast.success("Profile updated successfully ✨");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  
  const handleRemoveSavedJob = async (jobId) => {
    try {
      await API.patch(`/users/save/${jobId}`);
      setUser(prev => ({
        ...prev,
        savedJobs: prev.savedJobs.filter(job => job._id !== jobId)
      }));
      toast.success("Job removed from saved list");
    } catch (error) {
      toast.error("Failed to remove job");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
     
      <Sidebar />

      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        
        <div className="flex-1 overflow-y-auto">
          
          
          <div className="h-48 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 relative w-full">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          </div>

          <div className="max-w-5xl mx-auto px-8 sm:px-12 -mt-16 relative z-10 pb-12">
            
            
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-4xl font-black text-blue-600 overflow-hidden">
                    {user?.profilePicture ? (
                       <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       user?.name?.charAt(0).toUpperCase() || "C"
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 shadow-sm transition-all hover:scale-105">
                    <Camera size={16} />
                  </button>
                </div>

                
                <div className="text-center sm:text-left mt-2">
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user?.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm font-semibold text-gray-500">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs">
                      <Briefcase size={14} /> Job Seeker
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                      <MapPin size={14} /> {user?.location || "Remote"}
                    </span>
                  </div>
                </div>
              </div>

              
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm border ${
                  isEditing 
                  ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" 
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {isEditing ? <><X size={16} /> Cancel</> : <><Settings size={16} /> Edit Profile</>}
              </button>
            </div>

            
            <div className="flex gap-8 border-b border-gray-200 mb-8 px-4">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Overview
                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />}
              </button>
              <button 
                onClick={() => setActiveTab("saved")}
                className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'saved' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Saved Jobs <span className="text-yellow-400">⭐</span>
                {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />}
              </button>
            </div>

            
            <div className="animate-[fadeIn_0.3s_ease]">
              {activeTab === "overview" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <div className="lg:col-span-2 space-y-6">
                    {isEditing ? (
                      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">Edit Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Bangalore, Remote" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Key Skills (Comma Separated)</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} placeholder="e.g. React, Node.js" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Professional Bio</label>
                          <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="Tell recruiters about your passion..." />
                        </div>
                        <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                          <Save size={18} /> Save Changes
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                            <User size={18} /> About Me
                          </h4>
                          <p className="text-gray-600 leading-relaxed text-sm font-medium">
                            {user?.bio || "No bio added yet. Click 'Edit Profile' to stand out! "}
                          </p>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 mb-5">
                            <Briefcase size={18} /> Skills & Expertise
                          </h4>
                          <div className="flex flex-wrap gap-2.5">
                            {user?.skills?.length > 0 ? (
                              user.skills.map((skill, i) => (
                                <span key={i} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-xs font-bold border border-blue-100 transition-transform hover:-translate-y-0.5 cursor-default">{skill}</span>
                              ))
                            ) : (
                              <p className="text-sm text-gray-400 italic">No skills added yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  <div className="space-y-6">
                     <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-5 border-b border-gray-50 pb-4">Contact Info</h4>
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Mail size={18}/></div>
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0"><Phone size={18}/></div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phone</p>
                              <p className="text-sm font-semibold text-gray-800">{user?.phone || "Not provided"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><MapPin size={18}/></div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Location</p>
                              <p className="text-sm font-semibold text-gray-800">{user?.location || "Remote"}</p>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                
                <div className="space-y-6">
                  {user?.savedJobs?.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {user.savedJobs.map(job => (
                        <div key={job._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col relative">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors leading-snug">{job.title}</h3>
                              <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                                <MapPin size={12} /> {job.location || "Remote"}
                              </p>
                            </div>
                            <button onClick={() => handleRemoveSavedJob(job._id)} className="text-yellow-400 hover:text-gray-300 transition-colors p-1" title="Remove from saved">
                              <Bookmark size={22} className="fill-current" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-100 uppercase tracking-wide">
                              {job.experienceRequired ? `${job.experienceRequired} Yrs` : "Entry Level"}
                            </span>
                            <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-100 uppercase tracking-wide">
                              {job.salary || "Not Disclosed"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                            {job.description || "Excellent opportunity matching your profile."}
                          </p>
                          
  <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // 🔥 FIX: Ensures we get the correct ID, whether it's an object or a string
                              const correctJobId = typeof job === 'object' && job._id ? job._id : job;
                              if (correctJobId) {
                                navigate(`/job/${correctJobId}`);
                              } else {
                                toast.error("Job ID not found");
                              }
                            }}
                            className="mt-auto w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 hover:shadow-md transition-all"
                          >
                            View & Apply 
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                         <Bookmark className="text-yellow-500" size={28} />
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-800 mb-1">No saved jobs yet</h3>
                      <p className="text-sm text-gray-500 font-medium max-w-sm">Jobs you star on the dashboard will appear here so you can apply to them later.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            

          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateProfile;