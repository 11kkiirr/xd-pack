NetworkEvents.dataReceived('sync_era', event => {
    if (!event || !event.data) return

    const player = Client.player
    if (!player || !player.persistentData) return

    const eraText = event.data.getString('era')
    const currentEra = Number.parseInt(String(eraText), 10)
    const debugEnabled = String(event.data.getString('debug')) === 'true'
    const syncedEra = Number.isFinite(currentEra) && currentEra >= 1 && currentEra <= 5
        ? currentEra
        : 1

    player.persistentData.putInt('era_sync_current', syncedEra)
    player.persistentData.putBoolean('era_sync_debug', debugEnabled)

    if (debugEnabled) {
        console.info(`[EraDebug][CLIENT] sync_era received: era=${player.persistentData.getInt('era_sync_current')}`)
    }
})