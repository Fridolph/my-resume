export interface RagSourceEducationItem {
  id: string
  school: string
  degree: string
  major: string
  period: string
  location: string
  details?: string[]
}

export interface RagSourceExperienceProjectItem {
  id: string
  name: string
  summary: string
  coreFunctions?: string
  techStack?: string[]
  contributions?: string[]
}

export interface RagSourceExperienceItem {
  id: string
  company: string
  role: string
  period: string
  summary: string
  responsibilities?: string[]
  achievements?: string[]
  techStack?: string[]
  projects?: RagSourceExperienceProjectItem[]
}

export interface RagSourceStandaloneProjectItem {
  id: string
  name: string
  role: string
  period: string
  summary: string
  coreFunctions?: string
  techStack?: string[]
  contributions?: string[]
}

export interface RagSourceDocument {
  profile: {
    name: string
    title: string
    location: string
    experienceYears: string
    targetRole: string
    status: string
    summary: string
    links?: Array<{
      label: string
      url: string
    }>
  }
  strengths?: string[]
  skills: string[]
  education: RagSourceEducationItem[]
  experiences: RagSourceExperienceItem[]
  projects: RagSourceStandaloneProjectItem[]
  extras?: {
    openSource?: string[]
    articles?: string[]
  }
}

export interface RagChunk {
  id: string
  title: string
  section: string
  content: string
  sourceType?: 'resume' | 'knowledge'
  sourcePath?: string
}

export interface RagIndexedChunk extends RagChunk {
  embedding: number[]
}

export interface RagIndexFile {
  sourcePath: string
  blogDirectoryPath: string
  generatedAt: string
  chunkCount: number
  sourceHash: string
  knowledgeHash: string
  providerSummary?: {
    provider: string
    model: string
    mode: string
    chatModel?: string
    embeddingModel?: string
  }
  chunks: RagIndexedChunk[]
}

export interface RagSearchMatch extends RagChunk {
  score: number
}
