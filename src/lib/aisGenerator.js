import EventEmittor from 'node:events'
import { AISEncoder } from './aisEncoder.js'
import { config } from '../loadConfig.js'

const isOwnMsg = true

export class AISGenerator extends EventEmittor {

  /* eslint-disable lines-between-class-members */
  #positionReportInterval = null
  #staticDataReportInterval = null
  #staticDataReportTimeout = null
  #positionReport
  #staticDataReport
  /* eslint-enable lines-between-class-members */

  constructor () {
    super()

    this.#positionReport = this.#positionReportGenerator()
    this.#staticDataReport = this.#staticDataReportGenerator()
  }

  start () {
    this.emit('ready')

    this.#positionReportInterval = setInterval(() => {
      this.emit('nmea', this.#positionReport.next().value)
    }, 1000 * 60 * 3)
    this.#staticDataReportInterval = setInterval(() => {
      this.emit('nmea', this.#staticDataReport.next().value)
      this.#staticDataReportTimeout = setTimeout(() => {
        this.emit('nmea', this.#staticDataReport.next().value)
      }, 1000 * 8)
    }, 1000 * 60 * 6)

    this.emit('nmea', this.#positionReport.next().value)
    this.emit('nmea', this.#staticDataReport.next().value)
    setTimeout(() => this.emit('nmea', this.#staticDataReport.next().value), 1000 * 8)
  }

  stop () {
    try {
      clearInterval(this.#positionReportInterval)
      clearInterval(this.#staticDataReportInterval)
      clearTimeout(this.#staticDataReportTimeout)
    } catch (err) {
      this.emit('error', err)
    }
    this.emit('finished')
  }

  /* eslint-disable class-methods-use-this */
  *#positionReportGenerator () { // Should Call every 3min
    const lon = config.debug.generatorData.lon
    const lat = config.debug.generatorData.lat
    const sog = config.debug.generatorData.sog
    const cog = config.debug.generatorData.hdg
    const hdg = config.debug.generatorData.hdg

    const randomNumberInRange = (min, max) => Number((Math.random() * (max - min)) + min)
    const rangedNumber = (num, decimals = 0) => {
      const numStr = String(num)
      const lastDigit = Number(numStr.slice(-1))
      return Number(Number(`${numStr.slice(0, -1)}${randomNumberInRange(lastDigit - 1, lastDigit + 1, 0)}`).toFixed(decimals))
    }

    while (true) {
      yield new AISEncoder({
        channel: config.debug.generatorData.channel,
        aistype: 18,
        repeat: 0,
        mmsi: config.debug.generatorData.mmsi,
        class: config.debug.generatorData.class,
        lon: lon,
        lat: lat,
        sog: Number(sog || (rangedNumber(sog, 0) / 10).toFixed(1)),
        cog: rangedNumber(cog, 1),
        hdg: rangedNumber(hdg),
        own: isOwnMsg
      }).nmea
    }
  }


  *#staticDataReportGenerator () { // Should Call every 6min + 30sec
    while (true) {
      yield new AISEncoder({ // Message 1
        channel: config.debug.generatorData.channel,
        aistype: 24,
        repeat: 0,
        mmsi: config.debug.generatorData.mmsi,
        shipname: config.debug.generatorData.shipname,
        part: 0,
        own: isOwnMsg
      }).nmea

      yield new AISEncoder({ // Message 2
        channel: config.debug.generatorData.channel,
        aistype: 24,
        repeat: 0,
        mmsi: config.debug.generatorData.mmsi,
        part: 1,
        cargo: config.debug.generatorData.cargo,
        callsign: config.debug.generatorData.callsign,
        vendor: config.debug.generatorData.vendor,
        dimA: config.debug.generatorData.dimA,
        dimB: config.debug.generatorData.dimB,
        dimC: config.debug.generatorData.dimC,
        dimD: config.debug.generatorData.dimD,
        own: isOwnMsg
      }).nmea
    }
  }
  /* eslint-enable class-methods-use-this */
}
