'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('industries', 'ref_industries');
    // Check if categories/skills exist before renaming? 
    // Assuming they exist based on codebase presence. 
    // If this is a fresh database, previous migrations should have created them.
    await queryInterface.renameTable('categories', 'ref_categories');
    await queryInterface.renameTable('skills', 'ref_skills');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('ref_skills', 'skills');
    await queryInterface.renameTable('ref_categories', 'categories');
    await queryInterface.renameTable('ref_industries', 'industries');
  }
};
