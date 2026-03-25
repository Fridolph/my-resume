import { describe, expect, it } from '@jest/globals';

import { createExampleStandardResume } from './domain/standard-resume';
import { ResumePublicationService } from './resume-publication.service';

describe('ResumePublicationService', () => {
  it('should keep draft editable before publishing', () => {
    const service = new ResumePublicationService();
    const nextDraft = createExampleStandardResume();

    nextDraft.profile.headline = {
      zh: '资深全栈工程师',
      en: 'Senior Full-Stack Engineer',
    };

    service.updateDraft(nextDraft);

    expect(service.getDraft().resume.profile.headline).toEqual({
      zh: '资深全栈工程师',
      en: 'Senior Full-Stack Engineer',
    });
    expect(service.getPublished()).toBeNull();
  });

  it('should publish the current draft snapshot', () => {
    const service = new ResumePublicationService();
    const draft = createExampleStandardResume();

    draft.profile.headline = {
      zh: '可发布版本',
      en: 'Ready to Publish',
    };

    service.updateDraft(draft);

    const published = service.publish();

    expect(published.status).toBe('published');
    expect(published.resume.profile.headline).toEqual({
      zh: '可发布版本',
      en: 'Ready to Publish',
    });
    expect(published.publishedAt).toEqual(expect.any(String));
  });

  it('should keep published content stable after draft changes until republish', () => {
    const service = new ResumePublicationService();
    const firstDraft = createExampleStandardResume();

    firstDraft.profile.headline = {
      zh: '第一版',
      en: 'First Version',
    };

    service.updateDraft(firstDraft);
    service.publish();

    const secondDraft = createExampleStandardResume();
    secondDraft.profile.headline = {
      zh: '第二版草稿',
      en: 'Second Draft',
    };

    service.updateDraft(secondDraft);

    expect(service.getDraft().resume.profile.headline).toEqual({
      zh: '第二版草稿',
      en: 'Second Draft',
    });
    expect(service.getPublished()?.resume.profile.headline).toEqual({
      zh: '第一版',
      en: 'First Version',
    });
  });
});
