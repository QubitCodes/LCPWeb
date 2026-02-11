const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
});

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Add columns if not exist (quick migration)
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN country_code VARCHAR(255) DEFAULT '+971';");
        } catch (e) { /* ignore if exists */ }

        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN phone VARCHAR(255);");
        } catch (e) { /* ignore if exists */ }

        // 2. Update Admin
        const [results] = await sequelize.query("SELECT id FROM users WHERE email = 'admin@lms.com'");

        if (results.length > 0) {
            const adminId = results[0].id; // Access ID directly from result object
            // Update phone details
            await sequelize.query(
                "UPDATE users SET country_code = '+91', phone = '9400143527', phone_number = NULL WHERE id = :id",
                { replacements: { id: adminId } }
            );
            console.log('Admin user updated successfully with phone details: +91 9400143527');
        } else {
            console.log('Admin user not found.');
        }

    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await sequelize.close();
    }
}

seedAdmin();
