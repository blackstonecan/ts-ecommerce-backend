class CustomError {
    error: Error;
    status: number;

    constructor(error: Error, status: number = 500) {
        this.error = error;
        this.status = status;
    }

    static getWithMessage(errorText: string, status: number = 500) : CustomError {
        return new CustomError(new Error(errorText), status);
    }

    static getDefault() : CustomError {
        return new CustomError(new Error("An error occurred"), 500);
    }
}

export default CustomError;