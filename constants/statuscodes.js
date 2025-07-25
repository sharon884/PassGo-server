const StatusCodes = {
    SUCCESS : 200 ,
    CREATED : 201 ,
    ACCEPTED : 202 ,

    BAD_REQUEST : 400 ,
    UNAUTHORIZED : 401 ,
    FORBIDDEN : 403 ,
    NOT_FOUND : 404 ,
    CONFLICT : 409,
    TOKEN_EXPIRED: 498, 
    TOO_MANY_REQUESTS : 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,


};

module.exports =  StatusCodes;
