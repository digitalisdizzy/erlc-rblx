/**
 * @enum {string}
 * @readonly
 */
const AccountVerifcationRequirements = {
    /** There are no verification requirements */
    None: "Disabled",
    /** The player must have their account linked and verified to an email to join the server */
    Email: "Email",
    /** The player must either have a phone number link and verified to a phone number or must have verified their age with government ID to join the server */
    PhoneOrId: "Phone/ID"
}

module.exports = AccountVerifcationRequirements