import sequelize from '../lib/sequelize';
import User from './User';
import Company from './Company';
import Category from './Category';
import Job from './Job';
import Course from './Course';
import CourseLevel from './CourseLevel';
import ContentItem from './ContentItem';
import AuditLog from './AuditLog';
import Skill from './Skill';
import JobSkill from './JobSkill';
import Order from './Order';
import OrderItem from './OrderItem';
import Payment from './Payment';
import LevelEnrollment from './LevelEnrollment';
import ContentProgress from './ContentProgress';
import Question from './Question';
import QuestionOption from './QuestionOption';
import LevelRecommendation from './LevelRecommendation';
import Certificate from './Certificate';
import CompanyMembershipHistory from './CompanyMembershipHistory';
import Industry from './Industry';

// =============================================================
// DEFINING ASSOCIATIONS CENTRALLY
// This prevents circular dependency issues during model init
// =============================================================

// User <-> Company
(User as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
(Company as any).hasMany(User, { foreignKey: 'company_id', as: 'employees' });

// Company <-> Industry
(Company as any).belongsTo(Industry, { foreignKey: 'industry_id', as: 'industry' });
(Industry as any).hasMany(Company, { foreignKey: 'industry_id', as: 'companies' });

// Job <-> Category
(Job as any).belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
(Category as any).hasMany(Job, { foreignKey: 'category_id', as: 'jobs' });

// Job <-> Course
(Course as any).belongsTo(Job, { foreignKey: 'job_id', as: 'job' });
(Job as any).hasOne(Course, { foreignKey: 'job_id', as: 'course' });

// Course <-> CourseLevel
(CourseLevel as any).belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
(Course as any).hasMany(CourseLevel, { foreignKey: 'course_id', as: 'levels' });

// CourseLevel <-> ContentItem
(ContentItem as any).belongsTo(CourseLevel, { foreignKey: 'course_level_id', as: 'level' });
(CourseLevel as any).hasMany(ContentItem, { foreignKey: 'course_level_id', as: 'contents' });

// Job <-> Skill (Many-to-Many)
(Job as any).belongsToMany(Skill, { through: JobSkill, foreignKey: 'job_id', as: 'skills' });
(Skill as any).belongsToMany(Job, { through: JobSkill, foreignKey: 'skill_id', as: 'jobs' });

// AuditLog
(AuditLog as any).belongsTo(User, { foreignKey: 'user_id', as: 'actor' });

// Orders
(Order as any).belongsTo(User, { foreignKey: 'user_id', as: 'ordered_by' });
(Order as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// Order Items
(OrderItem as any).belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
(Order as any).hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
(OrderItem as any).belongsTo(User, { foreignKey: 'worker_id', as: 'worker' });
(OrderItem as any).belongsTo(CourseLevel, { foreignKey: 'course_level_id', as: 'level' });

// Payments
(Payment as any).belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Level Enrollments
(LevelEnrollment as any).belongsTo(User, { foreignKey: 'worker_id', as: 'worker' });
(LevelEnrollment as any).belongsTo(CourseLevel, { foreignKey: 'course_level_id', as: 'level' });

// Content Progress
(ContentProgress as any).belongsTo(LevelEnrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });
(LevelEnrollment as any).hasMany(ContentProgress, { foreignKey: 'enrollment_id', as: 'progress_records' });
(ContentProgress as any).belongsTo(ContentItem, { foreignKey: 'content_item_id', as: 'content_item' });

// Questions
(Question as any).belongsTo(ContentItem, { foreignKey: 'content_item_id', as: 'quiz' });
(ContentItem as any).hasMany(Question, { foreignKey: 'content_item_id', as: 'questions' });

(QuestionOption as any).belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
(Question as any).hasMany(QuestionOption, { foreignKey: 'question_id', as: 'options' });

// Recommendations
(LevelRecommendation as any).belongsTo(User, { foreignKey: 'worker_id', as: 'worker' });
(LevelRecommendation as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
(LevelRecommendation as any).belongsTo(CourseLevel, { foreignKey: 'course_level_id', as: 'level' });
(LevelRecommendation as any).belongsTo(User, { foreignKey: 'recommended_by_id', as: 'recommender' });
(LevelRecommendation as any).belongsTo(User, { foreignKey: 'approved_by_admin_id', as: 'admin' });

// Certificates
(Certificate as any).belongsTo(User, { foreignKey: 'worker_id', as: 'worker' });
(Certificate as any).belongsTo(LevelEnrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });
(Certificate as any).belongsTo(CourseLevel, { foreignKey: 'course_level_id', as: 'level' });

// Company Membership History
(CompanyMembershipHistory as any).belongsTo(User, { foreignKey: 'user_id', as: 'user' });
(CompanyMembershipHistory as any).belongsTo(Company, { foreignKey: 'from_company_id', as: 'from_company' });
(CompanyMembershipHistory as any).belongsTo(Company, { foreignKey: 'to_company_id', as: 'to_company' });
(CompanyMembershipHistory as any).belongsTo(User, { foreignKey: 'initiated_by_user_id', as: 'initiator' });

const models = {
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
  CompanyMembershipHistory,
  Industry
};

export {
  sequelize,
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
  CompanyMembershipHistory,
  Industry
};

export default models;