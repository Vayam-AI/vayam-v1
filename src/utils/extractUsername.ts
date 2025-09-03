/**
 * Extract username from email address
 * @param email - The email address
 * @returns The username part before @ symbol, cleaned and formatted
 */
export function extractUsernameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '';
  }
  
  // Get the part before @ symbol
  let username = email.split('@')[0];
  
  // Clean the username: remove dots, numbers, and special characters, keep only letters
  username = username.replace(/[^a-zA-Z]/g, '');
  
  // If no letters remain, use a default pattern
  if (!username) {
    username = 'user';
  }
  
  // Capitalize first letter and make rest lowercase
  username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  
  return username;
}

/**
 * Generate a display name from email
 * @param email - The email address
 * @returns A formatted display name
 */
export function generateDisplayNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return 'User';
  }
  
  // Get the part before @ symbol
  let name = email.split('@')[0];
  
  // Replace common separators with spaces
  name = name.replace(/[._-]/g, ' ');
  
  // Remove numbers
  name = name.replace(/\d/g, '');
  
  // Split into words and capitalize each
  const words = name.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'User';
  }
  
  // Capitalize each word
  const capitalizedWords = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  
  return capitalizedWords.join(' ');
}
