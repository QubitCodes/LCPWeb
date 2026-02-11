const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const industries = [
            'Construction',
            'Manufacturing',
            'Transportation & Logistics',
            'Healthcare',
            'Information Technology',
            'Retail',
            'Hospitality',
            'Education'
        ];

        const records = industries.map(name => ({
            id: uuidv4(),
            name,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await queryInterface.bulkInsert('ref_industries', records, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('ref_industries', null, {});
    }
};
