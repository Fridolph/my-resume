import { describe, expect, it } from 'vitest';

import { RagChunkService } from './rag-chunk.service';

const source = `
profile:
  name: 付寅生
  title: 前端工程师
  location: 成都
  experienceYears: 8年
  targetRole: 前端 / 全职
  status: 已离职
  summary: 负责前端开发与团队协作
skills:
  - 熟悉 Vue3 与 TypeScript
education:
  - id: scu
    school: 四川大学锦江学院
    degree: 本科
    major: 通信工程
    period: 2012 - 2016
    location: 四川成都
experiences:
  - id: yixie
    company: 成都一蟹科技有限公司
    role: 前端主管
    period: 2024
    summary: 负责前端主管工作
    responsibilities:
      - 参与需求规划
    achievements:
      - 组织 Code Review
    techStack:
      - Vue3
      - TypeScript
    projects:
      - id: yyk
        name: 云药客 SaaS 系统
        summary: SaaS 系统
        contributions:
          - 重构 Vue2 到 Vue3
projects:
  - id: resume
    name: my-resume
    role: 作者
    period: 2024 - 至今
    summary: 在线简历项目
extras:
  openSource:
    - my-resume
`;

describe('RagChunkService', () => {
  it('should parse yaml source and build stable resume chunks', () => {
    const service = new RagChunkService();
    const document = service.parseSource(source);
    const chunks = service.buildChunks(document);

    expect(document.profile.name).toBe('付寅生');
    expect(chunks.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'profile-overview',
        'skills-overview',
        'education-scu',
        'experience-yixie',
        'project-yixie-yyk',
        'project-standalone-resume',
        'extra-open-source',
      ]),
    );
    expect(chunks.find((item) => item.id === 'experience-yixie')?.content).toContain(
      '职责：参与需求规划',
    );
    expect(chunks.find((item) => item.id === 'project-yixie-yyk')?.content).toContain(
      '贡献：重构 Vue2 到 Vue3',
    );
  });
});
