import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, ExternalLink, Search, CheckCircle2, X, Lock, Check } from 'lucide-react';

export default function CompanyCertificates() {
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchCerts() {
      setLoading(true);
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
        const res = await fetch(`${apiBase}/company/certificates`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && isMounted) {
            setCerts(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load certificates:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCerts();
    return () => { isMounted = false; };
  }, []);

  const filteredCerts = certs.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.title || '').toLowerCase().includes(q) ||
      (c.recipient || c.student_name || '').toLowerCase().includes(q) ||
      (c.id || c.certificate_number || '').toLowerCase().includes(q) ||
      (c.college || c.institution_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cryptographically Verified Credentials</h1>
          <p className="text-sm text-slate-400 mt-1">
            Zero-knowledge cryptographic certifications sealed to the sovereign academic ledger.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search credentials or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input w-full text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCerts.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
            <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {certs.length === 0 ? 'No verified certificates available yet.' : 'No credentials matched your search.'}
            </p>
          </div>
        ) : (
          filteredCerts.map(cert => (
          <div
            key={cert.id}
            className="company-card p-5 flex items-start gap-4 cursor-pointer hover:border-cyan-500/40 transition-all"
            onClick={() => setSelectedCert(cert)}
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm leading-snug">{cert.title}</h3>
                  <p className="text-xs text-cyan-300 mt-0.5">{cert.recipient} • {cert.college}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/5 my-3 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Issuer:</span>
                  <span>{cert.issuer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ledger Block:</span>
                  <span className="font-mono text-slate-300">{cert.block}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Issued: {cert.date}</span>
                <span className="font-mono text-cyan-400 font-semibold">{cert.id}</span>
              </div>
            </div>
          </div>
        ))
      )}
      </div>

      {/* CREDENTIAL PROOF VERIFICATION MODAL (Phase 16) */}
      {selectedCert && (
        <div className="company-modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="company-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    Sovereign Credential Attestation
                  </h2>
                  <span className="text-xs text-emerald-300 font-mono">
                    {selectedCert.id} • Cryptographically Sealed
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block mb-1">
                  Tamper-Proof Verification Verified
                </span>
                <h3 className="text-base font-bold text-white mb-0.5">{selectedCert.title}</h3>
                <p className="text-cyan-300 font-semibold">{selectedCert.recipient}</p>
                <span className="text-[11px] text-slate-400 block mt-1">{selectedCert.college}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Issuing Authority</span>
                  <span className="text-xs font-bold text-white mt-1 block">{selectedCert.issuer}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Date Attested</span>
                  <span className="text-xs font-bold text-white mt-1 block">{selectedCert.date}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Ledger Transaction Hash</span>
                <p className="font-mono text-[11px] text-cyan-300 break-all bg-black/30 p-2 rounded border border-cyan-500/20">
                  {selectedCert.txHash}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>{selectedCert.block}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Consensus Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="company-btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
