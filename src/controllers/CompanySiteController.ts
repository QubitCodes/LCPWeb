import {
	CompanySite,
	Company,
	User,
	SurveyResponse,
	SurveyTemplate,
	IndustryProjectStage,
	sequelize,
} from '../models';
import { AuditService } from '../services/AuditService';

/**
 * CompanySiteController — CRUD for company sites.
 * Each company can have multiple physical sites/locations.
 * Sites are the anchoring point for survey responses.
 */
export class CompanySiteController {

	/**
	 * List all sites for a given company.
	 * Includes contractor rep and site supervisor user names.
	 * @param companyId - UUID of the parent company
	 */
	static async list(companyId: string) {
		try {
			const company = await Company.findByPk(companyId);
			if (!company) {
				return { success: false, message: 'Company not found', code: 310 };
			}

			const sites = await CompanySite.findAll({
				where: { company_id: companyId },
				include: [
					{
						model: User,
						as: 'contractor_rep',
						attributes: ['id', 'first_name', 'last_name'],
					},
					{
						model: User,
						as: 'site_supervisor',
						attributes: ['id', 'first_name', 'last_name'],
					},
					{
						model: IndustryProjectStage,
						as: 'project_stage',
						attributes: ['id', 'name'],
					},
				],
				order: [['created_at', 'DESC']],
			});

			// Add survey response count for each site
			const sitesWithCounts = await Promise.all(
				sites.map(async (site: any) => {
					const responseCount = await SurveyResponse.count({
						where: { site_id: site.id },
					});
					return {
						...site.toJSON(),
						survey_response_count: responseCount,
					};
				})
			);

			return {
				success: true,
				data: sitesWithCounts,
				code: 100,
			};
		} catch (error) {
			console.error('List Sites Error:', error);
			return { success: false, message: 'Failed to list sites', code: 300 };
		}
	}

	/**
	 * Get a single site with its survey responses.
	 * @param siteId - UUID of the site
	 */
	static async get(siteId: string) {
		try {
			const site = await CompanySite.findByPk(siteId, {
				include: [
					{
						model: Company,
						as: 'company',
						attributes: ['id', 'name', 'industry_id'],
					},
					{
						model: User,
						as: 'contractor_rep',
						attributes: ['id', 'first_name', 'last_name'],
					},
					{
						model: User,
						as: 'site_supervisor',
						attributes: ['id', 'first_name', 'last_name'],
					},
					{
						model: IndustryProjectStage,
						as: 'project_stage',
						attributes: ['id', 'name'],
					},
					{
						model: SurveyResponse,
						as: 'survey_responses',
						include: [
							{
								model: SurveyTemplate,
								as: 'template',
								attributes: ['id', 'name', 'slug'],
							},
							{
								model: User,
								as: 'respondent',
								attributes: ['id', 'first_name', 'last_name'],
							},
						],
						order: [['created_at', 'DESC']],
					},
				],
			});

			if (!site) {
				return { success: false, message: 'Site not found', code: 310 };
			}

			return { success: true, data: site, code: 100 };
		} catch (error) {
			console.error('Get Site Error:', error);
			return { success: false, message: 'Failed to get site', code: 300 };
		}
	}

	/**
	 * Create a new site for a company.
	 * @param companyId - UUID of the parent company
	 * @param data - { name, address?, project_stage?, expected_duration_months? }
	 * @param actorId - UUID of the user creating
	 */
	static async create(companyId: string, data: any, actorId: string) {
		try {
			// Verify company exists
			const company = await Company.findByPk(companyId);
			if (!company) {
				return { success: false, message: 'Company not found', code: 310 };
			}

			if (!data.name?.trim()) {
				return { success: false, message: 'Site name is required', code: 202 };
			}

			const site = await CompanySite.create({
				company_id: companyId,
				name: data.name.trim(),
				address: data.address || null,
				project_stage_id: data.project_stage_id || null,
				expected_duration_months: data.expected_duration_months || null,
				contractor_rep_id: data.contractor_rep_id || null,
				site_supervisor_id: data.site_supervisor_id || null,
			});

			await AuditService.log({
				userId: actorId,
				action: 'CREATE_COMPANY_SITE',
				entityType: 'COMPANY_SITE',
				entityId: site.id,
				details: { company_id: companyId, name: site.name },
			});

			return {
				success: true,
				message: 'Site created',
				data: site,
				code: 101,
			};
		} catch (error) {
			console.error('Create Site Error:', error);
			return { success: false, message: 'Failed to create site', code: 300 };
		}
	}

	/**
	 * Update a site.
	 * @param siteId - UUID of the site to update
	 * @param data - partial update fields
	 * @param actorId - UUID of the user updating
	 */
	static async update(siteId: string, data: any, actorId: string) {
		try {
			const site = await CompanySite.findByPk(siteId);
			if (!site) {
				return { success: false, message: 'Site not found', code: 310 };
			}

			const updateFields: any = {};
			if (data.name !== undefined) updateFields.name = data.name.trim();
			if (data.address !== undefined) updateFields.address = data.address;
			if (data.project_stage_id !== undefined) updateFields.project_stage_id = data.project_stage_id;
			if (data.expected_duration_months !== undefined) updateFields.expected_duration_months = data.expected_duration_months;
			if (data.contractor_rep_id !== undefined) updateFields.contractor_rep_id = data.contractor_rep_id;
			if (data.site_supervisor_id !== undefined) updateFields.site_supervisor_id = data.site_supervisor_id;
			if (data.status !== undefined) updateFields.status = data.status;

			await site.update(updateFields);

			await AuditService.log({
				userId: actorId,
				action: 'UPDATE_COMPANY_SITE',
				entityType: 'COMPANY_SITE',
				entityId: siteId,
				details: updateFields,
			});

			return {
				success: true,
				message: 'Site updated',
				data: site,
				code: 103,
			};
		} catch (error) {
			console.error('Update Site Error:', error);
			return { success: false, message: 'Failed to update site', code: 300 };
		}
	}

	/**
	 * Soft-delete a site.
	 * @param siteId - UUID of the site to delete
	 * @param actorId - UUID of the user deleting
	 * @param reason - Optional reason for deletion
	 */
	static async delete(siteId: string, actorId: string, reason?: string) {
		try {
			const site = await CompanySite.findByPk(siteId);
			if (!site) {
				return { success: false, message: 'Site not found', code: 310 };
			}

			await site.update({ delete_reason: reason || 'Deleted by admin' });
			await site.destroy();

			await AuditService.log({
				userId: actorId,
				action: 'DELETE_COMPANY_SITE',
				entityType: 'COMPANY_SITE',
				entityId: siteId,
				details: { reason },
			});

			return { success: true, message: 'Site deleted', code: 100 };
		} catch (error) {
			console.error('Delete Site Error:', error);
			return { success: false, message: 'Failed to delete site', code: 300 };
		}
	}
}
