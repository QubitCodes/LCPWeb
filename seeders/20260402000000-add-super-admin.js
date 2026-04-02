const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the user already exists to prevent duplicate seeding
    const existingAdmins = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE phone = '9400143527';`
    );

    if (existingAdmins[0].length === 0) {
      await queryInterface.bulkInsert('users', [
        {
          id: uuidv4(),
          first_name: 'Super',
          last_name: 'Admin',
          email: 'superadmin@example.com',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          country_code: '+91', // Adjust if you're using a different country code natively
          phone: '9400143527',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});
      console.log('Super Admin seeded successfully.');
    } else {
      console.log('Super Admin with phone number 9400143527 already exists.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      phone: '9400143527'
    }, {});
  }
};
