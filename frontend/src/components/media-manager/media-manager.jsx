import React, { useState } from 'react';
import axios from 'axios';
import './media-manager.css';

const MediaManager = ({ propertyData, onMediaUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [uploadFiles, setUploadFiles] = useState({ images: [], videos: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { property, images = [], videos = [] } = propertyData;

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => ({
      ...prev,
      [type]: files
    }));
  };

  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleVideoSelect = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleUpload = async () => {
    if (uploadFiles.images.length === 0 && uploadFiles.videos.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('propertyToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setUploading(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const formData = new FormData();
      
      formData.append('property_id', property.property_id);
      
      // Append images
      uploadFiles.images.forEach(file => {
        formData.append('images', file);
      });
      
      // Append videos
      uploadFiles.videos.forEach(file => {
        formData.append('videos', file);
      });

      const response = await axios.post(`${backendUrl}/api/properties/upload/media`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(`Successfully uploaded ${response.data.images?.length || 0} images and ${response.data.videos?.length || 0} videos`);
      setUploadFiles({ images: [], videos: [] });
      
      // Clear file inputs
      const imageInput = document.getElementById('image-upload');
      const videoInput = document.getElementById('video-upload');
      if (imageInput) imageInput.value = '';
      if (videoInput) videoInput.value = '';
      
      setTimeout(() => {
        onMediaUpdated();
      }, 1000);

    } catch (err) {
      console.error('Error uploading media:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to upload media');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      setError('Please select media to delete');
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('propertyToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setDeleting(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const deleteData = {
        property_id: property.property_id
      };

      if (selectedImages.length > 0) {
        deleteData.image_ids = selectedImages;
      }
      if (selectedVideos.length > 0) {
        deleteData.video_ids = selectedVideos;
      }

      const response = await axios.delete(`${backendUrl}/api/properties/delete/media`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: deleteData
      });

      setSuccess(`Successfully deleted ${response.data.deleted_images?.length || 0} images and ${response.data.deleted_videos?.length || 0} videos`);
      setSelectedImages([]);
      setSelectedVideos([]);
      
      setTimeout(() => {
        onMediaUpdated();
      }, 1000);

    } catch (err) {
      console.error('Error deleting media:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to delete media');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="media-manager">
      <div className="media-manager-header">
        {error && <div className="media-manager-error">{error}</div>}
        {success && <div className="media-manager-success">{success}</div>}
      </div>

      {/* Media Display Section */}
      <div className="media-manager-display">
        {(images.length > 0 || videos.length > 0) ? (
          <>
            {/* Images */}
            {images.length > 0 && (
              <div className="media-manager-media-section">
                <h3>Images ({images.length})</h3>
                <div className="media-manager-images-grid">
                  {images.map((image, index) => (
                    <div 
                      key={image.image_id} 
                      className={`media-manager-image-item ${selectedImages.includes(image.image_id) ? 'selected' : ''}`}
                      onClick={() => handleImageSelect(image.image_id)}
                    >
                      <img src={image.image_url} alt={`Property image ${index + 1}`} />
                      <div className="media-manager-image-overlay">
                        <div className="media-manager-checkbox">
                          <input 
                            type="checkbox" 
                            checked={selectedImages.includes(image.image_id)}
                            onChange={() => handleImageSelect(image.image_id)}
                          />
                        </div>
                      </div>
                      <div className="media-manager-image-info">
                        <span>Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="media-manager-media-section">
                <h3>Videos ({videos.length})</h3>
                <div className="media-manager-videos-grid">
                  {videos.map((video, index) => (
                    <div 
                      key={video.video_id} 
                      className={`media-manager-video-item ${selectedVideos.includes(video.video_id) ? 'selected' : ''}`}
                      onClick={() => handleVideoSelect(video.video_id)}
                    >
                      <video>
                        <source src={video.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="media-manager-video-overlay">
                        <div className="media-manager-checkbox">
                          <input 
                            type="checkbox" 
                            checked={selectedVideos.includes(video.video_id)}
                            onChange={() => handleVideoSelect(video.video_id)}
                          />
                        </div>
                      </div>
                      <div className="media-manager-video-info">
                        <span>Uploaded: {new Date(video.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="media-manager-empty-state">
            <div className="media-manager-empty-icon">📸</div>
            <div className="media-manager-empty-text">No media files yet</div>
            <div className="media-manager-empty-subtext">Upload images and videos to showcase your property</div>
          </div>
        )}
      </div>

      {/* Controls Section - At Bottom */}
      <div className="media-manager-controls">
        <div className="media-manager-controls-header">
          <h4 className="media-manager-controls-title">Media Management</h4>
          {(images.length > 0 || videos.length > 0) && (
            <div className="media-manager-selection-info">
              {selectedImages.length + selectedVideos.length} selected
            </div>
          )}
        </div>

        <div className="media-manager-actions">
          {/* Upload Controls */}
          <div className="media-manager-upload-group">
            <div className="media-manager-file-input">
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'images')}
              />
              <label htmlFor="image-upload" className="media-manager-file-label">
                📷 Select Images
              </label>
              {uploadFiles.images.length > 0 && (
                <span className="media-manager-file-count">
                  {uploadFiles.images.length} selected
                </span>
              )}
            </div>
            
            <div className="media-manager-file-input">
              <input
                id="video-upload"
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => handleFileSelect(e, 'videos')}
              />
              <label htmlFor="video-upload" className="media-manager-file-label">
                🎥 Select Videos
              </label>
              {uploadFiles.videos.length > 0 && (
                <span className="media-manager-file-count">
                  {uploadFiles.videos.length} selected
                </span>
              )}
            </div>
            
            <button 
              onClick={handleUpload} 
              disabled={uploading || (uploadFiles.images.length === 0 && uploadFiles.videos.length === 0)}
              className="media-manager-action-btn"
            >
              {uploading ? (
                <>⏳ Uploading...</>
              ) : (
                <>⬆️ Upload Media</>
              )}
            </button>
          </div>

          {/* Delete Controls */}
          {(images.length > 0 || videos.length > 0) && (
            <button 
              onClick={handleDelete} 
              disabled={deleting || (selectedImages.length === 0 && selectedVideos.length === 0)}
              className="media-manager-action-btn danger"
            >
              {deleting ? (
                <>⏳ Deleting...</>
              ) : (
                <>🗑️ Delete Selected</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaManager;