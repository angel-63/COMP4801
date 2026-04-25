import React, { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, Pencil, Trash2, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentUserProfile,
  getCachedUserProfile,
  getCurrentUserId,
  saveUserProfile,
} from '../../lib/profileApi'
import { readSavedJobs, removeSavedJob, subscribeToSavedJobs } from '../../lib/savedJobs'
import type {
  UserProfile,
} from '../../types/profile'
import type { SavedJob } from '../../types/savedJob'

type ProfileTab = 'profile' | 'saved-jobs'
type EditableSection =
  | 'personal'
  | 'education'
  | 'experience'
  | 'project'
  | 'skills'
  | null

type EditableLink = {
  id?: string
  label: string
  url: string
}

type PersonalDraft = {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  links: EditableLink[]
}

type EducationDraft = {
  items: Array<{
    id?: string
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: string
    endDate: string
  }>
}

type ExperienceDraft = {
  items: Array<{
    id?: string
    position: string
    company: string
    location: string
    startDate: string
    endDate: string
  }>
}

type ProjectDraft = {
  items: Array<{
    id?: string
    name: string
    owner: string
    location: string
    startDate: string
    endDate: string
    description: string
    technologies: string
  }>
}

type SkillsDraft = {
  skillsText: string
}

type SectionDrafts = {
  personal: PersonalDraft
  education: EducationDraft
  experience: ExperienceDraft
  project: ProjectDraft
  skills: SkillsDraft
}

const SectionCard = ({
  title,
  onEdit,
  isEditing,
  children,
}: {
  title: string
  onEdit?: () => void
  isEditing?: boolean
  children: React.ReactNode
}) => {
  return (
    <div className="rounded-2xl bg-[#666661] px-6 py-5 text-white shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-[24px] font-semibold leading-none tracking-[-0.02em]">{title}</h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={`rounded-md p-1 transition ${
              isEditing ? 'bg-white/10 text-[#f0ef4d]' : 'text-white/90 hover:bg-white/10 hover:text-[#f0ef4d]'
            }`}
          >
            <Pencil size={22} />
          </button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

const Tag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex rounded-md bg-[#d9d9d4] px-3 py-1 text-[13px] font-medium text-[#666661]">
      {children}
    </span>
  )
}

const YellowSkillTag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex rounded-full bg-[#f0ef4d] px-5 py-2 text-[14px] font-medium text-[#666661]">
      {children}
    </span>
  )
}

const inputClassName =
  'w-full rounded-md border border-white/10 bg-[#585854] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#f0ef4d]'

