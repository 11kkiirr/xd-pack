function canUseEraRestrictedItem(player, itemLike) {
    if (!player || !itemLike) return true
    if (global.isEraBypass(player)) return true

    const requiredEra = global.getRequiredEraFromItem(itemLike)
    if (global.hasEraUnlocked(player, requiredEra)) return true

    return false
}

BlockEvents.rightClicked(event => {
    if (!event.player || !event.block) return

    if (event.item && !canUseEraRestrictedItem(event.player, event.item)) {
        event.cancel()
        return
    }

    if (event.block.item && !canUseEraRestrictedItem(event.player, event.block.item)) {
        event.cancel()
    }
})

BlockEvents.placed(event => {
    if (!event.player || !event.block) return

    const placedItem = event.block.item
    if (placedItem && !canUseEraRestrictedItem(event.player, placedItem)) {
        event.cancel()
    }
})

ItemEvents.rightClicked(event => {
    if (!event.player || !event.item) return
    if (!canUseEraRestrictedItem(event.player, event.item)) {
        event.cancel()
    }
})