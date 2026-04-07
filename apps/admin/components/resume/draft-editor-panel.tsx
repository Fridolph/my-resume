'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
} from '@heroui/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { fetchDraftResume, updateDraftResume } from '../../lib/resume-draft-api';
import type {
  ResumeDraftSnapshot,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumeSkillGroup,
  StandardResume,
} from '../../lib/resume-types';
import { EducationSection } from './education-section';
import { ExperiencesSection } from './experiences-section';
import { ProfileSection } from './profile-section';
import { ProjectsSection } from './projects-section';
import { HighlightsSection, SkillsSection } from './skills-highlights-sections';
import {
  buildDraftFieldKey,
  buildDraftFieldValues,
  buildSortableCollectionState,
  clearLocalizedLineValues,
  clearLocalizedTextValue,
  clearProfileInterestValues,
  cloneResume,
  collectionNeedsDraftFieldSync,
  copyLocalizedLineValues,
  copyLocalizedTextValue,
  copyProfileInterestValues,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyHighlight,
  createEmptyProfileHero,
  createEmptyProfileInterest,
  createEmptyProfileLink,
  createEmptyProject,
  createEmptySkillGroup,
  createEmptySortableCollectionState,
  ensureHeroSlogans,
  formatIsoDateTime,
  mergeLocalizedLines,
  parseCommaSeparatedValues,
  parseLineSeparatedValues,
  reorderResumeCollection,
  type DraftEditorStatus,
  type DraftFieldValues,
  type EditorLocaleMode,
  type SortableCollectionKey,
  type SortableCollectionState,
} from './draft-editor-helpers';

interface ResumeDraftEditorPanelProps {
  apiBaseUrl: string;
  accessToken: string;
  canEdit: boolean;
  loadDraft?: typeof fetchDraftResume;
  saveDraft?: typeof updateDraftResume;
}

