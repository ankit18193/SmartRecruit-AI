import React, { useState, useEffect } from "react";
import Sidebar from "../components/common/sideBar";
import API, { fetchMyJobs } from "../services/api";
import { toast } from "react-hot-toast";
import {
    User, Mail, MapPin, Phone, Briefcase,
    Settings, Save, Loader2, Camera, X, Building2, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecruiterProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [myJobs, setMyJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isEditing, setIsEditing] = useState(false);

    
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        location: "",
        phone: ""
    });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            
            const [userRes, jobsRes] = await Promise.all([
                API.get("/auth/me"), 
                fetchMyJobs()
            ]);

            const userData = userRes.data;
            setUser(userData);
            setMyJobs(jobsRes.data || []);

            setFormData({
                name: userData.name || "",
                bio: userData.bio || "",
                location: userData.location || "",
                phone: userData.phone || ""
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
            await API.put("/users/update", formData);
            toast.success("Profile updated successfully ✨");
            setIsEditing(false);
            fetchProfileData(); 
        } catch (error) {
            toast.error("Update failed");
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

                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    
                    <div className="h-48 bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 relative w-full">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                    </div>

                    <div className="max-w-5xl mx-auto px-8 sm:px-12 -mt-16 relative z-10 pb-12">

                        
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-4xl font-black text-slate-800 overflow-hidden">
                                        {user?.profilePicture ? (
                                            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            user?.name?.charAt(0).toUpperCase() || "R"
                                        )}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 shadow-sm transition-all hover:scale-105">
                                        <Camera size={16} />
                                    </button>
                                </div>

                                
                                <div className="text-center sm:text-left mt-2">
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user?.name || "Recruiter"}</h1>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-sm font-semibold text-gray-500">
                                        <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs">
                                            <Building2 size={14} /> Hiring Manager
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                                            <MapPin size={14} /> {user?.location || "Company HQ"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm border ${isEditing
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
                                onClick={() => setActiveTab("posted-jobs")}
                                className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'posted-jobs' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                My Posted Roles <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] ml-1">{myJobs.length}</span>
                                {activeTab === 'posted-jobs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />}
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
                                                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                                                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Location / HQ</label>
                                                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Bangalore, India" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Bio / Description</label>
                                                    <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px] resize-none" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell candidates about your company culture, mission, and what you build..." />
                                                </div>
                                                <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                    <Save size={18} /> Save Changes
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                                                        <Building2 size={18} /> About Company
                                                    </h4>
                                                    <p className="text-gray-600 leading-relaxed text-sm font-medium whitespace-pre-line">
                                                        {user?.bio || "No description added yet. Add details about your company to attract better talent! 🚀"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    
                                    <div className="space-y-6">
                                        <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-5 border-b border-gray-50 pb-4">Contact Info</h4>
                                            <div className="space-y-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Mail size={18} /></div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Work Email</p>
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0"><Phone size={18} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phone</p>
                                                        <p className="text-sm font-semibold text-gray-800">{user?.phone || "Not provided"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><MapPin size={18} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">HQ Location</p>
                                                        <p className="text-sm font-semibold text-gray-800">{user?.location || "Not specified"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                
                                <div className="space-y-6">
                                    {myJobs.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {myJobs.map(job => (
                                                <div key={job._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col relative">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg leading-snug">{job.title}</h3>
                                                            <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                                                                <MapPin size={12} /> {job.location || "Remote"}
                                                            </p>
                                                        </div>
                                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wide">
                                                            Active
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-100 uppercase tracking-wide">
                                                            {job.jobType || "Full-time"}
                                                        </span>
                                                        <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-100 uppercase tracking-wide">
                                                            {job.experienceRequired ? `${job.experienceRequired} Yrs Exp` : "Entry Level"}
                                                        </span>
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-gray-50 flex gap-3">
                                                        <button
                                                            
                                                            onClick={() => navigate(`/recruiter/job/${job._id}`)}
                                                            className="flex-1 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Users size={14} /> View Details
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/jobs`)} 
                                                            className="flex-1 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Briefcase size={14} /> Manage Job
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                <Briefcase className="text-blue-500" size={28} />
                                            </div>
                                            <h3 className="text-lg font-extrabold text-gray-800 mb-1">No roles posted yet</h3>
                                            <p className="text-sm text-gray-500 font-medium max-w-sm mb-6">Create your first job posting to start receiving applications from top talent.</p>
                                            <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                                Post a Job Now
                                            </button>
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

export default RecruiterProfile;