import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    sender: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    whatsapp_message_id: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    query_embedding: {
      type: 'vector', // Custom type for vector embeddings
      allowNull: true,
    },
    structured_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    form_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_form_submission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
  }, {
    tableName: 'messages',
    timestamps: false,
  });

  return Message;
};