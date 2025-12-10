class Respond{
    success: boolean;
    statusCode: number;
    data: any;
    message: string;

    constructor(success: boolean, statusCode: number, data: any, message: string) {
        this.success = success;
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}

export default Respond;