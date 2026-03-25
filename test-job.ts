import dotenv from 'dotenv';
import path from 'path';

// Force load the exact .env file path
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testJobCreation() {
  const { default: sequelize } = await import('./src/lib/sequelize');
  const { default: Job } = await import('./src/models/Job');
  const { default: Course } = await import('./src/models/Course');
  await import('./src/models/index');

  const t = await sequelize.transaction();
  try {
    console.log('1. Creating Job...');
    const job = await Job.create({
      name: 'Test Plumber',
      category_id: 1, // Make sure a category with ID 1 exists
    }, { transaction: t });

    console.log('Job created! ID is:', job.id);
    console.log('Is Job ID null?', job.id === null);

    console.log('2. Creating Course...');
    const course = await Course.create({
      job_id: job.id,
      title: 'Plumbing 101',
      is_active: true
    }, { transaction: t });

    console.log('Course created! Job ID attached is:', course.job_id);

    await t.commit();
    console.log('Transaction committed successfully');
  } catch (err) {
    await t.rollback();
    console.error('Transaction Failed:', err);
  } finally {
    process.exit();
  }
}

testJobCreation();
