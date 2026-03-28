import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import {
  Loader2,
  Brain,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  AlertCircle,
  User,
  XCircle as CloseIcon
} from 'lucide-react';
import {
  getApplications,
  updateApplicationStatus
} from '../../services/api';
import API from '../../services/api';
import AIInsightsModal from './AIInsightsModal';
import toast from 'react-hot-toast';

const CandidateTable = ({ jobId }) => {
  const navigate = useNavigate(); 
  
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState(null);

 
  const handleError = (error, defaultMsg) => {
    console.error("🔥 ERROR:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      localStorage.clear();
      window.location.href = "/login";
    } else {
      toast.error(error.response?.data?.message || defaultMsg);
    }
  };

  
  const loadData = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await getApplications(jobId);

      if (response?.data?.applications) {
        setCandidates(response.data.applications);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      handleError(error, "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  
  const handleStatusUpdate = async (id, newStatus, currentStatus) => {
    if (currentStatus === newStatus) return;

    try {
      const { data } = await updateApplicationStatus(id, newStatus);

      if (data) {
        toast.success(`Candidate marked as ${newStatus}`);
        setCandidates(prev =>
          prev.map(app =>
            app._id === id ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      handleError(error, "Status update failed");
    }
  };

  
  const handleViewInterview = async (candidateId) => {
    if (!jobId || !candidateId) return;

    try {
      const { data } = await API.get(`/interviews/result/${jobId}/${candidateId}`);

      if (!data) {
        return toast.error("Invalid interview data received.");
      }

      setInterviewData(data);
      setShowInterviewModal(true);

    } catch (error) {
      handleError(error, "Candidate hasn't completed the interview yet!");
    }
  };

  
  const formatAIText = (text) => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  };

  if (!jobId) {
    return (
      <div className="text-center p-10 text-slate-400">
        No Job Selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2 md:p-6 overflow-x-auto custom-scrollbar">
      <table className="w-full text-left font-sans min-w-[700px]">
        <thead>
          <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100">
            <th className="pb-4 pl-4 font-black">Candidate</th>
            <th className="pb-4 font-black text-center">AI Fitment</th>
            <th className="pb-4 font-black text-center">Status</th>
            <th className="pb-4 pr-4 font-black text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-50">
          {candidates.length > 0 ? (
            candidates.map((app) => {
              const isShortlisted = app.status === 'Shortlisted' || app.status === 'Hired' || app.status === 'Selected' || app.status === 'Accepted';
              const isRejected = app.status === 'Rejected';

              return (
                <tr 
                  key={app._id} 
                  
                  onClick={() => navigate(`/recruiter/candidate/${app._id}`)}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                >
                 
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                        <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                          {app.candidateId?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-400 font-medium truncate">
                          {app.candidateId?.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  
                  <td className="py-4 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider border ${
                        app.fitmentScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        app.fitmentScore >= 50 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {app.fitmentScore ?? 0}% Match
                      </span>
                      {app.interviewScore !== undefined && app.interviewScore !== null && (
                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {app.interviewScore}% Interview
                        </span>
                      )}
                    </div>
                  </td>

                  
                  <td className="py-4 text-center align-middle">
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold border inline-flex items-center justify-center whitespace-nowrap ${
                      isShortlisted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      isRejected ? 'bg-red-50 text-red-600 border-red-200' :
                      app.status === 'Interview Scheduled' || app.status === 'Interview Completed' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {app.status}
                    </span>
                  </td>

                 
                  <td className="py-4 pr-4 text-right align-middle">
                    <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">

                      
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedApp(app); setIsModalOpen(true); }}
                        className="p-2.5 text-blue-500 hover:bg-blue-100 rounded-xl transition-all"
                        title="AI Resume Insights"
                      >
                        <Brain size={18} />
                      </button>

                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewInterview(app.candidateId?._id); }}
                        className="p-2.5 text-purple-500 hover:bg-purple-100 rounded-xl transition-all"
                        title="View AI Interview Result"
                      >
                        <ClipboardCheck size={18} />
                      </button>

                      
                      <button
                        disabled={isShortlisted || isRejected}
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app._id, "Shortlisted", app.status); }}
                        className={`p-2.5 rounded-xl transition-all ${
                          isShortlisted ? 'bg-emerald-100 text-emerald-500 opacity-50 cursor-not-allowed' :
                          isRejected ? 'opacity-30 cursor-not-allowed text-slate-400' :
                          'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title="Shortlist Candidate"
                      >
                        <CheckCircle size={18} />
                      </button>

                      
                      <button
                        disabled={isRejected || isShortlisted}
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app._id, "Rejected", app.status); }}
                        className={`p-2.5 rounded-xl transition-all ${
                          isRejected ? 'bg-red-100 text-red-500 opacity-50 cursor-not-allowed' :
                          isShortlisted ? 'opacity-30 cursor-not-allowed text-slate-400' :
                          'text-slate-400 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Reject Candidate"
                      >
                        <XCircle size={18} />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <AlertCircle size={40} strokeWidth={1.5} />
                  <p className="text-slate-500 font-medium text-sm">
                    No candidates have applied for this role yet.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      
      {selectedApp && (
        <AIInsightsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          application={selectedApp}
        />
      )}

      
      {showInterviewModal && interviewData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[85vh] border border-slate-100 animate-[scaleIn_0.2s_ease-out]">

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">
                AI Interview Feedback
              </h2>
              <button
                onClick={() => setShowInterviewModal(false)}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
              >
                <CloseIcon size={28} className="text-slate-300 hover:text-red-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                  Overall AI Score
                </p>
                <p className={`text-5xl font-black ${
                  interviewData.score >= 70 ? 'text-emerald-600' :
                  interviewData.score >= 40 ? 'text-amber-500' : 'text-red-600'
                }`}>
                  {interviewData.score ?? 0}%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['strengths', 'weaknesses', 'suggestions'].map((key, i) => {
                  const dataArray = interviewData.evaluation?.[key] || [];

                  return (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                      <h3 className="text-sm font-black mb-4 capitalize text-slate-700 tracking-wide border-b border-slate-200 pb-2">{key}</h3>
                      {dataArray.length > 0 ? (
                        <ul className="space-y-3">
                          {dataArray.map((item, idx) => (
                            <li key={idx} className="text-xs list-disc list-outside ml-4 text-slate-600 font-medium leading-relaxed">
                              {formatAIText(item)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No data available.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowInterviewModal(false)}
              className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-md"
            >
              Close Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateTable;