import { Category } from '../models';

export class CategoryController {
  static async list() {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    return { success: true, data: categories, code: 100 };
  }

  static async create(name: string, description: string) {
    const category = await Category.create({ name, description });
    return { success: true, data: category, code: 101 };
  }
}