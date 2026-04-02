import { Injectable, InternalServerErrorException, Logger, Version } from '@nestjs/common';
import { CreateMinioDto } from './dto/create-minio.dto';
import { UpdateMinioDto } from './dto/update-minio.dto';
import * as Minio from 'minio'
@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client
  private readonly bucketName: 'images'
  private readonly logger =  new Logger(MinioService.name)
  constructor() {
    this.minioClient = new Minio.Client({
      endPoint:'localhost',
      port:9000,
      useSSL:false,
      accessKey:'admin',
      secretKey:'admin1234'
    })
    this.initBucket()
  }
  private async initBucket(){
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName)
      if(!exists)
      {
        await this.minioClient.makeBucket(this.bucketName,'us-east-1')
        const policy={
          Statement: [
            {
              Action: ['s3:GetObject'],
              Effect: 'Allow',
              Principal: '*',
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        }
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket '${this.bucketName}' created successfully.`);
      }
    } catch (error) {
      this.logger.error('Error initializing MinIO bucket', error);
    }
  }
  async uploadFile(file: Express.Multer.File) {
    // Tạo tên file unique để tránh trùng lặp
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }, 
      );

  
      return {
        url: `http://localhost:9000/${this.bucketName}/${fileName}`,
      };
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw new InternalServerErrorException('Không thể upload ảnh lên hệ thống');
    }
  }
}
}
