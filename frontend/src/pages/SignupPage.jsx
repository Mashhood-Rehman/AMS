import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'STUDENT'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup attempt:', formData);
    // API integration will go here later
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1 pl-1" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all text-sm"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1 pl-1" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all text-sm"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1 pl-1" htmlFor="role">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all appearance-none text-sm"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            value={formData.role}
            onChange={handleChange}
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1 pl-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all text-sm"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg hover:bg-brand-hover transform active:scale-[0.98] transition-all shadow-md"
        >
          Create Account
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-slate-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-dark hover:underline font-semibold transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
};

export default SignupPage;
