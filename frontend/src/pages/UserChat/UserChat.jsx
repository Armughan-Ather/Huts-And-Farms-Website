import React, { useState, useEffect, useRef } from "react";
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

function UserChat({ userId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userId) loadChatHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages(response.data || []);
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
      // Remove the user message if sending failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload only image files");
      return;
    }

    // Validate file size (max 5MB)
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
      formData.append("upload_preset", "your_preset");

      // Upload to Cloudinary with progress tracking
      const cloudinaryRes = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      const imageUrl = cloudinaryRes.data.secure_url;

      // Add user's image message
      const userImgMsg = {
        sender: "user",
        content: "📷 Image",
        media_urls: { images: [imageUrl] },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userImgMsg]);

      // Send image to bot
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
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  <MDBIcon fas icon="robot" />
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
                  <MDBIcon fas icon="sync-alt" />
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
                    <MDBIcon fas icon="comments" className="user-chat-page-empty-icon" />
                    <h4>Start a Conversation</h4>
                    <p>Send a message to begin chatting with our assistant</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`user-chat-page-message ${
                        msg.sender === "user"
                          ? "user-chat-page-user-message"
                          : "user-chat-page-bot-message"
                      }`}
                    >
                      {msg.sender === "bot" && (
                        <div className="user-chat-page-message-avatar">
                          <MDBIcon fas icon="robot" />
                        </div>
                      )}
                      <div className="user-chat-page-bubble">
                        <span className="user-chat-page-message-content">
                          {msg.content}
                        </span>
                        {msg.media_urls?.images?.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="attachment"
                            className="user-chat-page-image"
                            loading="lazy"
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
                          <MDBIcon fas icon="user" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isSending && (
                  <div className="user-chat-page-message user-chat-page-bot-message">
                    <div className="user-chat-page-message-avatar">
                      <MDBIcon fas icon="robot" />
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
                  <MDBIcon fas icon="exclamation-triangle" className="me-2" />
                  {error}
                  <button
                    className="user-chat-page-error-close"
                    onClick={() => setError("")}
                  >
                    <MDBIcon fas icon="times" />
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
                  <MDBIcon fas icon="paperclip" />
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
                    <MDBIcon fas icon="paper-plane" />
                  )}
                </MDBBtn>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
}

export default UserChat;