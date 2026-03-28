import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/common/sideBar";
import API from "../../services/api";
import { 
  Loader2, User, Mail, Briefcase, Target, 
  Calendar, Video, MessageSquare, CheckCircle, 
  XCircle, ArrowLeft, Link as LinkIcon 
} from "lucide-react";
import toast from "react-hot-toast";

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  const fetchApplication = async () => {
    try {
      const { data } = await API.get(`/applications/${id}`);
      setApplication(data);
    } catch (err) {
      toast.error("Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplication(); }, []);

  const handleStatus = async (status) => {
    try {
      await API.patch(`/applications/${id}/status`, { status, notes });
      toast.success(`Candidate marked as ${status}`);
      navigate('/recruiter/candidates');
    } catch {
      toast.error("Update failed");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#f8fafc]">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8">
        
        {/* Top Bar */}
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-all">
            <ArrowLeft size={20} /> <span className="font-bold uppercase tracking-widest text-xs">Back to Pipeline</span>
          </button>
          <div className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            Live Interview Mode
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Candidate & AI Briefing (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <User size={40} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{application.candidateId?.name}</h2>
              <p className="text-gray-400 font-medium flex items-center gap-2 mt-1"><Mail size={14}/> {application.candidateId?.email}</p>
              
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Role</span>
                  <span className="text-xs font-black text-gray-800">{application.jobId?.title}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">AI Fitment</span>
                    <span className="text-green-600 font-black">{application.fitmentScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{width: `${application.fitmentScore}%`}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Details Card */}
            {application.interviewScheduled && (
              <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Video size={18}/> Meeting Link
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-indigo-300"/>
                    <span className="text-sm font-bold">{new Date(application.interviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-indigo-300"/>
                    <span className="text-sm font-bold">{application.interviewMode}</span>
                  </div>
                </div>
                <a href={application.interviewLink} target="_blank" className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all">
                  Join Room <LinkIcon size={14}/>
                </a>
              </div>
            )}
          </div>

          {/* RIGHT: Feedback & Actions (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="text-blue-600" size={20}/>
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Interview Notes & Evaluation</h3>
              </div>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing candidate evaluation, technical skills, and cultural fit..."
                className="flex-1 w-full min-h-[300px] p-6 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-gray-700 font-medium leading-relaxed resize-none"
              />

              <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleStatus("Hired")}
                  className="flex-1 h-14 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-100 transition-all active:scale-95"
                >
                  <CheckCircle size={18}/> Confirm Hire
                </button>
                <button 
                  onClick={() => handleStatus("Rejected")}
                  className="flex-1 h-14 bg-white text-red-500 border-2 border-red-50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-95"
                >
                  <XCircle size={18}/> Reject Candidate
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InterviewPage;