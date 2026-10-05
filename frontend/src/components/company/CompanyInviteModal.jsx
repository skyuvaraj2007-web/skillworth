import React, { useState } from 'react';
import { X, Send, Sparkles, Briefcase } from 'lucide-react';

export default function CompanyInviteModal({ student, opportunities = [], onClose, onSendInvite }) {
  const [selectedOppId, setSelectedOppId] = useState(
    opportunities[0]?.oppId || opportunities[0]?.id || ''
  );
  const [personalNote, setPersonalNote] = useState(
    `Hi ${student?.name || 'Candidate'}, your verified skills and project proofs directly align with our team. We would like to fast-track your application.`
  );

  if (!student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetOpp = opportunities.find(o => (o.oppId || o.id) === selectedOppId) || opportunities[0];
    onSendInvite(student, targetOpp, personalNote);
    onClose();
  };

  return (
    <div className="company-modal-overlay">
      <div className="company-modal-content max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Fast-Track Opportunity Invitation</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Target Candidate:</span>
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
              <img
                src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={student.name}
                className="w-8 h-8 rounded-full object-cover border border-cyan-500/30"
              />
              <div>
                <span className="font-bold text-white block">{student.name}</span>
                <span className="text-[11px] text-slate-400">{student.department} • {student.collegeName}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">Select Opportunity</label>
            <select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="company-select w-full text-xs"
            >
              {opportunities.map(opp => (
                <option key={opp.oppId || opp.id} value={opp.oppId || opp.id}>
                  {opp.title} ({opp.type || 'Internship'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">Personalized Recruiter Note</label>
            <textarea
              rows="3"
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="company-textarea w-full text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button type="button" onClick={onClose} className="company-btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="company-btn-gradient text-xs">
              <Send className="w-3.5 h-3.5" />
              <span>Transmit Invitation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
