import { Socket } from 'node:net'
import { setTimeout } from 'node:timers/promises'

export class TCPClient extends Socket {

  /* eslint-disable lines-between-class-members */
  #attempts = 0
  #maxDealySeconds = 60
  #port
  #host
  /* eslint-enable lines-between-class-members */

  constructor (port, host) {
    super()

    this.#port = port
    this.#host = host

    this.on('connect', () => {
      this.#attempts = 0
    })
    this.on('error', () => this.reconnect())
  }

  connect () {
    return super.connect(this.#port, this.#host)
  }

  async reconnect () {
    this.end()
    await setTimeout(1000 * Math.min(this.#attempts, this.#maxDealySeconds))
    this.#attempts++
    this.connect(this.#port, this.#host)
  }

}
