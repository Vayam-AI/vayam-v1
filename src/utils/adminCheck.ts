// Admin emails that can access conversation creation and dashboard
export const ADMIN_EMAILS = [
  "keerolla@gmail.com",
  "Keerthi@vayam.ai", 
  "we@vayam.ai",
  "abhiramjaini28@gmail.com"
];

/**
 * Check if a user email is in the admin list
 * @param email - User email to check
 * @returns boolean - True if user is admin
 */
export function isAdminUser(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}
