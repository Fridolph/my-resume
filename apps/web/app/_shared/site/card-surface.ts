import styles from './card-surface.module.css'

export const displayCardSurfaceClass = styles.displayCardSurface

export const interactiveCardSurfaceClass = [
  styles.displayCardSurface,
  styles.displayCardInteractive,
].join(' ')

export const displayInsetSurfaceClass = styles.displayInsetSurface

export const interactiveInsetSurfaceClass = [
  styles.displayInsetSurface,
  styles.displayInsetInteractive,
].join(' ')
