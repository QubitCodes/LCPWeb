import { NextRequest } from 'next/server';
import { sendResponse } from '@/utils/responseHandler';
import sequelize from '@/lib/sequelize';

// CRITICAL: Explicitly import ALL models to ensure they are registered in the Sequelize instance
import {
  User,
  Company,
  Category,
  Job,
  Course,
  CourseLevel,
  ContentItem,
  AuditLog,
  Skill,
  JobSkill,
  Order,
  OrderItem,
  Payment,
  LevelEnrollment,
  ContentProgress,
  Question,
  QuestionOption,
  LevelRecommendation,
  Certificate,
  CompanyMembershipHistory
} from '@/models';

export const dynamic = 'force-dynamic';

// WE MUST USE THE IMPORTED MODELS TO PREVENT TREE-SHAKING
// By putting them in an array, we force the bundler to execute the model files.
const REGISTERED_MODELS = [
  User, Company, Category, Job, Course, CourseLevel, ContentItem,
  AuditLog, Skill, JobSkill, Order, OrderItem, Payment,
  LevelEnrollment, ContentProgress, Question, QuestionOption,
  LevelRecommendation, Certificate, CompanyMembershipHistory
];

/**
 * HELPER: Log registered models to debug missing tables
 */
function logRegisteredModels() {
  // Accessing the array ensures the imports are valid and code is executed
  console.log(`[Migrate] Warm-up: ${REGISTERED_MODELS.length} model files loaded.`);
  
  const models = Object.keys(sequelize.models);
  console.log(`[Migrate] Sequelize Instance Models:`, models.join(', '));
  return models.length;
}

/**
 * GET /api/v1/system/migrate
 * ACTION: Syncs database with `alter: true`.
 * Use this to update schema without deleting data.
 */
export async function GET(req: NextRequest) {
  try {
    await sequelize.authenticate();
    
    // Check models
    const count = logRegisteredModels();
    
    if (count === 0) {
      return sendResponse(500, { status: false, message: 'No models detected in Sequelize. Tree-shaking issue?', code: 300 });
    }

    console.log('[Migrate] Starting sync (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('[Migrate] Sync Complete.');
    
    return sendResponse(200, { 
      status: true, 
      message: 'Database schema updated successfully.', 
      code: 100,
      misc: { models_synced: count }
    });
  } catch (error: any) {
    console.error('[Migrate] Failed:', error);
    return sendResponse(500, { status: false, message: `Migration Error: ${error.message}`, code: 300 });
  }
}

/**
 * POST /api/v1/system/migrate
 * ACTION: Syncs database with `force: true`.
 * WARNING: DROPS ALL TABLES AND DATA.
 */
export async function POST(req: NextRequest) {
  try {
    await sequelize.authenticate();
    
    const count = logRegisteredModels();
    
    const isMySQL = sequelize.getDialect() === 'mysql';
    if (isMySQL) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    }

    console.log('[Migrate] Starting DROP & SYNC (force: true)...');
    await sequelize.sync({ force: true });
    console.log('[Migrate] Reset Complete.');

    if (isMySQL) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    return sendResponse(200, { 
      status: true, 
      message: 'Database reset successfully (All data dropped).', 
      code: 100,
      misc: { models_synced: count }
    });
  } catch (error: any) {
    console.error('[Migrate] Failed:', error);
    return sendResponse(500, { status: false, message: `Reset Error: ${error.message}`, code: 300 });
  }
}