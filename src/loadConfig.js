import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const config = JSON.parse(await readFile(join(process.cwd(), 'config.json'), {
  encoding: 'utf8',
  flag: 'r'
}))
