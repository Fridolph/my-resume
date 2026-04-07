import { Injectable } from '@nestjs/common';
import { parse } from 'yaml';

import {
  RagChunk,
  RagSourceDocument,
  RagSourceEducationItem,
  RagSourceExperienceItem,
  RagSourceExperienceProjectItem,
  RagSourceStandaloneProjectItem,
} from './rag.types';

function compactLines(lines: Array<string | undefined | null>): string {
  return lines
    .filter((item): item is string => Boolean(item && item.trim().length > 0))
    .join('\n');
}

@Injectable()
export class RagChunkService {
  parseSource(source: string): RagSourceDocument {
    return parse(source) as RagSourceDocument;
  }

  buildChunks(document: RagSourceDocument): RagChunk[] {
    return [
      this.buildProfileChunk(document),
      ...this.buildStrengthsChunks(document),
      this.buildSkillsChunk(document),
      ...document.education.map((item) => this.buildEducationChunk(item)),
      ...document.experiences.flatMap((item) => this.buildExperienceChunks(item)),
      ...document.projects.map((item) => this.buildStandaloneProjectChunk(item)),
      ...this.buildExtraChunks(document),
    ];
  }

  private buildStrengthsChunks(document: RagSourceDocument): RagChunk[] {
    if (!document.strengths?.length) {
      return [];
    }

    return [
      {
        id: 'strengths-overview',
        title: '核心竞争力',
        section: 'strengths',
        sourceType: 'resume',
        content: compactLines([
          '核心竞争力：',
          ...document.strengths.map((item, index) => `${index + 1}. ${item}`),
        ]),
      },
    ];
  }

  private buildProfileChunk(document: RagSourceDocument): RagChunk {
    return {
      id: 'profile-overview',
      title: '基本信息',
      section: 'profile',
      sourceType: 'resume',
      content: compactLines([
        `姓名：${document.profile.name}`,
        `定位：${document.profile.title}`,
        `所在地：${document.profile.location}`,
        `工作经验：${document.profile.experienceYears}`,
        `当前状态：${document.profile.status}`,
        `求职意向：${document.profile.targetRole}`,
        `总结：${document.profile.summary}`,
        ...(document.profile.links ?? []).map(
          (item) => `${item.label}：${item.url}`,
        ),
      ]),
    };
  }

  private buildSkillsChunk(document: RagSourceDocument): RagChunk {
    return {
      id: 'skills-overview',
      title: '专业技能',
      section: 'skills',
      sourceType: 'resume',
      content: compactLines([
        '专业技能：',
        ...document.skills.map((item, index) => `${index + 1}. ${item}`),
      ]),
    };
  }

  private buildEducationChunk(item: RagSourceEducationItem): RagChunk {
    return {
      id: `education-${item.id}`,
      title: item.school,
      section: 'education',
      sourceType: 'resume',
      content: compactLines([
        `教育经历：${item.school}`,
        `学历：${item.degree}`,
        `专业：${item.major}`,
        `时间：${item.period}`,
        `地点：${item.location}`,
        ...(item.details ?? []).map((detail) => `说明：${detail}`),
      ]),
    };
  }

  private buildExperienceChunks(item: RagSourceExperienceItem): RagChunk[] {
    const experienceChunk: RagChunk = {
      id: `experience-${item.id}`,
      title: item.company,
      section: 'experience',
      sourceType: 'resume',
      content: compactLines([
        `公司经历：${item.company}`,
        `职位：${item.role}`,
        `时间：${item.period}`,
        `简介：${item.summary}`,
        ...(item.responsibilities ?? []).map((detail) => `职责：${detail}`),
        ...(item.achievements ?? []).map((detail) => `成果：${detail}`),
        item.techStack?.length ? `技术栈：${item.techStack.join('、')}` : null,
      ]),
    };

    const projectChunks = (item.projects ?? []).map((project) =>
      this.buildExperienceProjectChunk(item, project),
    );

    return [experienceChunk, ...projectChunks];
  }

  private buildExperienceProjectChunk(
    experience: RagSourceExperienceItem,
    project: RagSourceExperienceProjectItem,
  ): RagChunk {
    return {
      id: `project-${experience.id}-${project.id}`,
      title: project.name,
      section: 'project',
      sourceType: 'resume',
      content: compactLines([
        `项目经历：${project.name}`,
        `所属公司：${experience.company}`,
        `所属阶段：${experience.period}`,
        `简介：${project.summary}`,
        project.coreFunctions ? `核心功能：${project.coreFunctions}` : null,
        project.techStack?.length
          ? `技术栈：${project.techStack.join('、')}`
          : null,
        ...(project.contributions ?? []).map((detail) => `贡献：${detail}`),
      ]),
    };
  }

  private buildStandaloneProjectChunk(
    item: RagSourceStandaloneProjectItem,
  ): RagChunk {
    return {
      id: `project-standalone-${item.id}`,
      title: item.name,
      section: 'project',
      sourceType: 'resume',
      content: compactLines([
        `项目经历：${item.name}`,
        `角色：${item.role}`,
        `时间：${item.period}`,
        `简介：${item.summary}`,
        item.coreFunctions ? `核心功能：${item.coreFunctions}` : null,
        item.techStack?.length ? `技术栈：${item.techStack.join('、')}` : null,
        ...(item.contributions ?? []).map((detail) => `贡献：${detail}`),
      ]),
    };
  }

  private buildExtraChunks(document: RagSourceDocument): RagChunk[] {
    const chunks: RagChunk[] = [];

    if (document.extras?.openSource?.length) {
      chunks.push({
        id: 'extra-open-source',
        title: '参与开源',
        section: 'extra',
        sourceType: 'resume',
        content: compactLines([
          '参与开源：',
          ...document.extras.openSource.map((item) => `- ${item}`),
        ]),
      });
    }

    if (document.extras?.articles?.length) {
      chunks.push({
        id: 'extra-articles',
        title: '最近文章',
        section: 'extra',
        sourceType: 'resume',
        content: compactLines([
          '最近文章：',
          ...document.extras.articles.map((item) => `- ${item}`),
        ]),
      });
    }

    return chunks;
  }
}
