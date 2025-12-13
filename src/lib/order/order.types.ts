import { OrderStatus, PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";

interface IOrderItem {
    id: number;
    productId: number;
    productName: string;
    productSlug: string;
    quantity: number;
    amountCents: number;
    totalCents: number;
}

interface IOrderAddress {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    neighbourhood: string;
    district: string;
    city: string;
    country: string;
}

interface IOrder {
    id: number;
    amountCents: number;
    status: OrderStatus;
    createdAt: Date;
    items: IOrderItem[];
    address: IOrderAddress;
    payment: {
        id: number;
        provider: PaymentProvider;
        status: PaymentStatus;
        amountCents: number;
    };
}

interface IOrderListItem {
    id: number;
    amountCents: number;
    status: OrderStatus;
    itemCount: number;
    createdAt: Date;
}

export {
    IOrderItem,
    IOrderAddress,
    IOrder,
    IOrderListItem
};
