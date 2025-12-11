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

interface IProductForAdmin extends IProductItem {
    stock: number;
    images: {
        id: number;
        url: string;
    }[];
    category: ICategory;
    description: string;
}

export {
    IProductItem,
    IProduct,
    IProductForAdmin
};