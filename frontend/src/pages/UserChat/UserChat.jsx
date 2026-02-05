import React, { useState, useEffect, useRef,useLayoutEffect } from "react";
import axios from "axios";
import "./UserChat.css";
import { 
  MDBContainer, 
  MDBRow, 
  MDBCol, 
  MDBInput, 
  MDBBtn, 
  MDBIcon,
  MDBSpinner 
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";
import ChatResponseRenderer from "../../components/ChatResponseRenderer/ChatResponseRenderer";
function UserChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasActiveForm, setHasActiveForm] = useState(false); // Track if there's an active form
  const [sessionData, setSessionData] = useState(null); // Store session data for pre-filling forms
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserId(JSON.parse(storedUser).user_id);
    } else {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadChatHistory();
      fetchSessionData();
    }
  }, [userId]);

  const fetchSessionData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/session-info/${userId}`
      );
      if (response.data.status === 'active') {
        setSessionData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error);
    }
  };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);
const handleLogout = () => {
  // Remove items from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setUserId(null);
  setMessages([]);
  setInputMessage("");
  // Force page reload to avoid React routing conflicts
  window.location.href = '/login';
};

const handleDeleteChat = async () => {
  if (!userId) return;
  
  setIsDeleting(true);
  try {
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    const response = await axios.post(
      `${backendUrl}/api/messages/delete`,
      { user_id: userId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      // Clear messages from UI
      setMessages([]);
      setShowDeleteConfirm(false);
      console.log(`Deleted ${response.data.deletedCount} messages`);
    } else {
      console.error('Failed to delete messages:', response.data.error);
      setError('Failed to delete chat history. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    setError('Failed to delete chat history. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};
useLayoutEffect(() => {
  if (messages.length > 0) {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: isLoading ? "auto" : "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }
}, [messages, isLoading]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const extractBotText = (content) => {
  if (!content) return "";

  // PRIORITY: Handle direct string responses (new clean format from fixed backend)
  if (typeof content === "string" && !content.trim().startsWith("[") && !content.trim().startsWith("{")) {
    return content;
  }

  // Handle array format with objects containing type and text properties
  if (Array.isArray(content)) {
    const result = content
      .filter(item => item && item.type === "text" && item.text)
      .map(item => item.text)
      .filter(text => !text.toLowerCase().includes("attachment")) // Filter out attachment references
      .join("<br>");
    return result;
  }

  // Handle Python-style string that looks like: [{'type': 'text', 'text': '...', 'extras': {...}}]
  if (typeof content === "string" && content.trim().startsWith("[{") && content.includes("'type':") && content.includes("'text':")) {
    try {
      // Convert Python-style string to proper JSON
      let pythonStr = content.trim();
      
      // Replace single quotes with double quotes, but be careful with quotes inside strings
      // First, temporarily replace escaped single quotes
      pythonStr = pythonStr.replace(/\\'/g, "___ESCAPED_QUOTE___");
      
      // Replace single quotes with double quotes
      pythonStr = pythonStr.replace(/'/g, '"');
      
      // Restore escaped quotes as proper JSON escaped quotes
      pythonStr = pythonStr.replace(/___ESCAPED_QUOTE___/g, '\\"');
      
      // Handle None values
      pythonStr = pythonStr.replace(/\bNone\b/g, "null");
      
      // Handle True/False values
      pythonStr = pythonStr.replace(/\bTrue\b/g, "true");
      pythonStr = pythonStr.replace(/\bFalse\b/g, "false");

      const parsed = JSON.parse(pythonStr);
      
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && item.type === "text" && item.text)
          .map(item => item.text)
          .filter(text => !text.toLowerCase().includes("attachment")) // Filter out attachment references
          .join("<br>");
      }
    } catch (e) {
      console.error("Failed to parse Python-style array:", e);
      console.log("Original content:", content);
      // If parsing fails, try to extract text manually using regex
      try {
        const textMatch = content.match(/'text':\s*"([^"]+)"/);
        if (textMatch && textMatch[1]) {
          const extractedText = textMatch[1];
          // Filter out attachment references
          if (extractedText.toLowerCase().includes("attachment")) {
            return "";
          }
          return extractedText;
        }
        // Try with single quotes
        const textMatch2 = content.match(/'text':\s*'([^']+)'/);
        if (textMatch2 && textMatch2[1]) {
          const extractedText = textMatch2[1];
          // Filter out attachment references
          if (extractedText.toLowerCase().includes("attachment")) {
            return "";
          }
          return extractedText;
        }
      } catch (regexError) {
        console.error("Regex extraction failed:", regexError);
      }
      return content;
    }
  }

  // Handle JSON string that represents an array
  if (typeof content === "string" && content.trim().startsWith("[") && content.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(content.trim());
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && item.type === "text" && item.text)
          .map(item => item.text)
          .filter(text => !text.toLowerCase().includes("attachment")) // Filter out attachment references
          .join("<br>");
      }
    } catch (e) {
      console.error("Failed to parse array JSON:", e);
      // If JSON parsing fails, return the original content
      return content;
    }
  }

  // Handle JSON objects - check if string starts with { and ends with }
  if (typeof content === "string" && content.trim().startsWith("{") && content.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(content.trim());
      // Handle error messages
      if (parsed.error) {
        return parsed.error;
      }
      // Handle success/info messages
      if (parsed.message) {
        return parsed.message;
      }
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      // If JSON parsing fails, return the original content
      return content;
    }
  }

  // Handle direct error objects
  if (typeof content === "object" && content.error) {
    return content.error;
  }

  // Handle direct message objects
  if (typeof content === "object" && content.message) {
    return content.message;
  }

  // Filter out attachment references from plain text
  if (typeof content === "string" && content.toLowerCase().includes("attachment")) {
    return "";
  }

  // Already clean text
  if (typeof content === "string" && !content.trim().startsWith("[")) {
    return content;
  }

  try {
    // Handle STRING that looks like Python list (legacy support)
    if (typeof content === "string") {
      const fixed = content
        .replace(/'/g, '"')
        .replace(/\bNone\b/g, "null");

      const parsed = JSON.parse(fixed);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item.type === "text")
          .map(item => item.text)
          .filter(text => !text.toLowerCase().includes("attachment")) // Filter out attachment references
          .join("<br>");
      }
    }
  } catch (e) {
    console.error("Bot text parse failed:", e);
  }

  return content;
};


  const loadChatHistory = async () => {
  setIsLoading(true);
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/history`,
      { user_id: userId, limit: 50 },
      { headers: { "Content-Type": "application/json" } }
    );

    const normalizedMessages = (response.data || []).map(msg => {
      let timestamp = msg.timestamp;
      if (timestamp && !/Z|[+-]\d\d:?(\d\d)?$/.test(timestamp)) {
        timestamp += "Z";
      }

      // Clean media URLs for bot messages
      let cleanMediaUrls = msg.media_urls || {};
      if (msg.sender === "bot" && msg.media_urls) {
        cleanMediaUrls = {};
        
        // Clean images array
        if (msg.media_urls.images && Array.isArray(msg.media_urls.images)) {
          cleanMediaUrls.images = msg.media_urls.images
            .map(url => {
              if (typeof url === 'string') {
                let cleanUrl = url.trim();
                const imageExtensionMatch = cleanUrl.match(/(.*\.(jpg|jpeg|png|gif|webp))/i);
                if (imageExtensionMatch) {
                  cleanUrl = imageExtensionMatch[1];
                }
                try {
                  new URL(cleanUrl);
                  if (cleanUrl.endsWith('/images') || cleanUrl.endsWith('/videos')) {
                    return null;
                  }
                  return cleanUrl;
                } catch (e) {
                  return null;
                }
              }
              return null;
            })
            .filter(url => url !== null)
            .filter((url, index, array) => array.indexOf(url) === index);
        }
        
        // Clean videos array
        if (msg.media_urls.videos && Array.isArray(msg.media_urls.videos)) {
          cleanMediaUrls.videos = msg.media_urls.videos
            .map(url => {
              if (typeof url === 'string') {
                let cleanUrl = url.trim();
                const match = cleanUrl.match(/(.*\.(mp4|avi|mov|wmv|flv|webm|mkv))/i);
                if (match) {
                  cleanUrl = match[1];
                }
                try {
                  new URL(cleanUrl);
                  return cleanUrl;
                } catch (e) {
                  return null;
                }
              }
              return null;
            })
            .filter(url => url !== null);
        }
      }

      return {
        ...msg,
        content:
          msg.sender === "bot"
            ? extractBotText(msg.content)
            : msg.content,
        media_urls: cleanMediaUrls,
        structured_responses: msg.structured_response || null, // Add structured responses from history
        timestamp
      };
    });

    setMessages(normalizedMessages);
    setError("");
    
    // Check if the last bot message has questions (active form)
    const lastBotMessage = normalizedMessages.filter(m => m.sender === 'bot').pop();
    if (lastBotMessage?.structured_responses) {
      const hasQuestions = lastBotMessage.structured_responses.some(r => r.type === 'questions');
      setHasActiveForm(hasQuestions);
    } else {
      setHasActiveForm(false);
    }
  } catch (error) {
    console.error("Failed to load history:", error);
    setError("Failed to load chat history");
  } finally {
    setIsLoading(false);
  }
};

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMsg = {
      sender: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
   
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsSending(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/send-message`,
        { user_id: userId, message: inputMessage },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Bot response:", response.data);

      if (response.data.status === "success") {
        // Check if we have new structured format
        if (response.data.responses && Array.isArray(response.data.responses)) {
          // New structured format
          const botMsg = {
            sender: "bot",
            structured_responses: response.data.responses,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botMsg]);
          
          // Check if response has questions (active form)
          const hasQuestions = response.data.responses.some(r => r.type === 'questions');
          setHasActiveForm(hasQuestions);
        } else {
          // Legacy format - handle old responses
          const cleanMediaUrls = {};
          
          if (response.data.media_urls) {
            // Clean images array
            if (response.data.media_urls.images && Array.isArray(response.data.media_urls.images)) {
              cleanMediaUrls.images = response.data.media_urls.images
                .map(url => {
                  if (typeof url === 'string') {
                    let cleanUrl = url.trim();
                    const imageExtensionMatch = cleanUrl.match(/(.*\.(jpg|jpeg|png|gif|webp))/i);
                    if (imageExtensionMatch) {
                      cleanUrl = imageExtensionMatch[1];
                    }
                    try {
                      new URL(cleanUrl);
                      if (cleanUrl.endsWith('/images') || cleanUrl.endsWith('/videos')) {
                        return null;
                      }
                      return cleanUrl;
                    } catch (e) {
                      return null;
                    }
                  }
                  return null;
                })
                .filter(url => url !== null)
                .filter((url, index, array) => array.indexOf(url) === index);
            }
            
            // Clean videos array
            if (response.data.media_urls.videos && Array.isArray(response.data.media_urls.videos)) {
              cleanMediaUrls.videos = response.data.media_urls.videos
                .map(url => {
                  if (typeof url === 'string') {
                    let cleanUrl = url.trim();
                    const match = cleanUrl.match(/(.*\.(mp4|avi|mov|wmv|flv|webm|mkv))/i);
                    if (match) {
                      cleanUrl = match[1];
                    }
                    try {
                      new URL(cleanUrl);
                      return cleanUrl;
                    } catch (e) {
                      return null;
                    }
                  }
                  return null;
                })
                .filter(url => url !== null)
                .filter((url, index, array) => array.indexOf(url) === index);
            }
          }

          const botMsg = {
            sender: "bot",
            content: extractBotText(response.data.bot_response),
            media_urls: cleanMediaUrls,
            timestamp: new Date().toISOString(),
          };
          
          setMessages((prev) => [...prev, botMsg]);
        }
      } else {
        setError(response.data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message failed:", error);
      setError("Failed to send message. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const formatBotMessage = (text) => {
  if (!text) return "";
  console.log("Bot message:", text);

  let formatted = text;

  /* ---------------------------------
     0️⃣ Handle line breaks first
     Convert \n to <br> tags
  ---------------------------------- */
  formatted = formatted.replace(/\\n/g, "<br>");
  formatted = formatted.replace(/\n/g, "<br>");

  /* ---------------------------------
     1️⃣ Bold text: *text* → <strong>
  ---------------------------------- */
  formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");

  /* ---------------------------------
     2️⃣ Handle backticks for code/IDs: `text` → <code>
  ---------------------------------- */
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  /* ---------------------------------
     3️⃣ Handle italic text: _text_ → <em>
  ---------------------------------- */
  formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

  /* ---------------------------------
     4️⃣ Handle shift type definitions FIRST
     Prevents them from being broken by other rules
     Pattern: "- Day -> 8 am to 6 pm"
  ---------------------------------- */
  formatted = formatted.replace(
    /\s*-\s*(Day|Night|Full Day|Full Night)\s*->\s*([^\n-]+)/g,
    "<br>&nbsp;&nbsp;&nbsp;&nbsp;• <strong>$1:</strong> $2"
  );

  /* ---------------------------------
     5️⃣ Handle ‣ bullets (main bullets)
     Each bullet on new line with proper spacing
  ---------------------------------- */
  formatted = formatted.replace(/\s*‣\s*/g, "<br>‣ ");

  /* ---------------------------------
     6️⃣ Handle numbered lists (farmhouse results)
     Single <br> for tighter spacing between items
  ---------------------------------- */
  formatted = formatted.replace(/(\d+\.)\s*/g, "<br><strong>$1</strong> ");

  /* ---------------------------------
     7️⃣ Handle bullet points with • symbol
     Add proper spacing for bullet lists
  ---------------------------------- */
  formatted = formatted.replace(/\s*•\s*/g, "<br>&nbsp;&nbsp;• ");

  /* ---------------------------------
     8️⃣ Handle numbered emoji lists (1️⃣, 2️⃣, etc.)
     Add line breaks before emoji numbers
  ---------------------------------- */
  formatted = formatted.replace(/\s*([1-9]️⃣)\s*/g, "<br><strong>$1</strong> ");

  /* ---------------------------------
     9️⃣ Handle "Price (Rs) - 45000" pattern
     Clean format with line break after
  ---------------------------------- */
  formatted = formatted.replace(
    /Price\s*\(Rs\)\s*-\s*(\d+)/g,
    "<br>&nbsp;&nbsp;&nbsp;&nbsp;Rs <strong>$1</strong><br><br>"
  );

  /* ---------------------------------
     🔟 Catch any remaining pattern like "Rs 45000 Agr"
     Ensures Urdu text always starts on new line
  ---------------------------------- */
  formatted = formatted.replace(
    /(Rs\s*\d+)\s+([A-Za-zآ-ی])/g,
    "$1<br><br>$2"
  );

  /* ---------------------------------
     1️⃣1️⃣ Clean up multiple line breaks
     Max 2 consecutive <br> tags
  ---------------------------------- */
  formatted = formatted.replace(/(<br\s*\/?>){3,}/g, "<br><br>");
  
  /* ---------------------------------
     1️⃣2️⃣ Remove leading line breaks
  ---------------------------------- */
  formatted = formatted.replace(/^(<br\s*\/?>)+/, "");

  return formatted;
};

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload only image files");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setIsSending(true);
    setUploadProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "default_preset");

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const cloudinaryRes = await axios.post(uploadUrl, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      const imageUrl = cloudinaryRes.data.secure_url;

      const userImgMsg = {
        sender: "user",
        content: "📷 Image",
        media_urls: { images: [imageUrl] },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userImgMsg]);

      const resp = await axios.post(
        `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/send-image`,
        { user_id: userId, 
        image_data: imageUrl, 
        is_base64: false },
        { headers: { "Content-Type": "application/json" } }
      );

      const botMsg = {
        sender: "bot",
        content: resp.data.bot_response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsSending(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
  try {
    if (!timestamp) return "";

    // --- Step 1: Normalize ---
    // Some backends send timestamps without timezone (e.g. "2025-10-14T09:00:00")
    // We assume they are in UTC if no timezone info is provided
    let normalized = timestamp;
    if (!/Z|[+-]\d\d:?(\d\d)?$/.test(normalized)) {
      normalized += "Z"; // treat as UTC
    }

    // --- Step 2: Parse Date Object ---
    const date = new Date(normalized);
    if (isNaN(date.getTime())) {
      console.error("Invalid timestamp:", timestamp);
      return "";
    }

    // --- Step 3: Convert to local time ---
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
};


  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="user-chat-page-wrapper">
      <MDBContainer fluid className="user-chat-page-container">
        <MDBRow className="user-chat-page-row justify-content-center">
          <MDBCol md="10" lg="8" xl="6" className="user-chat-page-col">
            {/* Chat Header */}
            <div className="user-chat-page-header">
              <div className="user-chat-page-header-content">
                <div className="user-chat-page-header-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="user-chat-page-header-info">
                  <h5 className="user-chat-page-header-title">Huts & Farms Assistant</h5>
                  <p className="user-chat-page-header-status">
                    <span className="user-chat-page-status-dot"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="user-chat-page-header-actions">
                <button className="user-chat-page-icon-btn" onClick={loadChatHistory}>
                  <i className="fas fa-sync-alt"></i>
                </button>
                
                <button 
                  className="user-chat-page-icon-btn user-chat-page-delete-btn" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  title="Delete Chat History"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
                
  <button 
    className="user-chat-page-icon-btn user-chat-page-logout-btn" 
    onClick={handleLogout} 
    title="Logout"
  >
    <MDBIcon fas icon="sign-out-alt" />
  </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="user-chat-page-chatbox">
              <div className="user-chat-page-messages">
                {isLoading ? (
                  <div className="user-chat-page-loading">
                    <MDBSpinner color="primary" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="user-chat-page-empty-state">
                    <i className="fas fa-comments user-chat-page-empty-icon"></i>
                    <h4>Start a Conversation</h4>
                    <p>Send a message to begin chatting with our assistant</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`user-chat-page-message ${
                        msg.sender === "user" || msg.sender === "admin"
                          ? "user-chat-page-user-message"
                          : "user-chat-page-bot-message"
                      }`}
                    >
                      {msg.sender === "bot" && (
                        <div className="user-chat-page-message-avatar">
                          <i className="fas fa-robot"></i>
                        </div>
                      )}
                      <div className="user-chat-page-bubble">
                        {/* Check if message has structured responses */}
                        {msg.structured_responses ? (
                          <ChatResponseRenderer 
                            responses={msg.structured_responses}
                            onImageClick={handleImageClick}
                            sessionData={sessionData}
                            onQuestionSubmit={(responseText) => {
                              // Disable the form
                              setHasActiveForm(false);
                              
                              // Send directly without showing in input box
                              const userMsg = {
                                sender: "user",
                                content: responseText,
                                timestamp: new Date().toISOString(),
                              };
                              
                              setMessages((prev) => [...prev, userMsg]);
                              setIsSending(true);
                              
                              // Send to backend
                              axios.post(
                                `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/send-message`,
                                { user_id: userId, message: responseText },
                                { headers: { "Content-Type": "application/json" } }
                              ).then(response => {
                                if (response.data.status === "success") {
                                  if (response.data.responses && Array.isArray(response.data.responses)) {
                                    const botMsg = {
                                      sender: "bot",
                                      structured_responses: response.data.responses,
                                      timestamp: new Date().toISOString(),
                                    };
                                    setMessages((prev) => [...prev, botMsg]);
                                    const hasQuestions = response.data.responses.some(r => r.type === 'questions');
                                    setHasActiveForm(hasQuestions);
                                  }
                                }
                              }).catch(error => {
                                console.error("Send failed:", error);
                                setError("Failed to send. Please try again.");
                                setMessages((prev) => prev.slice(0, -1));
                              }).finally(() => {
                                setIsSending(false);
                              });
                            }}
                          />
                        ) : (
                          <>
                            <span
                              className="user-chat-page-message-content"
                              dangerouslySetInnerHTML={{
                                __html: msg.sender === "bot" ? formatBotMessage(msg.content) : msg.content,
                              }}
                            />

                            {msg.media_urls?.images?.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="attachment"
                                className="user-chat-page-image"
                                loading="lazy"
                                onClick={() => handleImageClick(img)}
                              />
                            ))}
                            {msg.media_urls?.videos?.map((vid, idx) => (
                              <video
                                key={idx}
                                src={vid}
                                controls
                                preload="metadata"
                                onMouseEnter={(e) => {
                                  e.target.style.filter = 'none';
                                  e.target.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.filter = 'none';
                                  e.target.style.opacity = '1';
                                }}
                                onLoadedMetadata={(e) => {
                                  e.target.style.filter = 'none';
                                  e.target.style.opacity = '1';
                                }}
                                className="user-chat-page-video"
                              />
                            ))}
                          </>
                        )}
                        <div className="user-chat-page-timestamp">
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                      {msg.sender === "user" && (
                        <div className="user-chat-page-message-avatar user-chat-page-user-avatar">
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isSending && (
                  <div className="user-chat-page-message user-chat-page-bot-message">
                    <div className="user-chat-page-message-avatar">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div className="user-chat-page-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="user-chat-page-upload-progress">
                  <div className="user-chat-page-progress-bar">
                    <div
                      className="user-chat-page-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="user-chat-page-error-banner">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{error}</span>
                  <button
                    className="user-chat-page-error-close"
                    onClick={() => setError("")}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="user-chat-page-input-area">
                <label
                  htmlFor="image-upload"
                  className="user-chat-page-upload-btn"
                  title="Attach image"
                >
                  <i className="fas fa-paperclip"></i>
                </label>
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  style={{ display: "none" }}
                  disabled={isSending}
                />

                <div className="user-chat-page-input-wrapper">
                  <MDBInput
                    className="user-chat-page-textbox"
                    type="text"
                    value={inputMessage}
                    disabled={isSending || hasActiveForm}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={hasActiveForm ? "Please fill out the form above..." : "Type your message..."}
                  />
                </div>

                <MDBBtn
                  className="user-chat-page-send-btn"
                  onClick={sendMessage}
                  disabled={isSending || !inputMessage.trim() || hasActiveForm}
                  color="primary"
                  title="Send message"
                >
                  {isSending ? (
                    <MDBSpinner size="sm" color="light" />
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </MDBBtn>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* Custom Image Modal */}
      {showImageModal && (
        <div className="user-chat-page-image-modal" onClick={closeImageModal}>
          <div className="user-chat-page-modal-overlay"></div>
          <div className="user-chat-page-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="user-chat-page-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="user-chat-page-modal-image"
            />
            <a
              href={selectedImage}
              download
              className="user-chat-page-modal-download"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-download"></i>
              <span>Download Image</span>
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="user-chat-page-delete-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="user-chat-page-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-chat-page-delete-modal-header">
              <h3>Delete Chat History</h3>
              <button 
                className="user-chat-page-modal-close" 
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="user-chat-page-delete-modal-body">
              <div className="user-chat-page-delete-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Are you sure you want to delete all your chat history?</p>
                <p className="user-chat-page-delete-warning-text">
                  This action cannot be undone. All your messages will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="user-chat-page-delete-modal-footer">
              <button 
                className="user-chat-page-delete-cancel-btn" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="user-chat-page-delete-confirm-btn" 
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt"></i>
                    Delete All Messages
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserChat;