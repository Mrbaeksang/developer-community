import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'mark', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    SAFE_FOR_TEMPLATES: true,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  });
};

export const sanitizeAndFormatContent = (content: string): string => {
  // 줄바꿈을 <br>로 변환 후 sanitize
  const formatted = content.replace(/\n/g, '<br />');
  return sanitizeHTML(formatted);
};

export const sanitizeHighlight = (text: string, searchTerm: string): string => {
  // HTML 특수문자 이스케이프
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 텍스트와 검색어를 이스케이프
  const escapedText = escapeHtml(text);
  const escapedSearchTerm = escapeHtml(searchTerm);
  
  // 정규식 특수문자 이스케이프
  const regexEscaped = escapedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 검색어 하이라이트
  const regex = new RegExp(`(${regexEscaped})`, 'gi');
  const highlighted = escapedText.replace(regex, '<mark>$1</mark>');
  
  // mark 태그만 허용하도록 sanitize
  return sanitizeHTML(highlighted);
};