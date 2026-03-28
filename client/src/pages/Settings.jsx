import React, { useState, useEffect } from "react";
// 🔥 FIXED PATH: Based on your folder structure (recruiter/ folder is 2 levels deep from src)
import Sidebar from "../components/common/sideBar";
import { 
  Bell, Lock, Eye, AlertTriangle, Shield, 
  Save, X, Loader2, Building2 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import API from "../services/api";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  
  const [applicantAlerts, setApplicantAlerts] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [companyPublic, setCompanyPublic] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role !== "recruiter") return <Navigate to="/" />;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const { data } = await API.get("/users/me");
        
        if (data?.settings) {
          setApplicantAlerts(data.settings.applicantAlerts ?? true);
          setInterviewReminders(data.settings.interviewReminders ?? true);
          setCompanyPublic(data.settings.companyPublic ?? true);
          setTwoFactor(data.settings.twoFactor ?? false);
        }
      } catch (error) {
        console.error("Fetch Settings Error:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const ToggleSwitch = ({ enabled, setEnabled }) => (
    <div 
      onClick={() => setEnabled(!enabled)}
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        enabled ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`} />
    </div>
  );

  const handleSaveSettings = async () => {
    try {
      const payload = {
        settings: { applicantAlerts, interviewReminders, companyPublic, twoFactor }
      };
      await API.put("/users/update", payload);
      toast.success("Settings updated successfully! ⚙️");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      setPasswordLoading(true);
      await API.put("/users/password", { 
        oldPassword: passwords.oldPassword, 
        newPassword: passwords.newPassword 
      });
      toast.success("Password changed!");
      setShowPasswordModal(false);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-slate-800">Recruiter Settings</h1>
            <p className="text-slate-500 font-medium">Manage your hiring workflow and security</p>
          </header>

          
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <Bell className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Hiring Alerts</h2>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">New Applicant Emails</p>
                  <p className="text-sm text-slate-500">Get notified immediately when someone applies.</p>
                </div>
                <ToggleSwitch enabled={applicantAlerts} setEnabled={setApplicantAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Interview Reminders</p>
                  <p className="text-sm text-slate-500">Daily alerts for scheduled candidate interviews.</p>
                </div>
                <ToggleSwitch enabled={interviewReminders} setEnabled={setInterviewReminders} />
              </div>
            </div>
          </section>

          
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <Building2 className="text-purple-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Company Visibility</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Public Company Profile</p>
                <p className="text-sm text-slate-500">Allow candidates to see company details on job posts.</p>
              </div>
              <ToggleSwitch enabled={companyPublic} setEnabled={setCompanyPublic} />
            </div>
          </section>

          
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <Shield className="text-emerald-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Security</h2>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add extra security to your recruiter account.</p>
                </div>
                <ToggleSwitch enabled={twoFactor} setEnabled={setTwoFactor} />
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-6 py-3 rounded-xl hover:bg-slate-200 transition-all"
              >
                <Lock size={16} /> Change Password
              </button>
            </div>
          </section>

          
          <div className="flex justify-end pt-4 pb-12">
            <button 
              onClick={handleSaveSettings}
              className="flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all"
            >
              <Save size={20} /> Save Recruiter Preferences
            </button>
          </div>

        </div>
      </main>

      
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Update Security</h2>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <input 
                type="password" placeholder="Current Password" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                value={passwords.oldPassword} onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
              />
              <input 
                type="password" placeholder="New Password" required minLength="6"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              />
              <input 
                type="password" placeholder="Confirm New Password" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              />
              <button 
                type="submit" disabled={passwordLoading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition flex justify-center disabled:bg-slate-400"
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={24} /> : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;