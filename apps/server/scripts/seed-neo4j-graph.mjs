#!/usr/bin/env node

/**
 * Neo4j 简历图谱 — 练习脚本（独立于生产 GraphSyncService）
 *
 * 用途：学习 Cypher 建图语法，手动验证 Neo4j 图谱结构。
 * 生产环境请使用 GraphSyncService 从 StandardResume 动态生成。
 *
 * 用法：
 *   1. docker compose up neo4j
 *   2. node apps/server/scripts/seed-neo4j-graph.mjs
 *   3. 打开 http://localhost:7474 查看图谱
 */

import neo4j from 'neo4j-driver'

// ══════════════════════════════════════════════════════════
// 连接配置（和 docker-compose.yml 保持一致）
// ══════════════════════════════════════════════════════════

const URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
const USER = process.env.NEO4J_USER ?? 'neo4j'
const PASSWORD = process.env.NEO4J_PASSWORD ?? 'password'
const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
const session = driver.session()

// ══════════════════════════════════════════════════════════
// 标签前缀：MR_（防与其他项目数据冲突）
// ══════════════════════════════════════════════════════════

const P = 'MR_'

// ══════════════════════════════════════════════════════════
// Part 1：Technology 节点（具体技术栈）
//
// 对应 StandardResume：
//   - resume.experiences[].technologies[]
//   - resume.projects[].technologies[]
//   - resume.skills[].keywords[] 中提取
//
// TODO: 从你的真实简历补全（参考 /api/resume/published 的 skills 返回）
// ══════════════════════════════════════════════════════════

const techs = [
  // ── 前端 ──
  { name: 'Vue',        category: '前端', proficiency: '熟练掌握' },
  { name: 'React',      category: '前端', proficiency: '熟练掌握' },
  { name: 'Next.js',    category: '前端', proficiency: '熟练掌握' },
  { name: 'Nuxt',       category: '前端', proficiency: '熟练掌握' },
  { name: 'TypeScript', category: '前端', proficiency: '熟练掌握' },
  { name: 'TailwindCSS',category: '前端', proficiency: '熟练掌握' },
  { name: 'Sass/Less',  category: '前端', proficiency: '熟练掌握' },
  { name: 'Pinia',      category: '前端', proficiency: '熟练掌握' },
  { name: 'ECharts',    category: '前端', proficiency: '熟练掌握' },
  { name: 'D3.js',      category: '前端', proficiency: '掌握' },
  { name: 'WebSocket',  category: '前端', proficiency: '掌握' },

  // ── 后端 ──
  { name: 'Node.js',    category: '后端', proficiency: '熟练掌握' },
  { name: 'NestJS',     category: '后端', proficiency: '熟练掌握' },
  { name: 'Express',    category: '后端', proficiency: '掌握' },
  { name: 'MySQL',      category: '后端', proficiency: '掌握' },
  { name: 'PostgreSQL', category: '后端', proficiency: '掌握' },
  { name: 'SQLite',     category: '后端', proficiency: '熟练掌握' },
  { name: 'Drizzle ORM',category: '后端', proficiency: '掌握' },

  // ── AI ──
  { name: 'LangGraph',  category: 'AI', proficiency: '掌握' },
  { name: 'LangChain',  category: 'AI', proficiency: '了解' },
  { name: 'Milvus',     category: 'AI', proficiency: '掌握' },
  { name: 'ElasticSearch', category: 'AI', proficiency: '了解' },
  { name: 'Neo4j',      category: 'AI', proficiency: '学习中' },
  { name: 'RAG',        category: 'AI', proficiency: '掌握' },
  { name: 'Prompt Engineering', category: 'AI', proficiency: '掌握' },
  { name: 'Claude Code',category: 'AI', proficiency: '熟练掌握' },

  // ── 工程化 / DevOps ──
  { name: 'Docker',     category: '运维', proficiency: '掌握' },
  { name: 'pnpm',       category: '工程化', proficiency: '熟练掌握' },
  { name: 'Monorepo',   category: '工程化', proficiency: '熟练掌握' },
  { name: 'Vite',       category: '工程化', proficiency: '熟练掌握' },
  { name: 'Webpack',    category: '工程化', proficiency: '掌握' },
  { name: 'GitHub Actions', category: '运维', proficiency: '掌握' },
  { name: 'Linux',      category: '运维', proficiency: '掌握' },
]

// ══════════════════════════════════════════════════════════
// Part 2：Skill 节点（能力分类标签）
//
// TODO: 从简历 skills[].name 动态提取（参考 GraphSyncService 的做法）
// ══════════════════════════════════════════════════════════

const skillMap = {
  '前端核心能力':        ['Vue','React','Next.js','Nuxt','TypeScript','TailwindCSS','Sass/Less','Pinia','ECharts','D3.js'],
  '全栈开发能力':        ['Node.js','NestJS','Express','MySQL','PostgreSQL','SQLite','Drizzle ORM'],
  'AI Agent 开发':       ['LangGraph','LangChain','Milvus','ElasticSearch','Neo4j','RAG','Prompt Engineering','Claude Code'],
  '工程化与性能优化':    ['Docker','pnpm','Monorepo','Vite','Webpack','GitHub Actions','Linux'],
}

