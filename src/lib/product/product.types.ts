import { ICategory } from "../category/category.types";

interface IProductItem {
    id: number;
    name: string;
    slug: string;
    amountCents: number;
    haveStock: boolean;
    mainImageUrl: string;
}

interface IProduct extends IProductItem {
    description: string;
    imagesUrls: string[];
    category: ICategory;
}

export {
    IProductItem,
    IProduct
};