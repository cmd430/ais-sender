import { Log } from 'cmd430-utils'
import { TCPClient } from './tcpClient.js'
import { AISGenerator } from './lib/aisGenerator.js'
import { config } from './loadConfig.js'

const MARINETRAFFIC_PORT = config.marineTraffic.port
const MARINETRAFFIC_HOST = config.marineTraffic.host

const { debug: aisDebug, error: aisError, info: aisInfo } = new Log('AIS')
const { error: mtError, info: mtInfo } = new Log('Marine Traffic')

const MarineTraffic = new TCPClient(MARINETRAFFIC_PORT, MARINETRAFFIC_HOST)
MarineTraffic.once('ready', () => {
  mtInfo('Connected to Marine Traffic')
  MarineTraffic.on('ready', () => mtInfo('Reconnected to Marine Traffic'))
})
MarineTraffic.on('ready', () => setTimeout(() => MarineTraffic.destroySoon(), 1000 * 30))
MarineTraffic.on('close', () => mtInfo('Disconnected from Marine Traffic'))
MarineTraffic.on('error', err => mtError(err))
MarineTraffic.connect()

const AIS = new AISGenerator()
AIS.on('ready', () => aisInfo('Generating AIS Data'))
AIS.on('nmea', sentence => {
  const sendMessage = () => {
    MarineTraffic.write(sentence)
    aisInfo('Sent AIS Message:', sentence)
  }

  if (MarineTraffic.readyState === 'open' || MarineTraffic.readyState === 'writeOnly') return sendMessage()
  if (MarineTraffic.readyState === 'closed') MarineTraffic.connect()

  MarineTraffic.once('ready', () => sendMessage())
})
AIS.on('error', err => aisError(err))
AIS.start()
