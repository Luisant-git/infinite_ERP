import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    const baseUrl = process.env.UPLOAD_URL || 'http://localhost:3001/uploads';
    const timestamp = Date.now();
    return {
      filename: file.filename,
      url: `${baseUrl}/${file.filename}?t=${timestamp}`,
    };
  }

  @Delete('file')
  async deleteFile(@Body('url') url: string) {
    try {
      const filename = url.split('/').pop()?.split('?')[0];
      if (!filename) throw new Error('Invalid URL');
      const filePath = join('./uploads', filename);
      await unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
