import type { Request, Response } from 'express';
import type { MediaService } from '../services/media.service.js';
import { AppError } from '../errors/app-error.js';

export class MediaController {
  constructor(private readonly service: MediaService) {}

  uploadImage = async (req: Request, res: Response) => {
    if (!req.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Image file is required');
    const result = await this.service.uploadImage({
      body: req.file.buffer,
      claimedMimeType: req.file.mimetype,
      originalName: req.file.originalname,
      folder: typeof req.body.folder === 'string' ? req.body.folder : undefined,
      userId: req.auth?.userId,
    });
    res.status(201).json({ success: true, data: result, requestId: req.requestId });
  };

  deleteAsset = async (req: Request, res: Response) => {
    await this.service.deleteAsset(req.params.id);
    res.status(204).end();
  };
}
