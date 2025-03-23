import { collection, deleteDoc, onSnapshot, doc, getDoc, query, where, getDocs } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import BlogSection from '../components/BlogSection'
import { db, storage } from '../firebase'
import Spinner from "../components/Spinner"
import MostPopular from '../components/MostPopular'
import QuoteOfTheDay from '../components/QuoteOfTheDay'
import '../components/BlogSection.css'
import './Home.css'
import { deleteObject, ref } from 'firebase/storage'

const Home = ({setActive, user}) => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992)

  // Add a window resize listener to detect mobile/desktop view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "blogs"),
        (snapshot) => {
          try {
            let list = []
            snapshot.docs.forEach((doc) => {
              list.push({id: doc.id, ...doc.data()})
            })
            setBlogs(list)
            setLoading(false)
            setActive("home")
          } catch (error) {
            console.error("Error processing snapshot:", error);
            setError("Error processing blog data: " + error.message)
            toast.error("Error loading blogs: " + error.message)
            setLoading(false)
          }
        },
        (error) => {
          console.error("Snapshot listener error:", error);
          setError("Error with blog listener: " + error.message)
          toast.error("Error loading blogs: " + error.message)
          setLoading(false)
        }
      )
      return () => unsub()
    } catch (error) {
      console.error("Overall setup error:", error);
      setError("Failed to set up blog listener: " + error.message)
      toast.error("Failed to set up blog listener")
      setLoading(false)
    }
  }, [setActive])

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        setLoading(true);
        
        // First, get the blog post to check if it has an image
        const blogDoc = await getDoc(doc(db, "blogs", id));
        if (blogDoc.exists()) {
          const blogData = blogDoc.data();
          
          // If the blog has an image stored in Firebase Storage
          if (blogData.description) {
            try {
              // Extract all image URLs from the blog content
              const imgRegex = /<img[^>]+src="([^">]+)"/g;
              const imgUrls = [];
              let match;
              
              // Find all image URLs in the blog content
              while ((match = imgRegex.exec(blogData.description)) !== null) {
                imgUrls.push(match[1]);
              }
              
              console.log("Found images in blog content:", imgUrls);
              
              // Delete each image from Firebase Storage
              for (const imgUrl of imgUrls) {
                try {
                  // Extract the path from the URL
                  if (imgUrl.includes('firebasestorage.googleapis.com')) {
                    // Try to get the path by querying the storage references
                    const pathRef = await query(
                      collection(db, "storageReferences"),
                      where("url", "==", imgUrl)
                    );
                    const pathSnapshot = await getDocs(pathRef);
                    
                    if (!pathSnapshot.empty) {
                      const pathData = pathSnapshot.docs[0].data();
                      if (pathData.path) {
                        const imageRef = ref(storage, pathData.path);
                        await deleteObject(imageRef);
                        console.log("Deleted image:", pathData.path);
                      }
                    } else {
                      // If we can't find the path, try to derive it from the URL
                      const urlParts = imgUrl.split('?')[0].split('/o/');
                      if (urlParts.length > 1) {
                        const encodedPath = urlParts[1];
                        const path = decodeURIComponent(encodedPath);
                        const imageRef = ref(storage, path);
                        await deleteObject(imageRef);
                        console.log("Deleted image with derived path:", path);
                      }
                    }
                  }
                } catch (imgError) {
                  console.error("Error deleting image:", imgError);
                  // Continue with other images and blog deletion
                }
              }
            } catch (contentError) {
              console.error("Error processing blog content:", contentError);
              // Continue with blog deletion
            }
          }
          
          // If the blog has a direct image path
          if (blogData.imgPath) {
            try {
              console.log("Attempting to delete direct image:", blogData.imgPath);
              // Delete the image from Firebase Storage
              const imageRef = ref(storage, blogData.imgPath);
              await deleteObject(imageRef);
              console.log("Direct image deleted successfully");
            } catch (imageError) {
              console.error("Error deleting direct image:", imageError.code, imageError.message);
              // Continue with blog deletion even if image deletion fails
            }
          }
        }
        
        // Delete the blog document from Firestore
        await deleteDoc(doc(db, "blogs", id));
        toast.success("Blog deleted successfully");
      } catch (error) {
        console.error("Error in delete operation:", error);
        toast.error("Error deleting blog: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Sort blogs by pinned status first, then by timestamp
  const sortedBlogs = React.useMemo(() => {
    if (!blogs || blogs.length === 0) return [];
    
    return [...blogs].sort((a, b) => {
      // First check if posts are pinned
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // If both are pinned, sort by pinnedAt timestamp (most recently pinned first)
      if (a.pinned && b.pinned) {
        if (a.pinnedAt && b.pinnedAt) {
          return b.pinnedAt.seconds - a.pinnedAt.seconds;
        }
      }
      
      // Then sort by creation time (newest first)
      if (a.timestamp && b.timestamp) {
        return b.timestamp.seconds - a.timestamp.seconds;
      }
      
      // If timestamps are not available, use date strings
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      
      return 0;
    });
  }, [blogs]);

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container-fluid" style={{ padding: "25px" }}>
      <div className="main-content">
        {/* On mobile, show Quote of the Day above blog posts */}
        {isMobile && (
          <div className="mobile-quote-container">
            <QuoteOfTheDay />
          </div>
        )}
        
        <div className="blog-feed">
          <BlogSection 
            blogs={sortedBlogs} 
            user={user} 
            handleDelete={handleDelete}
          />
        </div>
        <div className="sidebar">
          {/* Only show Quote of the Day in sidebar on desktop */}
          {!isMobile && <QuoteOfTheDay />}
          <MostPopular blogs={sortedBlogs} />
        </div>
      </div>
    </div>
  )
}

export default Home