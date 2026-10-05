import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export default function NotificationBell({ onSelectEntity }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res && res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (e) {
      // Background polling fail silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (onSelectEntity && notif.relatedEntityId) {
      onSelectEntity(notif.relatedEntityType, notif.relatedEntityId);
      setIsOpen(false);
    }
  };

  return (
    <div className="sw-notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="sw-notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
        style={{
          background: 'transparent',
          border: '1px solid #dadce0',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: '#3c4043',
          transition: 'all 0.2s ease'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
        {unreadCount > 0 && (
          <span 
            className="sw-notif-badge"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ea4335',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '10px',
              padding: '1px 6px',
              minWidth: '18px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="sw-notif-panel"
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(60,64,67,0.18)',
            border: '1px solid #e8eaed',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #f1f3f4',
            background: '#fafbfc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '18px' }}>notifications</span>
              <strong style={{ fontSize: '14px', color: '#202124' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', background: '#e8f0fe', color: '#1a73e8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a73e8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#70757a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#bdc1c6', marginBottom: '8px' }}>notifications_off</span>
                <p style={{ margin: 0, fontSize: '13px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f3f4',
                    background: n.read ? '#ffffff' : '#f8fafd',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f4'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.read ? '#ffffff' : '#f8fafd'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: n.read ? 600 : 700, color: '#202124' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '10px', color: '#80868b' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#5f6368', lineHeight: '1.4' }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: n.type?.includes('SCHEDULED') ? '#e6f4ea' : n.type?.includes('EVIDENCE') ? '#fef7e0' : '#e8f0fe',
                      color: n.type?.includes('SCHEDULED') ? '#137333' : n.type?.includes('EVIDENCE') ? '#b06000' : '#1a73e8',
                      fontWeight: 600
                    }}>
                      {n.type?.replace(/_/g, ' ')}
                    </span>
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#5f6368',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
