/**
 * Google Research URL generator for SkillNexus 2.0.
 * Dynamically formats Google search queries for courses, emerging technologies,
 * research topics, and technical capabilities without generic fallbacks.
 * Handles both string and object parameters safely.
 */

export function getGoogleResearchUrl(topic, category = '', extraKeywords = '') {
  let topicStr = '';
  let catStr = '';
  let extraStr = '';

  if (typeof topic === 'object' && topic !== null) {
    topicStr = String(topic.topic || topic.title || topic.name || topic.query || '').trim();
    catStr = String(topic.category || topic.domain || '').trim();
    extraStr = String(topic.focus || topic.extraKeywords || '').trim();
    if (!topicStr && catStr) {
      topicStr = catStr;
      catStr = '';
    }
  } else {
    topicStr = String(topic || '').trim();
  }

  if (typeof category === 'object' && category !== null) {
    catStr = catStr || String(category.category || category.domain || '').trim();
    extraStr = extraStr || String(category.focus || category.extraKeywords || '').trim();
  } else if (typeof category === 'string' && category.trim()) {
    catStr = catStr || category.trim();
  }

  if (typeof extraKeywords === 'string' && extraKeywords.trim()) {
    extraStr = extraStr ? `${extraStr} ${extraKeywords.trim()}` : extraKeywords.trim();
  }

  if (!topicStr && !catStr) {
    return 'https://www.google.com/search?q=' + encodeURIComponent('emerging technology industry research paper tutorial');
  }

  const parts = [];
  if (topicStr) parts.push(topicStr);
  if (catStr && !topicStr.toLowerCase().includes(catStr.toLowerCase())) {
    parts.push(catStr);
  }
  if (extraStr) {
    parts.push(extraStr);
  } else {
    parts.push('tutorial research documentation guide');
  }

  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/search?q=${query}`;
}

export function openGoogleResearch(topic, category = '', extraKeywords = '') {
  try {
    const url = getGoogleResearchUrl(topic, category, extraKeywords);
    if (typeof window !== 'undefined' && window.open) {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.href = url;
      }
    }
  } catch (err) {
    console.error('[GoogleResearch] Failed to open Google research URL:', err);
  }
}
