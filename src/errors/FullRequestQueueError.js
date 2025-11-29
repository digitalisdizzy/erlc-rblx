class FullRequestQueueError extends Error {
    constructor(queueName, maxQueueLength){
        super(`The maximum request queue limit (${maxQueueLength}) for this queue (${queueName}) has been reached and further requests to it will be dropped.`)
        /** @type {number} The maximum length for the request queue that has been exceeded. */
        this.maxQueueLength = maxQueueLength
        /** @type {string} The name of the queue that is full */
        this.queueName = queueName
    }
}

module.exports = FullRequestQueueError