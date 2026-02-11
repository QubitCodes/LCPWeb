import { Skill } from '../models';

export class SkillController {
  static async list() {
    const skills = await Skill.findAll({
      order: [['name', 'ASC']]
    });
    return { success: true, data: skills, code: 100 };
  }

  static async create(name: string) {
    const [skill, created] = await Skill.findOrCreate({
      where: { name },
      defaults: { name }
    });
    
    if (!created) {
      return { success: false, message: 'Skill already exists', code: 205, data: skill };
    }
    
    return { success: true, data: skill, code: 101 };
  }
}