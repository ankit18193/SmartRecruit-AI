import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import API, { fetchMyJobs, getApplications, updateApplicationStatus } from '../../services/api';
import {
    Loader2, Filter, UserCircle, Search, Sparkles, CalendarDays,
    Video, CheckCircle2, XCircle, ExternalLink, Brain, Briefcase, AlertTriangle, ChevronDown, XCircle as CloseIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import ScheduleInterviewModal from "../../components/recruiter/ScheduleInterviewModal";
import AIInsightsModal from "../../components/recruiter/AIInsightsModal";
import Sidebar from "../../components/common/sideBar";

const Candidates = () => {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("");

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedApplication, setSelectedApplication] = useState(null);
    const [resumeInsightsApp, setResumeInsightsApp] = useState(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', candidateId: null, candidateName: '' });

    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [interviewData, setInterviewData] = useState(null);

    const loadJobs = async () => {
        try {
            const response = await fetchMyJobs();
            const jobList = response.data || [];
            setJobs(jobList);
            if (jobList.length > 0) setSelectedJobId(jobList[0]._id);
            else setLoading(false);
        } catch (error) {
            toast.error("Failed to load roles");
            setLoading(false);
        }
    };

    useEffect(() => { loadJobs(); }, []);

    const fetchCandidates = async () => {
        if (!selectedJobId) return;

        try {
            setLoading(true);
            const { data } = await getApplications(selectedJobId);
            if (data?.applications) {
                const sortedApps = [...data.applications].sort((a, b) => (b.fitmentScore || 0) - (a.fitmentScore || 0));
                setCandidates(sortedApps);
            } else {
                setCandidates([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load candidates for this role");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCandidates(); }, [selectedJobId]);

    const handleViewInterview = async (candidateId) => {
        if (!selectedJobId || !candidateId) return;

        try {
            const { data } = await API.get(`/interviews/result/${selectedJobId}/${candidateId}`);
            if (!data) return toast.error("Invalid interview data received.");

            setInterviewData(data);
            setShowInterviewModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Candidate hasn't completed the interview yet!");
        }
    };

    const formatAIText = (text) => {
        if (!text) return "";
        return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    };

    const filteredCandidates = candidates.filter((c) => {
        const score = c.fitmentScore || 0;
        const matchesFilter = activeFilter === 'All' ? true : activeFilter === 'Top Rated' ? score >= 75 : c.status === activeFilter;
        const matchesSearch = (c.candidateId?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const confirmAction = async () => {
        try {
            await updateApplicationStatus(actionModal.candidateId, actionModal.type);
            toast.success(`Candidate successfully marked as ${actionModal.type}`);
            setCandidates(prev => prev.map(c => c._id === actionModal.candidateId ? { ...c, status: actionModal.type } : c));
        } catch (error) {
            toast.error("Action failed to process.");
        } finally {
            setActionModal({ isOpen: false, type: '', candidateId: null, candidateName: '' });
        }
    };

    const statusColors = {
        "Applied": "bg-slate-100 text-slate-700 border-slate-200",
        "Shortlisted": "bg-blue-100 text-blue-700 border-blue-200",
        "Interview Scheduled": "bg-indigo-100 text-indigo-700 border-indigo-200",
        "Hired": "bg-emerald-100 text-emerald-700 border-emerald-200",
        "Rejected": "bg-red-100 text-red-700 border-red-200",
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">

                <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0 shadow-sm z-20">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                            Candidate Pipeline
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] rounded-lg uppercase tracking-widest font-black">Live</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {jobs.length > 0 ? (
                            <div className="relative group hidden md:block">
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 hover:border-blue-300 transition-all cursor-pointer">
                                    <Briefcase size={16} className="text-blue-600 mr-2" />
                                    <select
                                        className="bg-transparent text-sm font-bold text-slate-700 outline-none appearance-none pr-8 cursor-pointer min-w-[180px]"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                    >
                                        {jobs.map(job => (
                                            <option key={job._id} value={job._id}>{job.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 text-slate-400 group-hover:text-blue-600 transition-colors pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 font-medium bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 hidden md:block">No active roles</div>
                        )}

                        <div className="relative w-64 group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                            <input type="text" placeholder="Search candidate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-700" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">

                    {loading ? (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-blue-600 gap-4 bg-slate-50 z-10">
                            <Loader2 className="animate-spin" size={48} />
                            <span className="text-sm font-bold text-slate-500">Loading Pipeline Data...</span>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto">

                            <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 border-b border-slate-200">
                                <Filter size={18} className="text-slate-400 shrink-0 mr-2" />
                                {['All', 'Top Rated', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'].map((f) => (
                                    <button key={f} onClick={() => setActiveFilter(f)} className={`px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap rounded-full border ${activeFilter === f ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                                        {f === 'Top Rated' && <Sparkles size={14} className="inline mr-1.5 mb-0.5 text-amber-400" />} {f}
                                    </button>
                                ))}
                            </div>

                            <div>
                                {jobs.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm mt-8">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Briefcase size={32} /></div>
                                        <h3 className="text-xl font-bold text-slate-800">No active roles</h3>
                                    </div>
                                ) : filteredCandidates.length > 0 ? (
                                    filteredCandidates.map((c) => {
                                        const fitScore = c.fitmentScore || 0;
                                        const isTopTier = fitScore >= 75;

                                        return (
                                            <div key={c._id} className="relative mb-12 mt-10 group">

                                                <div
                                                    onClick={(e) => { e.stopPropagation(); handleViewInterview(c.candidateId?._id); }}
                                                    className="absolute bottom-full left-6 bg-[#F8FAFF] border border-indigo-100 border-b-0 text-indigo-800 text-[11px] font-bold px-5 py-2.5 rounded-t-xl shadow-sm flex items-center gap-2 cursor-pointer hover:bg-indigo-50 transition-colors z-0"
                                                >
                                                    <Brain size={15} className="text-indigo-600" />
                                                    <span className="uppercase tracking-widest text-[10px] font-bold">
                                                        AI Interview Feedback
                                                        {/* 🔥 FIXED: Only renders score inside brackets if it exists. Nothing else. */}
                                                        <span className="ml-1 text-indigo-600 font-black">
                                                            {c.interviewScore !== undefined && c.interviewScore !== null ? `(${c.interviewScore}%)` : ''}
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative z-10 hover:border-blue-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">

                                                    <div onClick={() => navigate(`/recruiter/candidate/${c._id}`)} className="flex items-center gap-4 flex-1 cursor-pointer group/profile p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors ${isTopTier ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover/profile:bg-blue-50 group-hover/profile:text-blue-600'}`}>
                                                            <UserCircle size={32} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 text-lg group-hover/profile:text-blue-600 transition-colors">{c.candidateId?.name || "Unknown"}</h3>
                                                            <p className="text-xs font-semibold mt-0.5 text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Briefcase size={13} className="text-slate-400" />{c.jobId?.title || "Role"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 md:gap-10">
                                                        <div onClick={() => setResumeInsightsApp(c)} className="text-center cursor-pointer group/score p-2 rounded-xl hover:bg-blue-50 transition-colors" title="View Resume Match Insights">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/score:text-blue-500 transition-colors">Resume Match</span>
                                                            <span className={`text-xl font-black group-hover/score:scale-110 inline-block transition-transform ${isTopTier ? 'text-emerald-600' : fitScore >= 50 ? 'text-blue-600' : 'text-red-500'}`}>{fitScore}%</span>
                                                        </div>
                                                        <div className="text-center min-w-[120px]">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                                            <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusColors[c.status] || statusColors["Applied"]}`}>{c.status}</span>
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:block w-px h-12 bg-slate-200 mx-2"></div>

                                                    <div className="flex items-center gap-3">
                                                        {!c.interviewScheduled && (
                                                            <button onClick={(e) => { e.stopPropagation(); setSelectedApplication(c._id); }} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95" title="Schedule HR Interview">
                                                                <CalendarDays size={20} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); if (c.status !== "Hired") setActionModal({ isOpen: true, type: 'Hired', candidateId: c._id, candidateName: c.candidateId?.name }); }} disabled={c.status === "Hired"} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed">
                                                            <CheckCircle2 size={20} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); if (c.status !== "Rejected") setActionModal({ isOpen: true, type: 'Rejected', candidateId: c._id, candidateName: c.candidateId?.name }); }} disabled={c.status === "Rejected"} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed">
                                                            <XCircle size={20} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {c.interviewScheduled && (
                                                    <div onClick={(e) => { e.stopPropagation(); navigate(`/recruiter/interview/${c._id}`); }} className="absolute top-full right-6 bg-amber-50 border border-amber-200 border-t-0 text-amber-800 text-[11px] font-bold px-6 py-2.5 rounded-b-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors z-0">
                                                        <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-amber-600" /> {c.interviewDate ? new Date(c.interviewDate).toLocaleDateString() : 'Scheduled'}</span>
                                                        <span className="flex items-center gap-1 text-blue-600 hover:underline">HR Interview Space <ExternalLink size={12} /></span>
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm mt-8">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400"><Search size={32} /></div>
                                        <h3 className="text-xl font-bold text-slate-800">No applicants found</h3>
                                    </div>
                                )}
                            </div>

                            {selectedApplication && <ScheduleInterviewModal applicationId={selectedApplication} onClose={() => setSelectedApplication(null)} onSuccess={fetchCandidates} />}

                            {resumeInsightsApp && <AIInsightsModal isOpen={!!resumeInsightsApp} onClose={() => setResumeInsightsApp(null)} application={resumeInsightsApp} />}

                            {showInterviewModal && interviewData && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[85vh] border border-slate-100">

                                        <div className="flex justify-between items-center mb-8">
                                            <h2 className="text-2xl font-black text-slate-800">AI Interview Feedback</h2>
                                            <button onClick={() => setShowInterviewModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                                <CloseIcon size={28} className="text-slate-300 hover:text-red-500" />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Overall AI Score</p>
                                                <p className={`text-4xl font-black ${interviewData.score >= 70 ? 'text-green-600' : interviewData.score >= 40 ? 'text-amber-500' : 'text-red-600'
                                                    }`}>
                                                    {interviewData.score ?? 0}%
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {['strengths', 'weaknesses', 'suggestions'].map((key, i) => {
                                                    const dataArray = interviewData.evaluation?.[key] || [];
                                                    return (
                                                        <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                                                            <h3 className="text-sm font-bold mb-3 capitalize">{key}</h3>
                                                            {dataArray.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {dataArray.map((item, idx) => (
                                                                        <li key={idx} className="text-xs list-disc list-inside text-slate-600">{formatAIText(item)}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 italic">No data available.</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button onClick={() => setShowInterviewModal(false)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800">
                                            Close Report
                                        </button>
                                    </div>
                                </div>
                            )}

                            {actionModal.isOpen && (
                                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 relative">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${actionModal.type === 'Hired' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                            {actionModal.type === 'Hired' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 mb-2">{actionModal.type === 'Hired' ? 'Confirm Hire' : 'Confirm Rejection'}</h2>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                            Are you sure you want to change <span className="font-bold text-slate-800">{actionModal.candidateName}</span>'s status to <span className={`font-bold ${actionModal.type === 'Hired' ? 'text-emerald-600' : 'text-red-600'}`}>{actionModal.type}</span>?
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setActionModal({ isOpen: false, type: '', candidateId: null, candidateName: '' })} className="flex-1 py-3.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                                            <button onClick={confirmAction} className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${actionModal.type === 'Hired' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Yes, {actionModal.type === 'Hired' ? 'Hire' : 'Reject'}</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Candidates;