import EventEmittor from 'node:events'
import { AISEncoder } from './aisEncoder.js'
import { config } from '../loadConfig.js'

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
    this.#positionReportInterval = setInterval(() => {
      this.emit('nmea', this.#positionReport.next().value)
    }, 1000 * 60 * 3)
    this.#staticDataReportInterval = setInterval(() => {
      this.emit('nmea', this.#staticDataReport.next().value)
      this.#staticDataReportTimeout = setTimeout(() => {
        this.emit('nmea', this.#staticDataReport.next().value)
      }, 1000 * 8)
    }, 1000 * 60 * 6)
    this.emit('ready')
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
    while (true) {
      yield new AISEncoder({
        channel: config.debug.generatorData.channel,
        aistype: 18,
        repeat: 0,
        mmsi: config.debug.generatorData.mmsi,
        class: config.debug.generatorData.class,
        lon: config.debug.generatorData.lon,
        lat: config.debug.generatorData.lat,
        sog: config.debug.generatorData.sog,
        cog: config.debug.generatorData.cog,
        hdg: config.debug.generatorData.hdg,
        own: true
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
        own: true
      }).nmea

      yield new AISEncoder({ // Message 2
        channel: config.debug.generatorData.channel,
        aistype: 24,
        repeat: 0,
        mmsi: config.debug.generatorData.mmsi,
        part: 1,
        cargo: config.debug.generatorData.cargo,
        callsign: config.debug.generatorData.callsign,
        dimA: config.debug.generatorData.dimA,
        dimB: config.debug.generatorData.dimB,
        dimC: config.debug.generatorData.dimC,
        dimD: config.debug.generatorData.dimD,
        own: true
      }).nmea
    }
  }
  /* eslint-enable class-methods-use-this */
}
