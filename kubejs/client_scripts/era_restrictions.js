const forbiddenItemMessages = [
    'Що це?',
    '?',
    'Я не розумію що це',
    'Як це працює?',
    'Не зрозумів.',
    '. . .'
]

const forbiddenBlockMessages = [
    'Що це за коробка?',
    'Якесь барахло',
    'Як це працює?',
    'Воно працює?',
    '. . .',
    'Не зрозумів.'
]

function isClientEraRestricted(player, item) {
    if (!player || !item) return false

    const requiredEra = global.getRequiredEraFromItem(item)
    if (requiredEra <= 1) return false

    return !(player.stages && player.stages.has(`era_${requiredEra}`))
}

function showClientEraRestriction(player, isBlock) {
    const messages = isBlock ? forbiddenBlockMessages : forbiddenItemMessages
    const message = messages[Math.floor(Math.random() * messages.length)]
    player.setStatusMessage(Text.of(message).gray().italic())
}

function cancelRestrictedInteraction(event, item, isBlock) {
    if (!isClientEraRestricted(event.player, item)) return false

    showClientEraRestriction(event.player, isBlock)
    event.cancel()
    return true
}

BlockEvents.rightClicked(event => {
    if (!event.player) return
    if (cancelRestrictedInteraction(event, event.block && event.block.item, true)) return

    cancelRestrictedInteraction(event, event.item, true)
})

BlockEvents.placed(event => {
    if (!event.player || !event.block) return

    if (isClientEraRestricted(event.player, event.block.item)) {
        showClientEraRestriction(event.player, true)
    }
})

ItemEvents.rightClicked(event => {
    cancelRestrictedInteraction(event, event.item, false)
})

