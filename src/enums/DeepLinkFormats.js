/**
 * See further information about these at {@link https://create.roblox.com/docs/production/promotion/deeplinks}
 * @enum {string}
 * @readonly
 */
const DeepLinkFormats = {
    /** Via the policeroleplay.community website (https://policeroleplay.community/<joinCode>) */
    ViaPRCWebsite: "prcWebsite",
    /** Via roblox.com (https://roblox.com/start) */
    ViaRobloxWeb: "viaRobloxWeb",
    /** Directly open the Roblox App (roblox://) */
    Direct: "directToApp"
}

module.exports = DeepLinkFormats