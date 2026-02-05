import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    booking_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    property_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'properties',
        key: 'property_id'
      }
    },
    property_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    booking_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shift_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    min_price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_occupancy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conversation_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    summary_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    summary_generation_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
    needs_summarization: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
  }, {
    tableName: 'sessions',
    timestamps: false,
  });

  return Session;
};