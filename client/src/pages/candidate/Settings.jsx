import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/sideBar";
import { 
  Bell, Lock, Eye, AlertTriangle, Shield, 
  Save, X, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API from "../../services/api"; 

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [jobAlerts, setJobAlerts] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/users/me");
        
        if (data?.settings) {
          setJobAlerts(data.settings.jobAlerts ?? true);
          setAppUpdates(data.settings.appUpdates ?? true);
          setProfileVisible(data.settings.profileVisible ?? true);
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
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out shadow-inner ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <div 
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`} 
      />
    </div>
  );

  
  const handleSaveSettings = async () => {
    try {
      const updatedSettings = {
        settings: { jobAlerts, appUpdates, profileVisible, twoFactor }
      };

      await API.put("/users/update", updatedSettings);
      toast.success("Settings saved successfully! ⚙️");
    } catch (error) {
      console.error("Update Settings Error:", error);
      toast.error("Failed to save settings");
    }
  };

  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    
    try {
      setPasswordLoading(true);
      
      await API.put("/users/password", { 
        oldPassword: passwords.oldPassword, 
        newPassword: passwords.newPassword 
      });
      
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  
  const handleDeleteAccount = async () => {
    try {
      
      await API.delete("/users/me");
      toast.success("Account deleted permanently. Goodbye! ");
      
      
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      toast.error("Failed to delete account");
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        
        <header className="h-20 bg-white border-b flex items-center px-10 shrink-0 shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Account Settings</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your preferences and security</p>
          </div>
        </header>

        
        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease]">

            
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Bell size={20} /></div>
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Job Alerts</p>
                    <p className="text-xs text-gray-500 mt-1">Get emails when new jobs match your skills.</p>
                  </div>
                  <ToggleSwitch enabled={jobAlerts} setEnabled={setJobAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Application Updates</p>
                    <p className="text-xs text-gray-500 mt-1">Notify me when a recruiter views my profile.</p>
                  </div>
                  <ToggleSwitch enabled={appUpdates} setEnabled={setAppUpdates} />
                </div>
              </div>
            </div>

           
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Eye size={20} /></div>
                <h3 className="text-lg font-bold text-gray-800">Privacy & Visibility</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Public Profile</p>
                  <p className="text-xs text-gray-500 mt-1">Allow recruiters to find your profile in searches.</p>
                </div>
                <ToggleSwitch enabled={profileVisible} setEnabled={setProfileVisible} />
              </div>
            </div>

            
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Shield size={20} /></div>
                <h3 className="text-lg font-bold text-gray-800">Security</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <ToggleSwitch enabled={twoFactor} setEnabled={setTwoFactor} />
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-100 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Lock size={16} /> Change Password
                  </button>
                </div>
              </div>
            </div>

            
            <div className="bg-white rounded-[2rem] p-8 border border-red-100 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-red-50 opacity-50 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={20} /></div>
                  <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
                </div>
                <p className="text-sm text-gray-600 mb-5">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm font-bold text-red-600 bg-white border-2 border-red-100 px-5 py-2.5 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>

        
            <div className="flex justify-end pt-4 pb-10">
              <button 
                onClick={handleSaveSettings}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Save size={18} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      </main>

      
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-[scaleIn_0.2s_ease]">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={20} className="text-blue-500"/> Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Current Password</label>
                <input 
                  type="password" required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={passwords.oldPassword} onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">New Password</label>
                <input 
                  type="password" required minLength="6"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Confirm New Password</label>
                <input 
                  type="password" required minLength="6"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                />
              </div>
              
              <button 
                type="submit" disabled={passwordLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex justify-center mt-2 disabled:bg-blue-400"
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-[scaleIn_0.2s_ease]">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Are you absolutely sure?</h2>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;