import { NextRequest } from 'next/server';
import { sendResponse } from '@/utils/responseHandler';
import sequelize from '@/lib/sequelize';
import { hashPassword } from '@/lib/auth';

// Explicitly import models to ensure registration
import { 
  User, Company, Category, Job, Course, CourseLevel, ContentItem 
} from '@/models';
import { UserRole } from '@/models/User';
import { ContentType } from '@/models/ContentItem';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('[Seed] Starting...');
    await sequelize.authenticate();

    // 1. Ensure Tables Exist (Run a non-destructive sync first just in case)
    // Use POST /api/v1/system/migrate to drop/reset if needed.
    await sequelize.sync({ alter: true });

    const password = await hashPassword('password123');
    console.log('[Seed] Password hashed.');

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
        password_hash: password,
        role: UserRole.SUPER_ADMIN,
        email: 'admin@lms.com',
        phone_number: '0000000000',
        years_experience: 10
    });

    // -- Companies
    const compA = await (Company as any).create({ 
        name: 'BuildCorp Global',
        status: 'ACTIVE', 
        contact_email: 'contact@buildcorp.com', 
        contact_phone: '1234567890', 
        registration_number: 'REG001' 
    });

    // -- Supervisor
    await (User as any).create({
        first_name: 'John', last_name: 'Supervisor', password_hash: password,
        role: UserRole.SUPERVISOR, company_id: compA.id, phone_number: '111', years_experience: 5,
        email: 'supervisor@buildcorp.com'
    });

    // -- Worker
    await (User as any).create({
        first_name: 'Bob', last_name: 'Builder', password_hash: password,
        role: UserRole.WORKER, company_id: compA.id, phone_number: '222', years_experience: 6,
        email: 'worker@buildcorp.com'
    });

    console.log('[Seed] Creating Courses...');

    // -- Category & Job
    const cat = await (Category as any).create({ name: 'Construction', description: 'General Construction' });
    
    const job = await (Job as any).create({ name: 'Masonry', category_id: cat.id });
    const course = await (Course as any).create({ job_id: job.id, title: 'Certified Mason', is_active: true });
    
    const l1 = await (CourseLevel as any).create({
         course_id: course.id, level_number: 1, title: 'Foundation', fast_track_experience_required: 0, completion_window_days: 30
    });
    await (CourseLevel as any).create({
         course_id: course.id, level_number: 2, title: 'Intermediate', fast_track_experience_required: 5, completion_window_days: 45
    });
    
    await (ContentItem as any).create({
         course_level_id: l1.id, title: 'Introduction to Bricks', type: ContentType.VIDEO, sequence_order: 1, 
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