import {
	SurveyTemplate,
	SurveySection,
	SurveyQuestion,
	SurveyQuestionOption,
	SurveyResponse,
	SurveyAnswer,
	SurveySignoff,
	sequelize
} from '../models';
import { AuditService } from '../services/AuditService';

/**
 * SurveyController — Full CRUD for the dynamic survey/quiz engine.
 * Handles templates, sections, questions, options, and reading responses.
 *
 * All methods are static and return a result object { success, message, data, code }.
 */
export class SurveyController {

	// =============================================================
	// TEMPLATE CRUD
	// =============================================================

	/**
	 * List all survey templates with optional filters.
	 * @param filters - { status?, type?, industry_id? }
	 */
	static async listTemplates(filters: any = {}) {
		try {
			const where: any = {};
			if (filters.status) where.status = filters.status;
			if (filters.type) where.type = filters.type;
			if (filters.industry_id) where.industry_id = filters.industry_id;

			const templates = await SurveyTemplate.findAll({
				where,
				include: [
					{
						model: SurveySection,
						as: 'sections',
						attributes: ['id'],
					}
				],
				order: [['created_at', 'DESC']],
			});

			return {
				success: true,
				data: templates,
				code: 100
			};
		} catch (error) {
			console.error('List Templates Error:', error);
			return { success: false, message: 'Failed to list templates', code: 300 };
		}
	}

	/**
	 * Get a single template with full nested structure:
	 * template → sections → questions → options (all ordered by sequence_order).
	 */
	static async getTemplate(templateId: string) {
		try {
			const template = await SurveyTemplate.findByPk(templateId, {
				include: [
					{
						model: SurveySection,
						as: 'sections',
						include: [
							{
								model: SurveyQuestion,
								as: 'questions',
								include: [
									{
										model: SurveyQuestionOption,
										as: 'options',
									}
								],
							}
						],
					}
				],
				order: [
					[{ model: SurveySection, as: 'sections' }, 'sequence_order', 'ASC'],
					[
						{ model: SurveySection, as: 'sections' },
						{ model: SurveyQuestion, as: 'questions' },
						'sequence_order', 'ASC'
					],
					[
						{ model: SurveySection, as: 'sections' },
						{ model: SurveyQuestion, as: 'questions' },
						{ model: SurveyQuestionOption, as: 'options' },
						'sequence_order', 'ASC'
					],
				],
			});

			if (!template) {
				return { success: false, message: 'Template not found', code: 310 };
			}

			return { success: true, data: template, code: 100 };
		} catch (error) {
			console.error('Get Template Error:', error);
			return { success: false, message: 'Failed to get template', code: 300 };
		}
	}

	/**
	 * Create a new survey template.
	 * @param data - { name, description?, industry_id?, type?, status? }
	 * @param actorId - UUID of the user creating the template
	 */
	static async createTemplate(data: any, actorId: string) {
		try {
			if (!data.name?.trim()) {
				return { success: false, message: 'Template name is required', code: 202 };
			}

			// Auto-generate slug from name (lowercase, hyphenated, no special chars)
			const baseSlug = data.slug || data.name.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');

			// Ensure slug is unique — append counter if needed
			let slug = baseSlug;
			let counter = 1;
			while (await SurveyTemplate.findOne({ where: { slug } })) {
				slug = `${baseSlug}-${counter++}`;
			}

			const template = await SurveyTemplate.create({
				name: data.name.trim(),
				slug,
				description: data.description || null,
				industry_id: data.industry_id || null,
				type: data.type || 'SURVEY',
				status: data.status || 'DRAFT',
				created_by: actorId,
			});

			await AuditService.log({
				userId: actorId,
				action: 'CREATE_SURVEY_TEMPLATE',
				entityType: 'SURVEY_TEMPLATE',
				entityId: template.id,
				details: { name: template.name, type: template.type }
			});

			return {
				success: true,
				message: 'Template created',
				data: template,
				code: 101
			};
		} catch (error) {
			console.error('Create Template Error:', error);
			return { success: false, message: 'Failed to create template', code: 300 };
		}
	}

