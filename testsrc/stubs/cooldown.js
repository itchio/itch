
let cooldown = () => async () => null
cooldown['@noCallThru'] = true

module.exports = cooldown
