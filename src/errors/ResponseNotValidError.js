class ResponseNotValidError extends Error {
    constructor(message){
        super(`Response received from server was not what was expected: ${message}`)
    }
}

module.exports = ResponseNotValidError