// Admin user configuration
const ADMIN_EMAIL = "ujvalshah1@gmail.com";
const ADMIN_UID = "TpsRf35kPqafVMnpz4VKuIWM5O63";

/**
 * Checks if the current user is an admin
 * @param {Object} user - Firebase user object
 * @returns {Boolean} - Whether the user is an admin
 */
export const isAdmin = (user) => {
  if (!user) {
    console.log("Admin check failed: No user provided");
    return false;
  }
  
  // Check if the user has admin email and UID
  const isAdminMatch = user.email === ADMIN_EMAIL && user.uid === ADMIN_UID;
  
  // Log admin check details for debugging
  console.log(`Admin check for user ${user.email}:`, {
    expectedEmail: ADMIN_EMAIL,
    expectedUID: ADMIN_UID,
    actualEmail: user.email,
    actualUID: user.uid,
    isAdmin: isAdminMatch
  });
  
  return isAdminMatch;
};

/**
 * Checks if the user can perform admin actions like create/edit/delete blogs
 * @param {Object} user - Firebase user object
 * @returns {Boolean} - Whether the user can perform admin actions
 */
export const canManageBlogs = (user) => {
  return isAdmin(user);
}; 