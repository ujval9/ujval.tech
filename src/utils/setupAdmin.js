import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Admin user configuration - must match the values in adminCheck.js
const ADMIN_EMAIL = "ujvalshah1@gmail.com";
const ADMIN_UID = "TpsRf35kPqafVMnpz4VKuIWM5O63";

/**
 * Sets up the admin user in the Firestore database
 * This should be run once when the admin logs in for the first time
 */
export const setupAdminUser = async () => {
  try {
    // Check if admin user document already exists
    const adminDocRef = doc(db, 'users', ADMIN_UID);
    const adminDoc = await getDoc(adminDocRef);
    
    if (adminDoc.exists()) {
      // If it exists, ensure it has the correct role
      const userData = adminDoc.data();
      
      if (userData.role !== 'admin') {
        console.log('Updating existing user to admin role');
        await setDoc(adminDocRef, { 
          ...userData, 
          role: 'admin' 
        }, { merge: true });
        console.log('Admin role updated successfully');
      } else {
        console.log('Admin user already exists with correct role');
      }
    } else {
      // If it doesn't exist, create it with the admin role
      console.log('Creating admin user document');
      await setDoc(adminDocRef, {
        uid: ADMIN_UID,
        email: ADMIN_EMAIL,
        displayName: 'Ujval Shah',
        firstName: 'Ujval',
        lastName: 'Shah',
        role: 'admin',
        createdAt: new Date(),
        receiveNotifications: true
      });
      console.log('Admin user created successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up admin user:', error);
    return { 
      success: false,
      error: error.message
    };
  }
}; 