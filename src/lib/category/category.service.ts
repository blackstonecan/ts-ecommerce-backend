import Response from '@/lib/response/Response';
import { errorHandler } from '@/lib/error/errorHandler';
import CustomError from '@/lib/error/CustomError';
import { uploadImage, UploadOut } from '@/lib/common/s3';
import { deleteS3Object } from '@/config/s3';
import { generateSlug } from '@/lib/common/slug';
import { categoryRepo } from './category.repo';

export const categoryService = {
    /**
     * Create a new category with image upload
     */
    async createCategory(data: {
        name: string;
        file: Express.Multer.File;
    }): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // 1. Generate slug from name
            const slug = generateSlug(data.name);

            // 2. Upload image to S3
            response = await uploadImage({
                buffer: data.file.buffer,
                mimetype: data.file.mimetype,
                size: data.file.size,
                originalname: data.file.originalname,
            });
            if (!response.success) throw response.error;

            const uploadData = response.data as UploadOut;

            // 3. Create category in database
            response = await categoryRepo.create({
                name: data.name,
                slug: slug,
                imageKey: uploadData.key,
                imageSize: uploadData.size,
                imageMimeType: uploadData.mime,
            });
            if (!response.success) throw response.error;

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    },

    /**
     * Update an existing category (name and/or image)
     */
    async updateCategory(data: {
        id: number;
        name?: string;
        file?: Express.Multer.File;
    }): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // Validate at least one field is being updated
            if (!data.name && !data.file) {
                throw CustomError.getWithMessage('At least one field (name or image) must be provided for update', 400);
            }

            // 1. Prepare update data
            const updateData: {
                id: number;
                name?: string;
                slug?: string;
                imageKey?: string;
                imageSize?: number;
                imageMimeType?: string;
            } = {
                id: data.id
            };

            // 2. Generate slug if name is provided
            if (data.name) {
                updateData.name = data.name;
                updateData.slug = generateSlug(data.name);
            }

            // 3. Upload new image if file is provided
            if (data.file) {
                response = await uploadImage({
                    buffer: data.file.buffer,
                    mimetype: data.file.mimetype,
                    size: data.file.size,
                    originalname: data.file.originalname,
                });
                if (!response.success) throw response.error;

                const uploadData = response.data as UploadOut;

                updateData.imageKey = uploadData.key;
                updateData.imageSize = uploadData.size;
                updateData.imageMimeType = uploadData.mime;
            }

            // 4. Update category in database
            response = await categoryRepo.update(updateData);
            if (!response.success) throw response.error;

            const { oldImageKey }: {
                oldImageKey?: string;
            } = response.data;

            // 5. Cleanup old S3 image (async, non-blocking)
            if (oldImageKey) {
                response = await deleteS3Object(oldImageKey);
                if (!response.success) throw response.error;
            }

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    },

    /**
     * Delete a category
     * Fails if category has products
     */
    async deleteCategory(id: number): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // Delete category from database (will fail if has products)
            response = await categoryRepo.delete(id);
            if (!response.success) throw response.error;

            const { imageKey }: { imageKey?: string } = response.data;

            // Cleanup S3 image if exists
            if (imageKey) {
                response = await deleteS3Object(imageKey);
                if (!response.success) throw response.error;
            }

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    }
};
