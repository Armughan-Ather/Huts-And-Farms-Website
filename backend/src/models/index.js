
import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';
import dbConfig from '../db/config.js';
/*
// Initialize Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.DIALECT,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for NeonDB
    },
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});
*/
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});
// Models
import UserModel from './user.model.js';
import BookingModel from './booking.model.js';
import PropertyModel from './property.model.js';
import PropertyPricingModel from './propertyPricing.model.js';
import PropertyShiftPricingModel from './propertyShiftPricing.model.js';
import OwnerModel from './owner.model.js';
import OwnerPropertyModel from './ownerProperty.model.js';
import PropertyAmenityModel from './propertyAmenity.model.js';
import PropertyImageModel from './propertyImage.model.js';
import PropertyVideoModel from './propertyVideo.model.js';
import MessageModel from './message.model.js';
import SessionModel from './session.model.js';

// Initialize models
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = UserModel(sequelize, DataTypes);
db.Booking = BookingModel(sequelize, DataTypes);
db.Property = PropertyModel(sequelize, DataTypes);
db.PropertyPricing = PropertyPricingModel(sequelize, DataTypes);
db.PropertyShiftPricing = PropertyShiftPricingModel(sequelize, DataTypes);
db.Owner = OwnerModel(sequelize, DataTypes);
db.OwnerProperty = OwnerPropertyModel(sequelize, DataTypes);
db.PropertyAmenity = PropertyAmenityModel(sequelize, DataTypes);
db.PropertyImage = PropertyImageModel(sequelize, DataTypes);
db.PropertyVideo = PropertyVideoModel(sequelize, DataTypes);
db.Message = MessageModel(sequelize, DataTypes);
db.Session = SessionModel(sequelize, DataTypes);

// Define associations
db.User.associate = (models) => {
  models.User.hasMany(models.Booking, { foreignKey: 'user_id' });
  models.User.hasMany(models.Message, { foreignKey: 'user_id' });
  models.User.hasMany(models.Session, { foreignKey: 'user_id' });
};

db.Booking.associate = (models) => {
  models.Booking.belongsTo(models.User, { foreignKey: 'user_id', constraints: false });
  models.Booking.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
};

db.Property.associate = (models) => {
  models.Property.hasMany(models.Booking, { foreignKey: 'property_id', constraints: false });
  models.Property.hasMany(models.PropertyAmenity, { foreignKey: 'property_id', constraints: false });
  models.Property.hasMany(models.PropertyImage, { foreignKey: 'property_id', constraints: false });
  models.Property.hasMany(models.PropertyVideo, { foreignKey: 'property_id', constraints: false });
  models.Property.hasOne(models.PropertyPricing, { foreignKey: 'property_id', constraints: false });
  models.Property.hasMany(models.OwnerProperty, { foreignKey: 'property_id', constraints: false });
};

db.PropertyPricing.associate = (models) => {
  models.PropertyPricing.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
  models.PropertyPricing.hasMany(models.PropertyShiftPricing, { foreignKey: 'pricing_id', constraints: false });
};

db.PropertyShiftPricing.associate = (models) => {
  models.PropertyShiftPricing.belongsTo(models.PropertyPricing, { foreignKey: 'pricing_id', constraints: false });
};

db.Owner.associate = (models) => {
  models.Owner.hasMany(models.OwnerProperty, { foreignKey: 'owner_id', constraints: false });
};

db.OwnerProperty.associate = (models) => {
  models.OwnerProperty.belongsTo(models.Owner, { foreignKey: 'owner_id', constraints: false });
  models.OwnerProperty.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
};

db.PropertyAmenity.associate = (models) => {
  models.PropertyAmenity.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
};

db.PropertyImage.associate = (models) => {
  models.PropertyImage.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
};

db.PropertyVideo.associate = (models) => {
  models.PropertyVideo.belongsTo(models.Property, { foreignKey: 'property_id', constraints: false });
};

db.Message.associate = (models) => {
  models.Message.belongsTo(models.User, { foreignKey: 'user_id', constraints: false });
};

db.Session.associate = (models) => {
  models.Session.belongsTo(models.User, { foreignKey: 'user_id', constraints: false });
};

// Apply associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

export default db;