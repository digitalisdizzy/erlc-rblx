class RemovedFromQueueError extends Error {
    constructor(wasQueueCleared){
        if(wasQueueCleared){
            super(`App's queue was cleared, removing this request from the queue`)
        } else {
            super(`Request was removed from the App's queue`)
        }
        this.wasQueueCleared = wasQueueCleared
    }
}

module.exports = RemovedFromQueueError