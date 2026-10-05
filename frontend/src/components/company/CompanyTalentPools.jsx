import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Users,
  MessageSquare,
  Send,
  Download,
  Trash2,
  ChevronRight,
  Sparkles,
  UserPlus,
  X
} from 'lucide-react';

export default function CompanyTalentPools({ onSelectPool, onTabSelect, onShowToast }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolTags, setNewPoolTags] = useState('');

  const fetchPools = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const res = await fetch(`${apiBase}/company/talent-pools`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          const colors = ['#28D7FF', '#3478FF', '#8B5CF6', '#2FE0A1', '#FF9D4D', '#EC4899'];
          setPools(json.data.map((p, idx) => ({
            id: p.id,
            name: p.name,
            count: p.candidateCount || p.candidate_count || 0,
            tags: Array.isArray(p.tags) ? p.tags : (p.description ? [p.description] : ['Talent Pool']),
            color: colors[idx % colors.length]
          })));
        }
      }
    } catch (err) {
      console.warn('Failed to load talent pools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!newPoolName.trim()) return;

    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const tags = newPoolTags.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${apiBase}/company/talent-pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ name: newPoolName.trim(), description: tags.join(', ') })
      });

      if (res.ok) {
        setNewPoolName('');
        setNewPoolTags('');
        setIsCreateModalOpen(false);
        fetchPools();
        if (onShowToast) {
          onShowToast({
            title: 'Talent Pool Created',
            message: `Talent Pool "${newPoolName.trim()}" is now ready.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleAction = (action, pool) => {
    if (action === 'Message') {
      onTabSelect('messages');
    } else if (action === 'Invite') {
      if (onShowToast) {
        onShowToast({
          title: 'Bulk Invites Dispatched',
          message: `Dispatched campaign invitations to ${pool.count} candidates in "${pool.name}".`,
          type: 'success'
        });
      }
    } else if (action === 'Export') {
      if (onShowToast) {
        onShowToast({
          title: 'Export Generated',
          message: `CSV candidate dataset for "${pool.name}" exported successfully.`,
          type: 'success'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 13. Screen 7 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Talent Pools</h1>
          <p className="text-sm text-slate-400 mt-1">
            Curated high-potential candidate pipelines segmented by specialization and readiness.
          </p>
        </div>

        <button
          type="button"
          className="company-btn-gradient"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Create Talent Pool</span>
        </button>
      </div>

      {/* Grid of Pool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pools.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No talent pools created yet. Click "Create Talent Pool" to segment candidates.
            </p>
          </div>
        ) : (
          pools.map(pool => (
          <div key={pool.id} className="company-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pool.color}20`, color: pool.color }}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {pool.count} Students
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{pool.name}</h3>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {pool.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-1 text-xs">
              <button
                type="button"
                onClick={() => onTabSelect('students')}
                className="btn-cyber-outline"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Add Students to Pool"
              >
                <UserPlus size={12} />
                <span>Add</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('Message', pool)}
                className="btn-cyber-outline"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Broadcast Message to Pool"
              >
                <MessageSquare size={12} />
                <span>Message</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('Invite', pool)}
                className="btn-cyber-primary"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Invite Candidates to Opportunity"
              >
                <Send size={12} />
                <span>Invite</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('Export', pool)}
                className="btn-cyber-outline"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Export CSV"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        ))
      )}
      </div>

      {/* CREATE TALENT POOL MODAL */}
      {isCreateModalOpen && (
        <div className="company-modal-overlay">
          <div className="company-modal-content max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white">Create New Talent Pool</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity Engineers"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  className="company-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Cryptography, PenTesting, Python, Linux"
                  value={newPoolTags}
                  onChange={(e) => setNewPoolTags(e.target.value)}
                  className="company-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="company-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="company-btn-gradient text-xs"
                >
                  Create Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
