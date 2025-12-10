import { ICategory } from "../category/category.types";

interface IProductItem {
    id: number;
    name: string;
    mainImageUrl: string;
    amountCents: number;
    haveStock: boolean;
    slug: string;
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