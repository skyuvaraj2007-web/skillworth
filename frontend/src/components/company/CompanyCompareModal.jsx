import React from 'react';
import { X, GitCompare, ShieldCheck, Sparkles, Award, Check } from 'lucide-react';

export default function CompanyCompareModal({ students = [], onClose, onSelectStudent }) {
  if (!students || students.length === 0) return null;

  return (
    <div className="company-modal-overlay">
      <div className="company-modal-content max-w-4xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Side-by-Side Candidate Comparison</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-x-auto py-2">
          {students.map(s => {
            const match = s.aiMatchScore || 90;
            const readiness = s.readinessScore || 85;
            const progress = s.courseProgress || 80;
            const certs = s.certificatesCount || (s.certifications ? s.certifications.length : 4);

            return (
              <div key={s.studentId} className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={s.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                      alt={s.name}
                      className="w-12 h-12 rounded-full object-cover border border-cyan-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{s.name}</h4>
                      <span className="text-xs text-slate-400 block">{s.department} • {s.year}</span>
                      <span className="text-[11px] text-cyan-400">{s.collegeName || s.institutionName || 'College'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-y border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">AI Match Index:</span>
                      <span className="font-bold text-cyan-400 font-mono">{match}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Course Progress:</span>
                      <span className="font-mono text-slate-200">{progress}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Career Readiness:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{readiness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verified Certs:</span>
                      <span className="font-mono text-purple-400">{certs}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Top Verified Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(s.skills || []).slice(0, 4).map(sk => (
                        <span key={sk.name} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono">
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { onClose(); onSelectStudent(s); }}
                  className="company-btn-outline-cyan w-full justify-center text-xs mt-4 py-2"
                >
                  Inspect Full Profile
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
