import React from 'react';
import { X, CheckCircle2, AlertCircle, Target, Sparkles } from 'lucide-react';

const AIInsightsModal = ({ isOpen, onClose, application }) => {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="p-6 bg-slate-50/50 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gemini AI Analysis</h3>
              <p className="text-sm text-slate-500 font-medium">{application.candidateId?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all shadow-sm group">
            <X size={20} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-3xl">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Match Score</p>
              <p className="text-4xl font-black text-blue-700">{application.fitmentScore}%</p>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-3xl">
              <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest mb-1">Experience</p>
              <p className="text-2xl font-black text-purple-700">{application.experienceRelevance}</p>
            </div>
          </div>

          
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-lg">
              <CheckCircle2 className="text-green-500" size={20} /> Key Strengths 
            </h4>
            <div className="space-y-2">
              {application.strengths?.map((s, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600 font-medium">
                  {s}
                </div>
              ))}
            </div>
          </section>

          
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-lg">
              <AlertCircle className="text-amber-500" size={20} /> Missing Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {application.missingSkills?.map((skill, i) => (
                <span key={i} className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          
          <section>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-lg">
              <Target className="text-blue-500" size={20} /> Suggested Improvements
            </h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 font-medium ml-2">
              {application.improvements?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;
