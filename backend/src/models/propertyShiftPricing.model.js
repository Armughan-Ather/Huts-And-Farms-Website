import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PropertyShiftPricing = sequelize.define('PropertyShiftPricing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    pricing_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'property_pricing',
        key: 'pricing_id',
      },
    },
    day_of_week: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shift_type: {
      type: 'shift_type_enum',
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'property_shift_pricing',
    timestamps: false,
    underscored: true,
  });

  return PropertyShiftPricing;
};