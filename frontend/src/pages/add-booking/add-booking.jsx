 import React, { useState } from 'react';
 import axios from 'axios';
 import './add-booking.css';
 
 const AddBooking = () => {
   const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    phone_no: '',
    booking_date: '',
    shift_type: '',
    
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
 
   const handleChange = (e) => {
     const { name, value } = e.target;
     setFormData((prev) => ({ ...prev, [name]: value }));
   };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);
     setError('');
     setSuccess('');
 
     try {
       const token = localStorage.getItem('propertyToken');
       if (!token) {
         setError('No authentication token found. Please login again.');
         setLoading(false);
         return;
       }

       // Get property_id from URL parameters if present (for owner access)
       const urlParams = new URLSearchParams(window.location.search);
       let propertyId = urlParams.get('property_id');
       
       // If no property_id in URL, try to get it from stored property data (for owner access)
       if (!propertyId) {
         const propertyData = localStorage.getItem('propertyData');
         if (propertyData) {
           try {
             const parsedPropertyData = JSON.parse(propertyData);
             propertyId = parsedPropertyData.property_id;
           } catch (e) {
             console.log('Error parsing property data:', e);
           }
         }
       }

       // Prepare request data
       const requestData = { ...formData };
       if (propertyId) {
         requestData.property_id = propertyId;
       }
 
       const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
       await axios.post(
         `${backendUrl}/api/bookings/create`,
         requestData,
         {
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         }
       );
 
       setSuccess('Booking created successfully!');
       setLoading(false);
 
       setTimeout(() => {
         // Get property_id for redirect
         const urlParams = new URLSearchParams(window.location.search);
         let propertyId = urlParams.get('property_id');
         
         if (!propertyId) {
           const propertyData = localStorage.getItem('propertyData');
           if (propertyData) {
             try {
               const parsedPropertyData = JSON.parse(propertyData);
               propertyId = parsedPropertyData.property_id;
             } catch (e) {
               console.log('Error parsing property data:', e);
             }
           }
         }
         
         // Navigate to bookings with property_id if available
         if (propertyId) {
           window.location.href = `/bookings?property_id=${propertyId}`;
         } else {
           window.location.href = '/bookings';
         }
       }, 1200);
     } catch (err) {
       if (err.response?.data?.error) {
         setError(err.response.data.error);
       } else if (err.response?.data?.details) {
         setError(err.response.data.details);
       } else if (err.request) {
         setError('Network error. Please check your connection and try again.');
       } else {
         setError('An unexpected error occurred. Please try again.');
       }
       setLoading(false);
     }
   };
 
   const handleBackToBookings = () => {
     // Get property_id from URL parameters or localStorage
     const urlParams = new URLSearchParams(window.location.search);
     let propertyId = urlParams.get('property_id');
     
     if (!propertyId) {
       const propertyData = localStorage.getItem('propertyData');
       if (propertyData) {
         try {
           const parsedPropertyData = JSON.parse(propertyData);
           propertyId = parsedPropertyData.property_id;
         } catch (e) {
           console.log('Error parsing property data:', e);
         }
       }
     }
     
     // Navigate to bookings with property_id if available
     if (propertyId) {
       window.location.href = `/bookings?property_id=${propertyId}`;
     } else {
       window.location.href = '/bookings';
     }
   };
 
   const handleBackToDashboard = () => {
     // Get property_id from URL parameters or localStorage
     const urlParams = new URLSearchParams(window.location.search);
     let propertyId = urlParams.get('property_id');
     
     if (!propertyId) {
       const propertyData = localStorage.getItem('propertyData');
       if (propertyData) {
         try {
           const parsedPropertyData = JSON.parse(propertyData);
           propertyId = parsedPropertyData.property_id;
         } catch (e) {
           console.log('Error parsing property data:', e);
         }
       }
     }
     
     // Navigate to dashboard with property_id if available
     if (propertyId) {
       window.location.href = `/dashboard?property_id=${propertyId}`;
     } else {
       window.location.href = '/dashboard';
     }
   };
 
   return (
     <div className="add-booking-page-container">
       <header className="add-booking-page-header">
         <div className="add-booking-page-header-inner">
           <div className="add-booking-page-header-left">
             <h1 className="add-booking-page-title">Add New Booking</h1>
             <p className="add-booking-page-subtitle">Create a booking quickly with validated inputs</p>
           </div>
           <div className="add-booking-page-header-actions">
             <button onClick={handleBackToBookings} className="add-booking-page-ghost-button">← Back to Bookings</button>
             <button onClick={handleBackToDashboard} className="add-booking-page-ghost-button">⌂ Dashboard</button>
           </div>
         </div>
       </header>
 
       <main className="add-booking-page-main">
         <div className="add-booking-page-card">
           <div className="add-booking-page-card-header">
             <h2>Create Booking</h2>
             <p>Enter customer info and booking details</p>
           </div>
 
           {error && <div className="add-booking-page-alert add-booking-page-alert-error">{error}</div>}
           {success && <div className="add-booking-page-alert add-booking-page-alert-success">{success}</div>}
 
           <form className="add-booking-page-form" onSubmit={handleSubmit}>
             <div className="add-booking-page-grid">
             <div className="add-booking-page-form-group">
                 <label htmlFor="cnic" className="add-booking-page-label">Name <span className="add-booking-page-required">*</span></label>
                 <input
                   id="name"
                   name="name"
                   type="text"
                   placeholder="John"
                   value={formData.name}
                   onChange={handleChange}
                   className="add-booking-page-input"
                   required
                 />
                 <small className="add-booking-page-help">Enter name of booking customer</small>
               </div>


               <div className="add-booking-page-form-group">
                 <label htmlFor="cnic" className="add-booking-page-label">CNIC Number <span className="add-booking-page-required">*</span></label>
                 <input
                   id="cnic"
                   name="cnic"
                   type="text"
                   placeholder="12345-1234567-1 or 1234512345671"
                   value={formData.cnic}
                   onChange={handleChange}
                   className="add-booking-page-input"
                   required
                 />
                 <small className="add-booking-page-help">13 digits, with or without dashes</small>
               </div>
 
               <div className="add-booking-page-form-group">
                 <label htmlFor="phone_no" className="add-booking-page-label">Phone Number <span className="add-booking-page-required">*</span></label>
                 <input
                   id="phone_no"
                   name="phone_no"
                   type="tel"
                   placeholder="+923001234567"
                   value={formData.phone_no}
                   onChange={handleChange}
                   className="add-booking-page-input"
                   required
                 />
                 <small className="add-booking-page-help">10-15 digits, optional + prefix</small>
               </div>
 
               <div className="add-booking-page-form-group">
                 <label htmlFor="booking_date" className="add-booking-page-label">Booking Date <span className="add-booking-page-required">*</span></label>
                 <input
                   id="booking_date"
                   name="booking_date"
                   type="date"
                   min={new Date().toISOString().split('T')[0]}
                   value={formData.booking_date}
                   onChange={handleChange}
                   className="add-booking-page-input"
                   required
                 />
                 <small className="add-booking-page-help">Select a future date</small>
               </div>
 
               <div className="add-booking-page-form-group">
                 <label htmlFor="shift_type" className="add-booking-page-label">Shift Type <span className="add-booking-page-required">*</span></label>
                 <select
                   id="shift_type"
                   name="shift_type"
                   value={formData.shift_type}
                   onChange={handleChange}
                   className="add-booking-page-select"
                   required
                 >
                   <option value="">Select shift type</option>
                   <option value="Day">Day</option>
                   <option value="Night">Night</option>
                   <option value="Full Day">Full Day</option>
                   <option value="Full Night">Full Night</option>
                 </select>
               </div>
 
               {/* <div className="add-booking-page-form-group">
                 <label htmlFor="booking_source" className="add-booking-page-label">Booking Source <span className="add-booking-page-required">*</span></label>
                 <select
                   id="booking_source"
                   name="booking_source"
                   value={formData.booking_source}
                   onChange={handleChange}
                   className="add-booking-page-select"
                   required
                 >
                   <option value="">Select booking source</option>
                   <option value="Website">Website</option>
                   <option value="WhatsApp Bot">WhatsApp Bot</option>
                   <option value="Third-Party">Third-Party</option>
                 </select>
               </div> */}
             </div>
 
             <div className="add-booking-page-actions">
               <button
                 type="button"
                 onClick={handleBackToBookings}
                 className="add-booking-page-button add-booking-page-button-ghost"
                 disabled={loading}
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 className="add-booking-page-button add-booking-page-button-primary"
                 disabled={loading}
               >
                 {loading ? (
                   <span className="add-booking-page-loading" aria-hidden />
                 ) : 'Create Booking'}
               </button>
             </div>
           </form>
         </div>
       </main>
     </div>
   );
 };
 
 export default AddBooking;
 

