// The shapes of canvas Gaia's programs were written for: a square, a landscape twice as wide as
// it's tall, or the selection layout, a main canvas and 14 more for the children to choose from.
export type Frame = 'square' | 'landscape' | 'selection'

export interface Demo {
  // Its address: index.html#<slug>.
  slug: string
  name: string
  // The program, programs/<file>.ts.
  file: string
  frame: Frame
  summary: string
  // How to drive it, for demos that take input beyond a click.
  controls?: string
}

const STEP = 'Press → to grow it a step and ← to go back.'

export const DEMOS: Demo[] = [
  { slug: 'biomorph-selection', name: 'Biomorph Selection', file: 'BiomorphSelection', frame: 'selection', summary: 'Breed biomorphs by hand: click one of the 14 children, each with one gene mutated, to make it the parent of the next generation.' },
  { slug: 'biomorph-selection-v2', name: 'Biomorph Selection V2', file: 'BiomorphSelectionV2', frame: 'selection', summary: 'A second take on Biomorph Selection, whose genes also change the length of the branches at different depths.' },
  { slug: 'biomorph', name: 'Biomorph', file: 'Biomorphs', frame: 'square', summary: 'One biomorph, drawn from nine random genes that set its angles, lengths and depth.' },
  { slug: 'origins', name: 'Origins', file: 'Origins', frame: 'landscape', summary: 'A single seed that grows cell by cell, spending the energy it stores.', controls: STEP },
  { slug: 'origins-v2', name: 'Origins V2', file: 'OriginsV2', frame: 'landscape', summary: 'Seeds on the ground that grow into plants together.', controls: STEP },
  { slug: 'grassland', name: 'Grassland', file: 'Grassland', frame: 'landscape', summary: 'A field of grass growing up from seeds scattered on the ground.', controls: STEP },
  { slug: 'growing-tree', name: 'Growing Tree', file: 'GrowingTree', frame: 'landscape', summary: 'A tree growing from its trunk out to the tips of its branches.', controls: STEP },
  { slug: 'trees', name: 'Trees', file: 'Trees', frame: 'landscape', summary: 'A row of trees, each grown from its own random genes, in its own color.' },
  { slug: 'tree', name: 'Tree', file: 'Tree', frame: 'square', summary: 'One tree, its branches splitting the same way at every level.' },
  { slug: 'conway', name: 'Conway', file: 'Conway', frame: 'square', summary: 'Conway’s Game of Life from a random start, in a random color.' },
  { slug: 'pattern-loop', name: 'Pattern Loop', file: 'PatternLoop', frame: 'square', summary: 'A grid of tiny cells redrawn over and over in new random patterns.' },
  { slug: 'grid', name: 'Grid', file: 'Grid', frame: 'square', summary: 'A grid of squares in random colors, recolored as it runs.' },
  { slug: 'blocks', name: 'Blocks', file: 'Blocks', frame: 'square', summary: 'Rectangles of random sizes and colors, piled on top of one another.' },
]
