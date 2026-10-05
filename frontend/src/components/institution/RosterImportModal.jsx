import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  AlertTriangle,
  Users
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function RosterImportModal({ institution, onClose, onSuccess, onShowToast }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      await academicService.downloadTemplate();
      if (onShowToast) {
        onShowToast({ title: 'Template Downloaded', message: 'Official SkillNexus roster template ready.', type: 'success' });
      }
    } catch (err) {
      setError('Could not download template: ' + err.message);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      setError('Please upload a valid CSV file (.csv)');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        analyzeContent(content, selectedFile.name);
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file.');
    };
    reader.readAsText(selectedFile);
  };

  const analyzeContent = async (content, fName) => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await academicService.previewRoster(content, fName);
      if (!res.success && res.message && !res.rows) {
        setError(res.message);
      } else {
        setPreviewData(res);
      }
    } catch (err) {
      setError(err.message || 'Error parsing file preview.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!previewData?.errors || previewData.errors.length === 0) return;
    const headers = ['Row Number,Roll Number,Student Name,Email,Validation Errors'];
    const rows = previewData.errors.map(e => 
      `"${e.rowNumber}","${e.rollNumber}","${e.studentName}","${e.email}","${e.errors.join('; ')}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Roster_Validation_Errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCommitImport = async () => {
    if (!previewData || !Array.isArray(previewData.rows) || previewData.rows.length === 0) {
      setError('No valid rows available to import.');
      return;
    }
    setCommitting(true);
    setError(null);
    try {
      const res = await academicService.confirmRosterImport(previewData.rows, fileName);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Roster Synchronized',
            message: `Successfully processed ${res.summary.totalRows} students: ${res.summary.newCount} new, ${res.summary.updatedCount} updated, ${res.summary.unchangedCount} unchanged.`,
            type: 'success'
          });
        }
        if (onSuccess) onSuccess(res);
        if (onClose) onClose();
      } else {
        setError(res.message || 'Failed to complete roster import.');
      }
    } catch (err) {
      setError(err.message || 'Server error during roster commit.');
    } finally {
      setCommitting(false);
    }
  };

  const metrics = previewData?.metrics || {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    newCount: 0,
    updatedCount: 0,
    unchangedCount: 0,
    duplicateRows: 0
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.96))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6, 182, 212, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                PostgreSQL Authoritative Roster
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Campus: {institution?.collegeId || 'TN010'}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Bulk Student Cohort Import & Synchronization
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Top action: template download */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            marginBottom: '18px'
          }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Need the official format?
              </span>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Required headers: Student Name, College Email, Roll Number, Phone Number, Department, Batch, Graduation Year
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="btn-cyber-outline"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <Download size={14} />
              <span>Download CSV Template</span>
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              color: 'var(--cyber-coral)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(6, 182, 212, 0.02)',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyber-cyan)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--cyber-cyan)'
            }}>
              {analyzing ? <RefreshCw className="spin" size={24} /> : <Upload size={24} />}
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {fileName ? fileName : 'Click to select or drag & drop cohort CSV file'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Supports CSV / TSV files with UTF-8 encoding
            </div>
          </div>

          {/* Analysis & Metrics Dashboard */}
          {previewData && (
            <div>
              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '10px',
                marginBottom: '18px'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.totalRows}</div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--cyber-emerald)', textTransform: 'uppercase' }}>Valid Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-emerald)' }}>{metrics.validRows}</div>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--cyber-cyan)', textTransform: 'uppercase' }}>New Students</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-cyan)' }}>{metrics.newCount}</div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--cyber-amber)', textTransform: 'uppercase' }}>Updated</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-amber)' }}>{metrics.updatedCount}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unchanged</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)' }}>{metrics.unchangedCount}</div>
                </div>
                {metrics.invalidRows > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--cyber-coral)', textTransform: 'uppercase' }}>Invalid / Errors</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-coral)' }}>{metrics.invalidRows}</div>
                  </div>
                )}
              </div>

              {/* Error report download bar if errors exist */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="var(--cyber-coral)" />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      Found <strong>{previewData.errors.length}</strong> validation errors. Invalid rows will be skipped during import.
                    </span>
                  </div>
                  <button
                    onClick={handleDownloadErrors}
                    className="btn-cyber-outline"
                    style={{ padding: '5px 12px', fontSize: '11.5px', borderColor: 'var(--cyber-coral)', color: 'var(--cyber-coral)' }}
                  >
                    <Download size={13} />
                    <span>Download Error Report CSV</span>
                  </button>
                </div>
              )}

              {/* Diff Preview Table */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Previewing Verified Rows ({previewData.rows.length})
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        <th style={{ padding: '8px 12px' }}>Roll Number</th>
                        <th style={{ padding: '8px 12px' }}>Student Name</th>
                        <th style={{ padding: '8px 12px' }}>College Email</th>
                        <th style={{ padding: '8px 12px' }}>Department</th>
                        <th style={{ padding: '8px 12px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{r.rollNumber}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.email}</td>
                          <td style={{ padding: '8px 12px' }}>{r.department}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span className={`cyber-badge ${
                              r.action === 'NEW' ? 'badge-blue' : r.action === 'UPDATED' ? 'badge-purple' : 'badge-emerald'
                            }`} style={{ fontSize: '9px' }}>
                              {r.action || 'NEW'}
                            </span>
                            {r.diffNote && (
                              <span style={{ fontSize: '10px', color: 'var(--cyber-amber)', marginLeft: '6px' }}>
                                {r.diffNote}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6, 182, 212, 0.02)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-cyber-outline"
            style={{ padding: '8px 18px', fontSize: '12.5px' }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!previewData || previewData.rows.length === 0 || committing}
            onClick={handleCommitImport}
            className="btn-cyber-primary"
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              opacity: (!previewData || previewData.rows.length === 0 || committing) ? 0.5 : 1
            }}
          >
            {committing ? (
              <>
                <RefreshCw className="spin" size={14} />
                <span>Committing to PostgreSQL...</span>
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                <span>Commit & Synchronize Roster ({previewData?.rows?.length || 0} Students)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
