const ERA_COUNT = 5
const ERA_NAMES = {
    1: 'Era of Kinetics',
    2: 'Era of Metallurgy',
    3: 'Era of Oil',
    4: 'Era of Electricity',
    5: 'Era of Smart Electronics'
}

global.ERA_COUNT = ERA_COUNT
global.ERA_NAMES = ERA_NAMES
global.ERA_TAG_PREFIX = 'kubejs:era_'

global.getEraTag = era => `kubejs:era_${era}`
global.getEraStage = era => `era_${era}`

global.getCurrentServerEra = server => {
    try {
        var eraConfig = JsonIO.read('kubejs/config/era_system.json')
        return Number(eraConfig.globalEra || 1)
    } catch (error) {
        if (!server || !server.persistentData) return 1
        return Number(server.persistentData.getInt('globalEra') || 1)
    }
}

global.getRecipeServerEra = () => {
    try {
        const server = Utils.getServer()
        if (server && server.persistentData) {
            return global.getCurrentServerEra(server)
        }
    } catch (error) {
    }

    return Number(global.currentEra || 1)
}

global.getRequiredEraFromItem = itemLike => {
    if (!itemLike) return 1

    let requiredEra = 1
    for (let era = 1; era <= ERA_COUNT; era++) {
        if (itemLike.hasTag(global.getEraTag(era))) {
            requiredEra = Math.max(requiredEra, era)
        }
    }

    return requiredEra
}

global.syncPlayerEraStages = player => {
    if (!player || !player.stages || !player.server) return

    const currentEra = global.getCurrentServerEra(player.server)

    if (currentEra >= 1) player.stages.add('era_1')
    if (currentEra >= 2) player.stages.add('era_2')
    if (currentEra >= 3) player.stages.add('era_3')
    if (currentEra >= 4) player.stages.add('era_4')
    if (currentEra >= 5) player.stages.add('era_5')

    if (currentEra < 5) player.stages.remove('era_5')
    if (currentEra < 4) player.stages.remove('era_4')
    if (currentEra < 3) player.stages.remove('era_3')
    if (currentEra < 2) player.stages.remove('era_2')
}

global.hasEraUnlocked = (player, era) => {
    if (!era) return true
    return Boolean(player && player.stages && player.stages.has(`era_${era}`))
}

global.isEraBypass = player => {
    if (!player) return false

    try {
        return Boolean(player.hasPermission('era.bypass'))
    } catch (error) {
        return false
    }
}

global.currentEra = 1
global.isBypass = false