const {DeepLinkFormats} = require("../enums")

/**
 * @param {string} joinCode
 * @param {string} format See enum `DeepLinkFormats`
 */
function deepLinkFromJoinCode(joinCode, format){
    switch(format){
        case DeepLinkFormats.Direct:
            return `roblox://placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({joinCode}))}`
            break
        case DeepLinkFormats.ViaRobloxWeb:
            return `https://www.roblox.com/games/start?placeId=2534724415&launchData=${encodeURIComponent(JSON.stringify({joinCode}))}`
            break
        case DeepLinkFormats.ViaPRCWebsite:
             return `https://policeroleplay.community/join/${joinCode}`
            break
    }
}

module.exports = deepLinkFromJoinCode