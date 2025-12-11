import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import Response from '@/lib/response/Response';
import { errorHandler } from '@/lib/error/errorHandler';

export const s3 = new S3Client({
    region: env.AWS_REGION,
    forcePathStyle: false,  // use virtual-hosted-style URLs
    endpoint: `https://s3.${env.AWS_REGION}.amazonaws.com`, // explicitly define the endpoint
    credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

export const putObject = async (params: {
    Key: string;
    Body: Buffer;
    ContentType: string;
}): Promise<Response<string>> => {
    try {
        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: params.Key,
            Body: params.Body,
            ContentType: params.ContentType,
            ACL: 'private' // keep it private
        });

        await s3.send(command);
        return Response.getSuccess(params.Key);
    } catch (error) {
        return errorHandler(error);
    }
};

export const getSignedS3Url = async (Key: string, expiresInSeconds = 60 * 60 * 24): Promise<Response<string>> => {
    try {
        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key
        });

        const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
        return Response.getSuccess(url);
    } catch (error) {
        return errorHandler(error);
    }
};

export const deleteS3Object = async (key: string): Promise<Response<null>> => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: key
        });

        await s3.send(command);

        return Response.getSuccess(null);
    } catch (error) {
        return errorHandler(error);
    }
};

export const headS3Object = async (key: string): Promise<Response<{
    contentType: string | undefined;
    contentLength: number;
    lastModified: Date | undefined;
    etag: string | undefined;
    metadata: Record<string, string> | undefined;
}>> => {
    try {
        const command = new HeadObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: key
        });
        const res = await s3.send(command);
        return Response.getSuccess({
            contentType: res.ContentType,
            contentLength: Number(res.ContentLength ?? 0),
            lastModified: res.LastModified,
            etag: res.ETag,
            metadata: res.Metadata
        });
    } catch (error) {
        return errorHandler(error);
    }
};

export const copyS3Object = async (params: {
    sourceKey: string;
    destinationKey: string;
    contentType?: string;
}): Promise<Response<null>> => {
    try {
        const command = new CopyObjectCommand({
            Bucket: env.AWS_S3_BUCKET,
            Key: params.destinationKey,
            CopySource: `${env.AWS_S3_BUCKET}/${params.sourceKey}`,
            ...(params.contentType
                ? { MetadataDirective: 'REPLACE', ContentType: params.contentType }
                : {})
        });
        await s3.send(command);
        return Response.getSuccess(null);
    } catch (error) {
        return errorHandler(error);
    }
};