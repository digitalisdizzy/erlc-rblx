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

/**
 * @typedef {Object} Player
 * @prop {string} username
 * @prop {number} userId
 * @prop {"Normal" | "Server Administrator" | "Server Owner" | "Server Moderator"} permissionLevel
 * @prop {string | null} callsign
 * @prop {"Civilian" | "Sheriff" | "Fire" | "Police" | "DOT"} team
 */

/**
 * @typedef {Object} JoinLog
 * @prop {boolean} logType
 * @prop {Date} date
 * @prop {string} username
 * @prop {number} userId
 * @prop {string} fingerprint
 */

/**
 * @typedef {Object} KillLog
 * @prop {string} killedUsername
 * @prop {number} killedUserId
 * @prop {string} killerUsername
 * @prop {number} killerUserId
 * @prop {Date} date
 * @prop {string} fingerprint
 */

/**
 * @typedef {Object} CommandLog
 * @prop {string} moderatorUsername
 * @prop {number} moderatorUserId
 * @prop {string} command
 * @prop {boolean} isRemoteServer
 * @prop {string} fingerprint
 * @prop {Date} date
 */

/**
 * @typedef {Object} ModCallLog
 * @prop {string} callerUsername
 * @prop {number} callerUserId
 * @prop {boolean} responded
 * @prop {string} moderatorUsername
 * @prop {number} moderatorUserId
 * @prop {Date} date
 * @prop {string} fingerprint
 */

/**
 * @typedef {Object} BannedPlayer
 * @prop {string} username
 * @prop {number} userId
 */

/**
 * @typedef {Object} Vehicle
 * @prop {string} texture
 * @prop {string} vehicleName
 * @prop {string} ownerUsername
 */

function createFingerprint(string){
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Constrain to 32bit integer
    }

    return btoa(hash.toString(16))
}

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
     * 
     * @returns {Promise<Player[]>}
     */
    getPlayers(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/players", {queue})).then(r => {
                const players = []
                r.forEach(plr => {
                    players.push({username: plr.Player.split(":")[0], userId: Number(plr.Player.split(":")[1]), permissionLevel: plr.Permission, callsign: plr.Callsign || null, team: plr.Team})
                });
                resolve(players)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<JoinLog[]>}
     */
    getJoinLogs(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/joinlogs", {queue})).then(r => {
                const logs = []
                r.forEach(log => {
                    logs.push({username: log.Player.split(":")[0], userId: Number(log.Player.split(":")[1]), date: new Date(log.Timestamp * 1000), logType: log.Join, fingerprint: createFingerprint(`${log.Player}${log.Timestamp}${log.Join}`)})
                });
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<number[]>}
     */
    getQueue(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/queue", {queue})).then(resolve).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<KillLog[]>}
     */
    getKillLogs(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/killlogs", {queue})).then(r => {
                const logs = []
                r.forEach(log => {
                    logs.push({killerUsername: log.Killer.split(":")[0], killerUserId: Number(log.Killer.split(":")[1]), date: new Date(log.Timestamp * 1000), killedUsername: log.Killed.split(":")[0], killedUserId: Number(log.Killed.split(":")[1]), fingerprint: createFingerprint(`${log.Killed}${log.Killer}${log.Timestamp}`)})
                });
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<CommandLog[]>}
     */
    getCommandLogs(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/commandlogs", {queue})).then(r => {
                const logs = []
                r.forEach(log => {
                    if(log.Player == "Remote Server"){
                        logs.push({username: "RemoteServer", userId: -1, date: new Date(log.Timestamp * 1000), command: log.Command, fingerprint: createFingerprint(`${log.Player}${log.Timestamp}${log.Command}`), isRemoteServer: true})
                    } else {
                        logs.push({username: log.Player.split(":")[0], userId: Number(log.Player.split(":")[1]), date: new Date(log.Timestamp * 1000), command: log.Command, fingerprint: createFingerprint(`${log.Player}${log.Timestamp}${log.Command}`), isRemoteServer: false})
                    }
                })
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<ModCallLog[]>}
     */
    getModCallLogs(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/modcalls", {queue})).then(r => {
                const logs = []
                r.forEach(log => {
                    logs.push({callerUsername: log.Caller.split(":")[0], callerUserId: Number(log.Caller.split(":")[1]), moderatorUsername: log.Moderator?.split(":")[0] || null, moderatorUserId: Number(log.Moderator?.split(":")[1]) || null, date: new Date(log.Timestamp * 1000), responded: !!log.Moderator, fingerprint: createFingerprint(`${log.Caller}${log.Timestamp}`)})
                });
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<BannedPlayer[]>}
     */
    getBannedPlayers(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/bans", {queue})).then(r => {
                const logs = []
                for(const userId in r){
                    logs.push({username: r[userId], userId: userId})
                }
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * 
     * @returns {Promise<Vehicle[]>}
     */
    getVehicles(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/vehicles", {queue})).then(r => {
                const logs = []
                r.forEach(log => {
                    logs.push({texture: log.Texture, vehicleName: log.Name, ownerUsername: log.Owner})
                });
                resolve(logs)
            }).catch(reject)
        })
    }

    /**
     * @returns {Promise<void>}
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