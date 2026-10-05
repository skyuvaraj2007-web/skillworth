import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, ShieldCheck, FolderGit2, ExternalLink, BookOpen, Building2, User, X, AlertCircle } from 'lucide-react';
import { nexusApiClient } from '../../services/nexusApiClient';

export default function CompanyCourseLearnerProfile({ courseId, studentId, onClose, onShowToast }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLearnerProfile() {
      setLoading(true);
      try {
        const res = await nexusApiClient.getCompanyCourseLearnerProfile(courseId, studentId);
        if (res) {
          setProfileData(res);
        } else {
          setProfileData(null);
        }
      } catch (err) {
        console.error('Error fetching company course learner profile:', err);
        if (onShowToast) onShowToast({ title: 'Error', message: 'Failed to load learner profile for this course.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    if (courseId && studentId) {
      fetchLearnerProfile();
    }
  }, [courseId, studentId]);

  if (!courseId || !studentId) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: '20px', top: '20px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading Course Learner Profile...</div>
        ) : !profileData ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '8px' }} />
            <div>No enrollment profile found for this student and course.</div>
          </div>
        ) : (
          <div>
            {/* Top Header Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-cyan, #00f2fe)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <BookOpen size={14} />
                    <span>Company-Owned Course Learner Record</span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '4px 0' }}>{profileData.studentName}</h2>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span>Student ID: <strong style={{ color: '#cbd5e1' }}>{profileData.studentId}</strong></span>
                    <span>College: <strong style={{ color: '#cbd5e1' }}>{profileData.institutionName} ({profileData.institutionId})</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Title</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>{profileData.courseTitle}</div>
                </div>
              </div>

              {/* Progress Metric */}
              <div style={{ marginTop: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Course Progress</span>
                  <span style={{ color: '#10b981', fontWeight: '800' }}>{profileData.progress}% Complete</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${profileData.progress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Course-Related Projects Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FolderGit2 size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Course-Related Student Projects</h3>
              </div>

              {(!profileData.courseProjects || profileData.courseProjects.length === 0) ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
                  No course-specific projects submitted yet for this course.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profileData.courseProjects.map((proj, idx) => (
                    <div key={proj.projectId || idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{proj.title}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{proj.description}</div>
                        </div>
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', color: '#38bdf8', fontSize: '11px', textDecoration: 'none', fontWeight: '600' }}
                          >
                            <span>View Repo</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {Array.isArray(proj.skills) && proj.skills.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                          {proj.skills.map((sk, sIdx) => (
                            <span key={sIdx} style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: '#cbd5e1' }}>
                              {typeof sk === 'object' ? sk.name : sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* College-Verified Certificate Section */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>College Certificate Verification Status</h3>
              </div>

              {!profileData.certificate ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                  Course incomplete. Certificate will be issued upon 100% course completion and submitted to college for verification.
                </div>
              ) : profileData.certificate.status === 'VERIFIED' ? (
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#4ade80' }}>✓ Verified by College Management</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase' }}>Certificate ID</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#fff' }}>{profileData.certificate.certificateId}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase' }}>Verification Date</div>
                      <div>{profileData.certificate.verifiedAt ? new Date(profileData.certificate.verifiedAt).toLocaleDateString() : 'Verified'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase' }}>Verified By Authority</div>
                      <div>{profileData.certificate.verifiedBy || profileData.institutionName}</div>
                    </div>
                  </div>

                  {profileData.certificate.verificationHash && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: '#94a3b8' }}>
                      Cryptographic Verification Hash: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{profileData.certificate.verificationHash}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Clock size={18} style={{ color: '#facc15' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#facc15' }}>Verification Pending by {profileData.institutionName}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    The student has completed 100% of this course. Certificate verification is currently pending review by their college management ({profileData.institutionName}). Full certificate credentials and digital badges will be automatically shared here upon college verification.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
