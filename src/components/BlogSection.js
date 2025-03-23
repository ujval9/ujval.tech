import React, { useState, useEffect } from 'react'
import FontAwesome from 'react-fontawesome'
import { Link } from 'react-router-dom'
import { excerpt } from '../utility'
import './BlogSection.css'

// Helper function to render formatted text
const renderFormattedText = (text) => {
  if (!text) return "";
  
  // Content is already HTML from Quill editor
  return text;
};

// Function to extract the first image URL from HTML content
const extractFirstImage = (htmlContent) => {
  if (!htmlContent) return null;
  
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find the first image element
  const firstImg = doc.querySelector('img');
  
  // Return the src attribute if an image was found
  return firstImg ? firstImg.src : null;
};

// Helper function to check image orientation
const checkImageOrientation = (img, callback) => {
  // Create a new image object to get dimensions
  const image = new Image();
  
  image.onload = function() {
    // Check if height > width for portrait orientation
    const isPortrait = this.height > this.width;
    callback(isPortrait);
  };
  
  image.onerror = function() {
    // Default to landscape if error
    callback(false);
  };
  
  // Set the source to trigger loading
  image.src = img;
};

// Function to create an excerpt without images
const createTextOnlyExcerpt = (htmlString, maxLength) => {
  if (!htmlString) return "";
  
  // Create a document fragment to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Get text content only, properly handling paragraphs and line breaks
  let textContent = '';
  const paragraphs = doc.body.querySelectorAll('p');
  
  // If we have paragraphs from Quill editor
  if (paragraphs.length > 0) {
    // Get text from paragraphs with proper spacing
    paragraphs.forEach((p, index) => {
      if (index > 0) textContent += ' '; // Add space between paragraphs
      textContent += p.textContent;
    });
  } else {
    // Fallback to regular text content
    textContent = doc.body.textContent || "";
  }
  
  // Create excerpt
  if (textContent.length > maxLength) {
    return textContent.substring(0, maxLength) + "...";
  }
  
  return textContent;
};

// Individual blog post component to avoid hooks inside map
const BlogPostCard = ({ item, userId, formatDate, handleDelete }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Process the description for formatted content
  const formattedContent = renderFormattedText(item.description);
  
  // Extract the first image URL
  const firstImageUrl = extractFirstImage(formattedContent);
  
  // Create text-only excerpt (without images) for cleaner reading
  const textExcerpt = createTextOnlyExcerpt(formattedContent, 300);
  
  // Check image orientation when image URL changes
  useEffect(() => {
    if (firstImageUrl) {
      checkImageOrientation(firstImageUrl, (portrait) => {
        setIsPortrait(portrait);
      });
    }
  }, [firstImageUrl]);
  
  return (
    <div className={`blog-post-card ${item.pinned ? 'pinned-post' : ''}`}>
      <div className="blog-post-content">
        <Link to={`/detail/${item.id}`} className="blog-title-link">
          <h3 className="blog-post-title">
            {item.pinned && <span className="pin-icon" title="Pinned Post">📌</span>}
            {item.title}
          </h3>
        </Link>
        
        <div className="blog-post-body">
          <div className="blog-excerpt">
            {textExcerpt}
          </div>
          
          {/* Display first image if available */}
          {firstImageUrl && (
            <div className={`excerpt-first-image ${isPortrait ? 'portrait-image' : ''}`}>
              <img 
                src={firstImageUrl} 
                alt={item.title}
                loading="lazy" // Add lazy loading for better performance
                className={imageLoaded ? 'image-loaded' : ''}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.error("Failed to load image in blog excerpt");
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dy='.3em' fill='%23999'%3EImage unavailable%3C/text%3E%3C/svg%3E";
                  e.target.classList.add('image-error');
                  setImageLoaded(true);
                }}
              />
              {!imageLoaded && (
                <div className="image-loading-placeholder">
                  <div className="spinner-border spinner-border-sm text-secondary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Link to={`/detail/${item.id}`} className="read-more">
            Read more
          </Link>
        </div>
      </div>
      
      <div className="blog-post-footer">
        <div className="blog-post-meta">
          <div className="meta-info">
            {item.author && (
              <span className="post-author">Posted by: {item.author}</span>
            )}
            <div className="date-and-tags">
              <span className="post-date">
                {formatDate(item.date || item.timestamp)}
              </span>
              {item.emojiTag && (
                <span className="emoji-tag">
                  {item.emojiTag}
                  {item.emojiTagCount > 1 && (
                    <span className="emoji-count">{item.emojiTagCount}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {userId && item.userId === userId && (
          <div className="blog-admin-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => window.scrollTo(0, 0)}
            >
              <Link to={`/update/${item.id}`}>
                <FontAwesome name="edit" />
              </Link>
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => handleDelete(item.id)}
            >
              <FontAwesome name="trash" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function BlogSection({ blogs, user, handleDelete }) {
  const userId = user?.uid;

  // Format date efficiently
  const formatDate = (dateValue) => {
    if (!dateValue) return "No date";
    
    try {
      let date = dateValue.toDate ? dateValue.toDate() : 
                 typeof dateValue === 'string' ? new Date(dateValue) : 
                 dateValue;
      
      return date instanceof Date && !isNaN(date) 
        ? date.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
          }) 
        : "Unknown date";
    } catch (error) {
      return "Unknown date";
    }
  };

  // Filter out invalid posts
  const validBlogs = blogs?.filter(blog => 
    blog && blog.title && blog.title.trim() !== "" && 
    blog.description && blog.description.trim() !== ""
  ) || [];

  if (validBlogs.length === 0) {
    return (
      <div className="no-posts-message">
        <h4>No Posts Available</h4>
      </div>
    );
  }

  return (
    <div className="blog-section-container">
      {validBlogs.map((item) => (
        <BlogPostCard 
          key={item.id}
          item={item}
          userId={userId}
          formatDate={formatDate}
          handleDelete={handleDelete}
        />
      ))}
    </div>
  );
}