import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../../components/common/sideBar";
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Loader2,
  Building2,
  Users 
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-hot-toast";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  
  const [savedJobs, setSavedJobs] = useState([]); 
  
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role !== "candidate") return <Navigate to="/" />;

  

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        
        const [jobsRes, userRes] = await Promise.all([
          API.get("/jobs"),
          API.get("/users/me") 
        ]);

        const raw = jobsRes.data;

        const fetchedJobs =
          Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.jobs)
            ? raw.jobs
            : Array.isArray(raw?.data)
            ? raw.data
            : [];

        console.log("✅ JOBS:", fetchedJobs);
        setJobs(fetchedJobs);

        
        if (userRes.data?.savedJobs) {
          const savedIds = userRes.data.savedJobs.map(job => typeof job === 'object' ? job._id : job);
          setSavedJobs(savedIds);
        }

      } catch (error) {
        console.error("FETCH ERROR:", error);
        toast.error("Failed to load job board");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    const title = job.title || "";
    const titleMatch = title.toLowerCase().includes(term);

    
    const company = job.companyName || "";
    const companyMatch = company.toLowerCase().includes(term);

    const skillsData = job.skills || job.requiredSkills || [];

    let skillsMatch = false;

    if (Array.isArray(skillsData)) {
      skillsMatch = skillsData.some(skill =>
        (skill || "").toLowerCase().includes(term)
      );
    } else if (typeof skillsData === "string") {
      skillsMatch = skillsData.toLowerCase().includes(term);
    }

    return titleMatch || companyMatch || skillsMatch;
  });

  const handleSave = async (jobId) => {
    const isCurrentlySaved = savedJobs.includes(jobId);
    
   
    setSavedJobs(prev => isCurrentlySaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);

    try {
      const res = await API.patch(`/users/save/${jobId}`);
      if (res.data.saved) {
        toast.success("Job Saved!");
      } else {
        toast.success("Removed from Saved Jobs");
      }
    } catch (error) {
      
      setSavedJobs(prev => isCurrentlySaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
      toast.error("Failed to save job");
    }
  };

  

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
        
       
        <header className="h-20 bg-white border-b flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">Job Explorer</h2>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search jobs, skills, or company..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Discover Opportunities</h1>
            <p className="text-gray-500 text-sm mt-1">Browse and apply to the best roles tailored for you.</p>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed rounded-xl">
              <p className="text-gray-400 text-sm font-medium">No jobs found matching your criteria 😅</p>
              <button 
                onClick={() => setSearchTerm("")} 
                className="mt-3 text-xs text-blue-600 font-bold hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

              {filteredJobs.map(job => {

                
                const cleanSkills = (job.requiredSkills || [])
                  .filter(skill => 
                    skill && 
                    typeof skill === "string" && 
                    skill.length <= 25 && 
                    !skill.includes(" ")
                  )
                  .slice(0, 3);

                const isSaved = savedJobs.includes(job._id);

                return (
                  <div
                    key={job._id}
                    className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm 
                               hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 
                               transition-all duration-200 flex flex-col"
                  >

                    
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-1">
                          {job.title}
                        </h3>
                        
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                          <Building2 size={12} className="text-gray-400" />
                          {job.companyName || "Not Specified"}
                        </p>
                      </div>

                      <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Active Opening
                      </span>
                    </div>

                    
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400" />
                      {job.location || "Remote"} {job.workplaceType ? `(${job.workplaceType})` : ""}
                    </p>

                    
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      {job.openings || 1} Openings
                    </p>

                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cleanSkills.length > 0 ? (
                        cleanSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-1 rounded-full truncate max-w-[120px]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 py-1">
                          General requirements
                        </span>
                      )}
                    </div>

                    
                    <div className="mt-auto space-y-1.5 mb-5">
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Briefcase size={12} className="text-blue-400" /> 
                        Experience: <span className="font-medium text-gray-700">{job.experienceRequired || "0-2 yrs"}</span>
                      </p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <DollarSign size={12} className="text-green-400" /> 
                        Salary: <span className="font-medium text-gray-700">{job.salary || "Not disclosed"}</span>
                      </p>
                    </div>

                    
                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => navigate(`/job/${job._id}`)}
                        className="w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 
                                   hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                      >
                        View Details
                      </button>

                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(job._id);
                        }} 
                        className={`text-xs transition hover:scale-105 ${
                          isSaved 
                          ? "text-yellow-500 font-bold bg-yellow-50 px-3 py-2 rounded-lg whitespace-nowrap" 
                          : "text-gray-400 hover:text-gray-600 bg-gray-50 px-3 py-2 rounded-lg whitespace-nowrap"
                        }`}
                      >
                        {isSaved ? "Saved ⭐" : "Save ⭐"}
                      </button>
                      
                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrowseJobs;