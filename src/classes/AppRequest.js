class AppRequest {
    constructor(app, serverKey, endpoint, options){
        this.app = app
        this.serverKey = serverKey
        this.endpoint = endpoint
        this.method = options?.method?.toUpperCase() || "GET"
        this.body = options?.body
        this.queue = options?.queue || "main"
    }

    get url(){
        return new URL(this.endpoint, `https://api.policeroleplay.community`)
    }

    get headers(){
        return this.app.getHeaders(this.serverKey)
    }
}

module.exports = AppRequest