	/**
	 * Update an existing survey template.
	 * @param templateId - UUID of the template to update
	 * @param data - { name?, description?, industry_id?, type?, status? }
	 * @param actorId - UUID of the user performing the update
	 */
	static async updateTemplate(templateId: string, data: any, actorId: string) {
		try {
			const template = await SurveyTemplate.findByPk(templateId);
			if (!template) {
				return { success: false, message: 'Template not found', code: 310 };
			}

			const updateFields: any = {};
			if (data.name !== undefined) updateFields.name = data.name.trim();
			if (data.description !== undefined) updateFields.description = data.description;
			if (data.industry_id !== undefined) updateFields.industry_id = data.industry_id;
			if (data.type !== undefined) updateFields.type = data.type;
			if (data.status !== undefined) updateFields.status = data.status;

			await template.update(updateFields);

			await AuditService.log({
				userId: actorId,
				action: 'UPDATE_SURVEY_TEMPLATE',
				entityType: 'SURVEY_TEMPLATE',
				entityId: template.id,
				details: updateFields
			});

			return {
				success: true,
				message: 'Template updated',
				data: template,
				code: 103
			};
		} catch (error) {
			console.error('Update Template Error:', error);
			return { success: false, message: 'Failed to update template', code: 300 };
		}
	}

	/**
	 * Soft-delete a survey template.
	 */
	static async deleteTemplate(templateId: string, actorId: string, reason?: string) {
		try {
			const template = await SurveyTemplate.findByPk(templateId);
			if (!template) {
				return { success: false, message: 'Template not found', code: 310 };
			}

			// System templates cannot be deleted
			if (template.is_system) {
				return { success: false, message: 'System templates cannot be deleted', code: 400 };
			}

			await template.update({ delete_reason: reason || 'Deleted by admin' });
			await template.destroy();

			await AuditService.log({
				userId: actorId,
				action: 'DELETE_SURVEY_TEMPLATE',
				entityType: 'SURVEY_TEMPLATE',
				entityId: templateId,
				details: { reason }
			});

			return { success: true, message: 'Template deleted', code: 100 };
		} catch (error) {
			console.error('Delete Template Error:', error);
			return { success: false, message: 'Failed to delete template', code: 300 };
		}
	}

	// =============================================================
	// SECTION CRUD
	// =============================================================

	/**
	 * Add a section to a template.
	 * @param data - { template_id, name, description?, is_wizard_step? }
	 */
	static async createSection(data: any, actorId: string) {
		try {
			if (!data.template_id || !data.name?.trim()) {
				return { success: false, message: 'template_id and name are required', code: 202 };
			}

			// Auto-determine sequence_order
			const lastSection = await SurveySection.findOne({
				where: { template_id: data.template_id },
				order: [['sequence_order', 'DESC']],
			});
			const nextOrder = lastSection ? lastSection.sequence_order + 1 : 0;

			const section = await SurveySection.create({
				template_id: data.template_id,
				name: data.name.trim(),
				description: data.description || null,
				sequence_order: data.sequence_order ?? nextOrder,
				is_wizard_step: data.is_wizard_step ?? false,
			});

			return {
				success: true,
				message: 'Section added',
				data: section,
				code: 101
			};
		} catch (error) {
			console.error('Create Section Error:', error);
			return { success: false, message: 'Failed to create section', code: 300 };
		}
	}

	/**
	 * Update a section.
	 */
	static async updateSection(sectionId: string, data: any, actorId: string) {
		try {
			const section = await SurveySection.findByPk(sectionId);
			if (!section) {
				return { success: false, message: 'Section not found', code: 310 };
			}

			const updateFields: any = {};
			if (data.name !== undefined) updateFields.name = data.name.trim();
			if (data.description !== undefined) updateFields.description = data.description;
			if (data.sequence_order !== undefined) updateFields.sequence_order = data.sequence_order;
			if (data.is_wizard_step !== undefined) updateFields.is_wizard_step = data.is_wizard_step;

			await section.update(updateFields);

			return { success: true, message: 'Section updated', data: section, code: 103 };
		} catch (error) {
			console.error('Update Section Error:', error);
			return { success: false, message: 'Failed to update section', code: 300 };
		}
	}

	/**
	 * Soft-delete a section (cascades to questions via DB).
	 */
	static async deleteSection(sectionId: string, actorId: string) {
		try {
			const section = await SurveySection.findByPk(sectionId);
			if (!section) {
				return { success: false, message: 'Section not found', code: 310 };
			}

			await section.destroy();
			return { success: true, message: 'Section deleted', code: 100 };
		} catch (error) {
			console.error('Delete Section Error:', error);
			return { success: false, message: 'Failed to delete section', code: 300 };
		}
	}

