'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create the new ref_industry_project_stages table
    await queryInterface.createTable('ref_industry_project_stages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      industry_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ref_industries',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // 2. Remove the old project_stage column from company_sites
    try {
      await queryInterface.removeColumn('company_sites', 'project_stage');
    } catch (e) {
      console.log('project_stage column may already be removed.');
    }

    // 3. Add project_stage_id to company_sites
    await queryInterface.addColumn('company_sites', 'project_stage_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'ref_industry_project_stages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('company_sites', 'project_stage_id');
    
    await queryInterface.addColumn('company_sites', 'project_stage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.dropTable('ref_industry_project_stages');
  }
};
