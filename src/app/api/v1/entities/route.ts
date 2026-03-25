import { NextRequest } from 'next/server';
import { Response, RESPONSE_CODES, sendResponse } from '@/utils/responseHandler';
import { Company, CompanySite, Course, Job, User } from '@/models';

/**
 * @swagger
 * /api/v1/entities:
 *   get:
 *     summary: List entity records for DATA_SELECT dropdowns
 *     description: >
 *       Returns a list of `{ id, label }` records from the requested entity table.
 *       Supports optional filters for scoping (company_id, site_id, role, course_id).
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: id
 *         schema: { type: string }
 *       - in: query
 *         name: company_id
 *         schema: { type: string }
 *       - in: query
 *         name: site_id
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: course_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of entity records
 */
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const entityType = searchParams.get('type')?.toUpperCase();
		const companyId = searchParams.get('company_id');
		const siteId = searchParams.get('site_id');
		const id = searchParams.get('id');
		const role = searchParams.get('role');
		const courseId = searchParams.get('course_id');

		const isValidUuid = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);

		if (!entityType) {
			return sendResponse(400, Response.error(
				'Missing required parameter: type',
				RESPONSE_CODES.MISSING_REQUIRED_FIELD
			));
		}

		let data: Array<{ id: string; label: string }> = [];

		switch (entityType) {
			case 'COMPANY': {
				const where: any = { status: 'ACTIVE' };
				if (id && isValidUuid(id)) where.id = id;
				const rows = await Company.findAll({
					where,
					attributes: ['id', 'name'],
					order: [['name', 'ASC']],
					raw: true,
				});
				data = rows.map((r: any) => ({ id: String(r.id), label: r.name }));
				break;
			}

			case 'SITE': {
				const where: any = { status: 'ACTIVE' };
				if (id && isValidUuid(id)) where.id = id;
				if (companyId && isValidUuid(companyId)) where.company_id = companyId;
				const rows = await CompanySite.findAll({
					where,
					attributes: ['id', 'name'],
					order: [['name', 'ASC']],
					raw: true,
				});
				data = rows.map((r: any) => ({ id: String(r.id), label: r.name }));
				break;
			}

			case 'COURSE': {
				const where: any = { is_active: true };
				if (id && isValidUuid(id)) where.id = id;
				const rows = await Course.findAll({
					where,
					attributes: ['id', 'title'],
					order: [['title', 'ASC']],
					raw: true,
				});
				data = rows.map((r: any) => ({ id: String(r.id), label: r.title || r.name }));
				break;
			}

			case 'JOB': {
				const where: any = {};
				if (id && isValidUuid(id)) where.id = id;
				if (courseId && isValidUuid(courseId)) {
					/** Jobs linked to a specific course — find the course's job_id */
					const course = await Course.findByPk(courseId, { attributes: ['job_id'] });
					if (course) {
						where.category_id = (course as any).job_id;
					}
				}
				const rows = await Job.findAll({
					where,
					attributes: ['id', 'name'],
					order: [['name', 'ASC']],
					raw: true,
				});
				data = rows.map((r: any) => ({ id: String(r.id), label: r.name }));
				break;
			}

			case 'USER': {
				const where: any = { status: 'ACTIVE' };
				if (id && isValidUuid(id)) where.id = id;
				if (companyId && isValidUuid(companyId)) where.company_id = companyId;
				if (role) where.role = role;
				const rows = await User.findAll({
					where,
					attributes: ['id', 'first_name', 'last_name', 'role'],
					order: [['first_name', 'ASC'], ['last_name', 'ASC']],
					raw: true,
				});
				data = rows.map((r: any) => ({
					id: String(r.id),
					label: `${r.first_name} ${r.last_name}`,
				}));
				break;
			}

			default:
				return sendResponse(400, Response.error(
					`Unknown entity type: ${entityType}. Valid types: COMPANY, SITE, COURSE, JOB, USER`,
					RESPONSE_CODES.INVALID_INPUT_DATA
				));
		}

		return sendResponse(200, Response.success(data, `${data.length} ${entityType.toLowerCase()} records`, RESPONSE_CODES.OK));
	} catch (error: any) {
		console.error('[EntityAPI] Error:', error);
		return sendResponse(500, Response.error(
			'Failed to fetch entities',
			RESPONSE_CODES.GENERAL_SERVER_ERROR,
			[error.message]
		));
	}
}
