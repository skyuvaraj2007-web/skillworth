import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  FolderTree,
  UserPlus,
  Edit,
  Eye,
  Key,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  GraduationCap,
  Shield,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  AlertTriangle
} from 'lucide-react';

export default function InstitutionStaffManagement({ institution, onShowToast }) {
  const [staffList, setStaffList] = useState([]);
  const [groupedStaff, setGroupedStaff] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' or 'roster'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [mappedStudents, setMappedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Departments & Classes lookup
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);

  // Form State for Add Staff
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    staffId: '',
    age: 35,
    departmentId: '',
    classId: '',
    designation: 'Assistant Professor',
    assignmentType: 'Class Advisor',
    phone: '',
    qualification: 'M.Tech, Ph.D',
    specialization: 'Artificial Intelligence & Distributed Systems',
    experience: '8 Years',
    joiningDate: new Date().toISOString().split('T')[0],
    gender: 'Male',
    bio: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Form State for Assign Class
  const [assignForm, setAssignForm] = useState({
    departmentId: '',
    classId: '',
    assignmentType: 'Class Advisor'
  });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const instId = institution?.collegeId || institution?.institutionId || institution?.id;

  // Load Staff Directory
  const loadStaffData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/institution/staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data || []);
        setGroupedStaff(data.grouped || {});
      } else {
        setError(data.message || 'Failed to fetch institution staff');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching staff');
    } finally {
      setLoading(false);
    }
  };

  // Load Departments and Classes for selectors
  const loadMetadata = async () => {
    if (!instId) return;
    try {
      const [deptRes, classRes] = await Promise.all([
        fetch(`/api/auth/institutions/${encodeURIComponent(instId)}/departments`),
        fetch('/api/institution/classes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` },
          credentials: 'include'
        })
      ]);
      const deptData = await deptRes.json();
      const classData = await classRes.json();
      if (deptData.success) setDepartments(deptData.data || []);
      if (classData.success) setClasses(classData.data || []);
    } catch (e) {
      console.warn('Metadata load note:', e.message);
    }
  };

  useEffect(() => {
    loadStaffData();
    loadMetadata();
  }, [instId]);

  // Handle Add Staff Submit
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.staffId) {
      onShowToast?.('Please complete all required fields.', 'error');
      return;
    }
    setSubmittingAdd(true);
    try {
      const res = await fetch('/api/institution/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.('Academician account created & matching students automatically mapped!', 'success');
        setShowAddStaffModal(false);
        setAddForm({
          name: '',
          email: '',
          password: '',
          staffId: '',
          age: 35,
          departmentId: '',
          classId: '',
          designation: 'Assistant Professor',
          assignmentType: 'Class Advisor',
          phone: '',
          qualification: 'M.Tech, Ph.D',
          specialization: 'Artificial Intelligence & Distributed Systems',
          experience: '8 Years',
          joiningDate: new Date().toISOString().split('T')[0],
          gender: 'Male',
          bio: ''
        });
        loadStaffData();
      } else {
        onShowToast?.(data.message || 'Failed to create staff member', 'error');
      }
    } catch (err) {
      onShowToast?.(err.message, 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Staff Class Assignment
  const handleAssignClassSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff?.user_id || !assignForm.classId) {
      onShowToast?.('Please select a class to assign', 'error');
      return;
    }
    setSubmittingAssign(true);
    try {
      const res = await fetch(`/api/institution/staff/${selectedStaff.user_id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.(data.message || 'Class assigned and students mapped!', 'success');
        setShowAssignClassModal(false);
        loadStaffData();
      } else {
        onShowToast?.(data.message || 'Assignment failed', 'error');
      }
    } catch (err) {
      onShowToast?.(err.message, 'error');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle Toggle Active/Deactivate Status
  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = !staff.is_active;
      const res = await fetch(`/api/institution/staff/${staff.user_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.(`Staff account ${newStatus ? 'activated' : 'deactivated'}`, 'success');
        loadStaffData();
      }
    } catch (err) {
      onShowToast?.(err.message, 'error');
    }
  };

  // View Mapped Students Modal
  const handleOpenStudentsModal = async (staff) => {
    setSelectedStaff(staff);
    setShowStudentsModal(true);
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/institution/staff/${staff.user_id}/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexus_token') || ''}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMappedStudents(data.data || []);
      }
    } catch (err) {
      onShowToast?.('Error loading mapped students', 'error');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = !searchTerm ||
      (s.full_name || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.staff_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'All' || s.department_name === filterDepartment || s.department_code === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Action Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              CAMPUS FACULTY ARCHITECTURE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>//</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {staffList.length} Authenticated Academicians
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Staff & Academician Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Hierarchical mapping across Institution → Department → Class → Staff with automatic student progress isolation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={loadStaffData}
            className="btn-cyber-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Refresh Roster
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="btn-cyber-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            }}
          >
            <UserPlus size={16} /> Add New Staff
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '12px 18px'
      }}>
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('hierarchy')}
            style={{
              background: activeTab === 'hierarchy' ? '#6366f1' : 'transparent',
              border: 'none',
              color: activeTab === 'hierarchy' ? '#fff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderTree size={14} /> Hierarchical View
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            style={{
              background: activeTab === 'roster' ? '#6366f1' : 'transparent',
              border: 'none',
              color: activeTab === 'roster' ? '#fff' : 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} /> Staff Roster Table
          </button>
        </div>

        {/* Search & Department Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '7px 12px',
            minWidth: '240px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{
              background: '#0B1120',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="All">All Departments</option>
            {departments.map((d, i) => (
              <option key={i} value={d.name}>{d.name} ({d.code || 'Dept'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── VIEW 1: HIERARCHICAL GROUPED DISPLAY ── */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.keys(groupedStaff).length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '16px'
            }}>
              <GraduationCap size={44} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                No Academician Accounts Provisioned
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 18px' }}>
                Use the "Add New Staff" button to register class advisors, subject faculty, and mentors for your departments.
              </p>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="btn-cyber-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Add First Academician
              </button>
            </div>
          ) : (
            Object.entries(groupedStaff).map(([deptName, classesInDept]) => (
              <div
                key={deptName}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}
              >
                {/* Department Header */}
                <div style={{
                  padding: '14px 20px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Building2 size={18} color="#818cf8" />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    Department of {deptName}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    padding: '3px 8px',
                    borderRadius: '999px'
                  }}>
                    {Object.values(classesInDept).flat().length} Staff Mapped
                  </span>
                </div>

                {/* Classes & Assigned Staff under this Department */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(classesInDept).map(([className, staffArray]) => (
                    <div
                      key={className}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '14px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          CLASS: {className}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          • {staffArray.length} Faculty Member{staffArray.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Staff Cards inside this Class */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {staffArray.map(staff => (
                          <div
                            key={staff.user_id}
                            style={{
                              background: 'rgba(30, 41, 59, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '10px',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {staff.full_name || staff.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {staff.staff_id || 'ID: Pending'} • {staff.designation || 'Faculty'}
                                  </div>
                                </div>
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  background: staff.assignment_type === 'Class Advisor' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                  color: staff.assignment_type === 'Class Advisor' ? '#34d399' : '#818cf8',
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {staff.assignment_type || 'Faculty'}
                                </span>
                              </div>

                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                                {staff.email}
                              </div>

                              <div style={{
                                marginTop: '10px',
                                padding: '8px 10px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px'
                              }}>
                                <span style={{ color: 'var(--text-muted)' }}>Mapped Students:</span>
                                <strong style={{ color: '#38bdf8' }}>
                                  {staff.mapped_students_count ?? 0} Students
                                </strong>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                              <button
                                onClick={() => handleOpenStudentsModal(staff)}
                                style={{
                                  flex: 1,
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  color: '#38bdf8',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                View Students
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setAssignForm({
                                    departmentId: staff.department_id || '',
                                    classId: staff.class_id || '',
                                    assignmentType: staff.assignment_type || 'Class Advisor'
                                  });
                                  setShowAssignClassModal(true);
                                }}
                                style={{
                                  flex: 1,
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  color: '#a5b4fc',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reassign
                              </button>
                              <button
                                onClick={() => handleToggleStatus(staff)}
                                title={staff.is_active ? 'Deactivate Staff' : 'Activate Staff'}
                                style={{
                                  background: staff.is_active ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                  border: `1px solid ${staff.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                  color: staff.is_active ? '#f87171' : '#34d399',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                {staff.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── VIEW 2: ROSTER TABLE VIEW ── */}
      {activeTab === 'roster' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Staff Name</th>
                <th style={{ padding: '12px 16px' }}>Staff ID</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Class</th>
                <th style={{ padding: '12px 16px' }}>Designation</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Students</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(s => (
                  <tr key={s.user_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.full_name || s.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#818cf8' }}>
                      {s.staff_id || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {s.email}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      {s.department_name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600
                      }}>
                        {s.class_name ? `${s.class_name} ${s.class_section || ''}`.trim() : 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {s.designation || 'Faculty'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: s.assignment_type === 'Class Advisor' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: s.assignment_type === 'Class Advisor' ? '#34d399' : '#818cf8',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {s.assignment_type || 'Faculty'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#38bdf8' }}>
                      {s.mapped_students_count ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: s.is_active ? '#34d399' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {s.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenStudentsModal(s)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: 'none',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            cursor: 'pointer'
                          }}
                        >
                          Students
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(s);
                            setAssignForm({
                              departmentId: s.department_id || '',
                              classId: s.class_id || '',
                              assignmentType: s.assignment_type || 'Class Advisor'
                            });
                            setShowAssignClassModal(true);
                          }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: 'none',
                            color: '#818cf8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            cursor: 'pointer'
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL 1: ADD NEW STAFF ── */}
      {showAddStaffModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0B1120',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Add New Academician / Faculty Member
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  Creates ACADEMICIAN user, hashes password, assigns class, and automatically maps eligible students.
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Name & Staff ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    STAFF LEGAL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arun Kumar"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    STAFF ID / FACULTY CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE001"
                    value={addForm.staffId}
                    onChange={(e) => setAddForm({ ...addForm, staffId: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 2: Email & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    INSTITUTIONAL EMAIL ID *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="arun@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    INITIAL PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 3: Age, Gender & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    AGE *
                  </label>
                  <input
                    type="number"
                    min="21"
                    max="75"
                    required
                    placeholder="35"
                    value={addForm.age}
                    onChange={(e) => setAddForm({ ...addForm, age: parseInt(e.target.value, 10) || '' })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    GENDER
                  </label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DESIGNATION *
                  </label>
                  <select
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Head of Department">Head of Department</option>
                    <option value="Dean">Dean</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Department & Class */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DEPARTMENT *
                  </label>
                  <select
                    required
                    value={addForm.departmentId}
                    onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                    style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d, i) => (
                      <option key={i} value={d.id}>{d.name} ({d.code || 'Dept'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    ASSIGNED CLASS *
                  </label>
                  <select
                    required
                    value={addForm.classId}
                    onChange={(e) => setAddForm({ ...addForm, classId: e.target.value })}
                    style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls, i) => (
                      <option key={i} value={cls.id}>
                        {cls.name} {cls.section || ''} {cls.department_name ? `(${cls.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Responsibility / Assignment Type */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  ASSIGNMENT TYPE / RESPONSIBILITY *
                </label>
                <select
                  value={addForm.assignmentType}
                  onChange={(e) => setAddForm({ ...addForm, assignmentType: e.target.value })}
                  style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="Class Advisor">Class Advisor (Primary Overall Student View)</option>
                  <option value="Subject Faculty">Subject Faculty</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Placement Coordinator">Placement Coordinator</option>
                  <option value="Department Faculty">Department Faculty</option>
                </select>
              </div>

              {/* Optional Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    QUALIFICATION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ph.D. in Computer Science"
                    value={addForm.qualification}
                    onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    SPECIALIZATION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI / Machine Learning"
                    value={addForm.specialization}
                    onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    EXPERIENCE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Years"
                    value={addForm.experience}
                    onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '9px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="btn-cyber-primary"
                  style={{ padding: '9px 20px', fontWeight: 700 }}
                >
                  {submittingAdd ? 'Provisioning Academician...' : 'Save & Map Eligible Students →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ASSIGN CLASS ── */}
      {showAssignClassModal && selectedStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0B1120',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '26px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Assign Class to {selectedStaff.full_name || selectedStaff.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  Updates staff assignment and automatically maps students in this class.
                </p>
              </div>
              <button onClick={() => setShowAssignClassModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignClassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  DEPARTMENT
                </label>
                <select
                  value={assignForm.departmentId}
                  onChange={(e) => setAssignForm({ ...assignForm, departmentId: e.target.value })}
                  style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d, i) => (
                    <option key={i} value={d.id}>{d.name} ({d.code || 'Dept'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  TARGET CLASS *
                </label>
                <select
                  required
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls, i) => (
                    <option key={i} value={cls.id}>
                      {cls.name} {cls.section || ''} {cls.department_name ? `(${cls.department_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  ASSIGNMENT ROLE
                </label>
                <select
                  value={assignForm.assignmentType}
                  onChange={(e) => setAssignForm({ ...assignForm, assignmentType: e.target.value })}
                  style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="Class Advisor">Class Advisor</option>
                  <option value="Subject Faculty">Subject Faculty</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Placement Coordinator">Placement Coordinator</option>
                  <option value="Department Faculty">Department Faculty</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAssignClassModal(false)} className="btn-cyber-outline" style={{ padding: '8px 14px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingAssign} className="btn-cyber-primary" style={{ padding: '8px 18px', fontWeight: 700 }}>
                  {submittingAssign ? 'Assigning...' : 'Confirm Assignment & Remap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VIEW MAPPED STUDENTS ── */}
      {showStudentsModal && selectedStaff && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0B1120',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Students Mapped to {selectedStaff.full_name || selectedStaff.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  Strict mapping: Matching Institution + Department + Class.
                </p>
              </div>
              <button onClick={() => setShowStudentsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {studentsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading mapped students...
              </div>
            ) : mappedStudents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertTriangle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No students currently mapped to this staff member.</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Students registering with matching Institution, Department, and Class will be automatically linked.
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 14px' }}>Student Name</th>
                    <th style={{ padding: '10px 14px' }}>Roll No</th>
                    <th style={{ padding: '10px 14px' }}>Class</th>
                    <th style={{ padding: '10px 14px' }}>Course Progress</th>
                    <th style={{ padding: '10px 14px' }}>Skill Score</th>
                    <th style={{ padding: '10px 14px' }}>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedStudents.map(st => (
                    <tr key={st.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.full_name}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#818cf8' }}>
                        {st.roll_number || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {st.class_name ? `${st.class_name} ${st.class_section || ''}` : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#38bdf8' }}>
                        {st.course_progress ?? 0}%
                      </td>
                      <td style={{ padding: '10px 14px', color: '#34d399' }}>
                        {st.skill_score ?? 0}%
                      </td>
                      <td style={{ padding: '10px 14px', color: '#a5b4fc' }}>
                        {st.assessment_score ?? 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