	/**
	 * Reorder sections within a template.
	 * @param data - { template_id, order: [{ id, sequence_order }] }
	 */
	static async reorderSections(data: any) {
		const transaction = await sequelize.transaction();
		try {
			for (const item of data.order) {
				await SurveySection.update(
					{ sequence_order: item.sequence_order },
					{ where: { id: item.id, template_id: data.template_id }, transaction }
				);
			}
			await transaction.commit();
			return { success: true, message: 'Sections reordered', code: 103 };
		} catch (error) {
			await transaction.rollback();
			console.error('Reorder Sections Error:', error);
			return { success: false, message: 'Failed to reorder sections', code: 300 };
		}
	}

	// =============================================================
	// QUESTION CRUD
	// =============================================================

	/**
	 * Add a question to a section.
	 * @param data - { section_id, text, type?, is_required?, points?, config?, options?[] }
	 */
	static async createQuestion(data: any, actorId: string) {
		const transaction = await sequelize.transaction();
		try {
			if (!data.section_id || !data.text?.trim()) {
				await transaction.rollback();
				return { success: false, message: 'section_id and text are required', code: 202 };
			}

			// Auto-determine sequence_order
			const lastQ = await SurveyQuestion.findOne({
				where: { section_id: data.section_id },
				order: [['sequence_order', 'DESC']],
			});
			const nextOrder = lastQ ? lastQ.sequence_order + 1 : 0;

			const question = await SurveyQuestion.create({
				section_id: data.section_id,
				text: data.text.trim(),
				type: data.type || 'TEXT',
				is_required: data.is_required ?? false,
				sequence_order: data.sequence_order ?? nextOrder,
				points: data.points || 0,
				config: data.config || null,
			}, { transaction });

			// If options are provided (for SELECT / MULTI_SELECT / YES_NO), create those too
			if (data.options && Array.isArray(data.options) && data.options.length > 0) {
				const optionRecords = data.options.map((opt: any, idx: number) => ({
					question_id: question.id,
					text: opt.text,
					value: opt.value || opt.text,
					is_correct: opt.is_correct || false,
					sequence_order: opt.sequence_order ?? idx,
				}));
				await SurveyQuestionOption.bulkCreate(optionRecords, { transaction });
			}

			await transaction.commit();

			// Refetch to include options
			const fullQuestion = await SurveyQuestion.findByPk(question.id, {
				include: [{ model: SurveyQuestionOption, as: 'options' }],
				order: [[{ model: SurveyQuestionOption, as: 'options' }, 'sequence_order', 'ASC']],
			});

			return {
				success: true,
				message: 'Question added',
				data: fullQuestion,
				code: 101
			};
		} catch (error) {
			await transaction.rollback();
			console.error('Create Question Error:', error);
			return { success: false, message: 'Failed to create question', code: 300 };
		}
	}

	/**
	 * Update a question and optionally replace its options.
	 * @param questionId - UUID of the question
	 * @param data - { text?, type?, is_required?, points?, config?, options?[] }
	 */
	static async updateQuestion(questionId: string, data: any, actorId: string) {
		const transaction = await sequelize.transaction();
		try {
			const question = await SurveyQuestion.findByPk(questionId);
			if (!question) {
				await transaction.rollback();
				return { success: false, message: 'Question not found', code: 310 };
			}

			const updateFields: any = {};
			if (data.text !== undefined) updateFields.text = data.text.trim();
			if (data.type !== undefined) updateFields.type = data.type;
			if (data.is_required !== undefined) updateFields.is_required = data.is_required;
			if (data.sequence_order !== undefined) updateFields.sequence_order = data.sequence_order;
			if (data.points !== undefined) updateFields.points = data.points;
			if (data.config !== undefined) updateFields.config = data.config;

			await question.update(updateFields, { transaction });

			// If options are provided, replace existing options entirely
			if (data.options !== undefined && Array.isArray(data.options)) {
				// Soft-delete old options
				await SurveyQuestionOption.destroy({
					where: { question_id: questionId },
					transaction,
				});

				// Create new options
				if (data.options.length > 0) {
					const optionRecords = data.options.map((opt: any, idx: number) => ({
						question_id: questionId,
						text: opt.text,
						value: opt.value || opt.text,
						is_correct: opt.is_correct || false,
						sequence_order: opt.sequence_order ?? idx,
					}));
					await SurveyQuestionOption.bulkCreate(optionRecords, { transaction });
				}
			}

			await transaction.commit();

			// Refetch with options
			const fullQuestion = await SurveyQuestion.findByPk(questionId, {
				include: [{ model: SurveyQuestionOption, as: 'options' }],
				order: [[{ model: SurveyQuestionOption, as: 'options' }, 'sequence_order', 'ASC']],
			});

			return { success: true, message: 'Question updated', data: fullQuestion, code: 103 };
		} catch (error) {
			await transaction.rollback();
			console.error('Update Question Error:', error);
			return { success: false, message: 'Failed to update question', code: 300 };
		}
	}

