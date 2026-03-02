import { NextRequest } from 'next/server';
import { sendResponse } from '@/utils/responseHandler';
import sequelize from '@/lib/sequelize';

// Explicitly import models to ensure registration
import {
  User, Company, Category, Job, Course, CourseLevel, ContentItem,
  SurveyTemplate, SurveySection, SurveyQuestion, SurveyQuestionOption,
  SurveyResponse, SurveyAnswer, SurveySignoff
} from '@/models';
import { UserRole } from '@/models/User';
import { ContentType } from '@/models/ContentItem';
import { seedLcpSiteValidationChecklist } from '@/seeders/seedSurveyTemplate';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[Seed] Starting...');
    await sequelize.authenticate();

    // -- Survey Template Seed (has its own idempotency, runs on every seed)
    console.log('[Seed] Seeding LCP Site Validation Checklist...');
    await seedLcpSiteValidationChecklist();

    // 2. Check if Super Admin exists to prevent double seeding
    const adminExists = await (User as any).findOne({ where: { email: 'admin@lms.com' } });
    if (adminExists) {
      console.log('[Seed] Data already exists. Skipping...');
      return sendResponse(200, { status: true, message: 'Data already exists', code: 100 });
    }

    // 3. Seed Data
    console.log('[Seed] Creating Users & Companies...');

    // -- Super Admin
    await (User as any).create({
      first_name: 'Super',
      last_name: 'Admin',
      role: UserRole.SUPER_ADMIN,
      email: 'admin@lms.com',
      phone: '0000000000',
      years_experience: 10
    });

    // -- Companies
    const compA = await (Company as any).create({
      name: 'BuildCorp Global',
      status: 'ACTIVE',
      contact_email: 'contact@buildcorp.com',
      contact_phone: '1234567890',
      company_id: 'REG001'
    });

    // -- Supervisor
    await (User as any).create({
      first_name: 'John', last_name: 'Supervisor',
      role: UserRole.SUPERVISOR, company_id: compA.id, phone: '1231231231', years_experience: 5,
      email: 'supervisor@buildcorp.com'
    });

    // -- Worker
    await (User as any).create({
      first_name: 'Bob', last_name: 'Builder',
      role: UserRole.WORKER, company_id: compA.id, phone: '2222222222', years_experience: 6,
      email: 'worker@buildcorp.com'
    });

    console.log('[Seed] Creating Courses...');

    // -- Category & Job
    const cat = await (Category as any).create({ name: 'Construction', description: 'General Construction' });

    const job = await (Job as any).create({ name: 'Masonry', category_id: 1 });

    const course = await (Course as any).create({ job_id: 1, title: 'Certified Mason', is_active: true });

    const l1 = await (CourseLevel as any).create({
      course_id: 1, level_number: 1, title: 'Foundation', fast_track_experience_required: 0, completion_window_days: 30
    });
    const l2 = await (CourseLevel as any).create({
      course_id: 1, level_number: 2, title: 'Intermediate', fast_track_experience_required: 5, completion_window_days: 45
    });

    await (ContentItem as any).create({
      course_level_id: 1, title: 'Introduction to Bricks', type: ContentType.VIDEO, sequence_order: 1,
      video_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      video_duration_seconds: 60, min_watch_percentage: 10
    });

    console.log('[Seed] Completed successfully.');
    return sendResponse(200, { status: true, message: 'Database Seeded Successfully', code: 100 });

  } catch (error: any) {
    console.error('[Seed] Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Seed Error: ${error.message}`,
      code: 300,
      misc: { stack: error.stack }
    });
  }
}