const textareaClassName =
  'min-h-[88px] w-full rounded-md border border-white/10 bg-[#585854] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#f0ef4d]'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [drafts, setDrafts] = useState<SectionDrafts | null>(null)
  const [editingSection, setEditingSection] = useState<EditableSection>(null)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingSection, setSavingSection] = useState<EditableSection>(null)
  const [removingJobId, setRemovingJobId] = useState<string | null>(null)

  const syncSavedJobs = async () => {
    const items = await readSavedJobs()
    setSavedJobs(items)
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchCurrentUserProfile()
        setProfile(data)
        setDrafts(buildDrafts(data))
        await syncSavedJobs()
      } catch (loadError) {
        const cached = getCachedUserProfile()
        // console.log("cached profile @ profile page: ", cached)
        if (cached) {
          setProfile(cached)
          setDrafts(buildDrafts(cached))
          await syncSavedJobs()
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load profile')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [])

  useEffect(() => {
    return subscribeToSavedJobs(() => {
      void syncSavedJobs()
    })
  }, [])

  const initials = useMemo(() => {
    const firstName = profile?.firstName?.trim() || ''
    const lastName = profile?.lastName?.trim() || ''
    const fullName = profile?.fullName?.trim() || ''

    if (firstName || lastName) {
      return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'
    }

    if (!fullName) {
      return 'U'
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }, [profile?.firstName, profile?.lastName, profile?.fullName])

  if (isLoading) {
    return <div className="mx-auto max-w-[1180px] px-6 py-8 text-white/75">Loading profile...</div>
  }

  if (error) {
    return <div className="mx-auto max-w-[1180px] px-6 py-8 text-red-300">{error}</div>
  }

  if (!profile || !drafts) {
    return <div className="mx-auto max-w-[1180px] px-6 py-8 text-white/75">No profile available.</div>
  }

  const education = profile.education ?? []
  const workExperience = profile.workExperience ?? []
  const projects = profile.projects ?? []
  const skills = profile.skills ?? []
  const preferences = profile.preferences ?? {}

  const openSavedJob = (job: SavedJob) => {
    if (job.source === 'matches') {
      navigate(`/matches?savedJobId=${encodeURIComponent(job.id)}`)
      return
    }

    navigate(`/jobs?savedJobId=${encodeURIComponent(job.id)}`)
  }

  const handleRemoveSavedJob = async (jobId: string) => {
    setRemovingJobId(jobId)

    try {
      const nextItems = await removeSavedJob(jobId)
      setSavedJobs(nextItems)
    } finally {
      setRemovingJobId(null)
    }
  }

  const beginEdit = (section: Exclude<EditableSection, null>) => {
    setSaveError(null)
    setDrafts(buildDrafts(profile))
    setEditingSection(section)
  }

  const cancelEdit = () => {
    setDrafts(buildDrafts(profile))
    setSaveError(null)
    setEditingSection(null)
  }

  const updateDraft = <K extends keyof SectionDrafts>(key: K, value: SectionDrafts[K]) => {
    setDrafts((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const persistProfile = async (nextProfile: UserProfile) => {
    const normalized = normalizeProfile(nextProfile)
    const userId = normalized.id || getCurrentUserId()

    try {
      const saved = await saveUserProfile(userId, normalized)
      setProfile(saved)
      setDrafts(buildDrafts(saved))
    } catch (saveProfileError) {
      cacheProfileSnapshot(normalized)
      setProfile(normalized)
      setDrafts(buildDrafts(normalized))
      console.warn('Profile save fell back to local cache.', saveProfileError)
    }
  }

  const handleSaveSection = async (section: Exclude<EditableSection, null>) => {
    setSavingSection(section)
    setSaveError(null)

    try {
      let nextProfile = { ...profile }

      switch (section) {
        case 'personal': {
          const links = drafts.personal.links
            .filter((link) => link.label.trim() || link.url.trim())
            .map((link, index) => ({
              id: link.id || `link-${index + 1}`,
              site: link.label.trim(),
              url: link.url.trim(),
            }))

          nextProfile = {
            ...nextProfile,
            firstName: drafts.personal.firstName.trim(),
            lastName: drafts.personal.lastName.trim(),
            fullName: [drafts.personal.firstName.trim(), drafts.personal.lastName.trim()].filter(Boolean).join(' '),
            email: drafts.personal.email.trim(),
            phone: drafts.personal.phone.trim(),
            location: drafts.personal.location.trim(),
            links,
          }
          break
        }
        case 'education': {
          nextProfile = {
            ...nextProfile,
            education: drafts.education.items
              .filter((item) => hasAnyValue(Object.values(item)))
              .map((item, index) => ({
                id: item.id || `education-${index + 1}`,
                institution: item.institution.trim(),
                degree: item.degree.trim(),
                fieldOfStudy: item.fieldOfStudy.trim(),
                startDate: monthYearToIso(item.startDate.trim()),
                endDate: monthYearToIso(item.endDate.trim()),
              })),
          }
          break
        }
        case 'experience': {
          nextProfile = {
            ...nextProfile,
            workExperience: drafts.experience.items
              .filter((item) => hasAnyValue(Object.values(item)))
              .map((item, index) => ({
                id: item.id || `experience-${index + 1}`,
                position: item.position.trim(),
                company: item.company.trim(),
                location: item.location.trim(),
                startDate: monthYearToIso(item.startDate.trim()),
                endDate: monthYearToIso(item.endDate.trim()),
              })),
          }
          break
        }
        case 'project': {
          nextProfile = {
            ...nextProfile,
            projects: drafts.project.items
              .filter((item) => hasAnyValue(Object.values(item)))
              .map((item, index) => ({
                id: item.id || `project-${index + 1}`,
                projectName: item.name.trim(),
                projectOwner: item.owner.trim(),
                location: item.location.trim(),
                startDate: monthYearToIso(item.startDate.trim()),
                endDate: monthYearToIso(item.endDate.trim()),
                description: item.description.trim(),
                technologies: splitCommaList(item.technologies),
              })),
          }
          break
        }
        case 'skills': {
          nextProfile = {
            ...nextProfile,
            skills: splitCommaList(drafts.skills.skillsText).map((skillName, index) => ({
              id: `skill-${index + 1}`,
              skill: skillName,
            })),
          }
          break
        }
      }
      console.log("new profile: ", nextProfile)
      await persistProfile(nextProfile)
      setEditingSection(null)
    } catch (sectionError) {
      setSaveError(sectionError instanceof Error ? sectionError.message : 'Unable to save profile section.')
    } finally {
      setSavingSection(null)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl bg-[#666661] p-5">
            <div className="flex flex-col items-center pt-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-[#f0ef4d] text-3xl font-bold text-[#1f1f1d]">
                {initials}
              </div>
              <h1 className="text-[20px] font-semibold">{profile.fullName || 'New User'}</h1>
            </div>

            <div className="my-8 border-t border-white/25" />

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-4 text-left text-[15px] font-medium text-white transition ${
                  activeTab === 'profile' ? 'bg-[#4f4f4c]' : 'hover:bg-white/10'
                }`}
              >
                <User size={20} />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved-jobs')}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-4 text-left text-[15px] font-medium text-white transition ${
                  activeTab === 'saved-jobs' ? 'bg-[#4f4f4c]' : 'hover:bg-white/10'
                }`}
              >
                <Bookmark size={20} />
                <span>Saved jobs</span>
              </button>
            </div>
          </aside>

          <section className="space-y-6">
            {activeTab === 'profile' ? (
              <>
                {saveError ? <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{saveError}</div> : null}

                <SectionCard
                  title="Personal detail"
                  onEdit={() => beginEdit('personal')}
                  isEditing={editingSection === 'personal'}
                >
                  {editingSection === 'personal' ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm">
                          <span>First name</span>
                          <input
                            value={drafts.personal.firstName}
                            onChange={(e) =>
                              updateDraft('personal', { ...drafts.personal, firstName: e.target.value })
                            }
                            className={inputClassName}
                          />
                        </label>
                        <label className="space-y-2 text-sm">
                          <span>Last name</span>
                          <input
                            value={drafts.personal.lastName}
                            onChange={(e) =>
                              updateDraft('personal', { ...drafts.personal, lastName: e.target.value })
                            }
                            className={inputClassName}
                          />
                        </label>
                        <label className="space-y-2 text-sm">
                          <span>Email</span>
                          <input
                            value={drafts.personal.email}
                            onChange={(e) =>
                              updateDraft('personal', { ...drafts.personal, email: e.target.value })
                            }
                            className={inputClassName}
                          />
                        </label>
                        <label className="space-y-2 text-sm">
                          <span>Phone</span>
                          <input
                            value={drafts.personal.phone}
                            onChange={(e) =>
                              updateDraft('personal', { ...drafts.personal, phone: e.target.value })
                            }
                            className={inputClassName}
                          />
                        </label>
                      </div>

                      <label className="space-y-2 text-sm">
                        <span>Location</span>
                        <input
                          value={drafts.personal.location}
                          onChange={(e) =>
                            updateDraft('personal', { ...drafts.personal, location: e.target.value })
                          }
                          className={inputClassName}
                        />
                      </label>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-white/90">Links</div>
                        {drafts.personal.links.map((link, index) => (
                          <div key={link.id || index} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                            <input
                              value={link.label}
                              onChange={(e) => {
                                const nextLinks = drafts.personal.links.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, label: e.target.value } : item,
                                )
                                updateDraft('personal', { ...drafts.personal, links: nextLinks })
                              }}
                              className={inputClassName}
                              placeholder="Label"
                            />
                            <input
                              value={link.url}
                              onChange={(e) => {
                                const nextLinks = drafts.personal.links.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, url: e.target.value } : item,
                                )
                                updateDraft('personal', { ...drafts.personal, links: nextLinks })
                              }}
                              className={inputClassName}
                              placeholder="https://..."
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft('personal', {
                                  ...drafts.personal,
                                  links:
                                    drafts.personal.links.length > 1
                                      ? drafts.personal.links.filter((_, itemIndex) => itemIndex !== index)
                                      : [{ label: '', url: '' }],
                                })
                              }
                              className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft('personal', {
                              ...drafts.personal,
                              links: [...drafts.personal.links, { label: '', url: '' }],
                            })
                          }
                          className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:border-white/30 hover:text-[#f0ef4d]"
                        >
                          Add link
                        </button>
                      </div>

                      <SectionActions
                        isSaving={savingSection === 'personal'}
                        onCancel={cancelEdit}
                        onSave={() => void handleSaveSection('personal')}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-y-4">
                      <InfoRow label="Email" value={profile.email || 'Not provided'} />
                      <InfoRow label="Phone" value={profile.phone || 'Not provided'} />
                      <InfoRow label="Location" value={profile.location || 'Not provided'} />
                      <InfoRow
                        label="Links"
                        value={
                          profile.links && profile.links.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profile.links.map((link, index) => (
                                <Tag key={link.id || index}>{link.site || link.url || 'Link'}</Tag>
                              ))}
                            </div>
                          ) : (
                            'Not provided'
                          )
                        }
                      />
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="Education"
                  onEdit={() => beginEdit('education')}
                  isEditing={editingSection === 'education'}
                >
                  {editingSection === 'education' ? (
                    <div className="space-y-4">
                      {drafts.education.items.map((item, index) => (
                        <div key={item.id || index} className="rounded-xl border border-white/10 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-medium text-white/90">Education {index + 1}</div>
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft('education', {
                                  items:
                                    drafts.education.items.length > 1
                                      ? drafts.education.items.filter((_, itemIndex) => itemIndex !== index)
                                      : [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
                                })
                              }
                              className="text-sm text-white/70 transition hover:text-white"
                            >
                              Remove
                            </button>
                          </div>
                          <EditableEducationFields
                            item={item}
                            onChange={(nextItem) =>
                              updateDraft('education', {
                                items: drafts.education.items.map((currentItem, itemIndex) =>
                                  itemIndex === index ? nextItem : currentItem,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                      <AddRowButton
                        label="Add education"
                        onClick={() =>
                          updateDraft('education', {
                            items: [
                              ...drafts.education.items,
                              { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' },
                            ],
                          })
                        }
                      />
                      <SectionActions
                        isSaving={savingSection === 'education'}
                        onCancel={cancelEdit}
                        onSave={() => void handleSaveSection('education')}
                      />
                    </div>
                  ) : education.length > 0 ? (
                    <div className="space-y-5">
                      {education.map((item, index) => (
                        <div key={item.id || index}>
                          <p className="text-[15px] font-medium text-white">
                            {[item.degree, item.fieldOfStudy && `in ${item.fieldOfStudy}`, item.institution]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.degree ? <Tag>{item.degree}</Tag> : null}
                            {item.fieldOfStudy ? <Tag>{item.fieldOfStudy}</Tag> : null}
                            <Tag>{formatDateRange(item.startDate, item.endDate)}</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No education added yet." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Professional experience"
                  onEdit={() => beginEdit('experience')}
                  isEditing={editingSection === 'experience'}
                >
                  {editingSection === 'experience' ? (
                    <div className="space-y-4">
                      {drafts.experience.items.map((item, index) => (
                        <div key={item.id || index} className="rounded-xl border border-white/10 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-medium text-white/90">Experience {index + 1}</div>
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft('experience', {
                                  items:
                                    drafts.experience.items.length > 1
                                      ? drafts.experience.items.filter((_, itemIndex) => itemIndex !== index)
                                      : [{ position: '', company: '', location: '', startDate: '', endDate: '' }],
                                })
                              }
                              className="text-sm text-white/70 transition hover:text-white"
                            >
                              Remove
                            </button>
                          </div>
                          <EditableExperienceFields
                            item={item}
                            onChange={(nextItem) =>
                              updateDraft('experience', {
                                items: drafts.experience.items.map((currentItem, itemIndex) =>
                                  itemIndex === index ? nextItem : currentItem,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                      <AddRowButton
                        label="Add experience"
                        onClick={() =>
                          updateDraft('experience', {
                            items: [
                              ...drafts.experience.items,
                              { position: '', company: '', location: '', startDate: '', endDate: '' },
                            ],
                          })
                        }
                      />
                      <SectionActions
                        isSaving={savingSection === 'experience'}
                        onCancel={cancelEdit}
                        onSave={() => void handleSaveSection('experience')}
                      />
                    </div>
                  ) : workExperience.length > 0 ? (
                    <div className="space-y-5">
                      {workExperience.map((item, index) => (
                        <div key={item.id || index}>
                          <p className="text-[15px] font-medium text-white">
                            {[item.position, item.company && `at ${item.company}`].filter(Boolean).join(' ')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.location ? <Tag>{item.location}</Tag> : null}
                            <Tag>{formatDateRange(item.startDate, item.endDate)}</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No work experience added yet." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Project experience"
                  onEdit={() => beginEdit('project')}
                  isEditing={editingSection === 'project'}
                >
                  {editingSection === 'project' ? (
                    <div className="space-y-4">
                      {drafts.project.items.map((item, index) => (
                        <div key={item.id || index} className="rounded-xl border border-white/10 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-medium text-white/90">Project {index + 1}</div>
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft('project', {
                                  items:
                                    drafts.project.items.length > 1
                                      ? drafts.project.items.filter((_, itemIndex) => itemIndex !== index)
                                      : [
                                          {
                                            name: '',
                                            owner: '',
                                            location: '',
                                            startDate: '',
                                            endDate: '',
                                            description: '',
                                            technologies: '',
                                          },
                                        ],
                                })
                              }
                              className="text-sm text-white/70 transition hover:text-white"
                            >
                              Remove
                            </button>
                          </div>
                          <EditableProjectFields
                            item={item}
                            onChange={(nextItem) =>
                              updateDraft('project', {
                                items: drafts.project.items.map((currentItem, itemIndex) =>
                                  itemIndex === index ? nextItem : currentItem,
                                ),
                              })
                            }
                          />
                        </div>
                      ))}
                      <AddRowButton
                        label="Add project"
                        onClick={() =>
                          updateDraft('project', {
                            items: [
                              ...drafts.project.items,
                              {
                                name: '',
                                owner: '',
                                location: '',
                                startDate: '',
                                endDate: '',
                                description: '',
                                technologies: '',
                              },
                            ],
                          })
                        }
                      />
                      <SectionActions
                        isSaving={savingSection === 'project'}
                        onCancel={cancelEdit}
                        onSave={() => void handleSaveSection('project')}
                      />
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-5">
                      {projects.map((item, index) => (
                        <div key={item.id || index}>
                          <p className="text-[15px] font-medium text-white">{item.projectName || 'Untitled project'}</p>
                          {(item.technologies?.length ?? 0) > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.technologies?.map((tech) => (
                                <Tag key={tech}>{tech}</Tag>
                              ))}
                            </div>
                          ) : null}
                          {item.description ? (
                            <p className="mt-3 text-[14px] leading-6 text-white/80">{item.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No projects added yet." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Skills"
                  onEdit={() => navigate('/onboarding?mode=skills&returnTo=%2Fprofile')}
                >
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {skills.map((skill, index) => (
                        <YellowSkillTag key={skill.id || `${skill.skill}-${index}`}>
                          {skill.skill || 'Unnamed skill'}
                        </YellowSkillTag>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No skills added yet." />
                  )}
                </SectionCard>

                <SectionCard
                  title="Preferences"
                  onEdit={() => navigate('/onboarding?mode=preferences&returnTo=%2Fprofile')}
                >
                  <div className="space-y-4">
                    <PreferenceRow label="Job functions" values={preferences.jobFunction} />
                    <PreferenceRow label="Industries" values={preferences.industries} />
                    <PreferenceRow label="Employment types" values={preferences.employmentType} />
                    <PreferenceRow label="Experience levels" values={preferences.experienceLevel} />
                    <PreferenceRow label="Job modes" values={preferences.jobMode} />
                    <InfoRow
                      label="Minimum salary"
                      value={preferences.minSalary ? `${preferences.minSalary}k` : 'Not provided'}
                    />
                  </div>
                </SectionCard>
              </>
            ) : (
              <SectionCard title="Saved jobs">
                {savedJobs.length > 0 ? (
                  <div className="space-y-0">
                    {savedJobs.map((job, index) => (
                      <div
                        key={`${job.source}-${job.id}`}
                        className={`grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-4 py-4 ${
                          index === 0 ? '' : 'border-t border-white/15'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openSavedJob(job)}
                          className="h-16 w-16 rounded-sm bg-[#4f4f4c] transition hover:bg-[#5d5d59]"
                          aria-label={`Open ${job.title} at ${job.companyName}`}
                        >
                          {job.companyLogoDataUrl ? (
                            <img
                              src={job.companyLogoDataUrl}
                              alt={job.companyName || 'Company logo'}
                              className="h-full w-full rounded-sm object-contain p-1"
                            />
                          ) : null}
                        </button>

                        <button type="button" onClick={() => openSavedJob(job)} className="min-w-0 text-left">
                          <p className="truncate text-[18px] font-medium text-white transition hover:text-[#f0ef4d]">
                            {job.title} at {job.companyName}
                          </p>
                          <p className="mt-1 text-[13px] text-white/70">
                            {[job.employmentType, job.jobMode].filter(Boolean).join(' • ') || 'Not specified'}
                          </p>

                          {job.tags.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {job.tags.slice(0, 4).map((tag, tagIndex) => (
                                <span
                                  key={`${job.id}-${tag}-${tagIndex}`}
                                  className={`rounded px-3 py-1 text-[13px] ${
                                    tagIndex === 0 ? 'bg-[#f0ef4d] text-[#666661]' : 'bg-[#d9d9d4] text-[#666661]'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </button>

                        <div className="flex items-center gap-3 pt-1 text-right">
                          <span className="text-[14px] text-[#67d36f]">Saved</span>
                          <BookmarkCheck size={18} className="text-[#f0ef4d]" />
                          <button
                            type="button"
                            onClick={() => void handleRemoveSavedJob(job.id)}
                            disabled={removingJobId === job.id}
                            className="rounded-md border border-white/15 p-2 text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Remove ${job.title} from saved jobs`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState label="No saved jobs yet. Save jobs from Matches or Jobs to see them here." />
                )}
              </SectionCard>
            )}

            <div className="border-t border-white/20" />
          </section>
        </div>
      </main>
    </div>
  )
}

function EditableEducationFields({
  item,
  onChange,
}: {
  item: EducationDraft['items'][number]
  onChange: (nextItem: EducationDraft['items'][number]) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input value={item.institution} onChange={(e) => onChange({ ...item, institution: e.target.value })} className={inputClassName} placeholder="Institution" />
      <input value={item.degree} onChange={(e) => onChange({ ...item, degree: e.target.value })} className={inputClassName} placeholder="Degree" />
      <input value={item.fieldOfStudy} onChange={(e) => onChange({ ...item, fieldOfStudy: e.target.value })} className={inputClassName} placeholder="Field of study" />
      <div className="grid grid-cols-2 gap-4">
        <input value={item.startDate} onChange={(e) => onChange({ ...item, startDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
        <input value={item.endDate} onChange={(e) => onChange({ ...item, endDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
      </div>
    </div>
  )
}

function EditableExperienceFields({
  item,
  onChange,
}: {
  item: ExperienceDraft['items'][number]
  onChange: (nextItem: ExperienceDraft['items'][number]) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input value={item.position} onChange={(e) => onChange({ ...item, position: e.target.value })} className={inputClassName} placeholder="Job title" />
      <input value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} className={inputClassName} placeholder="Employer" />
      <input value={item.location} onChange={(e) => onChange({ ...item, location: e.target.value })} className={inputClassName} placeholder="Location" />
      <div className="grid grid-cols-2 gap-4">
        <input value={item.startDate} onChange={(e) => onChange({ ...item, startDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
        <input value={item.endDate} onChange={(e) => onChange({ ...item, endDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
      </div>
    </div>
  )
}

function EditableProjectFields({
  item,
  onChange,
}: {
  item: ProjectDraft['items'][number]
  onChange: (nextItem: ProjectDraft['items'][number]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} className={inputClassName} placeholder="Project name" />
        <input value={item.owner} onChange={(e) => onChange({ ...item, owner: e.target.value })} className={inputClassName} placeholder="Employer / owner" />
        <input value={item.location} onChange={(e) => onChange({ ...item, location: e.target.value })} className={inputClassName} placeholder="Location" />
        <div className="grid grid-cols-2 gap-4">
          <input value={item.startDate} onChange={(e) => onChange({ ...item, startDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
          <input value={item.endDate} onChange={(e) => onChange({ ...item, endDate: e.target.value })} className={inputClassName} placeholder="MM/YYYY" />
        </div>
      </div>
      <textarea value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} className={textareaClassName} placeholder="Description" />
      <input value={item.technologies} onChange={(e) => onChange({ ...item, technologies: e.target.value })} className={inputClassName} placeholder="Technologies, separated by commas" />
    </div>
  )
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:border-white/30 hover:text-[#f0ef4d]"
    >
      {label}
    </button>
  )
}

function SectionActions({
  isSaving,
  onCancel,
  onSave,
}: {
  isSaving: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:border-white/30 hover:text-white"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="rounded-md bg-[#f0ef4d] px-4 py-2 text-sm font-medium text-[#1f1f1d] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-4 text-[15px]">
      <span className="text-white/95">{label}</span>
      <div className="text-white/95">{value}</div>
    </div>
  )
}

function PreferenceRow({
  label,
  values,
}: {
  label: string
  values?: string[]
}) {
  return (
    <InfoRow
      label={label}
      value={
        values && values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <Tag key={`${label}-${value}-${index}`}>{value}</Tag>
            ))}
          </div>
        ) : (
          'Not provided'
        )
      }
    />
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-[15px] text-white/65">{label}</p>
}

// Convert ISO string to MM/YYYY
function isoToMonthYear(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function monthYearToIso(monthYear: string): string {
  if (!monthYear) return '';
  const parts = monthYear.split('/');
  if (parts.length !== 2) return '';
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return '';
  // Use UTC to avoid timezone shifts
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
}

function buildDrafts(profile: UserProfile): SectionDrafts {
  return {
    personal: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      links:
        profile.links && profile.links.length > 0
          ? profile.links.map((link) => ({
              id: link.id,
              label: link.site || '',
              url: link.url || '',
            }))
          : [{ label: '', url: '' }],
    },
    education: {
      items:
        profile.education && profile.education.length > 0
          ? profile.education.map((item) => ({
              id: item.id,
              institution: item.institution || '',
              degree: item.degree || '',
              fieldOfStudy: item.fieldOfStudy || '',
              startDate: isoToMonthYear(item.startDate) || '',
              endDate: isoToMonthYear(item.endDate) || '',
            }))
          : [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
    },
    experience: {
      items:
        profile.workExperience && profile.workExperience.length > 0
          ? profile.workExperience.map((item) => ({
              id: item.id,
              position: item.position || '',
              company: item.company || '',
              location: item.location || '',
              startDate: isoToMonthYear(item.startDate) || '',
              endDate: isoToMonthYear(item.endDate) || '',
            }))
          : [{ position: '', company: '', location: '', startDate: '', endDate: '' }],
    },
    project: {
      items:
        profile.projects && profile.projects.length > 0
          ? profile.projects.map((item) => ({
              id: item.id,
              name: item.projectName || '',
              owner: item.projectOwner || '',
              location: item.location || '',
              startDate: isoToMonthYear(item.startDate) || '',
              endDate: isoToMonthYear(item.endDate) || '',
              description: item.description || '',
              technologies: (item.technologies || []).join(', '),
            }))
          : [
              {
                name: '',
                owner: '',
                location: '',
                startDate: '',
                endDate: '',
                description: '',
                technologies: '',
              },
            ],
    },
    skills: {
      skillsText: (profile.skills || []).map((skill) => skill.skill || '').filter(Boolean).join(', '),
    },
  }
}

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function hasAnyValue(values: Array<string | undefined>) {
  return values.some((value) => (value || '').trim().length > 0)
}

function normalizeProfile(profile: UserProfile): UserProfile {
  const firstName = profile.firstName || ''
  const lastName = profile.lastName || ''
  const fullName = profile.fullName || [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    ...profile,
    id: profile.id || getCurrentUserId(),
    firstName,
    lastName,
    fullName,
  }
}

function cacheProfileSnapshot(profile: UserProfile) {
  const normalized = normalizeProfile(profile)
  const snapshot = {
    ...normalized,
    name: normalized.fullName,
    links: (normalized.links || []).map((link) => ({
      id: link.id,
      label: link.site || '',
      site: link.site || '',
      url: link.url || '',
    })),
  }

  window.localStorage.setItem('userProfile', JSON.stringify(snapshot))
  window.localStorage.setItem('profile', JSON.stringify(snapshot))
}

function formatDateRange(startDate?: string, endDate?: string) {
  const start = formatMonthYear(startDate)
  const end = endDate ? formatMonthYear(endDate) : 'Present'

  if (start && end) {
    return `${start} - ${end}`
  }

  return start || end || 'Date not provided'
}

function formatMonthYear(value?: string) {
  if (!value) {
    return ''
  }

  const normalized = normalizeMonthYearForDisplay(value)
  if (normalized) {
    return normalized
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function normalizeMonthYearForDisplay(value: string) {
  const match = value.match(/^(\d{2})\/(\d{4})$/)
  if (!match) {
    return ''
  }

  const month = Number(match[1])
  const year = Number(match[2])

  if (month < 1 || month > 12) {
    return value
  }

  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}