	/**
	 * Soft-delete a question.
	 */
	static async deleteQuestion(questionId: string, actorId: string) {
		try {
			const question = await SurveyQuestion.findByPk(questionId);
			if (!question) {
				return { success: false, message: 'Question not found', code: 310 };
			}

			await question.destroy();
			return { success: true, message: 'Question deleted', code: 100 };
		} catch (error) {
			console.error('Delete Question Error:', error);
			return { success: false, message: 'Failed to delete question', code: 300 };
		}
	}

	/**
	 * Reorder questions within a section.
	 * @param data - { section_id, order: [{ id, sequence_order }] }
	 */
	static async reorderQuestions(data: any) {
		const transaction = await sequelize.transaction();
		try {
			for (const item of data.order) {
				await SurveyQuestion.update(
					{ sequence_order: item.sequence_order },
					{ where: { id: item.id, section_id: data.section_id }, transaction }
				);
			}
			await transaction.commit();
			return { success: true, message: 'Questions reordered', code: 103 };
		} catch (error) {
			await transaction.rollback();
			console.error('Reorder Questions Error:', error);
			return { success: false, message: 'Failed to reorder questions', code: 300 };
		}
	}

	// =============================================================
	// RESPONSE HELPERS (Read-only from admin side)
	// =============================================================

	/**
	 * List responses for a given template, optionally filtered by company/site/status.
	 */
	static async listResponses(filters: any = {}) {
		try {
			const where: any = {};
			if (filters.template_id) where.template_id = filters.template_id;
			if (filters.company_id) where.company_id = filters.company_id;
			if (filters.site_id) where.site_id = filters.site_id;
			if (filters.status) where.status = filters.status;

			const responses = await SurveyResponse.findAll({
				where,
				include: [
					{ model: SurveyTemplate, as: 'template', attributes: ['id', 'name', 'type'] },
					{ model: SurveySignoff, as: 'signoffs', attributes: ['id', 'name', 'sign_method', 'signed_at'] },
				],
				order: [['created_at', 'DESC']],
			});

			return { success: true, data: responses, code: 100 };
		} catch (error) {
			console.error('List Responses Error:', error);
			return { success: false, message: 'Failed to list responses', code: 300 };
		}
	}

	/**
	 * Get a single response with all answers and signoffs.
	 */
	static async getResponse(responseId: string) {
		try {
			const response = await SurveyResponse.findByPk(responseId, {
				include: [
					{ model: SurveyTemplate, as: 'template', attributes: ['id', 'name', 'type'] },
					{
						model: SurveyAnswer,
						as: 'answers',
						include: [
							{
								model: SurveyQuestion,
								as: 'question',
								attributes: ['id', 'text', 'type', 'section_id'],
							}
						]
					},
					{ model: SurveySignoff, as: 'signoffs' },
				],
			});

			if (!response) {
				return { success: false, message: 'Response not found', code: 310 };
			}

			return { success: true, data: response, code: 100 };
		} catch (error) {
			console.error('Get Response Error:', error);
			return { success: false, message: 'Failed to get response', code: 300 };
		}
	}

	// =============================================================
	// RESPONSE MANAGEMENT (Fill-out operations)
	// =============================================================

