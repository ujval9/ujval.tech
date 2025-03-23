import React from 'react'
import { useNavigate } from 'react-router-dom'
import './MostPopular.css'

const MostPopular = ({ blogs }) => {
    const navigate = useNavigate()

    // Format date from Firestore timestamp or from date string
    const formatDate = (dateValue) => {
        if (!dateValue) return "No date";
        
        try {
            let date = dateValue;
            if (dateValue.toDate) {
                date = dateValue.toDate();
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            }
            
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

    // Get sorted blogs safely
    const sortedBlogs = React.useMemo(() => {
        // Filter out invalid blogs first
        const validBlogs = blogs?.filter(blog => 
            blog && blog.title && blog.title.trim() !== "" && 
            blog.description && blog.description.trim() !== ""
        ) || [];

        if (validBlogs.length === 0) return [];
        
        try {
            return [...validBlogs]
                .sort((a, b) => {
                    // Compare by timestamp or date
                    if (a.timestamp?.seconds && b.timestamp?.seconds) {
                        return b.timestamp.seconds - a.timestamp.seconds;
                    }
                    if (a.date && b.date) {
                        return new Date(b.date) - new Date(a.date);
                    }
                    return 0;
                })
                .slice(0, 3); // Get top 3 posts
        } catch (error) {
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
                                {formatDate(item.timestamp || item.date)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MostPopular