function updateEraRestrictionManager(era) {
    try {
        const EraRestrictionManager = Java.loadClass('me.kirillaim.craftblocker.EraRestrictionManager')
        EraRestrictionManager.setCurrentServerEra(era)
    } catch (error) {
        // Mod is absent or not yet loaded; KubeJS remains the source of truth.
    }
}

function saveEraToConfig(era) {
    JsonIO.write('kubejs/config/era_system.json', { globalEra: era })
}

function syncEraStages(player, currentEra) {
    if (!player || !player.stages) return []

    const syncedStages = []
    if (currentEra >= 1) player.stages.add('era_1')
    if (currentEra >= 2) player.stages.add('era_2')
    if (currentEra >= 3) player.stages.add('era_3')
    if (currentEra >= 4) player.stages.add('era_4')
    if (currentEra >= 5) player.stages.add('era_5')

    if (currentEra < 5) player.stages.remove('era_5')
    if (currentEra < 4) player.stages.remove('era_4')
    if (currentEra < 3) player.stages.remove('era_3')
    if (currentEra < 2) player.stages.remove('era_2')

    if (player.stages.has('era_1')) syncedStages.push('era_1')
    if (player.stages.has('era_2')) syncedStages.push('era_2')
    if (player.stages.has('era_3')) syncedStages.push('era_3')
    if (player.stages.has('era_4')) syncedStages.push('era_4')
    if (player.stages.has('era_5')) syncedStages.push('era_5')

    return syncedStages
}

function syncEraToClient(player, currentEra, debugEnabled) {
    if (!player || !player.sendData) return

    player.sendData('sync_era', {
        era: String(currentEra),
        debug: String(debugEnabled)
    })
}

function syncEraProgress(player, eraOverride) {
    if (!player || !player.server) return

    const server = player.server
    const currentEra = eraOverride || global.getCurrentServerEra(server)
    updateEraRestrictionManager(currentEra)
    const syncedStages = syncEraStages(player, currentEra)
    const debugEnabled = server.persistentData.getBoolean('eraDebug')
    syncEraToClient(player, currentEra, debugEnabled)

    if (debugEnabled) {
        player.tell(Text.of(`[EraDebug][SERVER] era=${currentEra}, stages=${syncedStages.join(', ') || 'none'}`).aqua())
    }
}

PlayerEvents.loggedIn(event => {
    syncEraProgress(event.player)
})

ServerEvents.loaded(event => {
    event.server.playerList.players.forEach(player => syncEraProgress(player))
})

ServerEvents.commandRegistry(event => {
    const { commands, arguments } = event

    event.register(
        commands.literal('setera')
            .requires(src => src.hasPermission(2))
            .then(commands.argument('era', arguments.INTEGER.create(event))
                .executes(ctx => {
                    const requestedEra = arguments.INTEGER.getResult(ctx, 'era')
                    const server = ctx.source.server
                    const clampedEra = Math.max(1, Math.min(global.ERA_COUNT, requestedEra))

                    saveEraToConfig(clampedEra)
                    updateEraRestrictionManager(clampedEra)
                    server.playerList.players.forEach(player => syncEraProgress(player, clampedEra))

                    server.tell([
                        Text.of('[Era System] ').green(),
                        Text.of('Global era changed to ').white(),
                        Text.of(String(clampedEra)).gold().bold(),
                        Text.of(` (${global.ERA_NAMES[clampedEra] || 'Unknown Era'})`).gray()
                    ])
                    return 1
                })
            )
    )

    event.register(
        commands.literal('getera')
            .executes(ctx => {
                const server = ctx.source.server
                const currentEra = global.getCurrentServerEra(server)
                ctx.source.sendSuccess(
                    Text.of(`Current global era: ${currentEra} (${global.ERA_NAMES[currentEra] || 'Unknown Era'})`).yellow(),
                    false
                )
                return 1
            })
    )

    event.register(
        commands.literal('eradebug')
            .requires(src => src.hasPermission(2))
            .then(commands.literal('on')
                .executes(ctx => {
                    const server = ctx.source.server
                    server.persistentData.putBoolean('eraDebug', true)
                    server.tell(Text.of('[EraDebug] Enabled.').aqua())
                    server.playerList.players.forEach(player => syncEraProgress(player))
                    return 1
                })
            )
            .then(commands.literal('off')
                .executes(ctx => {
                    const server = ctx.source.server
                    server.persistentData.putBoolean('eraDebug', false)
                    server.tell(Text.of('[EraDebug] Disabled.').gray())
                    return 1
                })
            )
            .then(commands.literal('status')
                .executes(ctx => {
                    const enabled = ctx.source.server.persistentData.getBoolean('eraDebug')
                    ctx.source.sendSuccess(Text.of(`[EraDebug] ${enabled ? 'enabled' : 'disabled'}`).aqua(), false)
                    return 1
                })
            )
    )
})
