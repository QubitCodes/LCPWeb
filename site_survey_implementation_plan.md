# Industry Details: Site Surveys & Categories

We need to enhance the reference module to allow viewing an Industry's detailed information, specifically giving it two tabs: **Site Surveys** and **Categories**. Each industry can have multiple site surveys linked to it, with one designated as the "validation survey".

## User Review Required

> [!IMPORTANT]
> **Question:** How would you like the system to identify which survey is the "validation survey" for an industry? 
> 
> Currently, `SurveyTemplate` has a `type` field (`SURVEY` or `QUIZ`). We have two options to distinguish validation surveys:
> 1. **Option A (Database Change)**: Add a straightforward boolean column `is_validation_survey` (default false) to the `SurveyTemplate` model.
> 2. **Option B (Naming Convention)**: No database changes. We just rely on the template name containing "Validation" (e.g. "LCP Site Validation Checklist").
> 
> *Option A is much more robust. If you choose Option A, I will create a migration to add this column.*

## Proposed Changes

### 1. Navigation & UI Updates
#### [MODIFY] `src/app/(portal)/admin/(protected)/settings/reference/[type]/page.tsx`
- When `type === 'industries'`, add a new **View (Eye icon)** button into the actions column of the data table.
- Clicking this button will route the user to `/admin/settings/reference/industries/[id]`.

### 2. New Detail Page
#### [NEW] `src/app/(portal)/admin/(protected)/settings/reference/industries/[id]/page.tsx`
- Create a new Next.js page component that reads the `[id]` parameter.
- Fetch the industry details via a new or existing backend call.
- Implement a 2-Tab Layout:
  1. **Site Surveys Tab**:
     - A data table mapping `SurveyTemplates` filtered by `industry_id`.
     - A button to "Create Site Survey" specifically for this industry.
     - A way to mark/identify the "Validation Survey" (based on the answer to the question above).
  2. **Categories Tab**:
     - A data table reusing category logic but strictly filtered to only show Categories where `industry_id === id`.

### 3. Backend Enhancements
#### [MODIFY] `src/controllers/SurveyController.ts` & `src/models/SurveyTemplate.ts`
- If **Option A** is chosen, update the `SurveyTemplate` model to include `is_validation_survey: boolean`.
- Ensure `SurveyController` passes `industry_id` and the new flag during template creation.

## Verification Plan
### Manual Verification
- Go to `/admin/settings/reference/industries`.
- Click the View button on an industry.
- Verify the tabs load correctly.
- Add a new Category under the Categories tab and verify it's linked.
- Add a new Survey under the Site Surveys tab and verify it appears.
