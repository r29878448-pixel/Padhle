
import React, { useState } from 'react';
import { User, Mail, Shield, Save, Camera, CheckCircle2, LogOut, Key, X, AlertCircle, Loader2 } from 'lucide-react';

interface ProfileSectionProps {
  user: { name: string; email: string; role: 'student' | 'admin' };
  onUpdate: (updatedUser: { name: string; email: string; role: 'student' | 'admin' }) => void;
  onLogout: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUpdate, onLogout }) => {
  const [formData, setFormData] = useState({ ...user });
  const [isSaved, setIsSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    
    if (!passwords.current) {
      setPassError('Current password is required.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPassError('New passwords do not match!');
      return;
    }
    if (passwords.new.length < 8) {
      setPassError('For security, new password must be at least 8 characters.');
      return;
    }

    setIsUpdatingPass(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdatingPass(false);
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
      alert("Your access credentials have been successfully updated.");
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn relative">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 h-48 relative">
          <div className="absolute -bottom-16 left-12">
            <div className="relative group">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] p-1 shadow-2xl">
                <div className="w-full h-full bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600">
                  <User size={64} strokeWidth={1.5} />
                </div>
              </div>
              <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-500 transition-all">
                <Camera size={18} />
              </button>
            </div>
          </div>
          <div className="absolute bottom-6 right-12">
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'}`}>
               {user.role} Status
             </span>
          </div>
        </div>

        <div className="pt-24 px-12 pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Identity & Security</h1>
              <p className="text-slate-500 font-medium">Manage your personal profile and account credentials.</p>
            </div>
            <button 
              onClick={onLogout}
              className="px-6 py-3 rounded-2xl border border-red-100 text-red-600 font-bold hover:bg-red-50 flex items-center gap-2 transition-all whitespace-nowrap self-start"
            >
              <LogOut size={18} /> End Session
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                  <Shield size={28} />
                </div>
                <div>
                  <p className="font-black text-slate-900">Security Credentials</p>
                  <p className="text-xs text-slate-500 font-medium">Protect your portal account with a strong password.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPasswordModal(true)}
                className="bg-white text-blue-600 font-black text-sm px-6 py-3 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
              >
                Change Password
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
              <div className={`flex items-center gap-2 text-green-600 font-bold transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
                <CheckCircle2 size={20} /> Identity updated successfully
              </div>
              <button 
                type="submit" 
                className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95"
              >
                <Save size={20} /> Save All Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Key className="text-blue-600" /> Security Reset
              </h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">Update your portal access credentials.</p>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              {passError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-fadeIn">
                  <AlertCircle size={18} /> {passError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={isUpdatingPass}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isUpdatingPass ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
