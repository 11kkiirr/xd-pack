function getRecipeServerEra() {
    try {
        var eraConfig = JsonIO.read('kubejs/config/era_system.json')
        return Number(eraConfig.globalEra || 1)
    } catch (error) {
        console.error(`[Era System] Could not read era config: ${error}`)
        return 1
    }
}

ServerEvents.recipes(event => {
    const currentEra = getRecipeServerEra()

    if (currentEra < 1 || currentEra > global.ERA_COUNT) {
        console.error(`[Era System] Invalid current era: ${currentEra}. Recipes were not removed.`)
        return
    }

    for (let era = currentEra + 1; era <= global.ERA_COUNT; era++) {
        event.remove({ output: `#${global.getEraTag(era)}` })
    }
})