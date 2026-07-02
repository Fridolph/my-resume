/**
 * GraphSyncService — 从 StandardResume 动态生成 Cypher 建图语句。
 *
 * 设计原则：
 * - 全部使用 MERGE（幂等，可重复执行）
 * - 先清空旧数据，再重建
 * - 从 StandardResume 提取，不硬编码任何具体值
 */

import { Injectable, Logger } from '@nestjs/common'
import type { StandardResume, LocalizedText } from '../../resume/domain/standard-resume'
import type { GraphStore } from './graph-store.interface'

const logger = new Logger('GraphSyncService')

/** 从 flattened StandardResume 读取文本 */
function zh(value: string | LocalizedText): string {
  if (typeof value === 'string') return value
  const v = value as unknown as Record<string, string>
  return (v.zh ?? v.en ?? '').trim()
}

/** 技术名归一化 */
function norm(name: string): string {
  return name.replace(/^Nuxt 4$/i, 'Nuxt').replace(/^Vue 3$|^Vue3$/i, 'Vue').replace(/^Vue2$/i, 'Vue').trim()
}

@Injectable()
export class GraphSyncService {
  /**
   * 从 StandardResume 动态生成并执行 Cypher 建图。
   *
   * 流程：
   * 1. 清空旧图（MATCH (n) DETACH DELETE n）
   * 2. 生成 Person 节点
   * 3. 遍历 experiences → Company + Industry + Technology 节点 + 关系
   * 4. 遍历 projects → Project 节点 + 关系
   * 5. 遍历 skills → Skill 节点 + 包含关系
   * 6. 遍历 education → School 节点 + 关系
   * 7. 遍历 interests → Interest 节点 + 关系
   * 8. 遍历 highlights → 关系
   */
  async syncToGraph(resume: StandardResume, store: GraphStore): Promise<void> {
    await store.clear()
    logger.log({ event: 'graph.sync.cleared', message: 'old graph data removed' })

    const statements: string[] = []

    // ── Person ──
    const profile = resume.profile
    statements.push(
      `MERGE (p:Person {name: "${esc(zh(profile.fullName))}"}) ` +
      `SET p.email = "${esc(profile.email ?? '')}", p.phone = "${esc(profile.phone ?? '')}"`,
    )

    // ── 经历 + 公司 + 行业 + 技术 ──
    const techSet = new Set<string>()
    for (const exp of resume.experiences ?? []) {
      const company = esc(zh(exp.companyName))
      const role = esc(zh(exp.role) || '员工')
      const industry = esc(zh(exp.employmentType) || '通用')
      const startDate = exp.startDate ?? ''
      const endDate = exp.endDate ?? ''

      statements.push(
        `MERGE (c${uid('co')}:Company {name: "${company}"}) ` +
        `SET c${uid('co')}.industry = "${industry}"`,
        `MERGE (i${uid('ind')}:Industry {name: "${industry}"})`,
        `MERGE (c${uid('co')})-[:属于]->(i${uid('ind')})`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[r${uid('rel')}:任职于 {role: "${role}", startDate: "${startDate}", endDate: "${endDate}"}]->(c${uid('co')})`,
      )

      for (const tech of exp.technologies ?? []) {
        const t = norm(typeof tech === 'string' ? tech : (tech as unknown as Record<string, string>).zh ?? '')
        if (!t) continue
        techSet.add(t)
        statements.push(
          `MERGE (t${uid('tech')}:Technology {name: "${esc(t)}"})`,
          `MERGE (c${uid('co')})-[:使用]->(t${uid('tech')})`,
        )
      }
    }

    // ── 项目 ──
    for (const proj of resume.projects ?? []) {
      const projName = esc(zh(proj.name))
      const projRole = esc(zh(proj.role) || '参与')
      const summary = esc((zh(proj.summary) || '').slice(0, 500))
      statements.push(
        `MERGE (pr${uid('pr')}:Project {name: "${projName}"}) SET pr${uid('pr')}.summary = "${summary}"`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[r${uid('pr')}:参与 {role: "${projRole}"}]->(pr${uid('pr')})`,
      )

      for (const tech of proj.technologies ?? []) {
        const t = norm(typeof tech === 'string' ? tech : (tech as unknown as Record<string, string>).zh ?? '')
        if (!t) continue
        techSet.add(t)
        statements.push(
          `MERGE (t${uid('pt')}:Technology {name: "${esc(t)}"})`,
          `MERGE (pr${uid('pr')})-[:使用]->(t${uid('pt')})`,
        )
      }
    }

    // ── 技能 → 技术 ──
    for (const skill of resume.skills ?? []) {
      const skillName = esc(zh(skill.name))
      const prof = skill.proficiency ?? 0
      statements.push(
        `MERGE (s${uid('sk')}:Skill {name: "${skillName}"}) SET s${uid('sk')}.proficiency = ${prof}`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[:擅长]->(s${uid('sk')})`,
      )

      for (const kw of skill.keywords ?? []) {
        const text = typeof kw === 'string' ? kw : (kw as unknown as Record<string, string>).zh ?? ''
        for (const tech of techSet) {
          if (text.includes(tech) && tech.length > 2) {
            statements.push(
              `MERGE (t${uid('st')}:Technology {name: "${esc(tech)}"})`,
              `MERGE (s${uid('sk')})-[:包含]->(t${uid('st')})`,
            )
          }
        }
      }
    }

    // ── 教育 ──
    for (const edu of resume.education ?? []) {
      const school = esc(zh(edu.schoolName))
      const degree = esc(zh(edu.degree))
      if (!school) continue
      statements.push(
        `MERGE (sc${uid('sc')}:School {name: "${school}"})`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[r${uid('ed')}:毕业于 {degree: "${degree}"}]->(sc${uid('sc')})`,
      )
    }

    // ── 兴趣 ──
    for (const interest of resume.profile?.interests ?? []) {
      const name = esc(typeof interest.label === 'string' ? interest.label : (interest.label as unknown as Record<string, string>).zh ?? '')
      if (!name) continue
      statements.push(
        `MERGE (int${uid('in')}:Interest {name: "${name}"})`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[:拥有]->(int${uid('in')})`,
      )
    }

    // ── 亮点 ──
    for (const hl of resume.highlights ?? []) {
      const title = esc(zh(hl.title))
      const desc = esc((zh(hl.description) || '').slice(0, 500))
      if (!title) continue
      statements.push(
        `MERGE (hl${uid('hl')}:Highlight {title: "${title}"}) SET hl${uid('hl')}.description = "${desc}"`,
        `MERGE (p${uid('p')}:Person {name: "${esc(zh(profile.fullName))}"})-[:具备]->(hl${uid('hl')})`,
      )
    }

    // ── 执行 ──
    const fullCypher = ['MATCH (n) DETACH DELETE n', ...statements].join('\n')
    logger.log({ event: 'graph.sync.generated', statementCount: statements.length + 1, size: fullCypher.length })

    // 通过 store 执行（Neo4j 直接运行 Cypher，memory 忽略）
    if (typeof (store as any).search === 'function') {
      await store.search(fullCypher)
    }

    logger.log({ event: 'graph.sync.completed', nodeTypes: ['Person', 'Company', 'Industry', 'Project', 'Technology', 'Skill', 'School', 'Interest', 'Highlight'].length })
  }
}

// ── 工具函数 ──

let idCounter = 0
function uid(prefix: string): string { return `${prefix}${++idCounter}` }
function esc(value: string): string { return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') }
