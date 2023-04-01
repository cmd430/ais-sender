export class AISEncoder {

  #payload = new Buffer.alloc(425).fill(0x0)
  #payloadSize = 0
  #nmea = []

  constructor (msg) {
    this.#PutInt(msg.aistype, 0, 6)
    this.#PutInt(msg.repeat, 6, 2)
    this.#PutInt(msg.mmsi, 8, 30)

    let lat, lon
    switch (msg.aistype) {
      case 1: {}
      case 2: {}
      case 3: { // class A position report
        this.#PutInt(msg.navstatus, 38, 4)
        lon = parseInt(msg.lon * 600000)
        if (lon < 0) lon |= 0x08000000
        this.#PutInt(lon, 61, 28)
        lat = parseInt(msg.lat * 600000)
        if (lat < 0) lat |= 0x04000000
        this.#PutInt(lat, 89, 27)
        const rot = parseInt(msg.rot)
        this.#PutInt(rot, 42, 8)
        const sog = parseInt(msg.sog * 10)
        this.#PutInt(sog, 50, 10)
        const cog = parseInt(msg.cog * 10)
        this.#PutInt(cog, 116, 12)
        const hdg = parseInt(msg.hdg) || parseInt(msg.cog)
        this.#PutInt(hdg, 128, 9)
        this.#PutInt (60, 137, 6)
        this.#PutInt (msg.smi, 143, 2)
        this.#payloadSize = 168
        break
      } case 18: { // class B position report
        const sog = parseInt(msg.sog * 10)
        this.#PutInt(sog, 46, 10)
        const accuracy = parseInt(msg.accuracy)
        this.#PutInt(accuracy, 56, 1)
        lon = parseInt(msg.lon * 600000)
        if (lon < 0) lon |= 0x08000000
        this.#PutInt(lon, 57, 28)
        lat = parseInt(msg.lat * 600000)
        if (lat < 0) lat |= 0x04000000
        this.#PutInt(lat, 85, 27)
        const cog = parseInt(msg.cog * 10)
        this.#PutInt(cog, 112, 12)
        const hdg = parseInt(msg.hdg)|| parseInt(msg.cog)
        this.#PutInt(hdg, 124, 9)
        this.#PutInt (60,  133, 6)
        this.#payloadSize = 168
        break
      } case 5: {
//      Get the AIS Version indicator
//      0 = station compliant with Recommendation ITU-R M.1371-1
//      1 = station compliant with Recommendation ITU-R M.1371-3
//      2-3 = station compliant with future editions
        this.#PutInt(1, 38, 2)
        this.#PutInt(msg.imo ,40, 30)
        this.#PutStr(msg.callsign, 70, 42)
        this.#PutStr(msg.shipname, 112, 120)
        this.#PutInt(msg.cargo , 232, 8)
        this.#PutInt(msg.dimA , 240, 9)
        this.#PutInt(msg.dimB , 249, 9)
        this.#PutInt(msg.dimC , 258, 6)
        this.#PutInt(msg.dimD , 264, 6)
        this.#PutInt(msg.etaMo , 274, 4)
        this.#PutInt(msg.etaDay , 278, 5)
        this.#PutInt(msg.etaHr , 283, 5)
        this.#PutInt(msg.etaMin , 288, 6)
        const draught = parseInt(msg.draught * 10)
        this.#PutInt((parseInt(draught * 10)), 294, 8)
        this.#PutStr(msg.destination, 302, 120)
        this.#payloadSize = 422
        break
      } case 21: {
        this.#PutInt(msg.aid_type, 38, 5)
        this.#PutStr(msg.atonname, 43, 120)
        const accuracy= parseInt(msg.accuracy)
        this.#PutInt(accuracy, 163, 1)
        lon = parseInt(msg.lon * 600000)
        if (lon < 0) lon |= 0x08000000
        this.#PutInt(lon, 164, 28 )
        lat = parseInt(msg.lat * 600000)
        if (lat < 0) lat |= 0x04000000
        this.#PutInt(lat, 192, 27)
        this.#PutInt(msg.dimA, 219, 9)
        this.#PutInt(msg.dimB, 228, 9)
        this.#PutInt(msg.dimC, 237, 6)
        this.#PutInt(msg.dimD, 243, 6)
        this.#PutInt(60, 253, 6)
        this.#PutInt(msg.off_position, 259, 1)
        this.#PutInt(msg.raim, 268, 1)
        this.#PutInt(msg.virtual_aid, 269, 1)
        this.#PutInt(msg.assigned, 270, 1)
        break
      } case 24: { // Vesel static information
        this.#PutInt(msg.part, 38, 2)
        if (msg.part === 0) {
          this.#PutStr(msg.shipname, 40, 120)
          this.#payloadSize = 160
        } else if (msg.part === 1) {
          this.#PutInt(msg.cargo, 40, 8)
          this.#PutStr(msg.callsign, 90, 42)
          this.#PutInt(msg.dimA, 132, 9)
          this.#PutInt(msg.dimB, 141, 9)
          this.#PutInt(msg.dimC, 150, 6)
          this.#PutInt(msg.dimD, 156, 6)
          this.#payloadSize = 168
        }
        break
      } case 25: { // single slot Binary message
        this.#PutInt(1, 38, 1)
        this.#PutInt(msg.mmsi, 40, 20)
        this.#payloadSize = 168
        break
      } default: {
        break
      }
    }

    let size = parseInt(this.#payloadSize / 6)
    if (this.#payloadSize % 6 > 0) size++

    for (let i = 0; i < size; i++) {
      const chr = this.#payload[i]

      if (chr < 40) {
        this.#payload[i] = chr + 48
      } else {
        this.#payload[i] = chr + 56
      }
    }

    const nmea = []
    nmea [0] = msg.own === true ? '!AIVDO' : '!AIVDM'
    nmea [1] = '1'
    nmea [2] = '1'
    nmea [3] = ''
    nmea [4] = 'A'
    nmea [5] = this.#payload.toString('utf8', 0, size)
    nmea [6] = 0

    const packet = nmea.toString()

    let checksum = 0
    for (let i = 1; i < packet.length; i++) {
      checksum = checksum ^ packet.charCodeAt(i)
    }

    if (checksum < 16) {
      this.#nmea = packet + '*0' + checksum.toString(16).toUpperCase()
    } else {
      this.#nmea = packet + '*' + checksum.toString(16).toUpperCase()
    }

    this.nmea = this.#nmea
  }

  #PutInt (number, start, len) {
    let c0, tp, ti, ts, t0
    if (number === undefined) return
    // keep track of payload size
    if ((start+len) > this.#payloadSize) this.#payloadSize = start + len
    for (let i = 0; i < len; i++) {
      c0 = (number >> i) & 1
      if (c0 !== 0) {
        tp = parseInt((start + len - i -1) / 6)
        ti = len - i -1
        ts = 5 - (start + ti) % 6
        t0 = 1 << ts
        this.#payload[tp] |= t0
      }
    }
  }

  #PutStr (string, start, len) {
    let cx, c0, tp, ts, t0

    if (string === undefined) return
    string = string.toUpperCase()
    if ((start+len) > this.#payloadSize) this.#payloadSize = start + len

    len = parseInt(len / 6)
    if (len > string.length) len = string.length
    let bitidx = start
    for (let idx = 0; idx < len; idx++) {
      cx = string.charCodeAt(idx)
      for (let j = 5; j >= 0; j--) {
        c0 = (cx >> j) & 1
        if (c0 !== 0) {
          tp = parseInt(bitidx / 6)
          ts = 5 - (bitidx % 6)
          t0 = 1 << ts
          this.#payload[tp] |= t0
        }
        bitidx++
      }
    }
  }

}