	/**
	 * Create a new survey response (start filling a survey).
	 * @param data - { template_id, site_id?, company_id }
	 * @param respondentId - UUID of the user starting the survey
	 */
	static async createResponse(data: any, respondentId: string | null) {
		try {
			if (!data.template_id || !data.company_id) {
				return { success: false, message: 'template_id and company_id are required', code: 202 };
			}

			// Verify template exists and is ACTIVE
			const template = await SurveyTemplate.findByPk(data.template_id);
			if (!template) {
				return { success: false, message: 'Template not found', code: 310 };
			}
			if (template.status !== 'ACTIVE') {
				return { success: false, message: 'Template is not active', code: 400 };
			}

			const response = await SurveyResponse.create({
				template_id: data.template_id,
				site_id: data.site_id || null,
				company_id: data.company_id,
				respondent_id: respondentId,
				status: 'DRAFT',
			});

			return {
				success: true,
				message: 'Survey started',
				data: { responseId: response.id, status: response.status },
				code: 101
			};
		} catch (error) {
			console.error('Create Response Error:', error);
			return { success: false, message: 'Failed to start survey', code: 300 };
		}
	}

	/**
	 * Upsert answers for a survey response (auto-save / batch save).
	 * Creates new answers or updates existing ones keyed by question_id.
	 * Also updates response status to IN_PROGRESS if currently DRAFT.
	 *
	 * @param responseId - UUID of the response
	 * @param answers - Array of { question_id, answer_text?, answer_json? }
	 * @param respondentId - UUID of the user saving (for ownership check)
	 */
	static async upsertAnswers(responseId: string, answers: any[], respondentId: string) {
		const transaction = await sequelize.transaction();
		try {
			const response = await SurveyResponse.findByPk(responseId);
			if (!response) {
				await transaction.rollback();
				return { success: false, message: 'Response not found', code: 310 };
			}

			// Ownership check
			if (response.respondent_id !== respondentId) {
				// If respondent_id is null, claim the form for this user
				if (!response.respondent_id) {
					await response.update({ respondent_id: respondentId }, { transaction });
				} else {
					await transaction.rollback();
					return { success: false, message: 'Not authorized to edit this response', code: 212 };
				}
			}

			// Cannot edit a completed response
			if (response.status === 'COMPLETED') {
				await transaction.rollback();
				return { success: false, message: 'Response is already completed', code: 400 };
			}

			// Upsert each answer
			for (const ans of answers) {
				if (!ans.question_id) continue;

				const existing = await SurveyAnswer.findOne({
					where: { response_id: responseId, question_id: ans.question_id },
				});

				if (existing) {
					// Update existing answer
					const updateData: any = {};
					if (ans.answer_text !== undefined) updateData.answer_text = ans.answer_text;
					if (ans.answer_json !== undefined) updateData.answer_json = ans.answer_json;
					await existing.update(updateData, { transaction });
				} else {
					// Create new answer
					await SurveyAnswer.create({
						response_id: responseId,
						question_id: ans.question_id,
						answer_text: ans.answer_text || null,
						answer_json: ans.answer_json || null,
					}, { transaction });
				}
			}

			// Move from DRAFT to IN_PROGRESS on first save
			if (response.status === 'DRAFT') {
				await response.update({ status: 'IN_PROGRESS' }, { transaction });
			}

			await transaction.commit();

			return {
				success: true,
				message: 'Answers saved',
				data: { responseId, status: response.status === 'DRAFT' ? 'IN_PROGRESS' : response.status },
				code: 103
			};
		} catch (error) {
			await transaction.rollback();
			console.error('Upsert Answers Error:', error);
			return { success: false, message: 'Failed to save answers', code: 300 };
		}
	}

