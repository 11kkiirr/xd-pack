ItemEvents.modifyTooltips(event => {
    for (let era = 1; era <= global.ERA_COUNT; era++) {
        event.modify(`#kubejs:era_${era}`, { stages: { [`era_${era}`]: false } }, tooltip => {
            tooltip.clear()
            tooltip.add([
                Text.of('???').white(),
                Text.of('Я не розумію, що це. . .').gray()
            ])
        })
    }
})