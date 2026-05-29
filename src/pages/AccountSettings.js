import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import './styles/AccountSettings.css';

const AccountSettings = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    receiveNotifications: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            receiveNotifications: data.receiveNotifications !== undefined ? data.receiveNotifications : true
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error loading your account information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const updateProfileInfo = async () => {
    try {
      const { firstName, lastName } = form;
      
      if (!firstName || !lastName) {
        toast.error('First name and last name are required');
        return false;
      }

      // Update display name in auth
      const displayName = `${firstName} ${lastName}`;
      await updateProfile(auth.currentUser, { displayName });

      // Update user data in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        displayName
      });

      // Update local user state
      setUser({
        ...user,
        displayName
      });

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
      return false;
    }
  };

  const changePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = form;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      // Clear password fields
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Error updating password');
      }
      
      return false;
    }
  };

  const updateNotificationSettings = async () => {
    try {
      const { receiveNotifications } = form;
      
      // Update user preferences in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        receiveNotifications
      });
      
      toast.success('Notification preferences updated');
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Error updating notification settings');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      let success = false;
      
      switch (activeTab) {
        case 'profile':
          success = await updateProfileInfo();
          break;
        case 'password':
          success = await changePassword();
          break;
        case 'notifications':
          success = await updateNotificationSettings();
          break;
        default:
          break;
      }
      
      if (success) {
        // Refresh user data after successful update
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="account-settings-container">
      <div className="account-settings-card">
        <h2 className="account-settings-title">Account Settings</h2>
        
        <div className="account-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button 
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>
        
        <form className="account-form" onSubmit={handleSubmit}>
          {activeTab === 'profile' && (
            <div className="form-tab-content">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="form-input disabled"
                />
                <small className="form-text">Email cannot be changed</small>
              </div>
            </div>
          )}
          
          {activeTab === 'password' && (
            <div className="form-tab-content">
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="form-tab-content">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="receiveNotifications"
                  name="receiveNotifications"
                  checked={form.receiveNotifications}
                  onChange={handleChange}
                  className="form-check-input"
                />
                <label htmlFor="receiveNotifications" className="form-check-label">
                  Receive email notifications when new blog posts are published
                </label>
              </div>
              
              <div className="notification-info">
                <p>
                  When enabled, you'll receive notifications for all new blog posts. 
                  We'll only email you about important updates and new content.
                </p>
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            className="save-button"
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings; 