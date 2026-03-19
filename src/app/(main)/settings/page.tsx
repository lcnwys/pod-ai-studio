'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import PageHeader from '@/components/layout/PageHeader';
import axios from 'axios';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveKeys = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.put('/api/settings', { accessKey, secretKey, callbackUrl });
      setMessage('配置已保存');
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="设置" description="系统配置与 API Key 管理" />

      <div className="max-w-2xl space-y-6">
        {/* API Keys */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">创次元 API 配置</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Access Key</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="AK_xxxx"
                className="input-field font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Secret Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="SK_xxxx"
                className="input-field font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">回调地址 (Callback URL)</label>
              <input
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://your-domain.com/api/callback"
                className="input-field font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveKeys} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? '保存中...' : '保存配置'}
              </button>
              {message && <span className="text-sm text-gray-400">{message}</span>}
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">账户信息</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">邮箱</span>
              <span className="text-white font-medium">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">名称</span>
              <span className="text-white font-medium">{user?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">当前套餐</span>
              <span className="text-white font-medium">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">账户余额</span>
              <span className="text-white font-medium">¥0.00</span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass-card p-6 border-red-500/20">
          <h3 className="text-base font-semibold text-red-400 mb-4">危险操作</h3>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </>
  );
}
