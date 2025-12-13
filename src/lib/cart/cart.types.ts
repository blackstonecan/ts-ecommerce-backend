import { IProductItem } from "../product/product.types";

interface ICartItem {
    id: number;
    product: IProductItem;
    quantity: number;
    totalCents: number;
}

interface ICart {
    items: ICartItem[];
    totalQuantity: number;
    totalAmountCents: number;
}

export { ICartItem, ICart };
