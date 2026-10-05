import React, { useRef, useEffect } from 'react';
import './HorizontalPageTabs.css';

/**
 * Reusable Horizontal Navigation / Tab Bar Component
 *
 * @param {Array} tabs - Array of tab objects: [{ id, label, icon: IconComponent, badge, badgeColor, count, path }]
 * @param {string} activeTab - The currently active tab ID
 * @param {function} onTabChange - Callback when a tab is clicked: (tabId, tabObj) => void
 * @param {string} variant - 'default' | 'pill' | 'underline'
 * @param {string} className - Additional CSS class names
 * @param {string} ariaLabel - Accessible label for tablist
 */
export default function HorizontalPageTabs({
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'default',
  className = '',
  ariaLabel = 'Workspace Navigation Tabs'
}) {
  const scrollContainerRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll to ensure active tab is in view on mount/change
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const el = activeTabRef.current;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const elLeft = el.offsetLeft;
      const elRight = elLeft + el.clientWidth;

      if (elLeft < containerLeft) {
        container.scrollTo({ left: elLeft - 16, behavior: 'smooth' });
      } else if (elRight > containerRight) {
        container.scrollTo({ left: elRight - container.clientWidth + 16, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  return (
    <div className={`horizontal-page-tabs-wrapper ${className}`}>
      <nav
        ref={scrollContainerRef}
        className={`horizontal-page-tabs-bar variant-${variant}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              className={`horizontal-page-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(tab.id, tab)}
              type="button"
            >
              {Icon && (
                <Icon
                  size={15}
                  className={`tab-icon ${isActive ? 'tab-icon-active' : ''}`}
                  aria-hidden="true"
                />
              )}
              <span className="tab-label">{tab.label}</span>

              {tab.badge && (
                <span className={`tab-badge ${tab.badgeColor ? `badge-${tab.badgeColor}` : 'badge-cyan'}`}>
                  {tab.badge}
                </span>
              )}

              {tab.count !== undefined && tab.count !== null && (
                <span className="tab-count">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
