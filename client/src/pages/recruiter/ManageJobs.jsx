import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/sideBar';
import JobTable from '../../components/recruiter/JobTable';
import CreateJobModal from '../../components/recruiter/CreateJobModal';
import { Plus, Briefcase, Loader2 } from 'lucide-react';
import { fetchMyJobs } from '../../services/api'; 
import { toast } from 'react-hot-toast';

const ManageJobs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const loadJobs = async () => {
    try {
      setLoading(true);

      const response = await fetchMyJobs(); 
      setJobs(response.data || []);

    } catch (error) {
      console.error("Error fetching recruiter jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleEditClick = (job) => {
    toast.success(`Edit feature coming in the next update for ${job.title}!`);
  };

  return (
    <div className="flex h-screen bg-brand-light font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-8 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Manage Jobs</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-105"
          >
            <Plus size={18} strokeWidth={3} />
            Post New Job
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Job Listings</h2>
              <p className="text-slate-500 text-sm mt-1">
                View, edit, or delete your active job postings.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            ) : (
              <JobTable
                jobs={jobs}
                onJobDeleted={loadJobs}
                onEditClick={handleEditClick}
              />
            )}
          </div>
        </div>
      </main>

      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJobCreated={loadJobs}
      />
    </div>
  );
};

export default ManageJobs;