export function ResumeDraftEditorPanel({
  apiBaseUrl,
  accessToken,
  canEdit,
  loadDraft = fetchDraftResume,
  saveDraft = updateDraftResume,
}: ResumeDraftEditorPanelProps) {
  const [status, setStatus] = useState<DraftEditorStatus>('idle');
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSnapshot | null>(
    null,
  );
  const [resumeDraft, setResumeDraft] = useState<StandardResume | null>(null);
  const [draftFieldValues, setDraftFieldValues] = useState<DraftFieldValues>({});
  const [sortableCollections, setSortableCollections] = useState<SortableCollectionState>(
    createEmptySortableCollectionState(),
  );
  const [editorLocaleMode, setEditorLocaleMode] = useState<EditorLocaleMode>('zh');
  const [pendingSave, setPendingSave] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sortableIdCounterRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function nextSortableId(scope: SortableCollectionKey) {
    sortableIdCounterRef.current += 1;
    return `${scope}-${sortableIdCounterRef.current}`;
  }

  function replaceSortableCollections(nextResume: StandardResume) {
    setSortableCollections(buildSortableCollectionState(nextResume, nextSortableId));
  }

  function updateSortableCollection(
    collection: SortableCollectionKey,
    updater: (currentIds: string[]) => string[],
  ) {
    setSortableCollections((current) => ({
      ...current,
      [collection]: updater(current[collection]),
    }));
  }

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setFeedbackMessage(null);

    loadDraft({
      apiBaseUrl,
      accessToken,
    })
      .then((snapshot) => {
        setDraftSnapshot(snapshot);
        setResumeDraft(cloneResume(snapshot.resume));
        setDraftFieldValues(buildDraftFieldValues(snapshot.resume));
        replaceSortableCollections(snapshot.resume);
        setStatus('ready');
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : '草稿读取失败，请稍后重试',
        );
        setStatus('error');
      });
  }, [accessToken, apiBaseUrl, canEdit, loadDraft]);

  const lastUpdatedLabel = useMemo(() => {
    if (!draftSnapshot) {
      return null;
    }

    return formatIsoDateTime(draftSnapshot.updatedAt);
  }, [draftSnapshot]);

  const isTranslationMode = editorLocaleMode === 'en';

  function handleCollectionDragEnd(
    collection: SortableCollectionKey,
    event: DragEndEvent,
  ) {
    const { active, over } = event;

    if (!resumeDraft || !over || active.id === over.id) {
      return;
    }

    const collectionIds = sortableCollections[collection];
    const fromIndex = collectionIds.indexOf(String(active.id));
    const toIndex = collectionIds.indexOf(String(over.id));

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    updateSortableCollection(collection, (currentIds) =>
      arrayMove(currentIds, fromIndex, toIndex),
    );

    updateResumeDraft(
      (draft) => {
        const nextDraft = reorderResumeCollection(draft, collection, fromIndex, toIndex);

        draft.meta = nextDraft.meta;
        draft.profile = nextDraft.profile;
        draft.education = nextDraft.education;
        draft.experiences = nextDraft.experiences;
        draft.projects = nextDraft.projects;
        draft.skills = nextDraft.skills;
        draft.highlights = nextDraft.highlights;
      },
      {
        syncDraftFields: collectionNeedsDraftFieldSync(collection),
      },
    );
  }

  function updateResumeDraft(
    mutator: (draft: StandardResume) => void,
    options?: { syncDraftFields?: boolean },
  ) {
    let nextDraftForDraftFields: StandardResume | null = null;

    setResumeDraft((current) => {
      if (!current) {
        return current;
      }

      const nextDraft = cloneResume(current);
      mutator(nextDraft);
      nextDraftForDraftFields = nextDraft;
      return nextDraft;
    });

    if (options?.syncDraftFields && nextDraftForDraftFields) {
      setDraftFieldValues(buildDraftFieldValues(nextDraftForDraftFields));
    }
  }

  function showTranslationPlaceholder(scopeTitle: string) {
    setErrorMessage(null);
    setFeedbackMessage(`${scopeTitle} 的 AI 翻译入口将在后续 issue 接入，这里先把工作区和人工校对路径立住。`);
  }

  function copyProfileTranslations() {
    updateResumeDraft(
      (draft) => {
        copyLocalizedTextValue(draft.profile.fullName);
        copyLocalizedTextValue(draft.profile.headline);
        copyLocalizedTextValue(draft.profile.summary);
        copyLocalizedTextValue(draft.profile.location);
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
        draft.profile.links.forEach((link) => {
          copyLocalizedTextValue(link.label);
        });
        draft.profile.interests = copyProfileInterestValues(draft.profile.interests);
        draft.profile.hero.slogans = copyLocalizedLineValues(draft.profile.hero.slogans);
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将基础信息中的中文内容复制到英文翻译工作区。');
  }

  function clearProfileTranslations() {
    updateResumeDraft(
      (draft) => {
        clearLocalizedTextValue(draft.profile.fullName);
        clearLocalizedTextValue(draft.profile.headline);
        clearLocalizedTextValue(draft.profile.summary);
        clearLocalizedTextValue(draft.profile.location);
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
        draft.profile.links.forEach((link) => {
          clearLocalizedTextValue(link.label);
        });
        draft.profile.interests = clearProfileInterestValues(draft.profile.interests);
        draft.profile.hero.slogans = clearLocalizedLineValues(draft.profile.hero.slogans);
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空基础信息中的英文翻译字段。');
  }

  function copyEducationTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          copyLocalizedTextValue(education.schoolName);
          copyLocalizedTextValue(education.degree);
          copyLocalizedTextValue(education.fieldOfStudy);
          copyLocalizedTextValue(education.location);
          education.highlights = copyLocalizedLineValues(education.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将教育经历中的中文内容复制到英文翻译工作区。');
  }

  function clearEducationTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          clearLocalizedTextValue(education.schoolName);
          clearLocalizedTextValue(education.degree);
          clearLocalizedTextValue(education.fieldOfStudy);
          clearLocalizedTextValue(education.location);
          education.highlights = clearLocalizedLineValues(education.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空教育经历中的英文翻译字段。');
  }

  function copyExperienceTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          copyLocalizedTextValue(experience.companyName);
          copyLocalizedTextValue(experience.role);
          copyLocalizedTextValue(experience.employmentType);
          copyLocalizedTextValue(experience.location);
          copyLocalizedTextValue(experience.summary);
          experience.highlights = copyLocalizedLineValues(experience.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将工作经历中的中文内容复制到英文翻译工作区。');
  }

  function clearExperienceTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          clearLocalizedTextValue(experience.companyName);
          clearLocalizedTextValue(experience.role);
          clearLocalizedTextValue(experience.employmentType);
          clearLocalizedTextValue(experience.location);
          clearLocalizedTextValue(experience.summary);
          experience.highlights = clearLocalizedLineValues(experience.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空工作经历中的英文翻译字段。');
  }

  function copyProjectTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          copyLocalizedTextValue(project.name);
          copyLocalizedTextValue(project.role);
          copyLocalizedTextValue(project.summary);
          project.highlights = copyLocalizedLineValues(project.highlights);
          project.links.forEach((link) => {
            copyLocalizedTextValue(link.label);
          });
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将项目经历中的中文内容复制到英文翻译工作区。');
  }

  function clearProjectTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          clearLocalizedTextValue(project.name);
          clearLocalizedTextValue(project.role);
          clearLocalizedTextValue(project.summary);
          project.highlights = clearLocalizedLineValues(project.highlights);
          project.links.forEach((link) => {
            clearLocalizedTextValue(link.label);
          });
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空项目经历中的英文翻译字段。');
  }

  function copySkillTranslations() {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        copyLocalizedTextValue(skill.name);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已将技能组名称复制到英文翻译工作区。');
  }

  function clearSkillTranslations() {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        clearLocalizedTextValue(skill.name);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已清空技能组中的英文翻译字段。');
  }

  function copyHighlightTranslations() {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        copyLocalizedTextValue(highlight.title);
        copyLocalizedTextValue(highlight.description);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已将亮点中的中文内容复制到英文翻译工作区。');
  }

  function clearHighlightTranslations() {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        clearLocalizedTextValue(highlight.title);
        clearLocalizedTextValue(highlight.description);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已清空亮点中的英文翻译字段。');
  }

  function renderTranslationActions(
    scopeTitle: string,
    handlers: {
      onCopy: () => void;
      onClear: () => void;
    },
  ) {
    if (!isTranslationMode) {
      return null;
    }

    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          aria-label={`${scopeTitle} 复制中文到英文`}
          onClick={handlers.onCopy}
          size="sm"
          type="button"
          variant="outline"
        >
          复制中文到英文
        </Button>
        <Button
          aria-label={`${scopeTitle} 清空英文`}
          onClick={handlers.onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          清空英文
        </Button>
        <Button
          aria-label={`${scopeTitle} AI 翻译入口预留`}
          onClick={() => showTranslationPlaceholder(scopeTitle)}
          size="sm"
          type="button"
          variant="ghost"
        >
          AI 翻译入口预留
        </Button>
      </div>
    );
  }

  function updateProfileLocalizedField(
    field: keyof Pick<ResumeProfile, 'fullName' | 'headline' | 'summary' | 'location'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile[field][locale] = value;
    });
  }

  function updateProfilePlainField(
    field: keyof Pick<ResumeProfile, 'email' | 'phone' | 'website'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile[field] = value;
    });
  }

  function updateProfileHeroField(
    field: keyof Pick<ResumeProfileHero, 'frontImageUrl' | 'backImageUrl' | 'linkUrl'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile.hero = ensureHeroSlogans(draft.profile.hero ?? createEmptyProfileHero());
      draft.profile.hero[field] = value;
    });
  }

  function updateProfileHeroSlogans(locale: 'zh' | 'en', value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('profile', 'hero', 'slogans', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.profile.hero = ensureHeroSlogans(draft.profile.hero ?? createEmptyProfileHero());
      draft.profile.hero.slogans = mergeLocalizedLines(
        draft.profile.hero.slogans,
        locale,
        value,
      ).slice(0, 2);

      if (draft.profile.hero.slogans.length < 2) {
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
      }
    });
  }

  function updateProfileLinkField(
    index: number,
    field: 'label' | 'url' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'url') {
        draft.profile.links[index].url = value;
        return;
      }

      if (field === 'icon') {
        draft.profile.links[index].icon = value.trim() ? value : undefined;
        return;
      }

      draft.profile.links[index].label[locale ?? 'zh'] = value;
    });
  }

  function updateProfileInterestField(
    index: number,
    field: 'label' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'icon') {
        draft.profile.interests[index].icon = value.trim() ? value : undefined;
        return;
      }

      draft.profile.interests[index].label[locale ?? 'zh'] = value;
    });
  }

  function addProfileLink() {
    updateResumeDraft((draft) => {
      draft.profile.links.push(createEmptyProfileLink());
    });
    updateSortableCollection('profileLinks', (currentIds) => [
      ...currentIds,
      nextSortableId('profileLinks'),
    ]);
  }

  function addProfileInterest() {
    updateResumeDraft((draft) => {
      draft.profile.interests.push(createEmptyProfileInterest());
    });
    updateSortableCollection('profileInterests', (currentIds) => [
      ...currentIds,
      nextSortableId('profileInterests'),
    ]);
  }

  function removeProfileLink(index: number) {
    updateResumeDraft((draft) => {
      draft.profile.links.splice(index, 1);
    });
    updateSortableCollection('profileLinks', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function removeProfileInterest(index: number) {
    updateResumeDraft((draft) => {
      draft.profile.interests.splice(index, 1);
    });
    updateSortableCollection('profileInterests', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateEducationLocalizedField(
    index: number,
    field: keyof Pick<
      ResumeEducationItem,
      'schoolName' | 'degree' | 'fieldOfStudy' | 'location'
    >,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.education[index][field][locale] = value;
    });
  }

  function updateEducationPlainField(
    index: number,
    field: keyof Pick<ResumeEducationItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.education[index][field] = value;
    });
  }

  function updateEducationHighlights(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('education', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.education[index].highlights = mergeLocalizedLines(
        draft.education[index].highlights,
        locale,
        value,
      );
    });
  }

  function addEducation() {
    updateResumeDraft(
      (draft) => {
        draft.education.push(createEmptyEducation());
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('education', (currentIds) => [
      ...currentIds,
      nextSortableId('education'),
    ]);
  }

  function removeEducation(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.education.splice(index, 1);
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('education', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateExperienceLocalizedField(
    index: number,
    field: keyof Pick<
      ResumeExperienceItem,
      'companyName' | 'role' | 'employmentType' | 'location' | 'summary'
    >,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.experiences[index][field][locale] = value;
    });
  }

  function updateExperiencePlainField(
    index: number,
    field: keyof Pick<ResumeExperienceItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.experiences[index][field] = value;
    });
  }

  function updateExperienceHighlights(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('experience', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.experiences[index].highlights = mergeLocalizedLines(
        draft.experiences[index].highlights,
        locale,
        value,
      );
    });
  }

  function updateExperienceTechnologies(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('experience', index, 'technologies')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.experiences[index].technologies = parseCommaSeparatedValues(value);
    });
  }

  function addExperience() {
    updateResumeDraft((draft) => {
      draft.experiences.push(createEmptyExperience());
    }, { syncDraftFields: true });
    updateSortableCollection('experiences', (currentIds) => [
      ...currentIds,
      nextSortableId('experiences'),
    ]);
  }

  function removeExperience(index: number) {
    updateResumeDraft((draft) => {
      draft.experiences.splice(index, 1);
    }, { syncDraftFields: true });
    updateSortableCollection('experiences', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateProjectLocalizedField(
    index: number,
    field: keyof Pick<ResumeProjectItem, 'name' | 'role' | 'summary'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.projects[index][field][locale] = value;
    });
  }

  function updateProjectPlainField(
    index: number,
    field: keyof Pick<ResumeProjectItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.projects[index][field] = value;
    });
  }

  function updateProjectHighlights(index: number, locale: 'zh' | 'en', value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('project', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.projects[index].highlights = mergeLocalizedLines(
        draft.projects[index].highlights,
        locale,
        value,
      );
    });
  }

  function updateProjectTechnologies(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('project', index, 'technologies')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.projects[index].technologies = parseCommaSeparatedValues(value);
    });
  }

  function updateProjectLinkField(
    projectIndex: number,
    linkIndex: number,
    field: 'label' | 'url',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'url') {
        draft.projects[projectIndex].links[linkIndex].url = value;
        return;
      }

      draft.projects[projectIndex].links[linkIndex].label[locale ?? 'zh'] = value;
    });
  }

  function addProjectLink(projectIndex: number) {
    updateResumeDraft((draft) => {
      draft.projects[projectIndex].links.push(createEmptyProfileLink());
    });
  }

  function removeProjectLink(projectIndex: number, linkIndex: number) {
    updateResumeDraft((draft) => {
      draft.projects[projectIndex].links.splice(linkIndex, 1);
    });
  }

  function addProject() {
    updateResumeDraft((draft) => {
      draft.projects.push(createEmptyProject());
    }, { syncDraftFields: true });
    updateSortableCollection('projects', (currentIds) => [
      ...currentIds,
      nextSortableId('projects'),
    ]);
  }

  function removeProject(index: number) {
    updateResumeDraft((draft) => {
      draft.projects.splice(index, 1);
    }, { syncDraftFields: true });
    updateSortableCollection('projects', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateSkillLocalizedField(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.skills[index].name[locale] = value;
    });
  }

  function updateSkillKeywords(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('skill', index, 'keywords')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.skills[index].keywords = parseLineSeparatedValues(value);
    });
  }

  function addSkillGroup() {
    updateResumeDraft(
      (draft) => {
        draft.skills.push(createEmptySkillGroup());
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('skills', (currentIds) => [
      ...currentIds,
      nextSortableId('skills'),
    ]);
  }

  function removeSkillGroup(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.skills.splice(index, 1);
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('skills', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateHighlightLocalizedField(
    index: number,
    field: keyof Pick<ResumeHighlightItem, 'title' | 'description'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.highlights[index][field][locale] = value;
    });
  }

  function addHighlight() {
    updateResumeDraft((draft) => {
      draft.highlights.push(createEmptyHighlight());
    });
    updateSortableCollection('highlights', (currentIds) => [
      ...currentIds,
      nextSortableId('highlights'),
    ]);
  }

  function removeHighlight(index: number) {
    updateResumeDraft((draft) => {
      draft.highlights.splice(index, 1);
    });
    updateSortableCollection('highlights', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftSnapshot || !resumeDraft) {
      return;
    }

    setPendingSave(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const nextSnapshot = await saveDraft({
        apiBaseUrl,
        accessToken,
        resume: cloneResume(resumeDraft),
      });

      setDraftSnapshot(nextSnapshot);
      setResumeDraft(cloneResume(nextSnapshot.resume));
      setDraftFieldValues(buildDraftFieldValues(nextSnapshot.resume));
      replaceSortableCollections(nextSnapshot.resume);
      setFeedbackMessage('草稿已保存。公开站内容不会自动变化，仍需手动发布。');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '草稿保存失败，请稍后重试',
      );
    } finally {
      setPendingSave(false);
    }
  }

  if (!canEdit) {
    return (
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="eyebrow">草稿编辑</p>
          <CardTitle>当前角色只读</CardTitle>
          <CardDescription>只有管理员可读取并保存草稿。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="readonly-box">
            当前账号没有草稿编辑权限，后台仅展示角色与导出入口。
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="eyebrow">草稿编辑</p>
        <CardTitle>完整标准简历模块编辑</CardTitle>
        <CardDescription>
          当前后台已按标准简历模型接通基础信息、教育、工作、项目、技能与亮点编辑，并改成“中文主编辑 + 英文翻译工作区”的维护方式，保存后仍需手动发布。
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {status === 'loading' ? <p className="muted">正在加载草稿...</p> : null}

        {status === 'error' && errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        {status === 'ready' && resumeDraft && draftSnapshot ? (
          <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex flex-col gap-3 rounded-[24px] border border-zinc-200/70 bg-zinc-50/90 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  草稿态与发布态分离
                </strong>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  保存只会更新后台草稿，公开站仍读取最近一次手动发布的版本。
                </span>
              </div>
              {lastUpdatedLabel ? (
                <Chip size="sm">
                  最近保存：
                  {lastUpdatedLabel}
                </Chip>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-zinc-200/70 bg-white/90 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/70 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  {isTranslationMode ? '英文翻译工作区' : '中文主编辑'}
                </strong>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {isTranslationMode
                    ? '这里集中维护所有英文字段。条目增删、时间、技术栈、链接地址等结构性信息仍回到中文主编辑处理。'
                    : '中文主编辑负责维护主文案与结构字段。英文字段改到独立翻译工作区，避免继续双列直填。'}
                </p>
              </div>
              <div
                aria-label="编辑模式切换"
                className="inline-flex w-full rounded-full border border-zinc-200/80 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/70 md:w-auto"
                role="tablist"
              >
                <Button
                  aria-selected={editorLocaleMode === 'zh'}
                  className="flex-1 md:flex-none"
                  onClick={() => setEditorLocaleMode('zh')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'zh' ? 'primary' : 'ghost'}
                >
                  中文主编辑
                </Button>
                <Button
                  aria-selected={editorLocaleMode === 'en'}
                  className="flex-1 md:flex-none"
                  onClick={() => setEditorLocaleMode('en')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'en' ? 'primary' : 'ghost'}
                >
                  英文翻译工作区
                </Button>
              </div>
            </div>

            <ProfileSection
              addProfileInterest={addProfileInterest}
              addProfileLink={addProfileLink}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleProfileInterestsDragEnd={(event) =>
                handleCollectionDragEnd('profileInterests', event)
              }
              handleProfileLinksDragEnd={(event) =>
                handleCollectionDragEnd('profileLinks', event)
              }
              isTranslationMode={isTranslationMode}
              removeProfileInterest={removeProfileInterest}
              removeProfileLink={removeProfileLink}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('基础信息', {
                onCopy: copyProfileTranslations,
                onClear: clearProfileTranslations,
              })}
              updateProfileHeroField={updateProfileHeroField}
              updateProfileHeroSlogans={updateProfileHeroSlogans}
              updateProfileInterestField={updateProfileInterestField}
              updateProfileLinkField={updateProfileLinkField}
              updateProfileLocalizedField={updateProfileLocalizedField}
              updateProfilePlainField={updateProfilePlainField}
            />

            <EducationSection
              addEducation={addEducation}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('education', event)}
              isTranslationMode={isTranslationMode}
              removeEducation={removeEducation}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('教育经历', {
                onCopy: copyEducationTranslations,
                onClear: clearEducationTranslations,
              })}
              updateEducationHighlights={updateEducationHighlights}
              updateEducationLocalizedField={updateEducationLocalizedField}
              updateEducationPlainField={updateEducationPlainField}
            />

            <ExperiencesSection
              addExperience={addExperience}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('experiences', event)}
              isTranslationMode={isTranslationMode}
              removeExperience={removeExperience}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('工作经历', {
                onCopy: copyExperienceTranslations,
                onClear: clearExperienceTranslations,
              })}
              updateExperienceHighlights={updateExperienceHighlights}
              updateExperienceLocalizedField={updateExperienceLocalizedField}
              updateExperiencePlainField={updateExperiencePlainField}
              updateExperienceTechnologies={updateExperienceTechnologies}
            />

            <ProjectsSection
              addProject={addProject}
              addProjectLink={addProjectLink}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('projects', event)}
              isTranslationMode={isTranslationMode}
              removeProject={removeProject}
              removeProjectLink={removeProjectLink}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('项目经历', {
                onCopy: copyProjectTranslations,
                onClear: clearProjectTranslations,
              })}
              updateProjectHighlights={updateProjectHighlights}
              updateProjectLinkField={updateProjectLinkField}
              updateProjectLocalizedField={updateProjectLocalizedField}
              updateProjectPlainField={updateProjectPlainField}
              updateProjectTechnologies={updateProjectTechnologies}
            />

            <SkillsSection
              addSkillGroup={addSkillGroup}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('skills', event)}
              isTranslationMode={isTranslationMode}
              removeSkillGroup={removeSkillGroup}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('技能组', {
                onCopy: copySkillTranslations,
                onClear: clearSkillTranslations,
              })}
              updateSkillKeywords={updateSkillKeywords}
              updateSkillLocalizedField={updateSkillLocalizedField}
            />

            <HighlightsSection
              addHighlight={addHighlight}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('highlights', event)}
              isTranslationMode={isTranslationMode}
              removeHighlight={removeHighlight}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('亮点', {
                onCopy: copyHighlightTranslations,
                onClear: clearHighlightTranslations,
              })}
              updateHighlightLocalizedField={updateHighlightLocalizedField}
            />

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            {feedbackMessage ? (
              <div className="dashboard-inline-note">{feedbackMessage}</div>
            ) : null}

            <Button
              fullWidth
              isDisabled={pendingSave}
              size="md"
              type="submit"
              variant="primary"
            >
              {pendingSave ? '保存中...' : '保存当前草稿'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
