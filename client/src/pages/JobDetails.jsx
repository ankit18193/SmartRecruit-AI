import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom"; 
import Sidebar from "../components/common/sideBar";
import API from "../services/api";
import ApplyModal from "../components/candidate/ApplyModal"; 
import { toast } from "react-hot-toast";
import { ArrowLeft, MapPin, Briefcase, DollarSign, CheckCircle2, Building2, Target, CalendarDays, Users } from "lucide-react"; // 🔥 ADDED: Users icon

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role !== "candidate") return <Navigate to="/" />;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([
          API.get(`/jobs/${id}`),
          API.get("/applications/my-applications")
        ]);

        setJob(jobRes.data);

        if (appsRes?.data) {
          const hasApplied = appsRes.data.some(app => app.jobId?._id === id || app.jobId === id);
          setIsApplied(hasApplied);
        }

      } catch (error) {
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-widest uppercase">Loading Role...</p>
      </div>
    </div>
  );

  if (!job) return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-gray-800">Role Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold hover:underline">Go Back</button>
      </div>
    </div>
  );

  const skillsArray = Array.isArray(job.requiredSkills) 
    ? job.requiredSkills 
    : (job.requiredSkills ? job.requiredSkills.split(',') : []);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        
        
        <div className="h-40 bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 absolute top-0 w-full z-0">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        </div>

        <div className="p-8 max-w-6xl mx-auto space-y-6 relative z-10">
          
          
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors mb-2"
          >
            <ArrowLeft size={18} /> Back to Jobs
          </button>

          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4 flex-1">
              
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Actively Hiring
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l border-gray-200 pl-3">
                  {job.department || "General"}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {job.title}
              </h1>

              
              <div className="flex flex-wrap gap-2.5">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Building2 size={14} className="text-blue-500"/> {job.companyName || "Company Name"}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <MapPin size={14} className="text-red-400"/> {job.location || 'Remote'} {job.workplaceType ? `(${job.workplaceType})` : ""}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Briefcase size={14} className="text-amber-500"/> {job.jobType || 'Full-time'}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <DollarSign size={14} className="text-green-600"/> {job.salary || 'Not Disclosed'}
                </span>
                
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Users size={14} className="text-indigo-400"/> {job.openings || 1} Openings
                </span>
              </div>
            </div>

            
            <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <button
                disabled={isApplied}
                onClick={() => setShowModal(true)}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-black transition-all shadow-sm flex items-center justify-center gap-2 ${
                  isApplied 
                  ? "bg-green-50 text-green-600 border border-green-200 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {isApplied ? "Application Sent ✅" : "Apply Now"}
              </button>
              {!isApplied && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full text-center md:text-right">
                  Takes only 2 mins
                </p>
              )}
            </div>
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-4 border-b border-gray-50 pb-4">About the Role</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>

            
            <div className="space-y-6">
              
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-50 pb-3">Requirements</h3>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Experience</p>
                    <p className="text-sm font-bold text-gray-800">
                      {job.experienceRequired || '0'} Years Minimum
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Posted On</p>
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              
              {skillsArray.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-3 flex items-center gap-2">
                    <Target size={16} className="text-purple-500"/> Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill, index) => (
                      <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        
        {showModal && (
          <ApplyModal
            job={job}
            onClose={() => setShowModal(false)}
            onSuccess={() => setIsApplied(true)} 
          />
        )}
      </main>
    </div>
  );
};

export default JobDetails;