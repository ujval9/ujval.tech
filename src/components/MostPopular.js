import React from 'react'
import { useNavigate } from 'react-router-dom'
import './MostPopular.css'

const MostPopular = ({ blogs }) => {
    const navigate = useNavigate()

    // Format date from Firestore timestamp or from date string
    const formatDate = (dateValue) => {
        if (!dateValue) return "No date";
        
        try {
            // If we have a numeric timestamp value (sortTimestamp)
            if (typeof dateValue === 'number') {
                const date = new Date(dateValue);
                return date instanceof Date && !isNaN(date) 
                    ? date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })
                    : "Unknown date";
            }
            
            // Handle Firestore timestamp or string date
            let date = dateValue;
            if (dateValue.toDate) {
                date = dateValue.toDate();
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            }
            
            // Return formatted date if valid
            if (date instanceof Date && !isNaN(date)) {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                });
            }
            
            // Final fallback - if dateValue is a string and might be a date, return it directly
            if (typeof dateValue === 'string' && dateValue.match(/\d{4}-\d{2}-\d{2}/)) {
                return dateValue; // Return the date string directly as last resort
            }
            
            return "Unknown date";
        } catch (error) {
            console.error("Error formatting date:", error, "Value:", dateValue);
            
            // Last resort fallback - if dateValue is a string, try to return it directly
            if (typeof dateValue === 'string') {
                return dateValue;
            }
            
            return "Unknown date";
        }
    };

    // Get sorted blogs safely
    const sortedBlogs = React.useMemo(() => {
        // Filter out invalid blogs first
        const validBlogs = blogs?.filter(blog => 
            blog && blog.title && blog.title.trim() !== "" && 
            blog.description && blog.description.trim() !== ""
        ) || [];

        if (validBlogs.length === 0) return [];
        
        try {
            // Ensure all blogs have sortTimestamp
            const blogsWithTimestamp = validBlogs.map(blog => {
                // Clone the blog object to avoid modifying the original
                const blogCopy = {...blog};
                
                // Add sortTimestamp if missing but date exists
                if (!blogCopy.sortTimestamp && blogCopy.date) {
                    try {
                        const dateObj = new Date(blogCopy.date);
                        if (!isNaN(dateObj)) {
                            dateObj.setHours(12, 0, 0, 0);
                            blogCopy.sortTimestamp = dateObj.getTime();
                            console.log(`MostPopular: Generated sortTimestamp ${blogCopy.sortTimestamp} for blog "${blogCopy.title}"`);
                        }
                    } catch (dateError) {
                        console.error("Error generating sortTimestamp:", dateError);
                    }
                }
                return blogCopy;
            });
            
            // Debug the date values in the first few blogs
            if (blogsWithTimestamp.length > 0) {
                console.log("MostPopular - Blog Date Values:");
                blogsWithTimestamp.slice(0, 3).forEach(blog => {
                    console.log(`Blog: ${blog.title}, Date: ${blog.date}, sortTimestamp: ${blog.sortTimestamp}`);
                });
            }
            
            return blogsWithTimestamp
                .sort((a, b) => {
                    // First check if posts are pinned
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    
                    // First priority: Use sortTimestamp (numeric millisecond timestamp) if available
                    if (a.sortTimestamp && b.sortTimestamp) {
                        return b.sortTimestamp - a.sortTimestamp;
                    } else if (a.sortTimestamp) {
                        return -1; // a has sortTimestamp, b doesn't, so a comes first
                    } else if (b.sortTimestamp) {
                        return 1;  // b has sortTimestamp, a doesn't, so b comes first
                    }
                    
                    // Second priority: Use Firestore timestamp
                    if (a.timestamp && b.timestamp) {
                        // Handle Firestore timestamps
                        if (a.timestamp.seconds && b.timestamp.seconds) {
                            return b.timestamp.seconds - a.timestamp.seconds;
                        }
                    }
                    
                    // Third priority: Fall back to date strings
                    if (a.date && b.date) {
                        return new Date(b.date) - new Date(a.date);
                    }
                    
                    return 0;
                })
                .slice(0, 3); // Get top 3 posts
        } catch (error) {
            console.error("Error sorting blogs:", error);
            return validBlogs.slice(0, 3);
        }
    }, [blogs]);

    if (sortedBlogs.length === 0) {
        return (
            <div className="most-popular-container">
                <h3 className="section-title">Recent Posts</h3>
                <p className="no-posts-message">No Posts Available</p>
            </div>
        );
    }

    return (
        <div className="most-popular-container">
            <h3 className="section-title">Recent Posts</h3>
            <div className="popular-posts-list">
                {sortedBlogs.map((item) => (
                    <div 
                        className="popular-post-card" 
                        key={item.id} 
                        onClick={() => navigate(`/detail/${item.id}`)}
                    >
                        <div className="popular-post-content">
                            <div className="article-tag">Article</div>
                            <h4 className="popular-post-title">{item.title}</h4>
                            <div className="popular-post-meta">
                                {formatDate(item.sortTimestamp || item.timestamp || item.date || "Unknown date")}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MostPopular