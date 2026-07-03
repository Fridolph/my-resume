#!/usr/bin/env node

/**
 * Neo4j 简历图谱 — 动态版练习脚本
 *
 * 从 GET /api/resume/published?locale=zh 获取真实数据，动态生成 Cypher。
 * 不硬编码任何具体值——改了简历，重新跑脚本即可同步。
 *
 * 用法：
 *   1. docker compose up neo4j (确保 server 也在运行)
 *   2. pnpm --filter @my-resume/server seed:neo4j
 *   3. 打开 http://localhost:7474 查看图谱
 */

import neo4j from 'neo4j-driver'

// ══════════════════════════════════════════════════════════
// 配置
// ══════════════════════════════════════════════════════════

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5577'
const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
const NEO4J_USER = process.env.NEO4J_USER ?? 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'password'

const P = 'MR_' // 标签前缀

// ══════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

let idCounter = 0
function uid(prefix: string): string { return `${prefix}${++idCounter}` }

// ══════════════════════════════════════════════════════════
// 主流程
// ══════════════════════════════════════════════════════════

async function main() {
  // 1. 从 API 获取真实简历数据
  console.log(`📡 从 ${API_BASE}/api/resume/published?locale=zh 获取数据...`)
  const res = await fetch(`${API_BASE}/api/resume/published?locale=zh`)
  const json = await res.json()
  const data = json.data?.resume ?? json.resume
  if (!data) throw new Error('无法获取简历数据')
  console.log(`✅ 已获取: ${data.profile.fullName}`)

  // 2. 连接 Neo4j
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    await session.run(`MATCH (n:${P}*) DETACH DELETE n`)
    console.log('🗑  旧数据已清除')

    const statements: string[] = []

    // ── 3a. Person ──
    const profile = data.profile
    statements.push(
      `CREATE (p:${P}Person {name: $name, title: $title, location: $location, email: $email})`,
    )
    await session.run(statements[statements.length - 1], {
      name: profile.fullName || '付寅生',
      title: profile.headline || '',
      location: profile.location || '',
      email: profile.email || '',
    })
    console.log('👤 Person 节点已创建')

    // ── 3b. Technology + Skill ──
    const techSet = new Set<string>()
    const skillGroups: Array<{ name: string; keywords: string[] }> = []

    for (const skill of data.skills ?? []) {
      skillGroups.push({ name: skill.name, keywords: skill.keywords ?? [] })
      // 从技能关键词中提取技术名
      for (const kw of skill.keywords ?? []) {
        const words = kw.match(/[\w.+]+(?:\.js)?/gi) ?? []
        for (const w of words) {
          if (w.length > 1 && !/^[a-z]$/i.test(w)) techSet.add(w)
        }
      }
    }

    for (const tech of techSet) {
      await session.run(
        `MERGE (t:${P}Technology {name: $name})`,
        { name: tech },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (t:${P}Technology {name: $tech})
         MERGE (p)-[:掌握]->(t)`,
        { person: profile.fullName, tech },
      )
    }
    console.log(`💻 ${techSet.size} 个 Technology 节点已创建`)

    for (const sg of skillGroups) {
      await session.run(
        `MERGE (s:${P}Skill {name: $name})`,
        { name: sg.name },
      )
      for (const kw of sg.keywords) {
        for (const tech of techSet) {
          if (kw.includes(tech) && tech.length > 2) {
            await session.run(
              `MATCH (s:${P}Skill {name: $skill}), (t:${P}Technology {name: $tech})
               MERGE (t)-[:属于]->(s)`,
              { skill: sg.name, tech },
            )
          }
        }
      }
    }
    console.log(`🏷  ${skillGroups.length} 个 Skill 节点已创建`)

    // ── 3c. Company + Industry ──
    for (const exp of data.experiences ?? []) {
      const company = exp.companyName
      const industry = exp.employmentType || '通用'
      await session.run(
        `MERGE (c:${P}Company {name: $name}) SET c.industry = $industry`,
        { name: company, industry },
      )
      await session.run(
        `MATCH (c:${P}Company {name: $company})
         MERGE (i:${P}Industry {name: $industry})
         MERGE (c)-[:属于]->(i)`,
        { company, industry },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (c:${P}Company {name: $company})
         MERGE (p)-[:任职于 {role: $role, startDate: $start, endDate: $end}]->(c)`,
        { person: profile.fullName, company, role: exp.role || '', start: exp.startDate || '', end: exp.endDate || '' },
      )
      for (const tech of exp.technologies ?? []) {
        // 正常化：Nuxt 4 → Nuxt
        const name = tech.replace(/ \d+$/, '').trim()
        await session.run(
          `MERGE (t:${P}Technology {name: $name})`,
          { name },
        )
        await session.run(
          `MATCH (c:${P}Company {name: $company}), (t:${P}Technology {name: $tech})
           MERGE (c)-[:使用]->(t)`,
          { company, tech: name },
        )
      }
    }
    console.log(`🏢 ${data.experiences?.length ?? 0} 个 Company 节点已创建`)

    // ── 3d. Project ──
    for (const proj of data.projects ?? []) {
      await session.run(
        `MERGE (pr:${P}Project {name: $name})`,
        { name: proj.name },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (pr:${P}Project {name: $proj})
         MERGE (p)-[:参与 {role: $role}]->(pr)`,
        { person: profile.fullName, proj: proj.name, role: proj.role || '' },
      )
      for (const tech of proj.technologies ?? []) {
        const name = tech.replace(/ \d+$/, '').trim()
        await session.run(
          `MERGE (t:${P}Technology {name: $name})`,
          { name },
        )
        await session.run(
          `MATCH (pr:${P}Project {name: $proj}), (t:${P}Technology {name: $tech})
           MERGE (pr)-[:使用]->(t)`,
          { proj: proj.name, tech: name },
        )
      }
    }
    console.log(`📦 ${data.projects?.length ?? 0} 个 Project 节点已创建`)

    // ── 3e. School ──
    for (const edu of data.education ?? []) {
      const school = edu.schoolName
      if (!school) continue
      await session.run(
        `MERGE (sc:${P}School {name: $name})`,
        { name: school },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (sc:${P}School {name: $school})
         MERGE (p)-[:毕业于 {degree: $degree}]->(sc)`,
        { person: profile.fullName, school, degree: edu.degree || '' },
      )
    }
    console.log(`🎓 ${data.education?.length ?? 0} 个 School 节点已创建`)

    // ── 3f. Interest ──
    for (const i of profile.interests ?? []) {
      await session.run(
        `MERGE (int:${P}Interest {name: $name})`,
        { name: i.label },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (int:${P}Interest {name: $interest})
         MERGE (p)-[:拥有]->(int)`,
        { person: profile.fullName, interest: i.label },
      )
    }
    console.log(`❤️  ${profile.interests?.length ?? 0} 个 Interest 节点已创建`)

    // ── 3g. Highlight ──
    for (const hl of data.highlights ?? []) {
      await session.run(
        `MERGE (hl:${P}Highlight {title: $title}) SET hl.description = $desc`,
        { title: hl.title, desc: (hl.description || '').slice(0, 500) },
      )
      await session.run(
        `MATCH (p:${P}Person {name: $person}), (hl:${P}Highlight {title: $title})
         MERGE (p)-[:具备]->(hl)`,
        { person: profile.fullName, title: hl.title },
      )
    }
    console.log(`✨ ${data.highlights?.length ?? 0} 个 Highlight 节点已创建`)

    // 4. 统计
    const result = await session.run(
      `MATCH (n:${P}*) RETURN DISTINCT labels(n) AS label, count(n) AS count`,
    )
    console.log('\n📊 图谱统计：')
    result.records.forEach(r => {
      console.log(`   ${r.get('label').join(', ')}: ${r.get('count').toNumber()} 个`)
    })
    console.log('\n✅ 动态建图完成！打开 http://localhost:7474 查看图谱')
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error)
