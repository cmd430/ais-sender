import { Log } from 'cmd430-utils'
import { TCPClient } from './tcpClient.js'
import { config } from './loadConfig.js'

const MARINETRAFFIC_PORT = config.marineTraffic.port
const MARINETRAFFIC_HOST = config.replay.enabled ? '127.0.0.1' : config.marineTraffic.host
const AIS_PORT = config.ais.port
const AIS_HOST = config.replay.enabled ? '127.0.0.1' : config.ais.host

const { debug: aisDebug, error: aisError, info: aisInfo } = new Log('AIS')
const { error: mtError, info: mtInfo } = new Log('Marine Traffic')

const MarineTraffic = new TCPClient(MARINETRAFFIC_PORT, MARINETRAFFIC_HOST)
MarineTraffic.once('ready', () => {
  mtInfo('Connected to Marine Traffic')
  MarineTraffic.on('ready', () => mtInfo('Reconnected to Marine Traffic'))
})
MarineTraffic.on('error', err => mtError(err))
MarineTraffic.connect()

const AIS = new TCPClient(AIS_PORT, AIS_HOST)
AIS.once('ready', () => {
  aisInfo('Connected to AIS')
  AIS.on('ready', () => aisInfo('Reconnected to AIS'))
})
AIS.on('data', data => {
  for (const sentence of data.toString().split('\r\n')) {
    if (sentence.startsWith('!AIVD')) {
      MarineTraffic.write(sentence)
      aisDebug('Sent AIS Message:', sentence)
    }
  }
})
AIS.on('error', err => aisError(err))
AIS.connect()
