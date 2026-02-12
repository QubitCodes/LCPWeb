import { LevelEnrollment, User, CourseLevel, Course, Company } from '../models';
import { Op } from 'sequelize';

/**
 * EnrollmentController
 * Handles admin-level enrollment listing with pagination, filtering, and joins.
 */
export class EnrollmentController {

    /**
     * List all enrollments for admin view with pagination and filters.
     * Includes worker, course level, course, and company info.
     * @param filters - Query filters (status, search, page, limit)
     */
    static async adminList(filters: any) {
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const offset = (page - 1) * limit;

        const whereClause: any = {};

        // Filter by status
        if (filters.status) {
            whereClause.status = filters.status;
        }

        // Worker include with search + company join
        const workerWhere: any = {};
        if (filters.search) {
            workerWhere[Op.or] = [
                { first_name: { [Op.iLike]: `%${filters.search}%` } },
                { last_name: { [Op.iLike]: `%${filters.search}%` } },
                { email: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        const { count, rows } = await LevelEnrollment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'worker',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'company_id'],
                    where: Object.keys(workerWhere).length > 0 ? workerWhere : undefined,
                    required: Object.keys(workerWhere).length > 0,
                    include: [
                        { model: Company, as: 'company', attributes: ['id', 'name'] }
                    ]
                },
                {
                    model: CourseLevel,
                    as: 'level',
                    attributes: ['id', 'title', 'level_number'],
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'title'] }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            success: true,
            data: rows,
            code: 100,
            misc: {
                total: count,
                page,
                limit,
                pages: Math.ceil(count / limit)
            }
        };
    }
}
