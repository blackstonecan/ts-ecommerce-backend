interface IAddressItem {
    id: number;
    name: string;
    country: string;
    city: string;
    addressLine1: string;
}

interface IAddress {
    id: number;
    name: string;
    country: string;
    city: string;
    district: string;
    neighbourhood: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
}

export { IAddressItem, IAddress };