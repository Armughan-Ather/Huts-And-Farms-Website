// export default (sequelize, DataTypes) => {
//   const Property = sequelize.define("Property", {
//     property_id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//     },
//     name: {
//       type: DataTypes.STRING(255),
//       allowNull: false,
//     },
//     description: DataTypes.TEXT,
//     address: DataTypes.STRING(255),
//     city: DataTypes.STRING(100),
//     province: DataTypes.STRING(100),
//     country: DataTypes.STRING(100),
//     contact_person: DataTypes.STRING(100),
//     contact_number: DataTypes.STRING(20),
//     email: DataTypes.STRING(100),
//     max_occupancy: DataTypes.INTEGER,
//     username: {
//       type: DataTypes.STRING(100),
//       unique: true,
//     },
//     password: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     type: {
//       type: DataTypes.ENUM("hut", "farm"),
//       allowNull: false,
//     },
//     created_at: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//     updated_at: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//   }, {
//     tableName: "properties",
//     timestamps: false,
//   });

//   return Property;
// };



import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Property = sequelize.define('Property', {
    property_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_person: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    max_occupancy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: 'enum_properties_type',
      allowNull: false,
    },
    advance_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'properties',
    timestamps: true,
    underscored: true,
  });

  return Property;
};