'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable('jobs', 'ref_jobs');
    await queryInterface.renameTable('job_skills', 'ref_job_skills');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('ref_job_skills', 'job_skills');
    await queryInterface.renameTable('ref_jobs', 'jobs');
  }
};
