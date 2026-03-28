import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Briefcase, MapPin, CalendarDays, 
  Users, Target, IndianRupee, Edit, Building2, Clock, CheckCircle2 
} from 'lucide-react';
import API from '../services/api'; 
import Sidebar from '../components/common/sideBar';

import CandidateTable from '../components/recruiter/CandidateTable';

const RecruiterJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        
        const [jobRes, statsRes] = await Promise.all([
          API.get(`/jobs/${id}`),
          API.get(`/jobs/${id}/applications`) 
        ]);
        
        setJob(jobRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to fetch job details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-widest uppercase">Loading Workspace...</p>
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

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        
       
        <div className="h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 absolute top-0 w-full z-0">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        </div>

        <div className="p-8 max-w-7xl mx-auto space-y-6 relative z-10">
          
          
          <button 
            onClick={() => navigate('/jobs')} 
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors mb-2"
          >
            <ArrowLeft size={18} /> Back
          </button>

          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4 flex-1">
              
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Role
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l border-gray-200 pl-3">
                  {job.department || "General Dept"}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {job.title}
              </h1>

              
              <div className="flex flex-wrap gap-2.5">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Building2 size={14} className="text-blue-500"/> {job.companyName || "Not Specified"}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <MapPin size={14} className="text-red-400"/> {job.location || 'Remote'} ({job.workplaceType || 'Remote'})
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Briefcase size={14} className="text-amber-500"/> {job.jobType} • {job.experienceRequired ? `${job.experienceRequired}+ Yrs` : "Entry Level"}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <IndianRupee size={14} className="text-green-600"/> {job.salary || 'Not Disclosed'}
                </span>
              </div>
            </div>

            
            <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-right w-full">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Open Vacancies</p>
                <p className="text-2xl font-black text-blue-600">{job.openings || 1}</p>
              </div>
              <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                <Edit size={16} /> Edit Details
              </button>
            </div>
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                   <Users className="text-blue-500" size={20}/> Candidate Pipeline
                 </h2>
                 <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                   {stats?.totalApplicants || 0} Total Applied
                 </span>
               </div>
               
               
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                 <CandidateTable jobId={job._id} />
               </div>
            </div>

            
            <div className="space-y-6">
              
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-3">Role Constraints</h3>
                 
                 <div className="space-y-4">
                   <div className="flex items-start gap-3">
                     <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                       <CalendarDays size={18} />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Application Deadline</p>
                       <p className="text-sm font-bold text-gray-800">
                         {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "No Deadline Set"}
                       </p>
                     </div>
                   </div>

                   <div className="flex items-start gap-3">
                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                       <Clock size={18} />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Posted On</p>
                       <p className="text-sm font-bold text-gray-800">
                         {new Date(job.createdAt).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                 </div>
              </div>

              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-3 flex items-center gap-2">
                   <Target size={16} className="text-purple-500"/> Required Skills
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {job.requiredSkills && job.requiredSkills.length > 0 ? (
                     job.requiredSkills.map((skill, index) => (
                       <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100">
                         {skill}
                       </span>
                     ))
                   ) : (
                     <p className="text-xs text-gray-400 italic">No specific skills listed.</p>
                   )}
                 </div>
              </div>

              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-3">About the Role</h3>
                 <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line overflow-hidden relative max-h-64">
                   {job.description}
                  
                   <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
                 </div>
                 <button className="text-xs font-bold text-blue-600 hover:underline mt-2 w-full text-center">Read Full Description</button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default RecruiterJobDetails;