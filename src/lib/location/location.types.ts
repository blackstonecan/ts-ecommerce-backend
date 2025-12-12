interface ICountry {
    id: number;
    name: string;
    code: string;
}

interface ICountryExtended extends ICountry {
    cities: ICityExtended[];
}

interface ICity {
    id: number;
    name: string;
}

interface ICityExtended extends ICity {
    districts: IDistrictExtended[];
}

interface IDistrict {
    id: number;
    name: string;
}

interface IDistrictExtended extends IDistrict {
    neighbourhoods: INeighbourhood[];
}

interface INeighbourhood {
    id: number;
    name: string;
}

export {
    ICountry,
    ICity,
    IDistrict,
    INeighbourhood,
    ICountryExtended,
    ICityExtended,
    IDistrictExtended
};