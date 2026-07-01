import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { PresignDto } from './dto/presign.dto';

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class UploadsService {
  private client: S3Client | null = null;

  private config() {
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET,
      R2_PUBLIC_BASE_URL,
    } = process.env;
    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET ||
      !R2_PUBLIC_BASE_URL
    ) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured (set R2_* env vars). Text-only posts still work.',
      );
    }
    return {
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      publicBase: R2_PUBLIC_BASE_URL.replace(/\/+$/, ''),
    };
  }

  private getClient(cfg: ReturnType<UploadsService['config']>): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  async presign(dto: PresignDto) {
    const ext = ALLOWED[dto.contentType];
    if (!ext) {
      throw new BadRequestException('Unsupported image type');
    }
    const cfg = this.config();
    const key = `posts/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.getClient(cfg), command, {
      expiresIn: 300,
    });
    return { uploadUrl, publicUrl: `${cfg.publicBase}/${key}`, key };
  }
}
