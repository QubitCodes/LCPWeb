export type WorkflowStep = {
	id: string;
	label: string;
	isOptional?: boolean;
};

export type WorkflowSection = {
	id: string;
	label: string;
	renderAs?: 'list' | 'flowchart';
	items: WorkflowNode[];
};

export type WorkflowNode = {
	id: string;
	label: string;
	type: 'category' | 'workflow';
	children?: WorkflowNode[];
	sections?: WorkflowSection[];
	steps?: WorkflowStep[];
	renderChildrenAs?: 'list' | 'flowchart';
};

export const WORKFLOWS_DATA: WorkflowNode[] = [
	{
		id: 'admins',
		label: 'Admins',
		type: 'category',
		sections: [
			{
				id: 'admin_core',
				label: 'Core Administration',
				renderAs: 'list',
				items: [
					{
						id: 'admin_company_registration',
						label: 'Company Registration',
						type: 'workflow',
						steps: [
							{ id: 'acr_1', label: 'Company submits application' },
							{ id: 'acr_2', label: 'Admin reviews details and documents' },
							{ id: 'acr_3', label: 'Admin approves or rejects company' },
							{ id: 'acr_4', label: 'If approved, automated welcome email sent to Super Admin' }
						]
					},
					{
						id: 'admin_manage_users',
						label: 'Manage Admin Users',
						type: 'workflow',
						steps: [
							{ id: 'amu_1', label: 'Admin navigates to Users module' },
							{ id: 'amu_2', label: 'Clicks Add User' },
							{ id: 'amu_3', label: 'Fills user details and assigns role (Admin/Supervisor)' },
							{ id: 'amu_4', label: 'System sends OTP/password via email' }
						]
					}
				]
			},
			{
				id: 'admin_setup',
				label: 'System Setup',
				renderAs: 'list',
				items: [
					{
						id: 'admin_job_roles',
						label: 'Job Roles & Categories',
						type: 'workflow',
						steps: [
							{ id: 'ajr_1', label: 'Navigate to System Reference settings' },
							{ id: 'ajr_2', label: 'Add/Edit Industry categories' },
							{ id: 'ajr_3', label: 'Create specific Job Roles under Industries' }
						]
					},
					{
						id: 'admin_courses',
						label: 'Course Management',
						type: 'workflow',
						steps: [
							{ id: 'ac_1', label: 'Admin clicks Add Course' },
							{ id: 'ac_2', label: 'Selects target Job and assigns Title' },
							{ id: 'ac_3', label: 'Adds Course Levels (Level 1, Level 2, etc.)' },
							{ id: 'ac_4', label: 'Uploads Content Items (Videos/PDFs) to Levels' },
							{ id: 'ac_5', label: 'Publishes the Course' }
						]
					},
					{
						id: 'admin_surveys',
						label: 'Survey Management',
						type: 'workflow',
						steps: [
							{ id: 'as_1', label: 'Admin creates Survey Template' },
							{ id: 'as_2', label: 'Adds Survey Sections' },
							{ id: 'as_3', label: 'Creates Questions within Sections' },
							{ id: 'as_4', label: 'Activates Survey for users' }
						]
					}
				]
			},
			{
				id: 'admin_finances',
				label: 'Financials',
				renderAs: 'list',
				items: [
					{
						id: 'admin_payments',
						label: 'Payment Management',
						type: 'workflow',
						steps: [
							{ id: 'ap_1', label: 'Supervisors purchase courses generating Pending Orders' },
							{ id: 'ap_2', label: 'Admin navigates to Payments module' },
							{ id: 'ap_3', label: 'Admin verifies Bank Transfer receipts manually' },
							{ id: 'ap_4', label: 'Admin marks Payment as Approved' },
							{ id: 'ap_5', label: 'System automatically enacts course Enrollments' }
						]
					}
				]
			}
		]
	},
	{
		id: 'supervisors',
		label: 'Supervisors',
		type: 'category',
		sections: [
			{
				id: 'sup_core_flow',
				label: 'Core Execution Flow',
				renderAs: 'flowchart',
				items: [
					{
						id: 'sup_admin_reg',
						label: 'Admin Supervisor Registration',
						type: 'workflow',
						steps: [
							{ id: 'sar_1', label: 'Enter Phone Number through Firebase Auth popup' },
							{ id: 'sar_2', label: 'Verify 6-digit SMS OTP' },
							{ id: 'sar_3', label: 'System validates phone is unregistered' },
							{ id: 'sar_4', label: 'Enter Personal Details (First Name, Last Name, Email)' },
							{ id: 'sar_5', label: 'System creates profile as ADMIN_SUPERVISOR' },
							{ id: 'sar_6', label: 'Auto-generates JWT token mapping to Onboarding Phase' }
						]
					},
					{
						id: 'sup_comp_onboarding',
						label: 'Company Onboarding',
						type: 'workflow',
						steps: [
							{ id: 'sco_1', label: 'Enter Company Name, Industry, and Contact info' },
							{ id: 'sco_2', label: 'System generates unique 6-digit integer Company ID' },
							{ id: 'sco_3', label: 'Company Database Model created (Status: PENDING)' },
							{ id: 'sco_4', label: 'Links User mapping dynamically to newly created Company UUID' },
							{ id: 'sco_5', label: 'Enter First Working Site Name & Location details' },
							{ id: 'sco_6', label: 'Finalize Onboarding. Administrator receives request to verify tenant' }
						]
					},
					{
						id: 'sup_login',
						label: 'Login (Mobile App)',
						type: 'workflow',
						steps: [
							{ id: 'sl_1', label: 'Open Mobile App and select Supervisor role (if prompted)' },
							{ id: 'sl_2', label: 'Enter Phone Number' },
							{ id: 'sl_3', label: 'Receive OTP via Firebase/SMS' },
							{ id: 'sl_4', label: 'Authenticate into Supervisor Mobile Dashboard' }
						]
					},
					{
						id: 'sup_add_emp',
						label: 'Add Employees',
						type: 'workflow',
						steps: [
							{ id: 'sae_1', label: 'Navigate to "Workers" tab in the Mobile App' },
							{ id: 'sae_2', label: 'Tap "Add Worker" button to open Form' },
							{ id: 'sae_3', label: 'Enter Employee First Name, Last Name, and Role' },
							{ id: 'sae_4', label: 'Enter Employee Phone Number (Required for their Firebase Login)' },
							{ id: 'sae_5', label: 'System generates "WORKER" user bound to the current Company ID' }
						]
					},
					{
						id: 'sup_assign_courses',
						label: 'Assign / Purchase Courses',
						type: 'workflow',
						steps: [
							{ id: 'sac_1', label: 'Navigate to "Recommendations" or "Enrollments" module in App' },
							{ id: 'sac_2', label: 'Select Target Course to assign' },
							{ id: 'sac_3', label: 'Multi-Select Specific Course Levels (e.g. Level 1, Level 2)' },
							{ id: 'sac_4', label: 'Search and Multi-Select specific Employees to Enroll' },
							{ id: 'sac_5', label: 'System calculates Unit price x Employees x Levels chosen' },
							{ id: 'sac_6', label: 'Choose Method: "Assign Directly" (if Free) OR "Checkout via Payment"' },
							{ id: 'sac_7', label: 'If Payment: Creates Order Invoice, awaits Admin Bank Receipt validation' }
						]
					}
				]
			},
			{
				id: 'sup_other_actions',
				label: 'Miscellaneous Actions',
				renderAs: 'list',
				items: [
					{
						id: 'sup_change_company',
						label: 'Change Assigned Company',
						type: 'workflow',
						steps: [
							{ id: 'scc_1', label: 'Navigate to Profile Settings' },
							{ id: 'scc_2', label: 'Select "Change Company"' },
							{ id: 'scc_3', label: 'Enter new 6-Digit Company ID Code' },
							{ id: 'scc_4', label: 'Submit request for Admin Approval' },
							{ id: 'scc_5', label: 'Admin approves shifting Supervisor to new Tenant' }
						]
					},
					{
						id: 'sup_site_signoffs',
						label: 'Practical Signoffs',
						type: 'workflow',
						steps: [
							{ id: 'sso_1', label: 'Receive notification that Worker completed Theory' },
							{ id: 'sso_2', label: 'Navigate to Pending Signoffs panel' },
							{ id: 'sso_3', label: 'Record video or provide Signature confirmation' },
							{ id: 'sso_4', label: 'Submit verification, generating Digital Certificate' }
						]
					}
				]
			}
		]
	},
	{
		id: 'workers',
		label: 'Workers',
		type: 'category',
		sections: [
			{
				id: 'work_core',
				label: 'Worker Journey Flow',
				renderAs: 'flowchart',
				items: [
					{
						id: 'work_onboarding',
						label: 'Account Access (Mobile App)',
						type: 'workflow',
						steps: [
							{ id: 'wo_1', label: 'Supervisor creates Worker account' },
							{ id: 'wo_2', label: 'Worker downloads the shared mobile app' },
							{ id: 'wo_3', label: 'Worker receives login OTP via Phone SMS/Firebase' },
							{ id: 'wo_4', label: 'Worker logs in on Mobile Dashboard' }
						]
					},
					{
						id: 'work_learning',
						label: 'Course Execution',
						type: 'workflow',
						steps: [
							{ id: 'wl_1', label: 'Worker taps assigned Course' },
							{ id: 'wl_2', label: 'Watches Video modules sequentially' },
							{ id: 'wl_3', label: 'Completes theoretical learning thresholds (Min view time)' },
							{ id: 'wl_4', label: 'Takes Survey/Quizzes for each Module to pass' }
						]
					},
					{
						id: 'work_completion',
						label: 'Certification Generation',
						type: 'workflow',
						steps: [
							{ id: 'wc_1', label: 'Worker completes all theoretical content' },
							{ id: 'wc_2', label: 'Requests Supervisor Practical Signoff' },
							{ id: 'wc_3', label: 'Supervisor validates via OTP or Drawing Signature' },
							{ id: 'wc_4', label: 'Generates Digital Certificate' }
						]
					}
				]
			}
		]
	}
];
