import { Industry } from '../models';
import { sendResponse } from '../utils/responseHandler';

export class IndustryController {
  
  static async list() {
    try {
      const industries = await (Industry as any).findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      return { success: true, data: industries };
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
