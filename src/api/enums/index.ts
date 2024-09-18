export enum ResponseStatus {
    CONTINUE = 100,
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
}


export enum Pagination {
    DEFAULT_PAGE_NUMBER = 1,
    DEFAULT_PAGE_SIZE = 20
}


export enum TransactionType {
    TRANSFER = "transfer",
    FUNDING = "funding"
}


export enum TransactionStatus {
    SUCCESS = "success",
    FAILED = "failed",
    PENDING = "pending",
    ONGOING = "on-going",
    REVERSED = "reversed",
    AWAITING_CONFIRMATION = "awaiting-confirmation",
    NEW = "new",
}

export enum GLAccount {
    CUSTOMER_FUNDING = "001",
    CUSTOMER_WITHDRAWAL = "002"
}