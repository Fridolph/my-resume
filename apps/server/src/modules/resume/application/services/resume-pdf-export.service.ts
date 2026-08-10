import { Injectable } from '@nestjs/common'
import puppeteer from 'puppeteer'

import { ResumeLocale, StandardResume } from '../../domain/standard-resume'

function l(value: { zh: string; en: string }, locale: ResumeLocale): string {
  return locale === 'en' ? (value.en || value.zh) : value.zh
}

/**
 * 构造 A4 简历 PDF 的完整 HTML 模板。
 */
function buildResumePdfHtml(resume: StandardResume, locale: ResumeLocale): string {
  const p = resume.profile
  const t = (v: { zh: string; en: string }) => l(v, locale)

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    font-size: 13px; line-height: 1.65; color: #333; background: #fff;
    width: 794px; margin: 0 auto;
  }
  @page { size: A4 portrait; margin: 10mm 0; }
  header { border-bottom: 2px solid #1a1a1a; padding: 40px 56px 20px; }
  header .profile-row { display: flex; align-items: flex-start; gap: 24px; }
  header .avatar { width: 80px; height: 80px; flex: 0 0 auto; border: 2px solid #e4e4e7; border-radius: 999px; object-fit: cover; }
  header .profile-content { min-width: 0; flex: 1; }
  header h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; letter-spacing: -.02em; }
  header .headline { font-size: 15px; color: #555; margin-top: 6px; }
  header .meta { display: flex; flex-wrap: wrap; gap: 6px 20px; font-size: 12px; color: #777; margin-top: 10px; }
  header .meta a { color: #555; text-decoration: none; }
  header .meta a:hover { color: #1d4ed8; text-decoration: underline; }
  header .links { display: flex; flex-wrap: wrap; gap: 6px 20px; border-top: 1px solid #f4f4f5; margin-top: 12px; padding-top: 12px; font-size: 12px; }
  header .links a { color: #777; text-decoration: none; }
  header .links a:hover { color: #1d4ed8; text-decoration: underline; }
  header .bio { font-size: 13px; color: #555; margin-top: 10px; line-height: 1.7; }
  main { padding: 24px 56px 40px; }
  section { margin-bottom: 18px; }
  section h2 {
    font-size: 18px; font-weight: 700; color: #333;
    border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 8px;
    break-after: avoid; page-break-after: avoid;
  }
  .highlight-item { font-size: 13px; color: #444; margin-bottom: 3px; }
  .highlight-item strong { color: #1a1a1a; }
  .edu-item, .exp-item, .proj-item { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
  .edu-item:last-child, .exp-item:last-child, .proj-item:last-child { margin-bottom: 0; }
  .edu-item .row, .exp-item .row, .proj-item .row {
    display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px 12px;
  }
  .edu-item strong, .exp-item strong, .proj-item strong { font-size: 13px; color: #1a1a1a; }
  .edu-item .date, .exp-item .date, .proj-item .date { font-size: 11px; color: #999; white-space: nowrap; }
  .edu-item .sub, .exp-item .sub, .proj-item .sub { font-size: 12px; color: #777; }
  .exp-item .summary, .proj-item .summary { font-size: 13px; color: #555; margin-top: 3px; }
  .exp-item ul, .proj-item ul { margin: 3px 0 0 16px; font-size: 13px; color: #555; }
  .exp-item ul li, .proj-item ul li { margin-bottom: 2px; }
  .exp-item .tech, .proj-item .tech { font-size: 11px; color: #aaa; margin-top: 3px; }
  .skills-item { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; font-size: 13px; color: #444; }
  .skills-item + .skills-item { margin-top: 12px; }
  .skills-item strong { color: #1a1a1a; }
  .interests { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: #555; }
  .thanks { font-size: 13px; color: #999; font-style: italic; }
</style>
</head>
<body>
<header>
  <div class="profile-row">
    ${p.hero.frontImageUrl ? `<img class="avatar" src="${escapeHtml(p.hero.frontImageUrl)}" alt="${escapeHtml(t(p.fullName))}" />` : ''}
    <div class="profile-content">
      <h1>${escapeHtml(t(p.fullName))}</h1>
      <div class="headline">${escapeHtml(t(p.headline))}</div>
      <div class="meta">
        ${[p.email, p.phone].filter(Boolean).map((v) => `<span>${escapeHtml(v!)}</span>`).join('')}
        ${p.website ? `<a href="${escapeHtml(p.website)}" target="_blank" rel="noreferrer">${escapeHtml(p.website)}</a>` : ''}
        ${p.location ? `<span>${escapeHtml(t(p.location))}</span>` : ''}
      </div>
    </div>
  </div>
  <div class="bio">${escapeHtml(t(p.summary))}</div>
  ${p.links.length ? `<div class="links">${p.links.map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(t(link.label))}</a>`).join('')}</div>` : ''}
</header>
<main>
  ${renderHighlights(resume, t, locale)}
  ${renderEducation(resume, t, locale)}
  ${renderSkills(resume, t, locale)}
  ${renderExperiences(resume, t, locale)}
  ${renderProjects(resume, t, locale)}
  ${renderInterests(resume, t, locale)}
  ${renderThanks(locale)}
</main>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHighlights(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.highlights.length) return ''
  const items = resume.highlights
    .map(
      (h) =>
        `<div class="highlight-item"><strong>${escapeHtml(t(h.title))}</strong> — ${escapeHtml(t(h.description))}</div>`,
    )
    .join('\n')
  return `<section><h2>${locale === 'en' ? 'Key Strengths' : '核心竞争力'}</h2>${items}</section>`
}

function renderEducation(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.education.length) return ''
  const items = resume.education
    .map(
      (edu) => `
    <div class="edu-item">
      <div class="row">
        <strong>${escapeHtml(t(edu.schoolName))} · ${escapeHtml(t(edu.degree))} ${escapeHtml(t(edu.fieldOfStudy))}</strong>
        <span class="date">${edu.startDate} - ${edu.endDate}</span>
      </div>
      <div class="sub">${escapeHtml(t(edu.location))}</div>
    </div>`,
    )
    .join('\n')
  return `<section><h2>${locale === 'en' ? 'Education' : '教育经历'}</h2>${items}</section>`
}

function renderSkills(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.skills.length) return ''
  const items = resume.skills
    .map(
      (sk) =>
        `<div class="skills-item"><strong>${escapeHtml(t(sk.name))}：</strong>${sk.keywords.map((k) => escapeHtml(t(k))).join('、')}</div>`,
    )
    .join('\n')
  return `<section><h2>${locale === 'en' ? 'Skills' : '专业技能'}</h2>${items}</section>`
}

function renderExperiences(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.experiences.length) return ''
  const items = resume.experiences
    .map(
      (exp) => `
    <div class="exp-item">
      <div class="row">
        <strong>${escapeHtml(t(exp.companyName))}</strong>
        <span class="date">${exp.startDate} - ${exp.endDate || '至今'}</span>
      </div>
      <div class="sub">${escapeHtml(t(exp.role))}${exp.location ? ` · ${escapeHtml(t(exp.location))}` : ''}</div>
      <div class="summary">${escapeHtml(t(exp.summary))}</div>
      ${exp.highlights.length ? `<ul>${exp.highlights.map((h) => `<li>${escapeHtml(t(h))}</li>`).join('')}</ul>` : ''}
      ${exp.technologies.length ? `<div class="tech">${exp.technologies.map((item) => escapeHtml(item)).join(' · ')}</div>` : ''}
    </div>`,
    )
    .join('\n')
  return `<section><h2>${locale === 'en' ? 'Work Experience' : '工作经历'}</h2>${items}</section>`
}

function renderProjects(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.projects.length) return ''
  const items = resume.projects
    .map(
      (proj) => `
    <div class="proj-item">
      <div class="row">
        <strong>${escapeHtml(t(proj.name))}</strong>
        <span class="date">${proj.startDate} - ${proj.endDate || '至今'}</span>
      </div>
      <div class="sub">${escapeHtml(t(proj.role))}</div>
      <div class="summary">${escapeHtml(t(proj.summary))}</div>
      ${proj.highlights.length ? `<ul>${proj.highlights.map((h) => `<li>${escapeHtml(t(h))}</li>`).join('')}</ul>` : ''}
      ${proj.technologies.length ? `<div class="tech">${proj.technologies.map((item) => escapeHtml(item)).join(' · ')}</div>` : ''}
    </div>`,
    )
    .join('\n')
  return `<section><h2>${locale === 'en' ? 'Projects' : '项目经历'}</h2>${items}</section>`
}

function renderInterests(
  resume: StandardResume,
  t: (v: { zh: string; en: string }) => string,
  locale: ResumeLocale,
): string {
  if (!resume.profile.interests.length) return ''
  const tags = resume.profile.interests
    .map(
      (item) =>
        `<span>${item.icon ? `${escapeHtml(item.icon)} ` : ''}${escapeHtml(t(item.label))}</span>`,
    )
    .join('')
  return `<section><h2>${locale === 'en' ? 'Interests' : '兴趣爱好'}</h2><div class="interests">${tags}</div></section>`
}

function renderThanks(locale: ResumeLocale): string {
  const text =
    locale === 'en'
      ? 'Thank you for taking the time to review my resume. I look forward to the opportunity to discuss how my experience can contribute to your team.'
      : '感谢您花时间阅读我的简历，期待有机会进一步交流。'
  return `<section><h2>致谢</h2><p class="thanks">${escapeHtml(text)}</p></section>`
}

@Injectable()
export class ResumePdfExportService {
  async render(resume: StandardResume, locale: ResumeLocale): Promise<Buffer> {
    const html = buildResumePdfHtml(resume, locale)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim()
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' as const })
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        printBackground: true,
        preferCSSPageSize: true,
      })
      return Buffer.from(pdf)
    } finally {
      await browser.close()
    }
  }
}
