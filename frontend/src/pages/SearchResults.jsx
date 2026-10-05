import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  Briefcase,
  Cpu,
  ArrowRight,
  Loader2,
  Building,
  GraduationCap,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function SearchResults({ setActivePage }) {
  const [query, setQuery] = useState(() => {
    return window.__nexusSearchQuery || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [results, setResults] = useState({
    courses: [],
    opportunities: [],
    skills: [],
    companies: [],
    institutions: []
  });

  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

  const executeSearch = useCallback(async (searchStr) => {
    const q = String(searchStr || '').trim();
    if (!q) {
      setResults({ courses: [], opportunities: [], skills: [], companies: [], institutions: [] });
      setTotalMatches(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/nexus/search?q=${encodeURIComponent(q)}&limit=15`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.results) {
        setResults(data.results);
        setTotalMatches(data.totalMatches || 0);
      } else {
        setResults({ courses: [], opportunities: [], skills: [], companies: [], institutions: [] });
        setTotalMatches(0);
      }
    } catch (err) {
      console.error('Real search execution failed:', err);
      setError(err.message || 'Unable to connect to search index');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Initial search and event listener for global search input in Navbar
  useEffect(() => {
    if (query) {
      executeSearch(query);
    }

    const handleSearchEvent = (e) => {
      const newQuery = e.detail?.query || '';
      setQuery(newQuery);
      window.__nexusSearchQuery = newQuery;
      executeSearch(newQuery);
    };

    window.addEventListener('nexus_search_query', handleSearchEvent);
    return () => {
      window.removeEventListener('nexus_search_query', handleSearchEvent);
    };
  }, [query, executeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    window.__nexusSearchQuery = query;
    executeSearch(query);
  };

  const hasAnyResults = totalMatches > 0 || (
    results.courses.length > 0 ||
    results.opportunities.length > 0 ||
    results.skills.length > 0 ||
    (results.companies && results.companies.length > 0) ||
    (results.institutions && results.institutions.length > 0)
  );

  return (
    <div>
      {/* Top Telemetry Header */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>GLOBAL POSTGRESQL SEARCH</span>
            <span>//</span>
            <span>REAL-TIME INDEX</span>
          </div>
          <h1>Search Results</h1>
          <p>
            {query.trim()
              ? `Found ${totalMatches} authoritative match${totalMatches === 1 ? '' : 'es'} across the SkillNexus ecosystem for "${query}".`
              : 'Search across all verified skills, courses, industry requisitions, companies, and academic institutions.'}
          </p>
        </div>
      </div>

      {/* Interactive Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          background: 'var(--bg-input)',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <Search size={18} color="var(--cyber-cyan)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, courses, opportunities, companies, institutions..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
          {loading && <Loader2 size={16} className="spin" color="var(--cyber-cyan)" />}
          <button
            type="submit"
            className="btn-cyber-primary"
            style={{ padding: '6px 16px', fontSize: '12px' }}
          >
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: '13px', color: '#FCA5A5' }}>{error}</span>
        </div>
      )}

      {/* Results Container */}
      {!loading && !hasAnyResults && query.trim() && (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
          <Sparkles size={36} color="var(--cyber-cyan)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Database Matches Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            No PostgreSQL records matched "{query}". Try searching for popular skills like "Python", "Cloud", "Data", or opportunity titles.
          </p>
        </div>
      )}

      {!loading && !query.trim() && (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
          <Search size={36} color="var(--cyber-cyan)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Start Searching
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            Type a query in the search bar above to query real-time PostgreSQL records across courses, opportunities, skills, companies, and institutions.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Courses Section */}
        {results.courses && results.courses.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--cyber-purple)" />
              Learning & Courses ({results.courses.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.courses.map((res, i) => (
                <div key={res.id || i} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={18} color="#8B5CF6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {res.category || 'Curriculum Course'} • {res.difficulty || 'Intermediate'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePage && setActivePage('learning')}
                    className="btn-cyber-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Course <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities Section */}
        {results.opportunities && results.opportunities.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} color="var(--cyber-amber)" />
              Opportunities ({results.opportunities.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.opportunities.map((res, i) => (
                <div key={res.id || i} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={18} color="#F59E0B" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {res.type || 'Internship'} • {res.location || 'Chennai, India'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePage && setActivePage('opportunities')}
                    className="btn-cyber-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Details <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {results.skills && results.skills.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--cyber-cyan)" />
              Skills & Competencies ({results.skills.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.skills.map((res, i) => (
                <div key={res.id || i} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={18} color="#00D4FF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Category: <span style={{ color: 'var(--cyber-cyan)' }}>{res.category || 'Technical'}</span> • Demand: {res.difficulty || 'High'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePage && setActivePage('skills')}
                    className="btn-cyber-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Skill <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companies Section */}
        {results.companies && results.companies.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="var(--cyber-emerald)" />
              Industry Partners ({results.companies.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.companies.map((res, i) => (
                <div key={res.id || i} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building size={18} color="#10B981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {res.industry || 'Technology'} • {res.match || 'Enterprise'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePage && setActivePage('opportunities')}
                    className="btn-cyber-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Explore Openings <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Institutions Section */}
        {results.institutions && results.institutions.length > 0 && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="var(--cyber-blue)" />
              Academic Nodes ({results.institutions.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.institutions.map((res, i) => (
                <div key={res.id || i} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={18} color="#3B82F6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Campus Code: <span style={{ color: 'var(--cyber-blue)' }}>{res.code || 'INST'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
