

export type TransitionType = {
  fromBottom: 'fromBottom'
  fromTop: 'fromTop'
  fromLeft: 'fromLeft'
  fromRight: 'fromRight'
  fadeIn: 'fadeIn'
}

export interface RepositoryItemProps {
  name: string
  description: string
  link?: string
  transitionType?: TransitionType['fromBottom'] | TransitionType['fromTop'] | TransitionType['fromLeft'] | TransitionType['fromRight'] | TransitionType['fadeIn']
}
