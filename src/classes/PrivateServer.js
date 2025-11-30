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
 * @prop {string} username The player's username
 * @prop {number} userId The player's Roblox user ID
 * @prop {"Normal" | "Server Administrator" | "Server Owner" | "Server Moderator"} permissionLevel The player's permission level. See the enum `PermissionLevels`
 * @prop {string | null} callsign The player's callsign on their team. `null` if they are on the Civilian team.
 * @prop {"Civilian" | "Sheriff" | "Fire" | "Police" | "DOT"} team The player's team. See the enum `Teams`
 */

/**
 * @typedef {Object} JoinLog
 * @prop {boolean} logType The type of log (leave or join). See the enum `JoinLogType`
 * @prop {Date} date A Date object representing when this log occured
 * @prop {string} username The username of of the player the log refers to
 * @prop {number} userId The Roblox user ID of the player the log refers to
 * @prop {string} fingerprint A unique identifier for this log. Be aware that (extremely rarely) this fingerprint can be the same as another log.
 */

/**
 * @typedef {Object} KillLog
 * @prop {string} killedUsername The username of the player that was killed
 * @prop {number} killedUserId The Roblox user ID of the player that was killed
 * @prop {string} killerUsername The username of the killer
 * @prop {number} killerUserId The Roblox user ID of the player that was killed
 * @prop {Date} date A Date object representing when this log occured
 * @prop {string} fingerprint A unique identifier for this log. Be aware that (extremely rarely) this fingerprint can be the same as another log.
 */

/**
 * @typedef {Object} CommandLog
 * @prop {string} moderatorUsername The username of the moderator that ran the command
 * @prop {number} moderatorUserId The Roblox user ID of the moderator that ran the command. `-1` if it was ran by a Remote Server
 * @prop {string} command The full command that was executed, e.g. ":h Hello World!"
 * @prop {boolean} isRemoteServer Whether the command was run via the API
 * @prop {string} fingerprint A unique identifier for this log. Be aware that (extremely rarely) this fingerprint can be the same as another log.
 * @prop {Date} date A Date object representing when this log occured
 */

/**
 * @typedef {Object} ModCallLog
 * @prop {string} callerUsername The username of the player that called for a moderator
 * @prop {number} callerUserId The user ID of the player that called for a moderator
 * @prop {boolean} responded Whether the mod call has been responded to
 * @prop {string | null} moderatorUsername The username of the moderator that responded to the call. `null` if nobody has responded yet.
 * @prop {number | null} moderatorUserId The Roblox user ID of the mdoerator that responded to the call. `null` if nobodt has responded yet
 * @prop {Date} date A Date object representing when this log occured
 * @prop {string} fingerprint A unique identifier for this log. Be aware that (extremely rarely) this fingerprint can be the same as another log.
 */

/**
 * @typedef {Object} BannedPlayer
 * @prop {string} username The username of the banned player
 * @prop {number} userId The Roblox user ID of the banned player
 */

/**
 * @typedef {Object} Vehicle
 * @prop {string} texture The texture of the vehicle
 * @prop {string} vehicleName The model of the vehicle
 * @prop {string} ownerUsername The username of the vehicle's owner
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
    /** @type {import("./App")} The App that manages this server */
    app
    /** @type {string} The server's API key */
    serverKey
    /** @type {string} The queue that requests will be sent to if one is not specified */
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
     * Get the private server's information, including owner, co-owners, name, join code, and other important settings.
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of all players in the server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of the recent join logs for this server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array containing the user IDs of all players in the server's queue
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
     * @returns {Promise<number[]>}
     */
    getQueue(queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/queue", {queue})).then(resolve).catch(reject)
        })
    }

    /**
     * Get an array of the recent kill logs for this server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of the recent command logs for this server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of all of the recent mod calls for this server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of all of the banned players in this server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Get an array of all of the currently spawned vehicles in the server
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
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
     * Send a command to the server
     * @param {string} command The command string to send to the server. Can include or exclude the colon prefix.
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
     * @returns {Promise<void>}
     */
    sendCommand(command, queue=this.defaultQueue){
        return new Promise((resolve, reject) => {
            this.queueRequest(this.createAppRequest("v1/server/command", {queue, method: "post", body: {command: (command.startsWith(":") ? command : ":" + command)}})).then(() => {
                resolve()
            }).catch(reject)
        })
    }

    /**
     * Get a link that automatically opens Roblox and sends the user to the private server
     * See {@link https://create.roblox.com/docs/production/promotion/deeplinks} for more information
     * @param {string} format The format to get the deep link in. See the enum `DeepLinkFormats`
     * @param {string} [queue] The queue to send the request to. Will use `PrivateServer.defaultQueue` if not specified.
     * @returns {string} The deep link in the requested format
     */
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