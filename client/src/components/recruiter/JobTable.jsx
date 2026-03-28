import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Trash2, Edit, Briefcase, MapPin, CalendarDays, Building2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteJob } from '../../services/api';

const JobTable = ({ jobs, onJobDeleted, onEditClick }) => {
  const navigate = useNavigate();

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job? This cannot be undone.")) return;
    try {
      await deleteJob(jobId);
      toast.success("Job deleted successfully");
      onJobDeleted(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
          <Briefcase size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">No active roles</h3>
        <p className="text-sm text-gray-500 mt-2">Post your first role to start receiving applications!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 w-2/5">Role & Company</th>
              <th className="p-6">Details</th>
              <th className="p-6">Deadline</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <tr 
                key={job._id} 
                onClick={() => navigate(`/recruiter/job/${job._id}`)} 
                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
              >
                
                
                <td className="p-6 align-top">
                  <p className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-500 bg-slate-100 text-[10px] font-semibold">
                      <Building2 size={10} /> {job.companyName || 'Not Specified'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-blue-600 bg-blue-50 text-[10px] font-semibold border border-blue-100">
                      <Users size={10} /> {job.openings || 1} Opening(s)
                    </span>
                    {job.department && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-500 bg-slate-100 text-[10px] font-semibold">
                        {job.department}
                      </span>
                    )}
                  </div>
                </td>
                
                
                <td className="p-6 align-top">
                  <div className="flex flex-col items-start gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                      <MapPin size={12} />
                      {job.location || 'Remote'} ({job.workplaceType || 'Remote'})
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                      <Briefcase size={12} />
                      {job.jobType || 'Full-time'}
                    </span>
                  </div>
                </td>

                
                <td className="p-6 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Ends
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-red-500">
                      <CalendarDays size={16} />
                      {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'No Deadline'}
                    </div>
                  </div>
                </td>

                
                <td className="p-6 align-top text-right">
                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditClick(job); }}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit Job"
                    >
                      <Edit size={18} />
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(job._id); }}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Job"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                  </div>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;