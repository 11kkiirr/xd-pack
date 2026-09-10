ServerEvents.commandRegistry(event => {
    const { commands, arguments } = event

    function getEraData(server) {
        var raw = server.persistentData.getString('dev_era_tags')
        if (!raw) return {}

        try {
            return JSON.parse(raw)
        } catch (error) {
            return null
        }
    }

    function saveEraData(server, data) {
        server.persistentData.putString('dev_era_tags', JSON.stringify(data))
    }

    event.register(
        commands.literal('tagera')
            .requires(src => src.hasPermission(2))
            .then(commands.literal('add')
                .then(commands.argument('era', arguments.INTEGER.create(event))
                    .executes(ctx => {
                        const era = arguments.INTEGER.getResult(ctx, 'era')
                        const player = ctx.source.player

                        if (!player) {
                            ctx.source.sendFailure(Text.of('This command can only be used by a player.'))
                            return 0
                        }

                        const item = player.mainHandItem
                        if (!item || item.empty) {
                            player.tell(Text.of('Hold an item in your main hand first.').red())
                            return 0
                        }

                        const server = player.server
                        const data = getEraData(server)
                        if (data === null) {
                            player.tell(Text.of('[TagDev] Saved tag data is invalid. Use /tagera clear.').red())
                            return 0
                        }

                        const key = String(era)
                        if (!data[key]) {
                            data[key] = []
                        }

                        const itemId = item.id.toString()
                        if (!data[key].includes(itemId)) {
                            data[key].push(itemId)
                            saveEraData(server, data)

                            player.tell([
                                Text.of('[TagDev] ').green(),
                                Text.of(itemId).yellow(),
                                Text.of(` added to Era ${era}.`).white()
                            ])
                        } else {
                            player.tell(Text.of(`This item is already assigned to Era ${era}.`).gold())
                        }

                        return 1
                    })
                )
            )
            .then(commands.literal('addhotbar')
                .then(commands.argument('era', arguments.INTEGER.create(event))
                    .executes(ctx => {
                        const era = arguments.INTEGER.getResult(ctx, 'era')
                        const player = ctx.source.player

                        if (!player) {
                            ctx.source.sendFailure(Text.of('This command can only be used by a player.'))
                            return 0
                        }

                        const server = player.server
                        const data = getEraData(server)
                        if (data === null) {
                            player.tell(Text.of('[TagDev] Saved tag data is invalid. Use /tagera clear.').red())
                            return 0
                        }

                        const key = String(era)
                        if (!data[key]) {
                            data[key] = []
                        }

                        const added = []
                        const already = []

                        for (let slot = 0; slot < 9; slot++) {
                            const stack = player.inventory.getItem(slot)
                            if (!stack || stack.empty) continue

                            const itemId = stack.id.toString()
                            if (!data[key].includes(itemId)) {
                                data[key].push(itemId)
                                added.push(itemId)
                            } else {
                                already.push(itemId)
                            }
                        }

                        saveEraData(server, data)

                        if (added.length === 0) {
                            player.tell(Text.of(`[TagDev] No new items were added to Era ${era}.`).gold())
                            return 0
                        }

                        player.tell(Text.of(`[TagDev] Added ${added.length} item(s) to Era ${era}.`).green())
                        if (added.length > 0) {
                            player.tell(Text.of(added.join(', ')).yellow())
                        }
                        if (already.length > 0) {
                            player.tell(Text.of(`Already present: ${already.join(', ')}`).gold())
                        }

                        return 1
                    })
                )
            )
            .then(commands.literal('list')
                .executes(ctx => {
                    const player = ctx.source.player
                    if (!player) return 0

                    const data = getEraData(player.server)
                    if (data === null) {
                        player.tell(Text.of('[TagDev] Saved tag data is invalid. Use /tagera clear.').red())
                        return 0
                    }

                    const eras = Object.keys(data)
                    if (eras.length === 0) {
                        player.tell(Text.of('[TagDev] No era tags recorded yet. Use /tagera add <era> first.').red())
                        return 0
                    }

                    const lines = ['[TagDev] Era item list:']
                    for (const eraKey of eras) {
                        const items = data[eraKey]
                        if (!Array.isArray(items) || items.length === 0) continue

                        lines.push(`Era ${eraKey}: ${items.join(', ')}`)
                    }

                    player.tell(Text.of(lines.join('\n')).white())
                    return 1
                })
            )
            .then(commands.literal('remove')
                .then(commands.argument('era', arguments.INTEGER.create(event))
                    .executes(ctx => {
                        const era = arguments.INTEGER.getResult(ctx, 'era')
                        const player = ctx.source.player

                        if (!player) {
                            ctx.source.sendFailure(Text.of('This command can only be used by a player.'))
                            return 0
                        }

                        const item = player.mainHandItem
                        if (!item || item.empty) {
                            player.tell(Text.of('Hold an item in your main hand first.').red())
                            return 0
                        }

                        const server = player.server
                        const data = getEraData(server)
                        if (data === null) {
                            player.tell(Text.of('[TagDev] Saved tag data is invalid. Use /tagera clear.').red())
                            return 0
                        }

                        const key = String(era)
                        if (!data[key] || !Array.isArray(data[key]) || data[key].length === 0) {
                            player.tell(Text.of(`Era ${era} has no tracked items.`).gold())
                            return 0
                        }

                        const itemId = item.id.toString()
                        const index = data[key].indexOf(itemId)
                        if (index === -1) {
                            player.tell(Text.of(`${itemId} is not assigned to Era ${era}.`).gold())
                            return 0
                        }

                        data[key].splice(index, 1)
                        if (data[key].length === 0) {
                            delete data[key]
                        }

                        saveEraData(server, data)
                        player.tell([
                            Text.of('[TagDev] ').green(),
                            Text.of(itemId).yellow(),
                            Text.of(` removed from Era ${era}.`).white()
                        ])
                        return 1
                    })
                )
            )
            .then(commands.literal('export')
                .executes(ctx => {
                    const player = ctx.source.player
                    if (!player) return 0

                    let stage = 'read'
                    try {
                        const exportStoredTags = player.server.persistentData.getString('dev_era_tags')
                        let data = {}

                        stage = 'parse'
                        data = exportStoredTags ? JSON.parse(exportStoredTags) : {}

                        if (Object.keys(data).length === 0) {
                            player.tell(Text.of('No era tags recorded yet. Use /tagera add <era> first.').red())
                            return 0
                        }

                        stage = 'build'
                        let itemCode = "ServerEvents.tags('item', event => {\n"

                        for (const exportEra in data) {
                            const items = data[exportEra]
                            if (!Array.isArray(items) || items.length === 0) continue

                            itemCode += `    // Era ${exportEra}\n    event.add('kubejs:era_${exportEra}', [\n`

                            items.forEach((id, index) => {
                                const comma = index === items.length - 1 ? '' : ','
                                itemCode += `        '${id}'${comma}\n`
                            })

                            itemCode += '    ])\n\n'
                        }

                        itemCode += '})'
                        stage = 'send'
                        const copyButton = Text.of('[ COPY TAG CODE ]')
                            .green()
                            .bold()
                            .underlined()
                            .clickCopy(itemCode)
                            .hover(Text.of('Copy generated tag code to clipboard.').yellow())
                        player.tell(Text.of('[TagDev] Click the button to copy the generated tag code.').white())
                        player.tell(copyButton)
                    } catch (error) {
                        var message = error && error.message ? error.message : String(error)
                        console.error(`[TagDev] /tagera export failed during ${stage}: ${message}`)
                        player.tell(Text.of(`[TagDev] Export failed during ${stage}: ${message}`).red())
                        return 0
                    }

                    return 1
                })
            )
            .then(commands.literal('clear')
                .executes(ctx => {
                    const player = ctx.source.player
                    if (!player) return 0

                    player.server.persistentData.remove('dev_era_tags')
                    player.tell(Text.of('[TagDev] Temporary era tag list cleared.').red())
                    return 1
                })
            )
    )
})