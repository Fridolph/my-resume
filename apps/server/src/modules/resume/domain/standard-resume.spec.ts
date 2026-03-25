import { describe, expect, it } from '@jest/globals';

import {
  createEmptyLocalizedText,
  createEmptyStandardResume,
  createExampleStandardResume,
  getStandardResumeModuleKeys,
  isLocalizedText,
  validateStandardResume,
} from './standard-resume';

describe('standard resume domain', () => {
  it('should expose stable module boundaries for the standard resume', () => {
    expect(getStandardResumeModuleKeys()).toEqual([
      'profile',
      'education',
      'experiences',
      'projects',
      'skills',
      'highlights',
    ]);
  });

  it('should create an empty bilingual resume skeleton', () => {
    const resume = createEmptyStandardResume();

    expect(resume.meta.defaultLocale).toBe('zh');
    expect(resume.meta.locales).toEqual(['zh', 'en']);
    expect(resume.profile.fullName).toEqual({
      zh: '',
      en: '',
    });
    expect(resume.education).toEqual([]);
    expect(resume.experiences).toEqual([]);
    expect(resume.projects).toEqual([]);
    expect(resume.skills).toEqual([]);
    expect(resume.highlights).toEqual([]);
  });

  it('should keep localized text objects strict and bilingual', () => {
    expect(isLocalizedText(createEmptyLocalizedText())).toBe(true);
    expect(isLocalizedText({ zh: '你好', en: 'Hello' })).toBe(true);
    expect(isLocalizedText({ zh: '只有中文' })).toBe(false);
    expect(isLocalizedText({ zh: '你好', en: 'Hello', ja: 'こんにちは' })).toBe(
      false,
    );
  });

  it('should validate a complete standard resume example', () => {
    const resume = createExampleStandardResume();

    expect(validateStandardResume(resume)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('should reject invalid bilingual content shapes', () => {
    const resume = createExampleStandardResume() as ReturnType<
      typeof createExampleStandardResume
    > & {
      profile: {
        fullName: { zh: string };
      };
    };

    resume.profile.fullName = {
      zh: '付寅生',
    };

    expect(validateStandardResume(resume)).toEqual({
      valid: false,
      errors: ['profile.fullName must be a localized text object'],
    });
  });
});