	/**
	 * Complete a survey response. Validates required questions are answered.
	 *
	 * @param responseId - UUID of the response
	 * @param respondentId - UUID of the user completing (for ownership check)
	 */
	static async completeResponse(responseId: string, respondentId: string) {
		const transaction = await sequelize.transaction();
		try {
			const response = await SurveyResponse.findByPk(responseId, {
				include: [{ model: SurveyAnswer, as: 'answers' }],
			});
			if (!response) {
				await transaction.rollback();
				return { success: false, message: 'Response not found', code: 310 };
			}

			if (response.respondent_id !== respondentId) {
				if (!response.respondent_id) {
					await response.update({ respondent_id: respondentId }, { transaction });
				} else {
					await transaction.rollback();
					return { success: false, message: 'Not authorized', code: 212 };
				}
			}

			if (response.status === 'COMPLETED') {
				await transaction.rollback();
				return { success: false, message: 'Already completed', code: 400 };
			}

			// Validate: check all required questions have answers
			const requiredQuestions = await SurveyQuestion.findAll({
				where: { is_required: true },
				include: [{
					model: SurveySection,
					as: 'section',
					where: {},
					include: [{
						model: SurveyTemplate,
						as: 'template',
						where: { id: response.template_id },
						attributes: [],
					}],
					attributes: [],
				}],
				attributes: ['id', 'text'],
			});

			const answeredQuestionIds = new Set(
				((response as any).answers || []).map((a: any) => a.question_id)
			);

			const unanswered = requiredQuestions.filter(q => !answeredQuestionIds.has(q.id));
			if (unanswered.length > 0) {
				await transaction.rollback();
				return {
					success: false,
					message: `${unanswered.length} required question(s) not answered`,
					code: 201,
					data: { unanswered: unanswered.map(q => ({ id: q.id, text: q.text })) },
				};
			}

			// Mark complete
			await response.update(
				{ status: 'COMPLETED', completed_at: new Date() },
				{ transaction }
			);

			await transaction.commit();

			return {
				success: true,
				message: 'Survey completed',
				data: { responseId, status: 'COMPLETED', completed_at: response.completed_at },
				code: 103
			};
		} catch (error) {
			await transaction.rollback();
			console.error('Complete Response Error:', error);
			return { success: false, message: 'Failed to complete survey', code: 300 };
		}
	}

	/**
	 * Get a response with the full template structure and existing answers merged.
	 * Used by the survey filling UI to render the form with saved answers populated.
	 */
	static async getResponseForFilling(responseId: string) {
		try {
			const response = await SurveyResponse.findByPk(responseId, {
				include: [
					{
						model: SurveyTemplate,
						as: 'template',
						include: [{
							model: SurveySection,
							as: 'sections',
							include: [{
								model: SurveyQuestion,
								as: 'questions',
								include: [{ model: SurveyQuestionOption, as: 'options' }],
							}],
						}],
					},
					{ model: SurveyAnswer, as: 'answers' },
					{ model: SurveySignoff, as: 'signoffs' },
				],
				order: [
					[{ model: SurveyTemplate, as: 'template' }, { model: SurveySection, as: 'sections' }, 'sequence_order', 'ASC'],
					[
						{ model: SurveyTemplate, as: 'template' },
						{ model: SurveySection, as: 'sections' },
						{ model: SurveyQuestion, as: 'questions' },
						'sequence_order', 'ASC'
					],
					[
						{ model: SurveyTemplate, as: 'template' },
						{ model: SurveySection, as: 'sections' },
						{ model: SurveyQuestion, as: 'questions' },
						{ model: SurveyQuestionOption, as: 'options' },
						'sequence_order', 'ASC'
					],
				],
			});

			if (!response) {
				return { success: false, message: 'Response not found', code: 310 };
			}

			return { success: true, data: response, code: 100 };
		} catch (error) {
			console.error('Get Response For Filling Error:', error);
			return { success: false, message: 'Failed to load survey', code: 300 };
		}
	}

	// =============================================================
	// SIGN-OFF MANAGEMENT
	// =============================================================

	/**
	 * Add a drawn signature sign-off to a completed response.
	 * @param data - { response_id, name, designation?, signature_data (base64) }
	 * @param userId - UUID of the signer (if logged in)
	 */
	static async addDrawnSignoff(data: any, userId: string | null) {
		try {
			if (!data.response_id || !data.name?.trim() || !data.signature_data) {
				return { success: false, message: 'response_id, name, and signature_data are required', code: 202 };
			}

			// Verify response exists and is COMPLETED
			const response = await SurveyResponse.findByPk(data.response_id);
			if (!response) {
				return { success: false, message: 'Response not found', code: 310 };
			}
			if (response.status !== 'COMPLETED') {
				return { success: false, message: 'Survey must be completed before sign-off', code: 400 };
			}

			const signoff = await SurveySignoff.create({
				response_id: data.response_id,
				user_id: userId || null,
				name: data.name.trim(),
				designation: data.designation || null,
				sign_method: 'DRAW',
				signature_data: data.signature_data,
				otp_verified: false,
				signed_at: new Date(),
			});

			return {
				success: true,
				message: 'Signature recorded',
				data: { id: signoff.id, name: signoff.name, signed_at: signoff.signed_at },
				code: 101
			};
		} catch (error) {
			console.error('Add Drawn Signoff Error:', error);
			return { success: false, message: 'Failed to add signature', code: 300 };
		}
	}

