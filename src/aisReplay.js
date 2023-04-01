/* eslint-disable max-classes-per-file */
import { Server } from 'node:net'
import { join } from 'node:path'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { setTimeout } from 'node:timers/promises'
import { AISGenerator } from './lib/aisGenerator.js'
import { AISDecoder } from './lib/aisDecoder.js'
import { Log } from 'cmd430-utils'
import { config } from './loadConfig.js'

const { debug: aisDebug, error: aisError } = new Log(config.debug.enabled ? 'AIS Replay' : '')
const { debug: mtDebug, error: mtError } = new Log(config.debug.enabled ? 'Marine Traffic Replay' : '')

class AISReplay extends Server {

  /* eslint-disable lines-between-class-members */
  #port
  #replayFile
  /* eslint-enable lines-between-class-members */

  constructor (port, replayFile) {
    super()

    this.#port = port
    this.#replayFile = replayFile

    this.on('connection', async AIS_CLIENT => {
      aisDebug('Starting AIS Replay')
      if (config.debug.replayMode) {
        const AIS_REPLAY = createReadStream(this.#replayFile)
        const RLI = createInterface({
          input: AIS_REPLAY
        })

        for await (const sentence of RLI) {
          AIS_CLIENT.write(sentence)
          await setTimeout(15)
        }
      } else {
        const aisGenerator = new AISGenerator()
        aisGenerator.on('ready', () => aisDebug('Generating AIS'))
        aisGenerator.on('nmea', sentence => AIS_CLIENT.write(sentence))
        aisGenerator.start()
      }
    })
    this.on('error', err => {
      aisError(err)
      this.relisten()
    })
  }

  listen () {
    return super.listen(this.#port)
  }

  async relisten () {
    this.close()
    await setTimeout(1000)
    this.listen(this.#port)
  }

}

class MarineTraffic extends Server {

  #port

  constructor (port) {
    super()

    this.#port = port

    this.on('connection', async MARINETRAFFIC_CLIENT => {
      mtDebug('Started Marine Traffic Receiver')
      MARINETRAFFIC_CLIENT.on('data', data => {
        const aisMessage = new AISDecoder(data.toString())
        if (aisMessage.isValid()) {
          aisDebug('Received Valid AIS Message:', aisMessage)
        } else {
          const err = aisMessage.errorMessage()
          aisDebug('Received Invalid AIS Message:', aisMessage)
          if (err) aisDebug('AIS Error Message:', err)
        }
      })
    })
    this.on('error', err => {
      mtError(err)
      this.relisten()
    })
  }

  listen () {
    return super.listen(this.#port)
  }

  async relisten () {
    this.close()
    await setTimeout(1000)
    this.listen(this.#port)
  }

}

const MARINETRAFFIC_PORT = config.marineTraffic.port
const AIS_PORT = config.ais.port
const AIS_FILE = join(process.cwd(), 'replays', config.debug.replayData)

const MARINETRAFFIC_SERVER = new MarineTraffic(MARINETRAFFIC_PORT)
const AIS_REPLAY = new AISReplay(AIS_PORT, AIS_FILE)

MARINETRAFFIC_SERVER.listen()
AIS_REPLAY.listen()
