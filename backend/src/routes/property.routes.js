import express from 'express';
import { addProperty, editProperty, editPropertyPricing, editPropertyAmenities, deletePropertyMedia,uploadPropertyMedia, loginProperty,getProperty } from '../controllers/property.controller.js';
import { verifyPropertyToken } from '../middlewares/propertyAuth.middleware.js';
import  uploadFiles  from '../middlewares/upload.js';
const router = express.Router();
router.route('/').get(verifyPropertyToken,getProperty);
router.post('/add', uploadFiles, addProperty);
router.route('/edit').post(verifyPropertyToken, editProperty);
router.route('/edit/pricing').post(verifyPropertyToken, editPropertyPricing);
router.route('/edit/amenities').post(verifyPropertyToken, editPropertyAmenities);
router.delete('/delete/media', verifyPropertyToken, deletePropertyMedia);
router.post('/upload/media', verifyPropertyToken, uploadFiles, uploadPropertyMedia);
router.route('/login').post(loginProperty)
export default router;
