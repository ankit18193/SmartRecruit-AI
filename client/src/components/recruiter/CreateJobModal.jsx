import React, { useState } from 'react';
import { X, Loader2, Building2, Briefcase, Calendar, MapPin, Users, IndianRupee, Target } from 'lucide-react';
import API from '../../services/api';
import toast from 'react-hot-toast';

const CreateJobModal = ({ isOpen, onClose, onJobCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '', 
    department: '',  
    description: '',
    requiredSkills: '', 
    experienceRequired: 0, 
    jobType: 'Full-time', 
    workplaceType: 'Remote', 
    openings: 1, 
    applicationDeadline: '', 
    location: '',
    salary: ''
  });

  if (!isOpen) return null;

  
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()).filter(s => s !== ''),
        experienceRequired: Number(formData.experienceRequired),
        openings: Number(formData.openings)
      };

      const response = await API.post('/jobs', payload);
      toast.success("Job posted successfully!");
      onJobCreated(response.data); 
      onClose(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] animate-[scaleIn_0.2s_ease-out]">
        
       
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Post a New Role</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Attract top talent with AI precision</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

       
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="jobForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Briefcase size={14}/> Job Title *</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800"
                  placeholder="e.g. Senior MERN Developer"
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Building2 size={14}/> Company Name *</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800"
                  placeholder="e.g. Google, TechCorp"
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Department</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Engineering"
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Openings *</label>
                  <input 
                    type="number" min="1" required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 3"
                    value={formData.openings}
                    onChange={(e) => setFormData({...formData, openings: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Deadline *</label>
                  <input 
                    type="date" required min={today}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-700"
                    onChange={(e) => setFormData({...formData, applicationDeadline: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Experience (Yrs) *</label>
                  <input 
                    type="number" min="0" required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 2"
                    onChange={(e) => setFormData({...formData, experienceRequired: e.target.value})}
                  />
                </div>
              </div>
            </div>

            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Job Type</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium cursor-pointer"
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Workplace</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium cursor-pointer"
                    onChange={(e) => setFormData({...formData, workplaceType: e.target.value})}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><MapPin size={14}/> Location</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Bangalore"
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><IndianRupee size={14}/> Salary</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 10L - 15L"
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Target size={14}/> Required Skills *</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
                  placeholder="React, Node.js, MongoDB (comma separated)"
                  onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                />
              </div>

            </div>

           
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Job Description *</label>
              <textarea 
                required
                rows="4"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium resize-none leading-relaxed"
                placeholder="Describe the responsibilities, expectations, and perks of the role. You can use bullet points."
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </form>
        </div>

        
        <div className="px-8 py-5 border-t border-slate-100 bg-gray-50/50 rounded-b-3xl shrink-0 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="jobForm"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Publish Job"}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CreateJobModal;