	/**
	 * Request an OTP sign-off: creates a signoff record and generates an OTP.
	 * The OTP is stored in-memory with a 5-min expiry (use Redis in production).
	 * @param data - { response_id, name, designation? }
	 * @param userId - UUID of the signer
	 */
	static async requestOtpSignoff(data: any, userId: string | null) {
		try {
			if (!data.response_id || !data.name?.trim()) {
				return { success: false, message: 'response_id and name are required', code: 202 };
			}

			const response = await SurveyResponse.findByPk(data.response_id);
			if (!response) {
				return { success: false, message: 'Response not found', code: 310 };
			}
			if (response.status !== 'COMPLETED') {
				return { success: false, message: 'Survey must be completed before sign-off', code: 400 };
			}

			// Create signoff record (unverified)
			const signoff = await SurveySignoff.create({
				response_id: data.response_id,
				user_id: userId || null,
				name: data.name.trim(),
				designation: data.designation || null,
				sign_method: 'OTP',
				otp_verified: false,
				signed_at: null,
			});

			// Generate 6-digit OTP
			const otp = Math.floor(100000 + Math.random() * 900000).toString();

			// Store OTP in memory with 5-min expiry
			otpStore.set(signoff.id, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

			// In production, send OTP via SMS/Email here
			console.log(`[OTP SIGN-OFF] Signoff ${signoff.id}: OTP = ${otp}`);

			return {
				success: true,
				message: 'OTP sent. Please verify to complete sign-off.',
				data: { signoffId: signoff.id },
				code: 101
			};
		} catch (error) {
			console.error('Request OTP Signoff Error:', error);
			return { success: false, message: 'Failed to request OTP', code: 300 };
		}
	}

	/**
	 * Verify an OTP sign-off.
	 * @param signoffId - UUID of the signoff record
	 * @param otp - 6-digit OTP string
	 */
	static async verifyOtpSignoff(signoffId: string, otp: string) {
		try {
			const signoff = await SurveySignoff.findByPk(signoffId);
			if (!signoff) {
				return { success: false, message: 'Signoff not found', code: 310 };
			}
			if (signoff.otp_verified) {
				return { success: false, message: 'Already verified', code: 400 };
			}
			if (signoff.sign_method !== 'OTP') {
				return { success: false, message: 'This signoff uses drawn signature, not OTP', code: 400 };
			}

			// Check OTP
			const stored = otpStore.get(signoffId);
			if (!stored) {
				return { success: false, message: 'OTP expired. Please request a new one.', code: 400 };
			}
			if (Date.now() > stored.expiresAt) {
				otpStore.delete(signoffId);
				return { success: false, message: 'OTP expired. Please request a new one.', code: 400 };
			}
			if (stored.otp !== otp) {
				return { success: false, message: 'Invalid OTP', code: 201 };
			}

			// Mark as verified
			await signoff.update({
				otp_verified: true,
				signed_at: new Date(),
			});

			// Clean up
			otpStore.delete(signoffId);

			return {
				success: true,
				message: 'OTP verified. Sign-off complete.',
				data: { id: signoff.id, name: signoff.name, signed_at: signoff.signed_at },
				code: 103
			};
		} catch (error) {
			console.error('Verify OTP Signoff Error:', error);
			return { success: false, message: 'Failed to verify OTP', code: 300 };
		}
	}

	/**
	 * List all signoffs for a response.
	 */
	static async listSignoffs(responseId: string) {
		try {
			const signoffs = await SurveySignoff.findAll({
				where: { response_id: responseId },
				order: [['created_at', 'ASC']],
			});

			return { success: true, data: signoffs, code: 100 };
		} catch (error) {
			console.error('List Signoffs Error:', error);
			return { success: false, message: 'Failed to list signoffs', code: 300 };
		}
	}

	/**
	 * Delete a survey response.
	 */
	static async deleteResponse(responseId: string) {
		try {
			const response = await SurveyResponse.findByPk(responseId);
			if (!response) {
				return { success: false, message: 'Response not found', code: 310 };
			}
			await response.destroy();
			return { success: true, message: 'Survey response deleted successfully', code: 100 };
		} catch (error) {
			console.error('Delete Response Error:', error);
			return { success: false, message: 'Failed to delete survey response', code: 300 };
		}
	}
}

// ─── In-memory OTP store (use Redis in production) ───────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
