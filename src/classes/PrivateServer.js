const AppRequest = require("./AppRequest")
const {DeepLinkFormats} = require("../enums")

/**
 * @typedef {Object} ServerInfo
 * @prop {string} name The name of the server
 * @prop {number} ownerUserId The Roblox User ID of the server's owner
 * @prop {number[]} coOwnerUserIds The Roblox User IDs of all of the server's co-owners.
 * @prop {number} playerCount How many players there currently are in the server
 * @prop {number} maxPlayerCount How many players the server allows. Remember that one slot is always reserved for the server's owner, so the maximum player count for normal players is `maxPlayerCount - 1`.
 * @prop {string} joinCode The code that is used to join this server via the `Servers > Join by Code` menu. While it is unique, it can be changed, so do not use this as a "server ID".
 * @prop {"Disabled" | "Email" | "Phone/ID"} accountVerificationLevelRequired The Roblox account verification level required to join this server. Se the enum `AccountVerificationRequirements`.
 * @prop {boolean} autoTeamBalanceEnabled Whether the setting that automatically balances teams are enabled. Note that the civilian team is never limited.
 */


class PrivateServer {
    /** @type {import("./App")} */
    app
    /** @type {string} */
    serverKey
    /** @type {string} */
    defaultQueue = "main"

    constructor(app, serverKey){
        this.app = app
        this.serverKey = serverKey
    }

    createAppRequest(endpoint, options){
        return new AppRequest(this.app, this.serverKey, endpoint, options)
    }

    queueRequest(request){
        return this.app.queueRequest(request)
    }
    sendRequest(request){
        return this.app.sendRequest(request)
    }

    /**
     * 
     * @returns {Promise<ServerInfo>}
     * @throws {import("../errors").ResponseNotOKError | import("../errors").ResponseNotValidError | import("../errors").RemovedFromQueueError | import("../errors").FullRequestQueueError | FetchError}
     */
    getInfo(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server", {queue})).then(r => {
                const {Name: name, OwnerId: ownerUserId, CoOwnerIds: coOwnerUserIds, CurrentPlayers: playerCount, MaxPlayers: maxPlayerCount, JoinKey: joinCode, AccVerifiedReq: accountVerificationLevelRequired, TeamBalance: autoTeamBalanceEnabled} = r
                resolve({name, ownerUserId, coOwnerUserIds, playerCount, maxPlayerCount, joinCode, accountVerificationLevelRequired, autoTeamBalanceEnabled})
            }).catch(reject)
        })
    }

    /**
     * @returns {Promise<void>}
     * @throws {import("../errors").ResponseNotOKError | import("../errors").ResponseNotValidError | import("../errors").RemovedFromQueueError | import("../errors").FullRequestQueueError | FetchError}
     */
    sendCommand(command, queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/command", {queue, method: "post", body: {command: (command.startsWith(":") ? command : ":" + command)}})).then(() => {
                resolve()
            }).catch(reject)
        })
    }

    getDeepLink(format, queue){
        return new Promise(async (resolve, reject) => {
            const info = await this.getInfo(queue).catch(reject)
            switch(format){
                case DeepLinkFormats.Direct:
                    resolve(`roblox://placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({psCode: info.joinCode}))}`)
                    break
                case DeepLinkFormats.ViaRobloxWeb:
                    resolve(`https://www.roblox.com/games/start?placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({psCode: info.joinCode}))}`)
                    break
                case DeepLinkFormats.ViaPRCWebsite:
                    resolve(`https://policeroleplay.community/join/${info.joinCode}`)
                    break
            }
        })
    }
}

module.exports = PrivateServer