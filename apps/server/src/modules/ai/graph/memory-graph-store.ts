/**
 * MemoryGraphStore — 基于 graphology 的内存图存储。
 *
 * 用于生产 ECS 环境，无需部署 Neo4j。
 * 从 StandardResume 动态建图，支持 Cypher 子集的图遍历查询。
 */

import { DirectedGraph } from 'graphology'
import type { StandardResume, LocalizedText } from '../../resume/domain/standard-resume'
import type { GraphStore, GraphSearchResult } from './graph-store.interface'

/** 从 flattened StandardResume 读取中文文本（API 已压平为字符串，但 TS 类型仍为 LocalizedText） */
function zh(value: string | LocalizedText): string {
  if (typeof value === 'string') return value
  const v = value as unknown as Record<string, string>
  return v.zh ?? v.en ?? ''
}

/** 从技术栈关键字提取技术列表并统一命名 */
function normalizeTechName(name: string): string {
  return name.replace(/^Nuxt 4$/i, 'Nuxt').replace(/^Vue 3$|^Vue3$/i, 'Vue').replace(/^Vue2$/i, 'Vue').trim()
}

export class MemoryGraphStore implements GraphStore {
  private graph: DirectedGraph | null = null

  async sync(resume: StandardResume): Promise<void> {
    const g = new DirectedGraph()
    g.addNode('person', { label: 'Person', name: zh(resume.profile.fullName), email: resume.profile.email ?? '' })

    // ── 教育 ──
    for (const edu of resume.education ?? []) {
      const schoolName = zh(edu.schoolName) || '未知学校'
      if (!g.hasNode(schoolName)) g.addNode(schoolName, { label: 'School', name: schoolName })
      g.addEdge('person', schoolName, { relation: '毕业于' })
    }

    // ── 经历 + 公司 + 行业 ──
    const techSet = new Set<string>()
    for (const exp of resume.experiences ?? []) {
      const companyName = zh(exp.companyName)
      const industryName = zh(exp.employmentType) || '通用'
      if (!g.hasNode(companyName)) g.addNode(companyName, { label: 'Company', name: companyName })
      if (!g.hasNode(industryName)) g.addNode(industryName, { label: 'Industry', name: industryName })
      g.addEdge(companyName, industryName, { relation: '属于' })
      g.addEdge('person', companyName, { relation: '任职于', role: zh(exp.role), startDate: exp.startDate, endDate: exp.endDate })

      for (const tech of exp.technologies ?? []) {
        const name = normalizeTechName(typeof tech === 'string' ? tech : (tech as unknown as Record<string, string>).zh ?? '')
        techSet.add(name)
        if (!g.hasNode(name)) g.addNode(name, { label: 'Technology', name })
        g.addEdge(companyName, name, { relation: '使用' })
      }
    }

    // ── 项目 ──
    for (const proj of resume.projects ?? []) {
      const projName = zh(proj.name)
      if (!g.hasNode(projName)) g.addNode(projName, { label: 'Project', name: projName, summary: zh(proj.summary) })
      g.addEdge('person', projName, { relation: '参与', role: zh(proj.role) })

      for (const tech of proj.technologies ?? []) {
        const name = normalizeTechName(typeof tech === 'string' ? tech : (tech as unknown as Record<string, string>).zh ?? '')
        if (!g.hasNode(name)) g.addNode(name, { label: 'Technology', name })
        g.addEdge(projName, name, { relation: '使用' })
      }
    }

    // ── 技能 → 技术 ──
    for (const skill of resume.skills ?? []) {
      const skillName = zh(skill.name)
      if (!g.hasNode(skillName)) g.addNode(skillName, { label: 'Skill', name: skillName, proficiency: skill.proficiency ?? 0 })
      g.addEdge('person', skillName, { relation: '擅长' })

      for (const kw of skill.keywords ?? []) {
        const text = typeof kw === 'string' ? kw : (kw as unknown as Record<string, string>).zh ?? ''
        for (const tech of techSet) {
          if (text.includes(tech) && tech.length > 2) {
            g.addEdge(skillName, tech, { relation: '包含' })
          }
        }
      }
    }

    // ── 兴趣 ──
    for (const interest of resume.profile?.interests ?? []) {
      const name = zh(interest.label as unknown as LocalizedText) || (interest.label as unknown as string)
      if (!g.hasNode(name)) g.addNode(name, { label: 'Interest', name })
      g.addEdge('person', name, { relation: '拥有' })
    }

    // ── 亮点 ──
    for (const hl of resume.highlights ?? []) {
      const title = zh(hl.title)
      g.addNode(title, { label: 'Highlight', title, description: zh(hl.description) })
      g.addEdge('person', title, { relation: '具备' })
    }

    this.graph = g
  }

  async search(_cypher: string): Promise<GraphSearchResult[]> {
    if (!this.graph) return []
    const results: GraphSearchResult[] = []

    // 基础图遍历：返回所有与 person 直接关联的节点
    const personNode = 'person'
    if (!this.graph.hasNode(personNode)) return []

    for (const neighbor of this.graph.outNeighbors(personNode)) {
      const attrs = this.graph.getNodeAttributes(neighbor)
      const edgeAttrs = this.graph.getEdgeAttributes(this.graph.edge(personNode, neighbor))
      const label = attrs.label as string ?? neighbor
      const rel = edgeAttrs.relation as string ?? '关联'

      results.push({
        text: `${label}: ${attrs.name ?? neighbor} — ${rel}`,
        score: 0.5,
        sourceType: 'graph',
      })

      // 二级遍历：公司/技能 → 技术
      for (const sub of this.graph.outNeighbors(neighbor)) {
        const subAttrs = this.graph.getNodeAttributes(sub)
        results.push({
          text: `  └ ${subAttrs.name ?? sub} (${subAttrs.label ?? ''})`,
          score: 0.3,
          sourceType: 'graph',
        })
      }
    }

    return results.slice(0, 20)
  }

  async clear(): Promise<void> {
    this.graph = null
  }
}
