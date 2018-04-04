class API {
    errorResponse (errorMessage, statusCode = 500) {
        return {
            statusCode,
            errorMessage,
            data: []
        }
    }

    successResponse (data) {
        return {
            statusCode: 200,
            errorMessage: "",
            data
        }
    }
}

module.exports = API