// ══════════════════════════════════════════════════════════
// Part 3：Company 节点（从 experiences 提取）
//
// TODO: 补全真实公司英文名（参考 /api/resume/published 的 experiences 返回）
// ══════════════════════════════════════════════════════════

const companies = [
  { name: '成都澳昇能源科技',     industry: '能源/SaaS',   startDate: '2024.08', endDate: '至今',     role: '前端开发' },
  { name: '成都一蟹科技',         industry: '医药合规/SaaS', startDate: '2024.03', endDate: '2024.08', role: '前端主管' },
  { name: '成都网思科平科技',     industry: '网络安全/ToB', startDate: '2017.07', endDate: '2024.01', role: '前端组长' },
  { name: '四川爱礼科技',         industry: '内容社区',     startDate: '2016.01', endDate: '2017.07', role: 'Web开发' },
]

// ══════════════════════════════════════════════════════════
// Part 4：Project 节点（对应简历中列出的核心项目）
// ══════════════════════════════════════════════════════════

const projects = [
  { name: 'my-resume',        company: '个人项目',   role: '全栈开发', techs: ['Next.js','NestJS','TypeScript','RAG','LangGraph'] },
  { name: 'GreenSketch',      company: '成都澳昇能源科技', role: '核心开发', techs: ['Nuxt','Vue','TypeScript','ECharts'] },
  { name: '云药客 SaaS',      company: '成都一蟹科技',     role: '项目管理', techs: ['Vue','TypeScript','pnpm','Monorepo'] },
  { name: 'EDR 安全平台',     company: '成都网思科平科技', role: '项目管理', techs: ['Vue','ECharts','D3.js','WebSocket'] },
  { name: 'LC 安全大屏',      company: '成都网思科平科技', role: '核心开发', techs: ['Vue','ECharts','D3.js','WebSocket'] },
]

// ══════════════════════════════════════════════════════════
// 主流程
// ══════════════════════════════════════════════════════════

async function main() {
  console.log('🔌 连接 Neo4j...')

  // 1. 清空旧数据
  await session.run(`MATCH (n:${P}*) DETACH DELETE n`)
  console.log('🗑  已清空旧数据')

  // 2. 建 Person 节点
  await session.run(`
    CREATE (p:${P}Person {
      name: '付寅生',
      title: 'AI 全栈工程师',
      location: '中国成都',
      email: '249121486@qq.com',
      experienceYears: 10
    })
  `)
  console.log('👤 Person 节点已创建')

  // 3. 建 Technology 节点 + 掌握关系
  for (const t of techs) {
    await session.run(`
      CREATE (tech:${P}Technology {name: $name, category: $category, proficiency: $proficiency})
      WITH tech
      MATCH (p:${P}Person {name: '付寅生'})
      CREATE (p)-[:掌握]->(tech)
    `, t)
  }
  console.log(`💻 ${techs.length} 个 Technology 节点已创建`)

  // 4. 建 Skill 节点 + 包含关系
  for (const [skillName, techNames] of Object.entries(skillMap)) {
    await session.run(`
      CREATE (s:${P}Skill {name: $name})
    `, { name: skillName })

    for (const techName of techNames) {
      await session.run(`
        MATCH (s:${P}Skill {name: $skill}), (t:${P}Technology {name: $tech})
        CREATE (t)-[:属于]->(s)
      `, { skill: skillName, tech: techName })
    }
  }
  console.log(`🏷  ${Object.keys(skillMap).length} 个 Skill 节点已创建`)

  // 5. 建 Company + 任职关系
  for (const c of companies) {
    await session.run(`
      CREATE (co:${P}Company {name: $name, industry: $industry})
      WITH co
      MATCH (p:${P}Person {name: '付寅生'})
      CREATE (p)-[:任职于 {role: $role, startDate: $startDate, endDate: $endDate}]->(co)
    `, c)
  }
  console.log(`🏢 ${companies.length} 个 Company 节点已创建`)

  // 6. 建 Project + 参与关系 + 使用技术关系
  for (const pr of projects) {
    await session.run(`
      CREATE (proj:${P}Project {name: $name, role: $role})
      WITH proj
      MATCH (p:${P}Person {name: '付寅生'})
      CREATE (p)-[:参与 {role: $role}]->(proj)
    `, pr)

    for (const techName of pr.techs) {
      await session.run(`
        MATCH (proj:${P}Project {name: $projName}), (t:${P}Technology {name: $techName})
        CREATE (proj)-[:使用]->(t)
      `, { projName: pr.name, techName })
    }

    if (pr.company !== '个人项目') {
      await session.run(`
        MATCH (proj:${P}Project {name: $projName}), (co:${P}Company {name: $company})
        CREATE (proj)-[:属于]->(co)
      `, { projName: pr.name, company: pr.company })
    }
  }
  console.log(`📦 ${projects.length} 个 Project 节点已创建`)

  // 7. 验证结果
  const result = await session.run(`
    MATCH (n:${P}*) RETURN DISTINCT labels(n) AS label, count(n) AS count
  `)
  console.log('\n📊 图谱统计：')
  result.records.forEach(r => {
    console.log(`   ${r.get('label')}: ${r.get('count').toNumber()} 个`)
  })

  console.log('\n✅ 练习脚本执行完成！打开 http://localhost:7474 查看图谱')
}

main()
  .catch(console.error)
  .finally(async () => {
    await session.close()
    await driver.close()
  })
