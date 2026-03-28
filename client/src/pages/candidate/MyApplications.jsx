import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../components/common/sideBar";
import API from "../../services/api";
import { getInterview } from "../../services/api";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  Calendar,
  Loader2,
  Brain,
  CheckCircle2,
  TrendingUp,
  Rocket,
  ExternalLink,
  BarChart,
  Building2,
  Users,
  FileText
} from "lucide-react";


const SmartInterviewButton = ({ jobId }) => {
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await getInterview(jobId);
        if (data) setInterviewData(data);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchStatus();
  }, [jobId]);

  if (loading) {
    return <div className="animate-pulse h-10 w-40 bg-gray-200 rounded-xl"></div>;
  }

  const isCompleted = interviewData?.status === "Completed";

  return (
    <Link
      to={`/interview/${jobId}`}
      className={`relative group text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 overflow-hidden ${isCompleted
        ? "bg-gradient-to-r from-emerald-500 to-teal-600"
        : "bg-gradient-to-r from-blue-600 to-indigo-600 animate-[pulse_2s_infinite]"
        }`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

      {isCompleted ? (
        <>
          <BarChart size={18} /> View Report (Score: {interviewData.score}%)
        </>
      ) : (
        <>
          🤖 Take AI Interview <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </>
      )}
    </Link>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role !== "candidate") return <Navigate to="/" />;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/applications/my-applications");
        const sortedApps = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setApplications(sortedApps);
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to load your applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-10 shrink-0 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Applications</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Track your AI fitment and recruitment status</p>
          </div>
        </header>


        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto">

            <div className="flex justify-between items-end mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Application History</h1>
              <p className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                Total Applied: <span className="font-bold text-blue-600">{applications.length}</span>
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Applications Yet</h3>
                <p className="text-sm text-gray-500 mb-6">Start applying to see your AI fitment scores!</p>
                <button
                  onClick={() => navigate("/browse")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {applications.map((app) => {
                  const job = app.jobId || {};
                  const isDeleted = !job.title;

                  return (
                    <div
                      key={app._id}
                      className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                    >

                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300
                        ${app.status === "Accepted" || app.status === "Selected" ? "bg-emerald-500"
                            : app.status === "Rejected" ? "bg-red-500"
                              : app.status === "Interview Scheduled" || app.status === "Shortlisted" ? "bg-blue-500"
                                : "bg-amber-400"
                          }`}
                      ></div>



                      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 pl-2">
                        <div
                          className={`flex-1 ${!isDeleted ? "cursor-pointer" : ""}`}
                          onClick={() => !isDeleted && navigate(`/job/${job._id}`)}
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {isDeleted ? "Job No Longer Available" : job.title}
                            </h3>
                            {!isDeleted && <ExternalLink size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>

                          {!isDeleted && (
                            <p className="text-[15px] font-semibold text-slate-500 flex items-center gap-2 mb-4">
                              <Building2 size={16} className="text-blue-500" />
                              {job.companyName || "Not Specified"}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                            <StatusBadge status={app.status} />

                            {!isDeleted && (
                              <>
                                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                                  <Briefcase size={14} className="text-blue-400" />
                                  Exp: {job.experienceRequired || '0'} Yrs
                                </span>

                                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                                  <MapPin size={14} className="text-red-400" />
                                  {job.location || "Remote"} {job.workplaceType ? `(${job.workplaceType})` : ""}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                                  <Users size={14} className="text-indigo-400" />
                                  {job.openings || 1} Openings
                                </span>
                              </>
                            )}

                            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                              <Calendar size={14} className="text-amber-500" />
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>



                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-6 py-4 rounded-2xl text-center min-w-[130px] shrink-0 shadow-inner flex flex-col justify-center">
                          <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">AI Match</p>
                          <p className="text-4xl font-black text-blue-700">{app.fitmentScore || 0}%</p>
                        </div>
                      </div>



                      <div className="mb-8 pl-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                          <span>Applied</span>
                          <span>Review</span>
                          <span>Interview</span>
                          <span>Decision</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm
                            ${app.status === "Accepted" || app.status === "Selected" ? "w-full bg-emerald-500"
                                : app.status === "Interview Scheduled" || app.status === "Shortlisted" ? "w-[75%] bg-blue-500"
                                  : app.status === "Under Review" ? "w-[40%] bg-amber-400"
                                    : app.status === "Rejected" ? "w-[100%] bg-red-500"
                                      : "w-[10%] bg-slate-300"
                              }`}
                          ></div>
                        </div>
                      </div>



                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-6 pl-2">



                        <div className="bg-red-50/40 p-5 rounded-2xl border border-red-100 hover:bg-red-50 transition-colors">
                          <div className="flex items-center gap-2 mb-3 text-red-600">
                            <Brain size={18} />
                            <span className="font-bold text-sm">Skill Gaps</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.missingSkills?.length > 0 ? app.missingSkills.map((skill, i) => (
                              <span key={i} className="bg-white border border-red-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-600 shadow-sm uppercase tracking-tight">
                                {skill}
                              </span>
                            )) : <span className="text-xs text-red-400 italic font-medium">No major gaps found!</span>}
                          </div>
                        </div>



                        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-2 mb-3 text-emerald-600">
                            <CheckCircle2 size={18} />
                            <span className="font-bold text-sm">Key Strengths</span>
                          </div>
                          <ul className="space-y-2">
                            {app.strengths?.length > 0 ? app.strengths.map((s, i) => (
                              <li key={i} className="text-xs font-medium text-emerald-800 leading-relaxed flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span>


                                <span>{s}</span>
                              </li>
                            )) : <li className="text-xs text-emerald-600/50 italic font-medium">Analysis pending...</li>}
                          </ul>
                        </div>



                        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 hover:bg-amber-50 transition-colors">
                          <div className="flex items-center gap-2 mb-3 text-amber-600">
                            <TrendingUp size={18} />
                            <span className="font-bold text-sm">AI Suggestions</span>
                          </div>

                          <ul className="space-y-2">
                            {app.improvements?.length > 0 ? app.improvements.map((imp, i) => (
                              <li key={i} className="text-xs text-amber-800 leading-relaxed italic font-medium flex items-start gap-2">
                                <span className="text-amber-500 not-italic mt-0.5">→</span>


                                <span>{imp}</span>
                              </li>
                            )) : (
                              <p className="text-xs text-amber-800 leading-relaxed italic font-medium">
                                Your resume is well-optimized for this role.
                              </p>
                            )}
                          </ul>
                        </div>

                      </div>



                      {!isDeleted && (
                        <div className="mt-6 flex justify-end pl-2">

                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3.5 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-100 transition-all text-sm flex items-center gap-2 max-w-[250px]"
                              title="View Resume Used"
                            >
                              <FileText size={18} className="text-blue-500 shrink-0" />
                              <span className="truncate">
                                
                                
                                {app.resumeUrl.split('/').pop().split('-').slice(1).join('-') || "Resume.pdf"}
                              </span>
                            </a>
                          )}

                          {(app.status === 'Shortlisted' || (app.status === 'Interview Scheduled' && (app.interviewMode === 'AI' || app.interviewMode === 'AI Interview'))) && (
                            <SmartInterviewButton jobId={job._id} />
                          )}

                          {app.status === 'Interview Scheduled' && app.interviewMode !== 'AI' && app.interviewMode !== 'AI Interview' && (
                            <a
                              href={app.interviewLink || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-emerald-600 transition-all text-sm flex items-center gap-2"
                            >
                              Join HR Interview <ExternalLink size={18} />
                            </a>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Under Review":
        return { text: "Under Review", style: "bg-amber-50 text-amber-700 border border-amber-200" };
      case "Interview Scheduled":
      case "Shortlisted":
        return { text: status, style: "bg-blue-50 text-blue-700 border border-blue-200" };
      case "Accepted":
      case "Selected":
        return { text: "Selected", style: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      case "Rejected":
        return { text: "Rejected", style: "bg-red-50 text-red-700 border border-red-200" };
      default:
        return { text: status, style: "bg-slate-50 text-slate-600 border border-slate-200" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${config.style}`}>
      {config.text}
    </span>
  );
};

export default MyApplications;