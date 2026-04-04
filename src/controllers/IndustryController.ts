import { Industry, Category, IndustryProjectStage } from '../models';
import { sendResponse } from '../utils/responseHandler';

export class IndustryController {
  
  static async list() {
    try {
      const industries = await (Industry as any).findAll({
        where: { is_active: true },
        include: [
          { model: Category, as: 'categories', attributes: ['id'] },
          { model: IndustryProjectStage, as: 'project_stages', attributes: ['id'] }
        ],
        order: [['name', 'ASC']]
      });
      // Filter out industries that lack either categories or project stages
      const filteredIndustries = industries.filter((ind: any) => 
        (ind.categories && ind.categories.length > 0) && 
        (ind.project_stages && ind.project_stages.length > 0)
      );
      return { success: true, data: filteredIndustries };
    } catch (error) {
      console.error('Error fetching industries:', error);
      return { success: false, message: 'Failed to fetch industries' };
    }
  }

  // Internal seeder method (to be called via a script or init route)
  static async seed() {
    const initialIndustries = [
      'Construction',
      'Manufacturing',
      'Transportation & Logistics',
      'Healthcare',
      'Information Technology',
      'Retail',
      'Hospitality',
      'Education'
    ];

    for (const name of initialIndustries) {
      await (Industry as any).findOrCreate({
        where: { name },
        defaults: { is_active: true }
      });
    }
    return { success: true, message: 'Industries seeded' };
  }
}
