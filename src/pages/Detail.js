import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Tags from "../components/Tags";
import "./styles/Detail.css";

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

// Helper function to render formatted text with images
const renderFormattedText = (text) => {
  if (!text) return "";
  
  // The content is already HTML from the Quill editor, 
  // but let's make sure images have error handling and additional features
  const processedText = text.replace(/<img(.*?)src="(.*?)"(.*?)>/g, (match, before, src, after) => {
    return `<img${before}src="${src}"${after} 
      loading="lazy" 
      class="blog-image" 
      data-src="${src}"
      onload="this.classList.add('image-loaded'); const placeholder = this.previousElementSibling; if (placeholder && placeholder.classList.contains('image-loading-placeholder')) placeholder.style.display = 'none';"
      onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-family=\\'Arial\\' font-size=\\'14\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3EImage failed to load%3C/text%3E%3C/svg%3E'; this.classList.add('image-error'); const placeholder = this.previousElementSibling; if (placeholder && placeholder.classList.contains('image-loading-placeholder')) placeholder.style.display = 'none';" 
      onclick="window.openImageModal && window.openImageModal(this.src)">`;
  });
  
  // Add a loading placeholder before each image
  const withLoadingPlaceholders = processedText.replace(/<img([^>]*)>/g, 
    '<div class="image-loading-placeholder"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div><img$1>');
  
  return withLoadingPlaceholders;
};

export default function Detail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // ID is needed to fetch the blog
    if (!id) {
      setLoading(false);
      return;
    }

    const getBlogDetail = async () => {
      try {
        // Get the blog data
        const docRef = doc(db, "blogs", id);
        const blogDetail = await getDoc(docRef);
        
        if (blogDetail.exists()) {
          const blogData = { id: blogDetail.id, ...blogDetail.data() };
          setBlog(blogData);

          // Fetch all tags for the Tags component
          const tagsSnapshot = await getDocs(collection(db, "tags"));
          const tagsList = tagsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTags(tagsList);
        }
      } catch (error) {
        console.error("Error fetching blog details:", error);
      } finally {
        setLoading(false);
      }
    };

    getBlogDetail();
  }, [id]);

  // Format date
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

  // Function to open image modal
  const openImageModal = (src) => {
    setModalImage(src);
    setShowModal(true);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  // Add function to window so it can be called from onclick in HTML content
  useEffect(() => {
    window.openImageModal = openImageModal;
    
    // Process images in blog content after render to check orientation
    if (blog) {
      setTimeout(() => {
        const images = document.querySelectorAll('.blog-content img');
        images.forEach(img => {
          checkImageOrientation(img.src, (isPortrait) => {
            if (isPortrait) {
              img.classList.add('portrait-image');
            }
          });
        });
      }, 100);
    }
    
    return () => {
      // Clean up
      delete window.openImageModal;
    };
  }, [blog]);

  // Process the blog content for display
  const processedContent = blog ? renderFormattedText(blog.description) : "";

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="no-blog-container">
        <h2>Blog post not found</h2>
      </div>
    );
  }

  return (
    <div className="single-blog-container">
      <div className="blog-content-wrapper">
        <h1 className="blog-title">{blog.title}</h1>
        
        <div className="blog-meta">
          <span className="blog-author">By {blog.author}</span>
          <span className="blog-date">{formatDate(blog.date || blog.timestamp)}</span>
          {blog.emojiTag && (
            <span className="emoji-tag">
              {blog.emojiTag}
              {blog.emojiTagCount > 1 && (
                <span className="emoji-count">{blog.emojiTagCount}</span>
              )}
            </span>
          )}
        </div>
        
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
        
        <div className="blog-tags">
          <span className="tags-title">Related Topics:</span>
          <Tags tags={tags} />
        </div>
      </div>
      
      {/* Image Modal for fullscreen viewing */}
      {showModal && (
        <div className="image-modal active" onClick={closeImageModal}>
          <img 
            src={modalImage} 
            alt="Fullscreen view" 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dy='.3em' fill='%23999'%3EImage failed to load%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      )}
    </div>
  );
}