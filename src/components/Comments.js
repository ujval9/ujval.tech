import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { isAdmin } from '../utils/adminCheck';
import { Link } from 'react-router-dom';
import './Comments.css';

const Comments = ({ blogId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdminUser = user ? isAdmin(user) : false;
  
  // Emoji array for the picker
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '❤️', '🔥', '👍', '👏', '🎉', '💯', '🚀', '💪', '🙏', '👀'
  ];

  useEffect(() => {
    if (!blogId) return;

    setLoading(true);
    console.log("Setting up comment listener for blog:", blogId);
    
    // Set up real-time listener for comments - no user filter so all visitors can see comments
    const q = query(
      collection(db, 'comments'),
      where('blogId', '==', blogId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure timestamp is never null for UI display
          timestamp: data.timestamp || Timestamp.now()
        };
      });
      console.log("Comments updated from Firebase:", commentsData.length);
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching comments:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [blogId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      return; // This shouldn't happen as the form should not be shown to logged out users
    }
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting new comment...");
      // Create comment object
      const commentData = {
        blogId,
        content: newComment,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous User',
        timestamp: serverTimestamp()
      };
      
      // Create a temporary comment ID for local state
      const tempId = 'temp-' + Date.now();
      
      // Add optimistic comment to UI immediately
      const optimisticComment = {
        id: tempId,
        ...commentData,
        timestamp: Timestamp.now() // Use client-side timestamp for immediate display
      };
      
      console.log("Adding optimistic comment to UI:", optimisticComment);
      
      // Add the new comment to the top of the list
      setComments(prevComments => [optimisticComment, ...prevComments]);
      
      // Show all comments when new comment is added
      if (!showAllComments && comments.length >= 2) {
        setShowAllComments(true);
      }
      
      // Clear input immediately for better UX
      setNewComment('');
      
      // Then add to database
      console.log("Adding comment to Firebase...");
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      console.log("Comment added to Firebase with ID:", docRef.id);
      
      // Replace temporary comment with real one if needed
      // Note: This might not be needed since Firebase listener will update anyway
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === tempId 
            ? { ...comment, id: docRef.id } 
            : comment
        )
      );
      
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    try {
      console.log("Deleting comment:", commentId);
      console.log("User:", user.email, "isAdmin:", isAdminUser);
      
      // First get the comment to check if it exists
      const commentRef = doc(db, 'comments', commentId);
      
      // Then delete from database
      await deleteDoc(commentRef);
      console.log("Comment deleted successfully");
      
      // Remove from UI after successful database deletion
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      // If there's an error, we can show it to the user
      alert('Error deleting comment: ' + error.message);
    }
  };

  const addEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate();
      
      // If less than 24 hours ago, show relative time
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        if (diffInHours < 1) {
          const minutes = Math.floor(diffInHours * 60);
          return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        const hours = Math.floor(diffInHours);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      }
      
      // Otherwise show date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Just now';
    }
  };

  // Get displayed comments based on showAllComments flag
  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  return (
    <div className="comments-section">
      <h3 className="comments-title">Comments ({comments.length})</h3>
      
      {user ? (
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <div className="input-container">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            />
            <button 
              type="button" 
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
          </div>
          
          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  className="emoji-option"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-comment"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <Link to="/auth" className="login-to-comment">
          Please log in to leave a comment
        </Link>
      )}
      
      <div className="comments-list">
        {loading && comments.length === 0 ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">Be the first to comment!</div>
        ) : (
          <>
            {displayedComments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <strong className="comment-author">{comment.userDisplayName}</strong>
                  <span className="comment-date">{formatDate(comment.timestamp)}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                {(user && (user.uid === comment.userId || isAdminUser)) && (
                  <button 
                    className="delete-comment"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
            
            {hasMoreComments && (
              <button 
                className="show-more-comments"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments ? 'Show fewer comments' : `Show ${comments.length - 3} more comments`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Comments; 