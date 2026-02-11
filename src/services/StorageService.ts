import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  
  private static UPLOAD_DIR = path.join(process.cwd(), 'file_uploads');

  static async upload(file: File, folder: string = 'misc'): Promise<string> {
    // Ensure directory exists
    const targetDir = path.join(this.UPLOAD_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate safe filename
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, filename);

    // Write file
    fs.writeFileSync(filePath, buffer);

    // Return relative path for DB storage
    return `/${folder}/${filename}`;
  }

  static getFilePath(relativePath: string): string | null {
    const fullPath = path.join(this.UPLOAD_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }
}