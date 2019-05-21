export interface ErrorMessage {
    message: string;
}

export function isErrorMessage<T>(x: ErrorMessage | T): x is ErrorMessage {
    return (x as ErrorMessage).message !== undefined;
}
