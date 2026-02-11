'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Industries Table
    await queryInterface.createTable('industries', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });

    // 2. Rename registration_number to company_id
    await queryInterface.renameColumn('companies', 'registration_number', 'company_id');

    // 3. Add New Columns
    await queryInterface.addColumn('companies', 'industry_id', {
      type: Sequelize.UUID,
      references: { model: 'industries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('companies', 'tax_id', { type: Sequelize.STRING });
    await queryInterface.addColumn('companies', 'website', { type: Sequelize.STRING });
    await queryInterface.addColumn('companies', 'address', { type: Sequelize.TEXT });
    await queryInterface.addColumn('companies', 'approval_status', {
      type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('companies', 'approval_status');
    await queryInterface.removeColumn('companies', 'address');
    await queryInterface.removeColumn('companies', 'website');
    await queryInterface.removeColumn('companies', 'tax_id');
    await queryInterface.removeColumn('companies', 'industry_id');
    await queryInterface.renameColumn('companies', 'company_id', 'registration_number');
    await queryInterface.dropTable('industries');
  }
};
