const EventEmitter = require("node:events")
const {ResponseNotOKError, ResponseNotValidError, FullRequestQueueError, RemovedFromQueueError} = require("../errors")
const PrivateServer = require("./PrivateServer")

/**
 * Fires when a request throws an error whilst processing the queue
 * @event App#errorInQueue
 * @type {Error}
 */

/**
 * @typedef {Object} PrivateServerRequestHeaders
 * @prop {string} Server-Key The API key of the private server
 * @prop {string=} Authorization The API authorisation key for the `App`. `undefined` if the App does not have one.
 * @prop {string} Content-Type Always "application/json"
 * @prop {string} Accept Always "\*\/\*"
 */

/**
 * @fires App#errorInQueue
 */
class App extends EventEmitter {
    /** @type {string=} */
    authorizationKey
    /** @type {Object<string,Object[]>}  */
    queues = {main: []}
    /** @type {Object<string,boolean>} Whether the queue will advance when new requests are sent in */
    willSendRequests = {main: false}
    /** @type {Object<string,boolean>} Whether the App is actively processing requests */
    currentlySendingRequests = {main: false}
    /** @type {Object<string,number>} The time in milliseconds the App will wait from the end of the last request to the beginning of the next. */
    timesBetweenRequestsMs = {main: 250}
    /** @type {Object<string,number>} The amount of requests that can be added to the queue. Set to `-1` to allow infinite requests, which can be dangerous for large applications, especially those large enough to have application keys. Default is `-1`. */
    maxQueueLengths = {main: -1}
    /** @type {Object<string,number>} The last request time per queue */
    lastRequestsUnix = {main: 0}

    constructor(authorizationKey=null){
        super()
        this.authorizationKey = authorizationKey
    }

    /**
     * @param {string} serverKey The API key of the private server to get the headers for.
     * @returns {PrivateServerRequestHeaders}
     */
    getHeaders(serverKey){
        if(this.authorizationKey){
            return {
                "Server-Key": serverKey,
                "Authorization": this.authorizationKey,
                "Content-Type": "application/json",
                "Accept": "*/*"
            }
        } else {
            return {
                "Server-Key": serverKey,
                "Content-Type": "application/json",
                "Accept": "*/*"
            }
        }
    }

    sendRequest(request){
        return new Promise((resolve, reject) => {
            fetch(request.url.href, {
                headers: request.headers,
                method: request.method,
                ...(request.body && { body: JSON.stringify(request.body) })
            }).then(async r => {
                if(!r.ok){
                    reject(new ResponseNotOKError(r, await r.json().catch(() => undefined)))
                    return
                }
                
                r.json().then(resolve).catch(() => {
                    reject(new ResponseNotValidError("Expected JSON response from server, did not receive it. This is usually a server error."))
                })
            }).catch(reject)
        })
    }

    queueRequest(request){
        const queueName = request.queue || "main"
        return new Promise((resolve, reject) => {
            if(!this.queues[queueName]) this.addQueue(queueName)
            if(this.maxQueueLengths[queueName] != -1 && this.queues[queueName].length >= this.maxQueueLengths[queueName]){
                reject(new FullRequestQueueError(queueName, this.maxQueueLengths[queueName]))
                return
            }

            this.queues[queueName].push({request, resolve, reject})
            if(this.willSendRequests[queueName] && !this.currentlySendingRequests[queueName]){
                this.advanceQueue(queueName)
            }
        })
    }

    removeFromQueue(queue, index){
        const removed = this.queues[queue]?.splice(index, 1)[0]
        if(!removed) return false
        removed.reject(new RemovedFromQueueError(false))
        return true
    }

    clearQueue(queue){
        const saved = this.queues[queue]
        this.queues[queue] = []
        saved?.forEach((v) => v.reject(new RemovedFromQueueError(true)))
    }

    async advanceQueue(queue="main"){
        if(!this.queues[queue] || this.queues[queue].length <= 0){
            this.currentlySendingRequests[queue] = false
            return
        }
        this.currentlySendingRequests[queue] = true

        const now = Date.now()
        const lastUnix = this.lastRequestsUnix[queue] || 0
        const delay = this.timesBetweenRequestsMs[queue] || 0
        if(lastUnix + delay > now){
            await new Promise(resolve => setTimeout(resolve, (lastUnix + delay) - now))
        }

        const toProcess = this.queues[queue].shift()
        this.sendRequest(toProcess.request).then(r => {
            toProcess.resolve(r)
            this.lastRequestsUnix[queue] = Date.now()
            if(this.willSendRequests[queue]){
                setTimeout(() => this.advanceQueue(queue), this.timesBetweenRequestsMs[queue])
            } else {
                this.currentlySendingRequests[queue] = false
            }
        }).catch(e => {
            this.emit("errorInQueue", e)
            toProcess.reject(e)
            this.lastRequestsUnix[queue] = Date.now()

            let timeout = this.timesBetweenRequestsMs[queue]
            if(e instanceof ResponseNotOKError && e.status == 429 && e.response.headers.has("retry-after")){
                timeout += Number(e.response.headers.get("retry-after")) * 1000
            }

            if(this.willSendRequests[queue]){
                setTimeout(() => this.advanceQueue(queue), timeout)
            } else {
                this.currentlySendingRequests[queue] = false
            }
        })
    }

    startQueue(queue="main"){
        this.willSendRequests[queue] = true
        this.advanceQueue(queue)
    }

    stopQueue(queue="main"){
        this.willSendRequests[queue] = false
    }

    stopAndClearQueue(queue="main"){
        this.stopQueue(queue)
        this.clearQueue(queue)
    }

    getPrivateServer(serverKey){
        if(typeof serverKey != "string"){
            throw new TypeError(`Expected serverKey to be a string, given ${typeof serverKey}`)
        }
        return new PrivateServer(this, serverKey)
    }

    addQueue(queueName, timeBetweenRequestsMs=250, maxQueueLength=-1){
        this.queues[queueName] = []
        this.willSendRequests[queueName] = false
        this.currentlySendingRequests[queueName] = false
        this.timesBetweenRequestsMs[queueName] = timeBetweenRequestsMs
        this.maxQueueLengths[queueName] = maxQueueLength
        this.lastRequestsUnix[queueName] = 0
    }
}

module.exports = App
