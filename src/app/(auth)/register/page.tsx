'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/register', { email, password, name });
      router.push('/login?registered=1');
    } catch (err: any) {
      const message = err.response?.data?.error || '注册失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">注册 POD AI Studio</h1>
          <p className="text-sm text-gray-500 mt-1">创建你的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字" className="input-field" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位" className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '注册中...' : '注册'}
          </button>
          <p className="text-center text-xs text-gray-500">
            已有账号？<Link href="/login" className="text-indigo-400 hover:text-indigo-300">登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
