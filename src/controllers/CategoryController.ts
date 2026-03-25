import { Category } from '../models';

export class CategoryController {
  static async list() {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
      include: ['industry']
    });
    return { success: true, data: categories, code: 100 };
  }

  static async create(name: string, industry_id: number | undefined | null, description: string) {
    const data: any = { name, description };
    if (industry_id) {
      data.industry_id = industry_id;
    }
    const category = await Category.create(data);
    return { success: true, data: category, code: 101 };
  }
}