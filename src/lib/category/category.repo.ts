import { prisma, PrismaClient } from "@/config/prisma";

import Response from "@/lib/response/Response";
import { repoErrorHandler } from "@/lib/error/errorHandler";
import { ICategory } from "./category.types";
import CustomError from "../error/CustomError";

export const categoryRepo = {
    async list(db: PrismaClient = prisma): Promise<Response<ICategory[]>> {
        try {
            const categories = await db.category.findMany({
                select: {
                    id: true,
                    name: true,
                    image: {
                        select: {
                            key: true,
                        }
                    }
                }
            });

            const output: ICategory[] = [];

            for (const category of categories) {
                if (!category.image) throw CustomError.getWithMessage('Category image not found', 500);

                output.push({
                    id: category.id,
                    name: category.name,
                    imageUrl: category.image.key,
                });
            }

            return Response.getSuccess(output);
        } catch (error: any) {
            return repoErrorHandler(error);
        }
    },
}