/**
 * sync-users-to-firebase.ts
 * 
 * One-time script to import existing DB users (with phone numbers) into Firebase Auth.
 * This ensures existing users can authenticate via Firebase OTP.
 * 
 * Usage: npx ts-node scripts/sync-users-to-firebase.ts
 * 
 * Requires:
 *  - FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
 *  - DB connection env vars (DB_HOST, DB_USER, DB_PASS, DB_NAME, etc.)
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ---- Firebase Admin Init ----
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment.');
    process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// ---- Database Connection ----
const dialect = (process.env.DB_DIALECT as 'postgres' | 'mysql') || 'postgres';
const dbPort = parseInt(process.env.DB_PORT || (dialect === 'mysql' ? '3306' : '5432'));
const dbUrl = process.env.DATABASE_URL;

const enableSSL = process.env.DB_SSL === 'false' ? false : (process.env.DB_SSL === 'true' || true);

const dialectOptions: any = {};
if (enableSSL) {
    if (dialect === 'postgres') {
        dialectOptions.ssl = { require: true, rejectUnauthorized: false };
    } else if (dialect === 'mysql') {
        dialectOptions.ssl = { rejectUnauthorized: false };
    }
}

let sequelize: Sequelize;

if (dbUrl) {
    sequelize = new Sequelize(dbUrl, { dialect, logging: false, dialectOptions });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'lms_db',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || 'password',
        {
            dialect,
            host: process.env.DB_HOST || 'localhost',
            port: dbPort,
            logging: false,
            dialectOptions,
        }
    );
}

// ---- Main Sync Logic ----
interface DbUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    country_code: string | null;
    phone: string | null;
}

async function syncUsersToFirebase() {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected.\n');

    // Fetch all users with phone numbers
    const users: DbUser[] = await sequelize.query(
        `SELECT id, first_name, last_name, email, country_code, phone 
		 FROM users 
		 WHERE phone IS NOT NULL 
		   AND phone != '' 
		   AND country_code IS NOT NULL 
		   AND country_code != ''
		   AND deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
    );

    console.log(`📋 Found ${users.length} users with phone numbers.\n`);

    if (users.length === 0) {
        console.log('No users to sync.');
        await sequelize.close();
        return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
        const fullPhone = `${user.country_code}${user.phone}`;
        const displayName = `${user.first_name} ${user.last_name}`.trim();

        try {
            // Check if user already exists in Firebase by phone number
            try {
                const existingUser = await admin.auth().getUserByPhoneNumber(fullPhone);
                console.log(`⏭️  SKIP: ${displayName} (${fullPhone}) — already in Firebase as ${existingUser.uid}`);
                skipped++;
                continue;
            } catch (lookupErr: any) {
                // auth/user-not-found means we need to create them — that's expected
                if (lookupErr.code !== 'auth/user-not-found') {
                    throw lookupErr;
                }
            }

            // Create user in Firebase
            const createRequest: admin.auth.CreateRequest = {
                phoneNumber: fullPhone,
                displayName: displayName,
                disabled: false,
            };

            // Add email only if available
            if (user.email) {
                createRequest.email = user.email;
            }

            const firebaseUser = await admin.auth().createUser(createRequest);
            console.log(`✅ CREATED: ${displayName} (${fullPhone}) → Firebase UID: ${firebaseUser.uid}`);
            created++;

        } catch (err: any) {
            console.error(`❌ ERROR: ${displayName} (${fullPhone}) — ${err.message}`);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Sync Complete:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors:  ${errors}`);
    console.log('='.repeat(50));

    await sequelize.close();
}

syncUsersToFirebase().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
