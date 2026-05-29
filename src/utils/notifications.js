import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sends an email notification to all subscribed users
 * Note: In production, you would use a cloud function or server to send actual emails
 * This is a placeholder function to demonstrate the feature
 * 
 * @param {Object} blog - Blog data that was published
 * @param {String} authorName - Name of the author
 */
export const sendNewBlogNotification = async (blog, authorName) => {
  try {
    // Get all users who have subscribed to notifications
    const usersQuery = query(
      collection(db, 'users'),
      where('receiveNotifications', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('No subscribers to notify');
      return;
    }
    
    // In a real application, you would call a server endpoint or use Firebase Cloud Functions
    // to send actual emails. For now, we'll just log what would happen.
    const subscribers = usersSnapshot.docs.map(doc => doc.data());
    
    console.log(`Would send notifications to ${subscribers.length} subscribers:`, {
      subject: `New blog post: ${blog.title}`,
      contentPreview: blog.description.substring(0, 100) + '...',
      author: authorName,
      date: new Date().toLocaleString(),
      link: `/detail/${blog.id}`
    });
    
    // For production, you would implement actual email sending logic here
    // This could involve:
    // 1. Using Firebase Cloud Functions
    // 2. Using an email API (SendGrid, Mailchimp, etc.)
    // 3. Using your own email server
    
    return {
      success: true,
      subscriberCount: subscribers.length
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Manages a user's notification preferences
 * 
 * @param {String} userId - ID of the user
 * @param {Boolean} receiveNotifications - Whether user wants to receive notifications
 */
export const updateNotificationPreferences = async (userId, receiveNotifications) => {
  try {
    // Update user preferences in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { receiveNotifications });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 