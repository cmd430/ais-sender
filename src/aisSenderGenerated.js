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
MarineTraffic.on('error', err => mtError(err))
MarineTraffic.connect()

const AIS = new AISGenerator()
AIS.on('ready', () => aisInfo('Generating AIS Data'))
AIS.on('nmea', sentence => {
  MarineTraffic.write(sentence)
  aisDebug('Sent AIS Message:', sentence)
})
AIS.on('error', err => aisError(err))
AIS.start()
