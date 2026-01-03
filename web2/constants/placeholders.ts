/**
 * Placeholder images and avatars
 * Use these instead of auto-generated avatar services
 */

// Placeholder avatar - simple SVG with user icon (fallback when no name available)
export const PLACEHOLDER_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"%3E%3C/path%3E%3Ccircle cx="12" cy="7" r="4"%3E%3C/circle%3E%3C/svg%3E';

// Placeholder image for items
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

/**
 * Generate user initials from name or username
 * @param name - User's name or username
 * @returns Initials (max 2 characters, uppercase)
 */
export const getInitials = (name: string | null | undefined): string => {
  if (!name || name.trim() === '') return '?';
  
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length >= 2) {
    // Use first letter of first and last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  } else {
    // Use first 2 letters of single name/username
    return trimmed.substring(0, 2).toUpperCase();
  }
};

/**
 * Generate a color based on the user's name (deterministic)
 * This ensures the same name always gets the same color
 */
const getColorFromName = (name: string): { bg: string; text: string } => {
  // Generate a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use predefined color palette (brand-friendly colors)
  const colors = [
    { bg: '#880e4f', text: '#ffffff' }, // Brand color
    { bg: '#1e40af', text: '#ffffff' }, // Blue
    { bg: '#059669', text: '#ffffff' }, // Green
    { bg: '#dc2626', text: '#ffffff' }, // Red
    { bg: '#ea580c', text: '#ffffff' }, // Orange
    { bg: '#7c3aed', text: '#ffffff' }, // Purple
    { bg: '#be185d', text: '#ffffff' }, // Pink
    { bg: '#0891b2', text: '#ffffff' }, // Cyan
    { bg: '#ca8a04', text: '#ffffff' }, // Yellow
    { bg: '#64748b', text: '#ffffff' }, // Slate
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Generate an SVG avatar with user initials
 * @param name - User's name or username
 * @param size - Size of the avatar (default: 150)
 * @returns Data URL of SVG avatar
 */
export const generateInitialsAvatar = (
  name: string | null | undefined,
  size: number = 150
): string => {
  if (!name || name.trim() === '') {
    return PLACEHOLDER_AVATAR;
  }
  
  const initials = getInitials(name);
  const colors = getColorFromName(name);
  const fontSize = size * 0.4; // 40% of size for text
  
  // Create SVG with initials
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${colors.bg}" rx="${size / 2}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="${colors.text}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};












