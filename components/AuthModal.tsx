import React, { useState } from 'react';
import { X, Mail, Lock, User, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import { StaffMember } from '../types';
import { subscribeToStaff } from '../services/db';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { name: string; email: string; role: 'student' | 'admin' | 'manager' }) => void;
}

const PRIMARY_ADMIN = {
  email: 'r29878448@gmail.com',
  password: 'Admin@123'
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const inputEmail = formData.email.trim().toLowerCase();
    const inputPassword = formData.password;

    setTimeout(() => {
      // 1. Primary Admin Check
      if (isLogin && inputEmail === PRIMARY_ADMIN.email.toLowerCase()) {
        if (inputPassword === PRIMARY_ADMIN.password) {
          onAuthSuccess({
            name: 'Primary Administrator',
            email: PRIMARY_ADMIN.email,
            role: 'admin'
          });
          setIsLoading(false);
          return;
        } else {
          setError('Invalid administrator credentials.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Dynamic Manager/Staff Check from Firestore
      // For simplicity in this structure, we'll use the subscribe method to get a snapshot, 
      // though in a massive app you'd use getDocs(query(...)) directly. 
      // Given the small staff size, this is efficient enough.
      const unsubscribe = subscribeToStaff((staffList) => {
        if (isLogin) {
          const matchedMember = staffList.find(s => s.email.toLowerCase() === inputEmail);
          
          if (matchedMember) {
             const validPassword = matchedMember.password || 'Staff@123';
             
             if (inputPassword === validPassword) {
               onAuthSuccess({
                 name: matchedMember.name,
                 email: matchedMember.email,
                 role: matchedMember.role
               });
               setIsLoading(false);
               unsubscribe(); // Cleanup
               return;
             } else {
               setError('Invalid password for faculty account.');
               setIsLoading(false);
               unsubscribe(); // Cleanup
               return;
             }
          }
        }

        // 3. Standard Student Logic (Fallback if not staff)
        if (!isLogin || isLogin) { 
          if (inputEmail.includes('admin') && !inputEmail.includes('student')) {
             setError('Unauthorized access for administrative account.');
             setIsLoading(false);
             unsubscribe();
             return;
          }

          onAuthSuccess({
            name: formData.name || 'Student Learner',
            email: inputEmail,
            role: 'student'
          });
          setIsLoading(false);
          unsubscribe();
        }
      });
      
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
          <X size={20} />
        </button>

        <div className="p-10">
          <div className="text-center mb-10 text-left">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-xl shadow-blue-500/30">
              S
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Access Portal' : 'Join Academic Hub'}
            </h2>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Global Study Management</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-fadeIn">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input 
                type="text" placeholder="Full Name" required
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            )}
            <input 
              type="email" placeholder="Email Address" required
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <input 
              type="password" placeholder="Password" required
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLogin ? 'Enter Portal' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-8 text-xs font-black text-slate-400 uppercase tracking-widest">
            {isLogin ? "New Learner?" : "Already Registered?"}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 text-blue-600 hover:underline">
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;