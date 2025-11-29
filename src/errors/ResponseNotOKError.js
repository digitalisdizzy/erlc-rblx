class ResponseNotOKError extends Error {
    /**
     * 
     * @param {Response} response
     * @param {Object} body
     */
    constructor(response, body){
        super(`Received a response that did not have an OK status. Received ${response.status} (${response.statusText}), expected a response between 200-299.`)
        this.response = response
        this.body = body
        this.status = response.status
        this.statusText = response.statusText
        this.isServerError = response.status >= 500 && response.status < 600
        this.isClientError = response.status >= 400 && response.status < 500

        this.errorCode = body?.code
        this.errorText = body?.message
    }
}

module.exports = ResponseNotOKError