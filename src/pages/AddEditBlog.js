import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import {
  addDoc,
  collection,
  getDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./AddEditBlog.css";
import Spinner from "../components/Spinner";
import heic2any from "heic2any"; // Import heic2any library for HEIC conversion
import ReactQuill from 'react-quill'; // Import React-Quill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

// Available emoji tags
const EMOJI_OPTIONS = [
  { emoji: '💻', label: 'Technology' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🍔', label: 'Food' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🏋️‍♂️', label: 'Fitness' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '💼', label: 'Business' }
];

const initialState = {
  title: "",
  description: "",
  imgUrl: "",
  date: new Date().toISOString().split('T')[0], // Default to today's date
  emojiTag: "",
  pinned: false
}

// Custom handler for YouTube videos
const videoHandler = function() {
  const quill = this.quill;
  const range = quill.getSelection();
  
  const value = prompt("Please enter the YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, or https://youtube.com/shorts/VIDEO_ID)");
  
  if (value) {
    // Extract video ID from various YouTube URL formats including Shorts
    let videoId = '';
    
    // Support regular YouTube, youtu.be, and YouTube Shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = value.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
      
      // Create responsive embed container for the video - centered by default
      const embedHtml = `
        <div class="video-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px auto; width: 90%;">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
      
      // Insert the HTML at cursor position
      quill.clipboard.dangerouslyPasteHTML(range.index, embedHtml);
      
      // Move cursor after the inserted content
      quill.setSelection(range.index + 1);
      
      toast.success("YouTube video embedded successfully");
    } else {
      toast.error("Invalid YouTube URL. Please enter a valid YouTube video URL.");
    }
  }
};

// Custom link handler to fix Quill link button
const linkHandler = function() {
  const quill = this.quill;
  const range = quill.getSelection();
  
  if (range == null) return;
  
  let preview = quill.getText(range);
  if (/^\S+@\S+\.\S+$/.test(preview)) {
    preview = 'mailto:' + preview;
  } else if (!/^https?:\/\//.test(preview)) {
    // If it doesn't start with http:// or https://, assume it's a website and add https://
    if (preview && !preview.trim().startsWith('http')) {
      preview = 'https://' + preview;
    }
  }
  
  const value = prompt('Enter link URL:', preview || 'https://');
  if (value) {
    quill.format('link', value);
  } else {
    quill.format('link', false);
  }
};

// Quill editor modules and formats configuration
const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['video'], // Add YouTube video button
      ['clean']
    ],
    handlers: {
      video: videoHandler, // Custom handler for YouTube videos
      link: linkHandler // Custom handler for links
    }
  },
  clipboard: {
    // Toggle to add keep full HTML when pasting
    matchVisual: false,
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link',
  'image', 'video'
];

const AddEditBlog = ({user, setActive}) => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialState)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlignment, setImageAlignment] = useState("center")
  const {id} = useParams()
  const quillRef = useRef(null)
  const fileInputRef = useRef(null)

  const {title, description, date, emojiTag, pinned} = form

  useEffect(() => {
    const loadBlogData = async () => {
      if (id) {
        await getBlogDetail();
      }
      setIsLoading(false);
    };
    loadBlogData();
  }, [id]);

  useEffect(() => {
    const uploadFile = () => {
      if (!file) return;
      
      try {
        // Log file details for debugging
        console.log("Attempting to upload file:", file.name, "Size:", file.size, "Type:", file.type);
        
        // Create a unique filename with timestamp
        const timestamp = new Date().getTime();
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const uniqueFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Storage path without user folder (simplify path structure)
        const imagePath = `blogImages/${uniqueFileName}`;
        const storageRef = ref(storage, imagePath);
        
        console.log("Storage path:", imagePath);
        
        // Start upload
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on("state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
            console.log("Upload progress:", progress.toFixed(1) + "%");
          },
          (error) => {
            // Detailed error logging
            console.error("Upload error:", error.code, error.message);
            let errorMessage = "Image upload failed!";
            
            // More specific error messages based on error code
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = "You don't have permission to upload";
                break;
              case 'storage/canceled':
                errorMessage = "Upload was canceled";
           break;
              case 'storage/unknown':
                errorMessage = "An unknown error occurred";
            break;
              default:
                errorMessage = `Upload error: ${error.message}`;
            }
            
            toast.error(errorMessage);
            setProgress(null);
            setFile(null);
          },
          async () => {
            console.log("Upload completed successfully");
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Download URL generated:", downloadUrl);
              
              toast.success("Image uploaded successfully");
              
              // Insert the image at cursor position
              insertImage(downloadUrl, imageAlignment);
              
              // Store the URL in the form state to ensure it's saved
              const updatedContent = quillRef.current?.getEditor().root.innerHTML || description;
              setForm(prev => ({
                ...prev,
                description: updatedContent,
              }));
              
              // Log the content after insertion
              setTimeout(() => {
                console.log("Updated content:", quillRef.current?.getEditor().root.innerHTML);
              }, 200);
              
              setProgress(null);
              setShowImagePopup(false);
              setFile(null);
            } catch (urlError) {
              console.error("Error getting download URL:", urlError);
              toast.error("Error retrieving the uploaded image URL");
              setProgress(null);
              setFile(null);
            }
          }
        );
      } catch (setupError) {
        console.error("Error setting up upload:", setupError);
        toast.error("Failed to initialize image upload");
        setProgress(null);
        setFile(null);
      }
    };
    
    file && uploadFile();
  }, [file, imageAlignment]);

  const getBlogDetail = async () => {
    try {
      const docRef = doc(db, "blogs", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setForm({...snapshot.data()});
      }
      setActive(null);
    } catch (error) {
      toast.error("Error loading blog: " + error.message);
    }
  };

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value})
  }

  // Handle Quill editor content change
  const handleEditorChange = (content) => {
    console.log("Editor content changed:", content.substring(0, 50) + "...");
    if (content !== description) {
      setForm({...form, description: content});
    }
  }

  const handleEmojiSelect = (emoji) => {
    setForm({...form, emojiTag: emoji});
    setShowEmojiPicker(false);
  }

  const togglePin = () => {
    setForm({...form, pinned: !pinned});
    toast.info(pinned ? "Post unpinned" : "Post pinned - will appear at the top");
  }

  const validateForm = () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return false
    }
    if (!description.trim() || description === '<p><br></p>') {
      toast.error("Description is required")
      return false
    }
    if (!date) {
      toast.error("Date is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const blogData = {
        ...form,
        timestamp: serverTimestamp(),
        author: user.displayName,
        userId: user.uid,
        reactions: {},  // Initialize empty reactions object
        userReactions: {} // Initialize empty user reactions object
      }

      // Add pinnedAt timestamp if post is pinned
      if (blogData.pinned) {
        blogData.pinnedAt = serverTimestamp();
      }

      // Set a default emojiTagCount of 1
      if (blogData.emojiTag) {
        blogData.emojiTagCount = 1;
        
        try {
          // Check for existing emoji counter in a separate collection
          const emojiCountersRef = collection(db, "emojiCounters");
          const q = await getDocs(query(emojiCountersRef, where("emoji", "==", blogData.emojiTag)));
          
          if (!q.empty) {
            const counterDoc = q.docs[0];
            const count = counterDoc.data().count || 0;
            
            // Update counter
            await updateDoc(doc(db, "emojiCounters", counterDoc.id), {
              count: count + 1
            });
            
            blogData.emojiTagCount = count + 1;
          } else {
            // Create new counter
            await addDoc(collection(db, "emojiCounters"), {
              emoji: blogData.emojiTag,
              count: 1
            });
          }
        } catch (error) {
          console.error("Error handling emoji counter:", error);
          // Continue anyway - the post will just show a count of 1
        }
      }

      if (!id) {
        // Creating a new blog
        await addDoc(collection(db, "blogs"), blogData)
        toast.success("Blog created successfully")
      } else {
        // Updating an existing blog
        const docRef = doc(db, "blogs", id);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          const existingData = snapshot.data();
          
          // Handle image replacement
          if (existingData.imgPath && 
              blogData.imgPath && 
              existingData.imgPath !== blogData.imgPath) {
            try {
              // Delete the old image if a new one was uploaded
              const oldImageRef = ref(storage, existingData.imgPath);
              await deleteObject(oldImageRef);
              console.log("Old image deleted during update");
            } catch (imageError) {
              console.error("Error deleting old image during update:", imageError);
              // Continue with update even if old image deletion fails
            }
          }
          
          // Keep existing reactions data
          if (existingData.reactions) {
            blogData.reactions = existingData.reactions;
          }
          if (existingData.userReactions) {
            blogData.userReactions = existingData.userReactions;
          }
        }
        
        await updateDoc(doc(db, "blogs", id), blogData)
        toast.success("Blog updated successfully")
      }
      navigate("/")
    } catch (err) {
      console.error("Error saving blog:", err);
      toast.error("Error saving blog: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Function to insert image directly into the Quill editor
  const insertImage = (url, alignment) => {
    if (!quillRef.current) {
      console.error("Quill editor reference not available");
      return;
    }
    
    console.log("Inserting image:", url, "with alignment:", alignment);
    
    try {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      
      // Get current position
      const index = range ? range.index : 0;
      console.log("Inserting at position:", index);
      
      // Create image HTML with alignment and responsive behavior
      let imageHtml = '';
      if (alignment === 'left') {
        imageHtml = `<img src="${url}" alt="Blog image" class="responsive-image" style="float: left; margin: 0 15px 10px 0; max-width: 40%;" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-family=\\'Arial\\' font-size=\\'14\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3EImage failed to load%3C/text%3E%3C/svg%3E';" />`;
      } else if (alignment === 'right') {
        imageHtml = `<img src="${url}" alt="Blog image" class="responsive-image" style="float: right; margin: 0 0 10px 15px; max-width: 40%;" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-family=\\'Arial\\' font-size=\\'14\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3EImage failed to load%3C/text%3E%3C/svg%3E';" />`;
      } else {
        imageHtml = `<img src="${url}" alt="Blog image" class="responsive-image" style="display: block; margin: 10px auto; max-width: 80%;" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f0f0f0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-family=\\'Arial\\' font-size=\\'14\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3EImage failed to load%3C/text%3E%3C/svg%3E';" />`;
      }
      
      console.log("Generated HTML:", imageHtml);
      
      // Insert the HTML at cursor position
      quill.clipboard.dangerouslyPasteHTML(index, imageHtml);
      
      // Also try the Quill built-in image insertion as a fallback
      // quill.insertEmbed(index, 'image', url);
      
      // Force a re-render of the editor content
      const currentContent = quill.getContents();
      setTimeout(() => {
        quill.setContents(currentContent);
        
        // Move cursor after the image
        quill.setSelection(index + 1);
      }, 10);
      
      // Log if image is in the editor content
      const editorContent = quill.root.innerHTML;
      console.log("Editor content contains image:", editorContent.includes(url));
      
      // Check image orientation and add appropriate class
      setTimeout(() => {
        const img = new Image();
        img.onload = function() {
          const isPortrait = this.height > this.width;
          
          // Find the inserted image in the editor
          const editorImages = document.querySelectorAll('.ql-editor img');
          console.log("Found images in editor:", editorImages.length);
          
          // Get the last inserted image
          const insertedImage = editorImages[editorImages.length - 1];
          
          if (insertedImage && isPortrait) {
            // Add portrait class or style
            if (alignment === 'center') {
              insertedImage.style.maxHeight = '500px';
              insertedImage.style.width = 'auto';
            }
          }
        };
        img.src = url;
      }, 100);
    } catch (error) {
      console.error("Error inserting image:", error);
      toast.error("Failed to insert image. Please try again.");
    }
  }
  
  // Handle image from URL
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    
    insertImage(imageUrl, imageAlignment);
    
    // Ensure the form state is updated with the new content
    setTimeout(() => {
      const updatedContent = quillRef.current?.getEditor().root.innerHTML || description;
      console.log("Updated content after URL insertion:", updatedContent.substring(0, 50) + "...");
      setForm(prev => ({
        ...prev,
        description: updatedContent,
      }));
    }, 100);
    
    setShowImagePopup(false);
    setImageUrl("");
    setImageAlignment("center"); // Reset alignment to center after insertion
  };
  
  // Handle file selection for image upload
  const handleFileSelected = async (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Log file info for debugging
      console.log('File selected:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);
      
      // Check file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
      const fileType = selectedFile.type.toLowerCase();
      
      // Get file extension
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const isValidByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExtension);
      
      if (validImageTypes.includes(fileType) || isValidByExtension) {
        // Check file size (10MB limit)
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast.error('Image file is too large. Maximum size is 10MB.');
          return;
        }
        
        try {
          // Handle HEIC/HEIF format conversion
          if (fileExtension === 'heic' || fileExtension === 'heif' || 
              fileType === 'image/heic' || fileType === 'image/heif') {
            
            toast.info("Converting HEIC image to JPEG format...");
            
            try {
              // Convert HEIC to JPEG using heic2any
              const jpegBlob = await heic2any({
                blob: selectedFile,
                toType: "image/jpeg",
                quality: 0.8
              });
              
              // Create a new file from the blob
              const convertedFile = new File(
                [jpegBlob], 
                `${selectedFile.name.split('.')[0]}.jpg`, 
                { type: 'image/jpeg' }
              );
              
              console.log("HEIC file converted to JPEG successfully");
              toast.success("HEIC image converted successfully");
              
              // Use the converted file
              setFile(convertedFile);
            } catch (conversionError) {
              console.error("HEIC conversion failed:", conversionError);
              toast.error("Failed to convert HEIC image. Please try a different format.");
            }
          } else {
            // For non-HEIC files, use as is
            setFile(selectedFile);
          }
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Error processing the selected file.");
        }
      } else {
        toast.error(`Unsupported file type. Please use JPG, PNG, GIF, WEBP, or HEIC format.`);
        console.error('Invalid file type:', fileType, 'Extension:', fileExtension);
      }
    }
  };
  
  // Open file browser with support for mobile formats
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  if (isLoading) {
    return <Spinner />;
  }

  return (
   <div className="container-fluid mb-4">
      {isSubmitting && <Spinner />}
    <div className="container">
      <div className="col-12">
        <div className="text-center heading py-2">
    {id ? "Update Blog" : "Create Blog"}
        </div>
      </div>
      <div className="row h-100 justify-content-center align-items-center">
        <div className="col-10 col-md-8 col-lg-6">
          <form className="row blog-form" onSubmit={handleSubmit}>
            <div className="col-12 py-3">
                <input 
                  type="text"
              className="form-control input-text-box"
                  placeholder="Title *"
              name="title"
              value={title}
                  onChange={handleChange}
                />
            </div>
              
            <div className="col-12 py-3">
                <input 
                  type="date"
                  className="form-control input-text-box"
                  placeholder="Date *"
                  name="date"
                  value={date}
                  onChange={handleChange}
                />
              </div>
              
              <div className="col-12 py-3">
                <div className="editor-toolbar">
                  <button 
                    type="button" 
                    className="toolbar-btn" 
                    title="Insert Image"
                    onClick={() => setShowImagePopup(true)}
                  >
                    🖼️
                  </button>
                  <div className="toolbar-separator"></div>
                  <button 
                    type="button" 
                    className={`toolbar-btn ${pinned ? 'active-pin' : ''}`}
                    title={pinned ? "Unpin Post" : "Pin Post to Top"}
                    onClick={togglePin}
                  >
                    📌
                  </button>
                  <div className="toolbar-separator"></div>
                  <div className="emoji-tag-toolbar">
                    <button 
                      type="button" 
                      className="toolbar-btn emoji-btn" 
                      title="Add Emoji Tag"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      {emojiTag || '😀'}
                    </button>
                    {showEmojiPicker && (
                      <div className="emoji-picker toolbar-popup">
                        {EMOJI_OPTIONS.map((option) => (
                          <div 
                            key={option.emoji} 
                            className="emoji-option" 
                            onClick={() => handleEmojiSelect(option.emoji)}
                            title={option.label}
                          >
                            {option.emoji}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Replace textarea with ReactQuill editor */}
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={description}
                  onChange={handleEditorChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your blog post here..."
                  className="quill-editor"
                />
              </div>
              
              <div className="col-12 py-3 text-center">
                <button 
                  className={`btn btn-add ${isSubmitting ? 'submitting' : ''}`}
                  type="submit"
                  disabled={isSubmitting || (progress !== null && progress < 100)}
                >
                  {isSubmitting ? 'Saving...' : (id ? 'Update' : 'Submit')}
                </button>
              </div>
            </form>
          </div>
               </div>
            </div>
      
      {/* Image Upload Popup */}
      {showImagePopup && (
        <div className="popup-overlay">
          <div className="image-popup">
            <div className="popup-header">
              <h3>Image Properties</h3>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setShowImagePopup(false)}
              >
                ×
              </button>
            </div>
            <div className="popup-body">
              <div className="form-group">
                <label>URL</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="form-group">
                <label>Upload</label>
                <div className="file-upload-container">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={triggerFileInput}
                  >
                    Choose File
                  </button>
                  <span className="selected-file-name">
                    {file ? file.name : 'no file selected'}
                  </span>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
              />
            </div>
                {file && (
                  <div className="file-preview-container">
                    <div className="file-preview">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        onError={(e) => {
                          console.error("Image preview failed to load");
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dy='.3em' fill='%23999'%3EPreview unavailable%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <button 
                        type="button" 
                        className="remove-preview" 
                        onClick={() => setFile(null)} 
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                {progress !== null && (
                  <div className="progress mt-2">
                    <div 
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {progress}%
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add alignment options */}
              <div className="form-group">
                <label>Alignment</label>
                <div className="alignment-options">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="alignment"
                      id="alignLeft"
                      value="left"
                      checked={imageAlignment === "left"}
                      onChange={() => setImageAlignment("left")}
                    />
                    <label className="form-check-label" htmlFor="alignLeft">
                      Left
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="alignment"
                      id="alignCenter"
                      value="center"
                      checked={imageAlignment === "center" || imageAlignment === "none"}
                      onChange={() => setImageAlignment("center")}
                    />
                    <label className="form-check-label" htmlFor="alignCenter">
                      Center
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="alignment"
                      id="alignRight"
                      value="right"
                      checked={imageAlignment === "right"}
                      onChange={() => setImageAlignment("right")}
                    />
                    <label className="form-check-label" htmlFor="alignRight">
                      Right
                    </label>
                  </div>
                </div>
              </div>

              <div className="popup-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowImagePopup(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={imageUrl ? handleInsertImageUrl : null}
                  disabled={!imageUrl && !file}
                >
                  {file ? 'Upload' : 'OK'}
                </button>
              </div>
            </div>
            </div>
        </div>
      )}
   </div>
  )
}

export default AddEditBlog