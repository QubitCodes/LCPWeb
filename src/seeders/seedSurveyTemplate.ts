import {
	SurveyTemplate,
	SurveySection,
	SurveyQuestion,
	SurveyQuestionOption,
	sequelize,
} from '@/models';

/**
 * seedLcpSiteValidationChecklist — Seeds the "Initial Site Validation" template.
 *
 * This is the LCP (Labour Certification Program) Initial Site Validation Checklist,
 * matching the official document exactly with 9 sections (A through I).
 *
 * Sections:
 *   A. Site & Employer Details
 *   B. Workforce Snapshot (Mandatory)
 *   C. Trade / Job Role Breakdown
 *   D. Experience & Eligibility Filter
 *   E. Language & ID Readiness
 *   F. Supervisor & Employer Recommendation Readiness
 *   G. Assessment Feasibility Check
 *   H. Pilot Definition (Initial Only)
 *   I. LCP Readiness Decision
 *
 * Idempotent — skips if a template with the exact name already exists.
 * Also deletes any old "LCP Site Validation Checklist" template if present.
 */
export async function seedLcpSiteValidationChecklist() {
	const TEMPLATE_NAME = 'Initial Site Validation';
	const TEMPLATE_SLUG = 'lcp-site-visit';
	const OLD_TEMPLATE_NAME = 'LCP Site Validation Checklist';

	// ── Delete old template if it exists ──────────────────────
	const oldTemplate = await SurveyTemplate.findOne({ where: { name: OLD_TEMPLATE_NAME } });
	if (oldTemplate) {
		await oldTemplate.destroy({ force: true });
		console.log(`[Seed] Deleted old template "${OLD_TEMPLATE_NAME}".`);
	}

	// ── Idempotency: skip if already seeded (check by slug first, then name) ──
	const existing = await SurveyTemplate.findOne({ where: { slug: TEMPLATE_SLUG } })
		|| await SurveyTemplate.findOne({ where: { name: TEMPLATE_NAME } });
	if (existing) {
		console.log(`[Seed] Survey template "${TEMPLATE_NAME}" already exists. Skipping.`);
		return;
	}

	const transaction = await sequelize.transaction();

	try {
		// ── Template ─────────────────────────────────────────
		const template = await SurveyTemplate.create({
			name: TEMPLATE_NAME,
			slug: TEMPLATE_SLUG,
			description: 'Labour Certification Program (LCP) Initial Site Validation Checklist. Completed by the LCP team during the first site visit to assess employer readiness, workforce composition, and feasibility for pilot.',
			type: 'SURVEY',
			status: 'ACTIVE',
			is_system: true,
			created_by: null as any,
		}, { transaction });

		// ── Helper types ────────────────────────────────────
		type QType = 'TEXT' | 'NUMBER' | 'DECIMAL' | 'YES_NO' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'FILE_UPLOAD' | 'USER_SELECT' | 'DATA_SELECT';

		/** Helper: create section → questions → options */
		const createSection = async (
			sectionData: { name: string; description: string; sequence_order: number; is_wizard_step: boolean },
			questions: Array<{
				text: string;
				type: QType;
				is_required: boolean;
				sequence_order: number;
				config?: any;
				options?: Array<{ text: string; value: string; sequence_order: number }>;
			}>
		) => {
			const section = await SurveySection.create({
				template_id: template.id,
				...sectionData,
			}, { transaction });

			for (const q of questions) {
				const question = await SurveyQuestion.create({
					section_id: section.id,
					text: q.text,
					type: q.type,
					is_required: q.is_required,
					sequence_order: q.sequence_order,
					points: 0,
					config: q.config ? sequelize.literal(`CAST('${JSON.stringify(q.config).replace(/'/g, "\\'")}' AS JSON)`) : null,
				}, { transaction });

				if (q.options && q.options.length > 0) {
					await SurveyQuestionOption.bulkCreate(
						q.options.map(opt => ({
							question_id: question.id,
							text: opt.text,
							value: opt.value,
							is_correct: false,
							sequence_order: opt.sequence_order,
						})),
						{ transaction }
					);
				}
			}
		};

		// ═══════════════════════════════════════════════════════
		// SECTION A — SITE & EMPLOYER DETAILS
		// ═══════════════════════════════════════════════════════
		await createSection(
			{
				name: 'Site & Employer Details',
				description: 'Basic information about the site, employer, and inspection context.',
				sequence_order: 0,
				is_wizard_step: true,
			},
			[
				{ text: 'Site Name', type: 'TEXT', is_required: true, sequence_order: 0 },
				{ text: 'Site Location', type: 'TEXT', is_required: true, sequence_order: 1 },
				{
					text: 'Contractor / Company Name',
					type: 'DATA_SELECT',
					is_required: true,
					sequence_order: 2,
					config: { entity_type: 'COMPANY', prefill_mode: 'READONLY', scope_filter: true },
				},
				{
					text: 'Contractor Representative',
					type: 'DATA_SELECT',
					is_required: true,
					sequence_order: 3,
					config: { entity_type: 'USER', prefill_mode: 'EDITABLE', scope_filter: true },
				},
				{ text: 'Designation', type: 'TEXT', is_required: false, sequence_order: 4 },
				{ text: 'Contact Number', type: 'TEXT', is_required: false, sequence_order: 5 },
				{
					text: 'Site Supervisor / In-Charge',
					type: 'DATA_SELECT',
					is_required: true,
					sequence_order: 6,
					config: { entity_type: 'USER', prefill_mode: 'EDITABLE', scope_filter: true },
				},
				{
					text: 'Project Stage',
					type: 'SELECT',
					is_required: true,
					sequence_order: 7,
					options: [
						{ text: 'Foundation', value: 'FOUNDATION', sequence_order: 0 },
						{ text: 'Structure', value: 'STRUCTURE', sequence_order: 1 },
						{ text: 'Masonry', value: 'MASONRY', sequence_order: 2 },
						{ text: 'Finishing', value: 'FINISHING', sequence_order: 3 },
						{ text: 'MEP', value: 'MEP', sequence_order: 4 },
					],
				},
				{ text: 'Expected Project Duration (Months)', type: 'NUMBER', is_required: false, sequence_order: 8 },
				{
					text: 'Date of Site Visit',
					type: 'DATE',
					is_required: true,
					sequence_order: 9,
					config: { default_today: true },
				},
				{
					text: 'LCP Team Member',
					type: 'DATA_SELECT',
					is_required: true,
					sequence_order: 10,
					config: { entity_type: 'USER', prefill_mode: 'EDITABLE', scope_filter: false },
				},
			]
		);

		// ═══════════════════════════════════════════════════════
		// SECTION B — WORKFORCE SNAPSHOT (MANDATORY)
		// ═══════════════════════════════════════════════════════
		await createSection(
			{
				name: 'Workforce Snapshot',
				description: 'Mandatory workforce size overview. Rule: Only skilled workers move forward for LCP.',
				sequence_order: 1,
				is_wizard_step: true,
			},
			[
				{ text: 'Total Workers on Site', type: 'NUMBER', is_required: true, sequence_order: 0 },
				{ text: 'Skilled Workers (LCP Eligible)', type: 'NUMBER', is_required: true, sequence_order: 1 },
				{ text: 'Semi-Skilled / Helpers', type: 'NUMBER', is_required: false, sequence_order: 2 },
				{ text: 'Supervisors / Charge Hands', type: 'NUMBER', is_required: false, sequence_order: 3 },
				{ text: 'Peak Workforce (Next 2-3 Months)', type: 'NUMBER', is_required: false, sequence_order: 4 },
			]
		);

		// ═══════════════════════════════════════════════════════
		// SECTION C — TRADE / JOB ROLE BREAKDOWN
		// ═══════════════════════════════════════════════════════
		// Each trade has 3 sub-fields: Current Workers, Expected in 30 Days, Avg Experience (Years)
		// Pilot Rule: Trades with fewer than 5 workers should not be included.
		const trades = [
			'Mason', 'Shuttering Carpenter', 'Steel Fixer', 'Electrician',
			'Plumber', 'Welder', 'Painter', 'HVAC / MEP Technician', 'Other (Specify)',
		];
		const tradeQuestions: Array<{
			text: string;
			type: QType;
			is_required: boolean;
			sequence_order: number;
			config?: any;
			options?: Array<{ text: string; value: string; sequence_order: number }>;
		}> = [];
		let seq = 0;
		for (const trade of trades) {
			tradeQuestions.push(
				{ text: `Current Workers`, type: 'NUMBER', is_required: false, sequence_order: seq++, config: { group: trade } },
				{ text: `Expected in 30 Days`, type: 'NUMBER', is_required: false, sequence_order: seq++, config: { group: trade } },
				{ text: `Avg Experience (Years)`, type: 'DECIMAL', is_required: false, sequence_order: seq++, config: { group: trade } },
			);
		}

		await createSection(
			{
				name: 'Trade / Job Role Breakdown',
				description: 'Per-trade workforce details. Pilot Rule: Trades with fewer than 5 workers should not be included.',
				sequence_order: 2,
				is_wizard_step: true,
			},
			tradeQuestions
		);

		// ═══════════════════════════════════════════════════════
		// SECTION D — EXPERIENCE & ELIGIBILITY FILTER
		// ═══════════════════════════════════════════════════════
		await createSection(
			{
				name: 'Experience & Eligibility Filter',
				description: 'Assess the experience depth and eligibility of workers on site.',
				sequence_order: 3,
				is_wizard_step: true,
			},
			(() => {
				const eligParams = [
					'Workers with 1+ year experience',
					'Workers with 3+ years experience',
					'Experience verifiable by supervisor',
					'Frequent trade switching observed',
				];
				const qs: typeof tradeQuestions = [];
				let s = 0;
				for (const p of eligParams) {
					qs.push(
						// { text: p, type: 'YES_NO', is_required: true, sequence_order: s++, config: { group: p }, options: [{ text: 'Yes', value: 'YES', sequence_order: 0 }, { text: 'No', value: 'NO', sequence_order: 1 }] },
						{ text: `Count`, type: 'NUMBER', is_required: false, sequence_order: s++, config: { group: p } },
						{ text: `Remarks`, type: 'TEXT', is_required: false, sequence_order: s++, config: { group: p } },
					);
				}
				return qs;
			})()
		);

		// ═══════════════════════════════════════════════════════
		// SECTION E — LANGUAGE & ID READINESS
		// ═══════════════════════════════════════════════════════
		// Hard Stop: No ID + no mobile = no LCP certificate.
		const langParams = [
			'Malayalam - speaking workers',
			'Hindi - speaking workers',
			'Tamil - speaking workers',
			'Odia - speaking workers',
			'Bengali - speaking workers',
			'Workers with Govt ID (Aadhaar / Other)',
			'Workers with active mobile numbers',
			'Digital certificate delivery feasible',
		];
		const langQuestions: typeof tradeQuestions = [];
		let langSeq = 0;
		for (const param of langParams) {
			langQuestions.push(
				{ text: 'Exists', type: 'YES_NO', is_required: false, sequence_order: langSeq++, config: { group: param }, options: [{ text: 'Yes', value: 'YES', sequence_order: 0 }, { text: 'No', value: 'NO', sequence_order: 1 }] },
				{ text: `Details`, type: 'TEXT', is_required: false, sequence_order: langSeq++, config: { group: param } },
			);
		}

		await createSection(
			{
				name: 'Language & ID Readiness',
				description: 'Language composition and identification readiness. Hard Stop: No ID + no mobile = no LCP certificate.',
				sequence_order: 4,
				is_wizard_step: true,
			},
			langQuestions
		);

		// ═══════════════════════════════════════════════════════
		// SECTION F — SUPERVISOR & EMPLOYER RECOMMENDATION READINESS
		// ═══════════════════════════════════════════════════════
		const supParams = [
			'Supervisor present daily on site',
			'Supervisor willing to verify experience',
			'Supervisor willing to sign recommendation',
			'Employer understands LCP is not training/license',
			'Certificate validity (Project / 1 Year) agreed',
		];
		const supQuestions: typeof tradeQuestions = [];
		let supSeq = 0;
		for (const param of supParams) {
			supQuestions.push(
				{ text: param, type: 'YES_NO', is_required: true, sequence_order: supSeq++, config: { group: param }, options: [{ text: 'Yes', value: 'YES', sequence_order: 0 }, { text: 'No', value: 'NO', sequence_order: 1 }] },
				{ text: `Remarks`, type: 'TEXT', is_required: false, sequence_order: supSeq++, config: { group: param } },
			);
		}

		await createSection(
			{
				name: 'Supervisor & Employer Recommendation Readiness',
				description: 'Verifies supervisor availability and employer understanding of LCP.',
				sequence_order: 5,
				is_wizard_step: true,
			},
			supQuestions
		);

		// ═══════════════════════════════════════════════════════
		// SECTION G — ASSESSMENT FEASIBILITY CHECK
		// ═══════════════════════════════════════════════════════
		const assessParams = [
			'Assessment possible during live work',
			'10-15 workers assessable in 2-3 hours',
			'Safe observation area available',
			'Assessment will not disrupt productivity',
		];
		const assessQuestions: typeof tradeQuestions = [];
		let assessSeq = 0;
		for (const param of assessParams) {
			assessQuestions.push(
				{ text: param, type: 'YES_NO', is_required: true, sequence_order: assessSeq++, config: { group: param }, options: [{ text: 'Yes', value: 'YES', sequence_order: 0 }, { text: 'No', value: 'NO', sequence_order: 1 }] },
				{ text: `Remarks`, type: 'TEXT', is_required: false, sequence_order: assessSeq++, config: { group: param } },
			);
		}

		await createSection(
			{
				name: 'Assessment Feasibility Check',
				description: 'Determines whether on-site skill assessment is practical.',
				sequence_order: 6,
				is_wizard_step: true,
			},
			assessQuestions
		);

		// ═══════════════════════════════════════════════════════
		// SECTION H — PILOT DEFINITION (INITIAL ONLY)
		// ═══════════════════════════════════════════════════════
		await createSection(
			{
				name: 'Pilot Definition',
				description: 'Initial pilot parameters — size, trades, timeline, and cost model.',
				sequence_order: 7,
				is_wizard_step: true,
			},
			[
				// { text: `Count`, type: 'NUMBER', is_required: false, sequence_order: s++, config: { group: p } },
				{
					text: 'Proposed Pilot Size',
					type: 'NUMBER',
					is_required: true,
					sequence_order: 0,
				},
				{ text: 'Trades Selected for Pilot', type: 'TEXT', is_required: false, sequence_order: 1 },
				{ text: 'Tentative Pilot Date', type: 'DATE', is_required: false, sequence_order: 2 },
				{
					text: 'Preferred Cost Model',
					type: 'SELECT',
					is_required: true,
					sequence_order: 3,
					options: [
						{ text: 'Employer', value: 'EMPLOYER', sequence_order: 0 },
						{ text: 'Shared', value: 'SHARED', sequence_order: 1 },
						{ text: 'Deferred', value: 'DEFERRED', sequence_order: 2 },
					],
				},
				{ text: 'Supervisor Assigned for Pilot', type: 'TEXT', is_required: false, sequence_order: 4 },
			]
		);

		// ═══════════════════════════════════════════════════════
		// SECTION I — LCP READINESS DECISION
		// ═══════════════════════════════════════════════════════
		await createSection(
			{
				name: 'LCP Readiness Decision',
				description: 'Final decision on site readiness for the LCP pilot.',
				sequence_order: 8,
				is_wizard_step: true,
			},
			[
				{
					text: 'Decision',
					type: 'SELECT',
					is_required: true,
					sequence_order: 0,
					options: [
						{ text: 'LCP-READY (Proceed with Pilot)', value: 'LCP_READY', sequence_order: 0 },
						{ text: 'CONDITIONAL (Minor Prep Required)', value: 'CONDITIONAL', sequence_order: 1 },
						{ text: 'NOT READY (Revisit Later)', value: 'NOT_READY', sequence_order: 2 },
					],
				},
				{ text: 'Reason / Notes', type: 'TEXT', is_required: false, sequence_order: 1 },
			]
		);

		await transaction.commit();
		console.log(`[Seed] Survey template "${TEMPLATE_NAME}" seeded successfully (9 sections, A-I).`);

	} catch (error) {
		await transaction.rollback();
		console.error('[Seed] Survey template seed error:', error);
		throw error;
	}
}
