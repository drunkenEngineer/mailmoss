import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Chrome extension icons have to be bitmaps, so the SVG is the source of truth
// and these are generated from it. Never hand-edit the PNGs.
const SIZES = [16, 32, 48, 128]

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'assets/logo.svg')
const outDir = resolve(root, 'public/icons')

const svg = await readFile(source)
await mkdir(outDir, { recursive: true })

for (const size of SIZES) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(resolve(outDir, `icon-${String(size)}.png`), png)
  console.log(`icon-${String(size)}.png  ${String(png.length)} bytes`)
}
