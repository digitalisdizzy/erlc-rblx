const {DeepLinkFormats} = require("../enums")

/**
 * @param {string} joinCode
 * @param {string} format See enum `DeepLinkFormats`
 */
function deepLinkFromJoinCode(joinCode, format){
    switch(format){
        case DeepLinkFormats.Direct:
            resolve(`roblox://placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({joinCode}))}`)
            break
        case DeepLinkFormats.ViaRobloxWeb:
            resolve(`https://www.roblox.com/games/start?placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({joinCode}))}`)
            break
        case DeepLinkFormats.ViaPRCWebsite:
             resolve(`https://policeroleplay.community/join/${joinCode}`)
            break
    }
}

module.exports = deepLinkFromJoinCode