import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import {
  UserPlus, Loader2, User, Mail, Lock,
  ChevronRight, ShieldCheck, ArrowLeft, Briefcase
} from 'lucide-react';

const Signup = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate'
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRole = params.get('role');
    const urlError = params.get('error');

    if (urlError) {
      toast.error("Social Authentication Failed!");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (urlToken && urlRole) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('role', urlRole);

      toast.success("Successfully logged in!");

     
      window.history.replaceState({}, document.title, window.location.pathname);

      const userRole = String(urlRole).toLowerCase();

      
      navigate(
        userRole === 'recruiter' ? '/dashboard' : '/my-applications',
        { replace: true }
      );
    }
  }, [navigate]);

  
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  
  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  
  const handleSocialLogin = (platform) => {
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    if (platform === 'Google') {
      window.location.href = `${BASE_URL}/auth/google?role=${formData.role}`;
    } else if (platform === 'LinkedIn') {
      toast.success("LinkedIn coming soon!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      await API.post('/auth/register', formData);

      toast.success("Account created successfully! Please login.");

      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-[100px]" />

      <div className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-200 mb-6 transform hover:-rotate-6 transition-transform">
            <UserPlus className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Get Started</h1>
          <p className="text-slate-500 font-medium mt-3">
            {step === 1 ? "How would you like to join us?" : `Create your ${formData.role} account`}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white">

          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <button
                onClick={() => handleRoleSelect('candidate')}
                className="w-full flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={24} />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-slate-800">I'm a Candidate</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Find jobs & track applications</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>

              <button
                onClick={() => handleRoleSelect('recruiter')}
                className="w-full flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-slate-800">I'm a Recruiter</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Post jobs & manage talent</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            </div>
          )}

          
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              
             
              <button 
                onClick={() => setStep(1)}
                className="flex items-center text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors mb-6 uppercase tracking-wider"
              >
                <ArrowLeft size={14} className="mr-1" /> Change Role
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="text" name="name" required placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium text-slate-700"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="email" name="email" required placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium text-slate-700"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="password" name="password" required placeholder="Min. 6 characters"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium text-slate-700"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : (
                    <>
                      <span>Create {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Account</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

             
              <div className="relative mt-8 mb-6 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative px-4 bg-white/0 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Or signup with
                </span>
              </div>

              <div className="flex justify-center gap-5 mb-6">
                <button
                  onClick={() => handleSocialLogin('Google')} type="button"
                  className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-6 h-6" alt="Google" />
                </button>

                <button
                  onClick={() => handleSocialLogin('LinkedIn')} type="button"
                  className="w-14 h-14 bg-[#0077B5] rounded-full flex items-center justify-center shadow-md hover:bg-[#006396] transition-all hover:-translate-y-1"
                >
                  <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-6 h-6 invert" alt="LinkedIn" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 justify-center">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>By joining, you agree to our terms & policies.</span>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Already a member? <Link to="/login" className="text-blue-600 font-black hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;