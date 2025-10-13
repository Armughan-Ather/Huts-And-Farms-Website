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
function UserChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
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
    if (userId) loadChatHistory();
  }, [userId]);

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
  // Navigate to login page
  navigate('/login');
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

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_FAST_API_BASE}/api/web-chat/history`,
        { user_id: userId, limit: 50 },
        { headers: { "Content-Type": "application/json" } }
      );

      const normalizedMessages = (response.data || []).map(msg => {
        const imageUrlMatch = msg.content?.match(/https?:\/\/[^\s]+/);
        if (imageUrlMatch && imageUrlMatch[0].includes("res.cloudinary.com")) {
          return {
            ...msg,
            media_urls: { images: [imageUrlMatch[0]] },
            content: "📷 Image",
          };
        }
        return msg;
      });

      setMessages(normalizedMessages);
      console.log(response.data);
    //   setTimeout(() => {
    //   scrollToBottom();
    // }, 200);
      setError("");
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

      if (response.data.status === "success") {
        const botMsg = {
          sender: "bot",
          content: response.data.bot_response,
          media_urls: response.data.media_urls,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
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
    let formatted = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/‣/g, "•");
    formatted = formatted.replace(/^- /gm, "• ");
    formatted = formatted.replace(/\n/g, "<br>");
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
        { user_id: userId, image_url: imageUrl },
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
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
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
                            className="user-chat-page-video"
                          />
                        ))}
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
                    disabled={isSending}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                  />
                </div>

                <MDBBtn
                  className="user-chat-page-send-btn"
                  onClick={sendMessage}
                  disabled={isSending || !inputMessage.trim()}
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
    </div>
  );
}

export default UserChat;