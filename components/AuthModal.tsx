
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { subscribeToStaff, registerOrUpdateStudent, getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { name: string; email: string; role: 'student' | 'admin' | 'manager' }) => void;
}

// Fallback for first-time login if no config exists in DB
const DEFAULT_ADMIN = {
  email: 'r29878448@gmail.com',
  password: 'Admin@123'
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const inputEmail = formData.email.trim().toLowerCase();
    const inputPassword = formData.password;

    const adminEmail = settings?.adminEmail?.toLowerCase() || DEFAULT_ADMIN.email.toLowerCase();
    const adminPassword = settings?.adminPassword || DEFAULT_ADMIN.password;

    setTimeout(() => {
      // 1. Master Admin Check
      if (isLogin && inputEmail === adminEmail) {
        if (inputPassword === adminPassword) {
          onAuthSuccess({ name: 'System Administrator', email: adminEmail, role: 'admin' });
          setIsLoading(false);
          return;
        } else {
          setError('Incorrect master password.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Staff Check (Sub-admins & Managers)
      const unsubscribe = subscribeToStaff((staffList) => {
        if (isLogin) {
          const matchedMember = staffList.find(s => s.email.toLowerCase() === inputEmail);
          if (matchedMember) {
             if (inputPassword === matchedMember.password) {
               onAuthSuccess({ name: matchedMember.name, email: matchedMember.email, role: matchedMember.role });
               setIsLoading(false);
               unsubscribe();
               return;
             } else {
               setError('Invalid credentials for staff account.');
               setIsLoading(false);
               unsubscribe();
               return;
             }
          }
        }

        // 3. Student Flow
        if (isLogin && inputEmail.includes('@')) {
           registerOrUpdateStudent(inputEmail, formData.name || 'Student').then((student) => {
             onAuthSuccess({ name: student.name, email: student.email, role: 'student' });
             setIsLoading(false);
             unsubscribe();
           });
           return;
        }

        if (!isLogin) {
            registerOrUpdateStudent(inputEmail, formData.name || 'New Learner').then((student) => {
                onAuthSuccess({ name: student.name, email: student.email, role: 'student' });
                setIsLoading(false);
                unsubscribe();
              });
              return;
        }

        setError('User not found. Please join the portal.');
        setIsLoading(false);
        unsubscribe();
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden relative border border-slate-200">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-none flex items-center justify-center text-white font-bold text-2xl mb-4 mx-auto shadow-xl">
               {settings?.appName?.charAt(0) || 'S'}
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-widest">{settings?.appName || 'Study Portal'}</p>
          </div>
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-tight flex items-center gap-3"><AlertCircle size={18} /> {error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <input type="text" placeholder="Full Name" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 font-bold text-slate-900 outline-none focus:border-blue-600" onChange={(e) => setFormData({...formData, name: e.target.value})} />}
            <input type="email" placeholder="Email" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 font-bold text-slate-900 outline-none focus:border-blue-600" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 font-bold text-slate-900 outline-none focus:border-blue-600" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-5 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-2">{isLoading && <Loader2 className="animate-spin" size={20} />}{isLogin ? 'Verify Access' : 'Create Account'}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center hover:text-blue-600 transition-colors">
            {isLogin ? "Need an account? Join Now" : "Already registered? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
