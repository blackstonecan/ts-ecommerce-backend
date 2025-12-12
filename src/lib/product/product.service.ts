import Response from '@/lib/response/Response';
import { errorHandler } from '@/lib/error/errorHandler';
import CustomError from '@/lib/error/CustomError';
import { uploadImage, UploadOut } from '@/lib/common/s3';
import { deleteS3Object } from '@/config/s3';
import { generateSlug } from '@/lib/common/slug';
import { productRepo } from './product.repo';

export const productService = {
    /**
     * Create a new product with images
     */
    async addProduct(data: {
        name: string;
        description: string;
        amountCents: number;
        stock: number;
        categoryId: number;
        mainImageFile: Express.Multer.File;
        additionalImagesFiles?: Express.Multer.File[];
    }): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // 1. Generate slug from name
            const slug = generateSlug(data.name);

            // 2. Upload main image to S3
            response = await uploadImage({
                buffer: data.mainImageFile.buffer,
                mimetype: data.mainImageFile.mimetype,
                size: data.mainImageFile.size,
                originalname: data.mainImageFile.originalname,
            });
            if (!response.success) throw response.error;

            const mainImageData = response.data as UploadOut;

            // 3. Upload additional images to S3 (if any)
            const additionalImagesData: UploadOut[] = [];
            if (data.additionalImagesFiles && data.additionalImagesFiles.length > 0) {
                for (const file of data.additionalImagesFiles) {
                    response = await uploadImage({
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        size: file.size,
                        originalname: file.originalname,
                    });
                    if (!response.success) throw response.error;
                    additionalImagesData.push(response.data as UploadOut);
                }
            }

            // 4. Create product in database
            response = await productRepo.create({
                name: data.name,
                description: data.description,
                amountCents: data.amountCents,
                stock: data.stock,
                slug: slug,
                categoryId: data.categoryId,
                mainImage: {
                    key: mainImageData.key,
                    size: mainImageData.size,
                    mimeType: mainImageData.mime,
                },
                additionalImages: additionalImagesData.map(img => ({
                    key: img.key,
                    size: img.size,
                    mimeType: img.mime,
                })),
            });
            if (!response.success) throw response.error;

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    },

    /**
     * Update an existing product
     */
    async updateProduct(data: {
        id: number;
        name?: string;
        description?: string;
        amountCents?: number;
        stock?: number;
        categoryId?: number;
        mainImageFile?: Express.Multer.File;
        additionalImagesFiles?: Express.Multer.File[];
        imageIdsToRemove?: number[];
    }): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // Validate at least one field is being updated
            if (!data.name && !data.description && data.amountCents === undefined &&
                data.stock === undefined && !data.categoryId && !data.mainImageFile &&
                (!data.additionalImagesFiles || data.additionalImagesFiles.length === 0) &&
                (!data.imageIdsToRemove || data.imageIdsToRemove.length === 0)) {
                throw CustomError.getWithMessage('At least one field must be provided for update', 400);
            }

            // 1. Prepare update data
            const updateData: {
                id: number;
                name?: string;
                description?: string;
                amountCents?: number;
                stock?: number;
                slug?: string;
                categoryId?: number;
                mainImage?: {
                    key: string;
                    size: number;
                    mimeType: string;
                };
                additionalImages?: {
                    key: string;
                    size: number;
                    mimeType: string;
                }[];
                imageIdsToRemove?: number[];
            } = {
                id: data.id
            };

            // 2. Set basic fields if provided
            if (data.name) {
                updateData.name = data.name;
                updateData.slug = generateSlug(data.name);
            }
            if (data.description) updateData.description = data.description;
            if (data.amountCents !== undefined) updateData.amountCents = data.amountCents;
            if (data.stock !== undefined) updateData.stock = data.stock;
            if (data.categoryId) updateData.categoryId = data.categoryId;

            // 3. Upload new main image if file is provided
            if (data.mainImageFile) {
                response = await uploadImage({
                    buffer: data.mainImageFile.buffer,
                    mimetype: data.mainImageFile.mimetype,
                    size: data.mainImageFile.size,
                    originalname: data.mainImageFile.originalname,
                });
                if (!response.success) throw response.error;

                const mainImageData = response.data as UploadOut;

                updateData.mainImage = {
                    key: mainImageData.key,
                    size: mainImageData.size,
                    mimeType: mainImageData.mime,
                };
            }

            // 4. Upload additional images if files are provided
            if (data.additionalImagesFiles && data.additionalImagesFiles.length > 0) {
                const additionalImagesData: UploadOut[] = [];
                for (const file of data.additionalImagesFiles) {
                    response = await uploadImage({
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        size: file.size,
                        originalname: file.originalname,
                    });
                    if (!response.success) throw response.error;
                    additionalImagesData.push(response.data as UploadOut);
                }

                updateData.additionalImages = additionalImagesData.map(img => ({
                    key: img.key,
                    size: img.size,
                    mimeType: img.mime,
                }));
            }

            // 5. Set image IDs to remove if provided
            if (data.imageIdsToRemove && data.imageIdsToRemove.length > 0) {
                updateData.imageIdsToRemove = data.imageIdsToRemove;
            }

            // 6. Update product in database
            response = await productRepo.update(updateData);
            if (!response.success) throw response.error;

            const { oldMainImageKey, removedImageKeys }: {
                oldMainImageKey?: string;
                removedImageKeys?: string[];
            } = response.data;

            // 7. Cleanup old main image from S3 if replaced
            if (oldMainImageKey) {
                response = await deleteS3Object(oldMainImageKey);
                if (!response.success) throw response.error;
            }

            // 8. Cleanup removed images from S3
            if (removedImageKeys && removedImageKeys.length > 0) {
                for (const key of removedImageKeys) {
                    response = await deleteS3Object(key);
                    if (!response.success) throw response.error;
                }
            }

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    },

    /**
     * Delete a product
     * Fails if product has orderItems
     */
    async deleteProduct(id: number): Promise<Response<null>> {
        try {
            let response: Response<any>;

            // Delete product from database (will fail if has orderItems)
            response = await productRepo.delete(id);
            if (!response.success) throw response.error;

            const { mainImageKey, imageKeys }: {
                mainImageKey?: string;
                imageKeys?: string[];
            } = response.data;

            // Cleanup main image from S3 if exists
            if (mainImageKey) {
                response = await deleteS3Object(mainImageKey);
                if (!response.success) throw response.error;
            }

            // Cleanup additional images from S3 if exist
            if (imageKeys && imageKeys.length > 0) {
                for (const key of imageKeys) {
                    response = await deleteS3Object(key);
                    if (!response.success) throw response.error;
                }
            }

            return Response.getSuccess(null);
        } catch (error) {
            return errorHandler(error);
        }
    }
};
