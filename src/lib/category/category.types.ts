import { IProductItem } from "../product/product.types";

interface ICategory {
    id: number;
    name: string;
    slug: string;
    imageUrl: string;
}

interface ICategoryWithProducts extends ICategory {
    products: IProductItem[];
}

export {
    ICategory,
    ICategoryWithProducts
};