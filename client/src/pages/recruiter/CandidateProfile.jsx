import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import {
  Loader2, ArrowLeft, Mail, Briefcase, Award, Target, 
  TrendingUp, AlertCircle, CheckCircle2, UserCircle, 
  Calendar, Video, Phone, ExternalLink, FileText
} from "lucide-react";
import Sidebar from "../../components/common/sideBar";

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    try {
      const { data } = await API.get(`/applications/${id}`);
      setApplication(data);
    } catch (error) {
      console.error("Failed to load candidate profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-bold tracking-widest uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-black text-gray-800">Candidate Not Found</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const score = application?.fitmentScore || 0;

  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-blue-600" : "text-red-500";

  const recommendation =
    score >= 85 ? { label: "Strong Hire", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    : score >= 70 ? { label: "Good Candidate", color: "bg-blue-100 text-blue-700 border-blue-200" }
    : { label: "Needs Review", color: "bg-red-100 text-red-700 border-red-200" };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        
        {/* 🔥 PREMIUM HEADER BACKGROUND */}
        <div className="h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 absolute top-0 w-full z-0">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        </div>

        <div className="p-8 max-w-7xl mx-auto relative z-10 space-y-6">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-all mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* 🔥 LEFT COLUMN (Profile Info) */}
            <div className="lg:col-span-1 space-y-6">

              {/* Candidate Card */}
              <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                  <UserCircle size={60} className="text-slate-400" />
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {application?.candidateId?.name || "Unknown Candidate"}
                </h2>

                <div className="space-y-2 mt-4 w-full">
                  <div className="flex items-center justify-center gap-2 text-gray-600 text-sm font-medium bg-gray-50 py-2 rounded-lg">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{application?.candidateId?.email || "Email unavailable"}</span>
                  </div>
                  {application?.candidateId?.phone && (
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm font-medium bg-gray-50 py-2 rounded-lg">
                      <Phone size={16} className="text-gray-400" />
                      <span>{application.candidateId.phone}</span>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-gray-100 my-6" />

                <div className="w-full space-y-5">
                  {/* Job Applied For */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Applied Role</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs">
                      <Briefcase size={14} />
                      {application?.jobId?.title || "Role unavailable"}
                    </span>
                  </div>

                  {/* AI Score Box */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                      AI Fitment Score
                    </p>
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className={`text-5xl font-black tracking-tighter ${scoreColor}`}>
                        {score}
                      </span>
                      <span className="text-gray-400 text-sm mb-1.5 font-bold">/ 100</span>
                    </div>
                    <span className={`inline-block px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-widest border ${recommendation.color}`}>
                      {recommendation.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Target size={16} className="text-red-500" /> Skill Gaps
                </h3>
                <div className="flex flex-wrap gap-2">
                  {application?.missingSkills?.length > 0 ? (
                    application.missingSkills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 w-full p-3 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={18} /> No major skill gaps!
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* 🔥 RIGHT COLUMN (Insights & Data) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Strengths */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03]">
                  <Award size={150} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <TrendingUp className="text-emerald-500" size={20} /> AI Identified Strengths
                </h3>
                <ul className="space-y-4 relative z-10">
                  {application?.strengths?.length > 0 ? (
                    application.strengths.map((s, i) => (
                      <li key={i} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="mt-0.5 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                        <p className="text-slate-700 leading-relaxed font-semibold text-sm">
                          {s}
                        </p>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm italic">No specific strengths highlighted by AI.</p>
                  )}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <AlertCircle className="text-amber-500" size={20} /> Recommended Improvements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application?.improvements?.length > 0 ? (
                    application.improvements.map((imp, i) => (
                      <div key={i} className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <p className="text-amber-900 font-semibold text-sm leading-relaxed">
                          "{imp}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm italic col-span-2">No improvements suggested.</p>
                  )}
                </div>
              </div>

              {/* Interview Details */}
              {application?.interviewScheduled && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-lg text-white">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-blue-100">
                    <Calendar className="text-blue-200" size={20} /> Interview Scheduled
                  </h3>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      {application?.interviewDate && (
                        <div className="flex items-center gap-3 text-white font-semibold">
                          <div className="p-2 bg-white/10 rounded-lg"><Calendar size={18} /></div>
                          {new Date(application.interviewDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                      {application?.interviewMode && (
                        <div className="flex items-center gap-3 text-white font-semibold">
                          <div className="p-2 bg-white/10 rounded-lg"><Video size={18} /></div>
                          {application.interviewMode}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate(`/recruiter/interview/${application._id}`)}
                        className="px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition shadow-sm"
                      >
                        Open Panel
                      </button>
                      {application?.interviewLink && (
                        <a
                          href={application.interviewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 bg-blue-800 text-white rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 border border-blue-500"
                        >
                          Join Meet <ExternalLink size={16}/>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Resume Viewer */}
              {application?.resumeUrl && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                      <FileText className="text-slate-500" size={20} /> Original Resume
                    </h3>
                    <a 
                      href={application.resumeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                      Open Full Screen <ExternalLink size={14}/>
                    </a>
                  </div>
                  <div className="w-full bg-slate-50 rounded-2xl p-2 border border-slate-200">
                    <iframe
                      src={application?.resumeUrl}
                      title="Candidate Resume"
                      className="w-full h-[600px] rounded-xl bg-white"
                    />
                  </div>
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