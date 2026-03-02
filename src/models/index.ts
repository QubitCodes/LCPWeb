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
import UserApproval from './UserApproval';
import CompanyDetail from './CompanyDetail';
import CompanySite from './CompanySite';
import SurveyTemplate from './SurveyTemplate';
import SurveySection from './SurveySection';
import SurveyQuestion from './SurveyQuestion';
import SurveyQuestionOption from './SurveyQuestionOption';
import SurveyResponse from './SurveyResponse';
import SurveyAnswer from './SurveyAnswer';
import SurveySignoff from './SurveySignoff';

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

// User Approvals
(UserApproval as any).belongsTo(User, { foreignKey: 'user_id', as: 'user' });
(UserApproval as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
(UserApproval as any).belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
(User as any).hasMany(UserApproval, { foreignKey: 'user_id', as: 'approvals' });

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

// Company Details (one-to-one, onboarding state)
(Company as any).hasOne(CompanyDetail, { foreignKey: 'company_id', as: 'details' });
(CompanyDetail as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// Company Sites (one-to-many)
(Company as any).hasMany(CompanySite, { foreignKey: 'company_id', as: 'sites' });
(CompanySite as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// CompanySite -> User (contractor representative)
(CompanySite as any).belongsTo(User, { foreignKey: 'contractor_rep_id', as: 'contractor_rep' });
// CompanySite -> User (site supervisor / in-charge)
(CompanySite as any).belongsTo(User, { foreignKey: 'site_supervisor_id', as: 'site_supervisor' });

// =============================================================
// SURVEY ENGINE ASSOCIATIONS
// =============================================================

// SurveyTemplate -> Industry (optional filter)
(SurveyTemplate as any).belongsTo(Industry, { foreignKey: 'industry_id', as: 'industry' });
(Industry as any).hasMany(SurveyTemplate, { foreignKey: 'industry_id', as: 'survey_templates' });

// SurveyTemplate -> User (creator)
(SurveyTemplate as any).belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// SurveyTemplate -> SurveySection
(SurveyTemplate as any).hasMany(SurveySection, { foreignKey: 'template_id', as: 'sections' });
(SurveySection as any).belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

// SurveySection -> SurveyQuestion
(SurveySection as any).hasMany(SurveyQuestion, { foreignKey: 'section_id', as: 'questions' });
(SurveyQuestion as any).belongsTo(SurveySection, { foreignKey: 'section_id', as: 'section' });

// SurveyQuestion -> SurveyQuestionOption
(SurveyQuestion as any).hasMany(SurveyQuestionOption, { foreignKey: 'question_id', as: 'options' });
(SurveyQuestionOption as any).belongsTo(SurveyQuestion, { foreignKey: 'question_id', as: 'question' });

// SurveyTemplate -> SurveyResponse
(SurveyTemplate as any).hasMany(SurveyResponse, { foreignKey: 'template_id', as: 'responses' });
(SurveyResponse as any).belongsTo(SurveyTemplate, { foreignKey: 'template_id', as: 'template' });

// SurveyResponse -> CompanySite (optional)
(SurveyResponse as any).belongsTo(CompanySite, { foreignKey: 'site_id', as: 'site' });
(CompanySite as any).hasMany(SurveyResponse, { foreignKey: 'site_id', as: 'survey_responses' });

// SurveyResponse -> Company
(SurveyResponse as any).belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
(Company as any).hasMany(SurveyResponse, { foreignKey: 'company_id', as: 'survey_responses' });

// SurveyResponse -> User (respondent)
(SurveyResponse as any).belongsTo(User, { foreignKey: 'respondent_id', as: 'respondent' });

// SurveyResponse -> SurveyAnswer
(SurveyResponse as any).hasMany(SurveyAnswer, { foreignKey: 'response_id', as: 'answers' });
(SurveyAnswer as any).belongsTo(SurveyResponse, { foreignKey: 'response_id', as: 'response' });

// SurveyAnswer -> SurveyQuestion
(SurveyAnswer as any).belongsTo(SurveyQuestion, { foreignKey: 'question_id', as: 'question' });

// SurveyResponse -> SurveySignoff
(SurveyResponse as any).hasMany(SurveySignoff, { foreignKey: 'response_id', as: 'signoffs' });
(SurveySignoff as any).belongsTo(SurveyResponse, { foreignKey: 'response_id', as: 'response' });

// SurveySignoff -> User (signer, optional)
(SurveySignoff as any).belongsTo(User, { foreignKey: 'user_id', as: 'signer' });

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
  Industry,
  UserApproval,
  CompanyDetail,
  CompanySite,
  SurveyTemplate,
  SurveySection,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveyResponse,
  SurveyAnswer,
  SurveySignoff
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
  Industry,
  UserApproval,
  CompanyDetail,
  CompanySite,
  SurveyTemplate,
  SurveySection,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveyResponse,
  SurveyAnswer,
  SurveySignoff
};

export default models;