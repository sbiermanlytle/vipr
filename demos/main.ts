import App from '../src/App'
import { DEMOS, type Demo } from './demos'

// Each program is its own chunk, loaded only when its demo is opened.
const programs = import.meta.glob('./programs/*.ts', { import: 'default' })

const list = document.getElementById('demos')!
const stage = document.getElementById('stage')!

function show(demo: Demo) {
  document.title = `${demo.name} · vipr demos`
  for (const link of list.querySelectorAll('a')) link.toggleAttribute('aria-current', link.hash === `#${demo.slug}`)

  const heading = document.createElement('h2')
  heading.textContent = demo.name
  const summary = document.createElement('p')
  summary.textContent = demo.summary
  stage.replaceChildren(heading, summary)
  if (demo.controls) {
    const controls = document.createElement('p')
    controls.className = 'controls'
    controls.textContent = demo.controls
    stage.append(controls)
  }

  // The canvas the program was written for. The selection programs also draw on 14 more, which
  // they find by the ids c0 to c13.
  const canvas = document.createElement('canvas')
  if (demo.frame === 'selection') {
    canvas.width = canvas.height = 200
    const children = document.createElement('div')
    children.className = 'children'
    for (let i = 0; i < 14; i++) {
      const child = document.createElement('canvas')
      child.id = `c${i}`
      child.width = child.height = 200
      children.append(child)
    }
    const layout = document.createElement('div')
    layout.className = 'selection'
    layout.append(canvas, children)
    stage.append(layout)
  } else {
    canvas.width = 800
    canvas.height = demo.frame === 'square' ? 800 : 400
    stage.append(canvas)
  }

  const load = programs[`./programs/${demo.file}.ts`]
  load().then((program) => new App(canvas, program, { webgl: true }))
}

for (const demo of DEMOS) {
  const item = document.createElement('li')
  const link = document.createElement('a')
  link.href = `#${demo.slug}`
  link.textContent = demo.name
  item.append(link)
  list.append(item)
}

// Gaia's programs never stop their timers, so switching demos loads the page again.
window.addEventListener('hashchange', () => window.location.reload())

const demo = DEMOS.find((d) => `#${d.slug}` === window.location.hash) ?? DEMOS[0]
show(demo)
