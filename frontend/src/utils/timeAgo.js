/**
 * SKILLNEXUS AI — Reusable Relative Time Formatter
 * Complies with Section 21: Real timestamps with humanized displays
 * (e.g. Just now, 2 min ago, 15 min ago, Today, 4:35 PM, Yesterday)
 */

export function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Recent';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 45) {
    return 'Just now';
  }

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }

  // Check if same calendar day
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Today, ${timeStr}`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Yesterday, ${timeStr}`;
  }

  // Check within 7 days
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default formatTimeAgo;
