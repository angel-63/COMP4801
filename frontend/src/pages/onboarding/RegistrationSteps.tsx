import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Plus, Search, Trash2 } from "lucide-react";

import {
  getCachedUserProfile,
  getCurrentUserEmail,
  getCurrentUserId,
  saveUserProfile,
} from "../../lib/profileApi";
import { hasAuthToken, registerUser } from "../../lib/authApi";
import type { UserProfile } from "../../types/profile";

type PreferenceStepId =
  | "jobFunctions"
  | "industries"
  | "employmentType"
  | "experienceLevel"
  | "jobMode"
  | "salary";

type ProfileStepId = "roles" | "education" | "experience" | "project" | "skills";
type StepId = ProfileStepId | PreferenceStepId;

type LinkItem = {
  label: string;
  url: string;
};

type EducationItem = {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  fieldOfStudy: string;
};

type ExperienceItem = {
  jobTitle: string;
  employer: string;
  startDate: string;
  endDate: string;
  location: string;
};

type ProjectItem = {
  projectName: string;
  employer: string;
  startDate: string;
  endDate: string;
  location: string;
};

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  links: LinkItem[];
  educations: EducationItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  roles: string[];
  skills: string[];
  industries: string[];
  employmentTypes: string[];
  experienceLevels: string[];
  jobModes: string[];
  minimumSalary: number;
};

type Section = {
  key: "profile" | "preference";
  steps: { id: StepId; label: string }[];
};

type RegistrationWizardProps = {
  onSubmit?: (data: FormData) => Promise<void> | void;
};

type PendingRegistration = Partial<FormData> & {
  email?: string;
  password?: string;
};

const sections: Section[] = [
  {
    key: "profile",
    steps: [
      { id: "roles", label: "Roles" },
      { id: "education", label: "Education" },
      { id: "experience", label: "Experience" },
      { id: "project", label: "Project" },
      { id: "skills", label: "Skills" },
    ],
  },
  {
    key: "preference",
    steps: [
      { id: "jobFunctions", label: "Job functions" },
      { id: "industries", label: "Industries" },
      { id: "employmentType", label: "Employment type" },
      { id: "experienceLevel", label: "Experience level" },
      { id: "jobMode", label: "Job mode" },
      { id: "salary", label: "Salary" },
    ],
  },
];

const allSteps = sections.flatMap((section) => section.steps);
const optionalSteps: StepId[] = ["education", "experience", "project"];
const preferenceSteps = sections.find((section) => section.key === "preference")?.steps ?? [];
const skillSteps = sections.find((section) => section.key === "profile")?.steps.filter((step) => step.id === "skills") ?? [];

const jobFunctionGroups: { group: string; items: string[] }[] = [
  {
    group: "Accounting",
    items: ["Accountant", "Tax specialist", "Payroll specialist", "Auditor"],
  },
  {
    group: "Administrative",
    items: ["Admin officer", "Data entry", "Clerk", "Administrator"],
  },
  {
    group: "Arts and Design",
    items: ["Artist", "Designer", "Host", "Actor", "Architect"],
  },
  {
    group: "Business Development",
    items: [
      "Managing director",
      "Business development manager",
      "Merger and acquisition specialist",
      "Chief executive officer",
    ],
  },
  {
    group: "Technology",
    items: [
      "Software engineer",
      "Frontend developer",
      "Backend developer",
      "Full-stack developer",
      "Data analyst",
      "Product manager",
    ],
  },
];

const industries = [
  "Aerospace",
  "AI & machine learning",
  "Automotive & transportation",
  "Biotechnology",
  "Consulting",
  "Consumer goods",
  "Consumer software",
  "Crypto & Web3",
  "Cyber security",
  "Data & analytics",
  "Defence",
  "Design",
  "Education",
  "Energy",
  "Enterprise software",
  "Entertainment",
  "Financial services",
  "Fintech",
  "Food & agriculture",
  "Gaming",
  "Government & public sector",
  "Hardware",
  "Healthcare",
  "Industrial & manufacturing",
  "Legal",
  "Quantitative finance",
  "Real estate",
  "Robotics & automation",
  "Social impact",
  "Venture capital",
  "VR & AR",
];

const employmentTypes = ["Internship", "Full-time", "Part-time", "Contract"];
const experienceLevels = ["Entry level", "Associate", "Mid-senior level", "Director", "Executive"];
const jobModes = ["On-site", "Remote", "Hybrid"];
const skillOptions = [
  "Microsoft Excel",
  "Data analytics",
  "SEO",
  "Python",
  "HTML/CSS",
  "Adobe Photoshop",
  "MATLAB",
  "CAD",
  "Java",
  "JIRA",
  "Adobe AfterEffect",
];

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  links: [{ label: "", url: "" }],
  educations: [{ institution: "", degree: "", startDate: "", endDate: "", fieldOfStudy: "" }],
  experiences: [{ jobTitle: "", employer: "", startDate: "", endDate: "", location: "" }],
  projects: [{ projectName: "", employer: "", startDate: "", endDate: "", location: "" }],
  roles: [],
  skills: [],
  industries: [],
  employmentTypes: [],
  experienceLevels: [],
  jobModes: [],
  minimumSalary: 150,
};

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isValidDate(value: string) {
  return /^\d{2}\/\d{4}$/.test(value);
}

function isEmptyLink(link: LinkItem) {
  return !isFilled(link.label) && !isFilled(link.url);
}

function hasMeaningfulEducation(item: EducationItem) {
  return [item.institution, item.degree, item.startDate, item.endDate, item.fieldOfStudy].some(isFilled);
}

function hasMeaningfulExperience(item: ExperienceItem) {
  return [item.jobTitle, item.employer, item.startDate, item.endDate, item.location].some(isFilled);
}

function hasMeaningfulProject(item: ProjectItem) {
  return [item.projectName, item.employer, item.startDate, item.endDate, item.location].some(isFilled);
}

function isCompleteEducation(item: EducationItem) {
  return (
    isFilled(item.institution) &&
    isFilled(item.degree) &&
    isFilled(item.startDate) &&
    isFilled(item.endDate) &&
    isFilled(item.fieldOfStudy)
  );
}

function isCompleteExperience(item: ExperienceItem) {
  return (
    isFilled(item.jobTitle) &&
    isFilled(item.employer) &&
    isFilled(item.startDate) &&
    isFilled(item.endDate) &&
    isFilled(item.location)
  );
}

function isCompleteProject(item: ProjectItem) {
  return (
    isFilled(item.projectName) &&
    isFilled(item.employer) &&
    isFilled(item.startDate) &&
    isFilled(item.endDate) &&
    isFilled(item.location)
  );
}

function toggleInArray(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function chipClass(selected: boolean) {
  return `rounded-full border px-5 py-2.5 text-sm transition ${
    selected
      ? "border-[#FCFF56] bg-[#FCFF56] text-[#2F2F2A]"
      : "border-white/18 bg-transparent text-white/90 hover:border-[#FCFF56]/70 hover:text-white"
  }`;
}

function cardSelectClass(selected: boolean) {
  return `flex w-full items-center gap-4 rounded-lg border px-7 py-5 text-left transition ${
    selected
      ? "border-[#FCFF56]/80 bg-[#FCFF56]/10"
      : "border-white/15 hover:border-white/35"
  }`;
}

function inputClassName() {
  return "h-11 w-full rounded bg-[#ECE8E1] px-4 text-zinc-900 outline-none";
}

function buildProfileSnapshot(formData: FormData, email: string): UserProfile {
  return {
    id: getCurrentUserId(),
    email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    fullName: [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim(),
    phone: formData.phone,
    location: formData.location,
    links: formData.links
      .filter((link) => !isEmptyLink(link))
      .map((link, index) => ({
        id: `link-${index + 1}`,
        site: link.label,
        url: link.url,
      })),
    education: formData.educations
      .filter(hasMeaningfulEducation)
      .map((item, index) => ({
        id: `education-${index + 1}`,
        institution: item.institution,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        startDate: item.startDate,
        endDate: item.endDate,
      })),
    workExperience: formData.experiences
      .filter(hasMeaningfulExperience)
      .map((item, index) => ({
        id: `experience-${index + 1}`,
        company: item.employer,
        position: item.jobTitle,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
      })),
    projects: formData.projects
      .filter(hasMeaningfulProject)
      .map((item, index) => ({
        id: `project-${index + 1}`,
        name: item.projectName,
        owner: item.employer,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
      })),
    skills: formData.skills.map((skill, index) => ({
      id: `skill-${index + 1}`,
      name: skill,
    })),
    preferences: {
      jobFunctions: formData.roles,
      industries: formData.industries,
      employmentTypes: formData.employmentTypes,
      experienceLevels: formData.experienceLevels,
      jobModes: formData.jobModes,
      minSalary: formData.minimumSalary,
    },
  };
}

function Sidebar({ currentStep, visibleSections }: { currentStep: StepId; visibleSections: Section[] }) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-white/10 pr-8">
      {visibleSections.map((section) => (
        <div key={section.key} className="mb-10">
          <div className="space-y-5">
            {section.steps.map((step) => {
              const active = step.id === currentStep;
              return (
                <div
                  key={step.id}
                  className={`border-l-4 pl-4 text-[15px] ${
                    active
                      ? "border-[#FCFF56] bg-[#8B8A45] py-2 text-white"
                      : "border-white/35 py-2 text-white/90"
                  }`}
                >
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function StepHeading({ children }: { children: string }) {
  return <h1 className="mb-10 text-center text-5xl font-semibold">{children}</h1>;
}

export default function FlashRegistrationWizard({ onSubmit }: RegistrationWizardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [searchRole, setSearchRole] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modeParam = searchParams.get("mode");
  const onboardingMode =
    modeParam === "preferences" ? "preferences" : modeParam === "skills" ? "skills" : "full";
  const returnTo = searchParams.get("returnTo") || "/matches";
  const visibleSections =
    onboardingMode === "preferences"
      ? sections.filter((section) => section.key === "preference")
      : onboardingMode === "skills"
        ? [
            {
              key: "profile" as const,
              steps: skillSteps,
            },
          ]
        : sections;
  const steps =
    onboardingMode === "preferences" ? preferenceSteps : onboardingMode === "skills" ? skillSteps : allSteps;

  const currentStep = steps[currentStepIndex].id;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isSkippableStep = optionalSteps.includes(currentStep);

  useEffect(() => {
    const pendingRegistrationRaw = window.localStorage.getItem("pendingRegistration");
    const cachedProfile = getCachedUserProfile();
    const email = getCurrentUserEmail() || cachedProfile?.email || "";

    let pendingRegistration: PendingRegistration = {};

    if (pendingRegistrationRaw) {
      try {
        pendingRegistration = JSON.parse(pendingRegistrationRaw) as PendingRegistration;
      } catch {
        pendingRegistration = {};
      }
    }

    setFormData((prev) => ({
      ...prev,
      firstName: pendingRegistration.firstName || cachedProfile?.firstName || prev.firstName,
      lastName: pendingRegistration.lastName || cachedProfile?.lastName || prev.lastName,
      skills:
        onboardingMode === "skills"
          ? cachedProfile?.skills?.map((item) => item.name || "").filter(Boolean) || prev.skills
          : prev.skills,
      roles:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.jobFunctions || prev.roles
          : prev.roles,
      industries:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.industries || prev.industries
          : prev.industries,
      employmentTypes:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.employmentTypes || prev.employmentTypes
          : prev.employmentTypes,
      experienceLevels:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.experienceLevels || prev.experienceLevels
          : prev.experienceLevels,
      jobModes:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.jobModes || prev.jobModes
          : prev.jobModes,
      minimumSalary:
        onboardingMode === "preferences"
          ? cachedProfile?.preferences?.minSalary || prev.minimumSalary
          : prev.minimumSalary,
    }));

    if (email) {
      window.localStorage.setItem("pendingRegistrationEmail", email);
    }
  }, [onboardingMode]);

  useEffect(() => {
    if (onboardingMode === "preferences" || onboardingMode === "skills") {
      setCurrentStepIndex(0);
    }
  }, [onboardingMode]);

  const filteredRoleGroups = useMemo(() => {
    if (!searchRole.trim()) return jobFunctionGroups;
    const keyword = searchRole.toLowerCase();
    return jobFunctionGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.toLowerCase().includes(keyword)),
      }))
      .filter((group) => group.items.length > 0);
  }, [searchRole]);

  const filteredSkills = useMemo(() => {
    if (!searchSkill.trim()) return skillOptions;
    const keyword = searchSkill.toLowerCase();
    return skillOptions.filter((skill) => skill.toLowerCase().includes(keyword));
  }, [searchSkill]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = <T,>(
    key: "links" | "educations" | "experiences" | "projects",
    index: number,
    field: keyof T,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: (prev[key] as T[]).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addArrayItem = (key: "links" | "educations" | "experiences" | "projects") => {
    setFormData((prev) => {
      if (key === "links") {
        return { ...prev, links: [...prev.links, { label: "", url: "" }] };
      }
      if (key === "educations") {
        return {
          ...prev,
          educations: [
            ...prev.educations,
            { institution: "", degree: "", startDate: "", endDate: "", fieldOfStudy: "" },
          ],
        };
      }
      if (key === "experiences") {
        return {
          ...prev,
          experiences: [
            ...prev.experiences,
            { jobTitle: "", employer: "", startDate: "", endDate: "", location: "" },
          ],
        };
      }
      return {
        ...prev,
        projects: [
          ...prev.projects,
          { projectName: "", employer: "", startDate: "", endDate: "", location: "" },
        ],
      };
    });
  };

  const removeArrayItem = (key: "links" | "educations" | "experiences" | "projects", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const stepError = useMemo(() => {
    switch (currentStep) {
      case "roles": {
        if (
          !isFilled(formData.firstName) ||
          !isFilled(formData.lastName) ||
          !isFilled(formData.phone) ||
          !isFilled(formData.location)
        ) {
          return "First name, last name, phone, and location are required.";
        }
        const hasInvalidLink = formData.links.some(
          (link) =>
            !isEmptyLink(link) &&
            (!isFilled(link.label) || !isFilled(link.url) || !isValidUrl(link.url)),
        );
        return hasInvalidLink ? "Each link must include a label and a valid URL." : null;
      }
      case "education": {
        if (formData.educations.filter(hasMeaningfulEducation).length === 0) return null;
        const hasIncompleteEducation = formData.educations.some(
          (item) => hasMeaningfulEducation(item) && !isCompleteEducation(item),
        );
        if (hasIncompleteEducation) {
          return "Complete all fields before continuing.";
        }
        const hasInvalidEducation = formData.educations.some(
          (item) =>
            hasMeaningfulEducation(item) &&
            (!isValidDate(item.startDate) || !isValidDate(item.endDate)),
        );
        return hasInvalidEducation ? "Complete all education date fields using MM/YYYY." : null;
      }
      case "experience": {
        if (formData.experiences.filter(hasMeaningfulExperience).length === 0) return null;
        const hasIncompleteExperience = formData.experiences.some(
          (item) => hasMeaningfulExperience(item) && !isCompleteExperience(item),
        );
        if (hasIncompleteExperience) {
          return "Complete all fields before continuing.";
        }
        const hasInvalidExperience = formData.experiences.some(
          (item) =>
            hasMeaningfulExperience(item) &&
            (!isValidDate(item.startDate) || !isValidDate(item.endDate)),
        );
        return hasInvalidExperience ? "Complete all experience date fields using MM/YYYY." : null;
      }
      case "project": {
        if (formData.projects.filter(hasMeaningfulProject).length === 0) return null;
        const hasIncompleteProject = formData.projects.some(
          (item) => hasMeaningfulProject(item) && !isCompleteProject(item),
        );
        if (hasIncompleteProject) {
          return "Complete all fields before continuing.";
        }
        const hasInvalidProject = formData.projects.some(
          (item) =>
            hasMeaningfulProject(item) &&
            (!isValidDate(item.startDate) || !isValidDate(item.endDate)),
        );
        return hasInvalidProject ? "Complete all project date fields using MM/YYYY." : null;
      }
      case "skills":
        return formData.skills.length === 0 ? "Select at least one skill." : null;
      case "jobFunctions":
        return formData.roles.length === 0 ? "Select at least one job function." : null;
      case "industries":
        return formData.industries.length === 0 ? "Select at least one industry." : null;
      case "employmentType":
        return formData.employmentTypes.length === 0 ? "Select at least one employment type." : null;
      case "experienceLevel":
        return formData.experienceLevels.length === 0 ? "Select at least one experience level." : null;
      case "jobMode":
        return formData.jobModes.length === 0 ? "Select at least one job mode." : null;
      case "salary":
        return formData.minimumSalary <= 0 ? "Minimum expected salary is required." : null;
      default:
        return null;
    }
  }, [currentStep, formData]);

  const canProceed = !stepError;

  const goNext = async () => {
    if (!canProceed) return;

    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    try {
      setIsSubmitting(true);
      const pendingRegistrationRaw = window.localStorage.getItem("pendingRegistration");
      let pendingRegistration: PendingRegistration = {};

      if (pendingRegistrationRaw) {
        try {
          pendingRegistration = JSON.parse(pendingRegistrationRaw) as PendingRegistration;
        } catch {
          pendingRegistration = {};
        }
      }

      const email =
        getCurrentUserEmail() ||
        pendingRegistration.email ||
        window.localStorage.getItem("pendingRegistrationEmail") ||
        getCachedUserProfile()?.email ||
        "";
      const profileSnapshot = buildProfileSnapshot(formData, email);

      window.localStorage.setItem("profile", JSON.stringify(profileSnapshot));
      window.localStorage.setItem("userProfile", JSON.stringify(profileSnapshot));

      if (onSubmit) {
        await onSubmit(formData);
      } else if (!hasAuthToken() && pendingRegistration.password) {
        await registerUser(profileSnapshot, pendingRegistration.password);
      } else {
        try {
          await saveUserProfile(getCurrentUserId(), profileSnapshot);
        } catch (saveError) {
          console.warn("Profile save fell back to local cache during onboarding.", saveError);
        }
      }

      window.localStorage.removeItem("pendingRegistration");
      window.localStorage.removeItem("pendingRegistrationEmail");
      navigate(returnTo);
    } catch (error) {
      console.error(error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStepIndex === 0) {
      if (onboardingMode === "preferences") {
        navigate(returnTo);
      }
      return;
    }
    setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-[#3F3F3B] text-white">
      <header className="flex h-20 items-center border-b border-white/5 bg-[#161616] px-6 md:px-10">
        <div className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">Flash</span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-8 px-8 py-14">
        <Sidebar currentStep={currentStep} visibleSections={visibleSections} />

        <main className="flex-1 pb-10">
          <button
            type="button"
            onClick={goBack}
            className="mb-8 flex items-center gap-2 text-lg text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <div className="mx-auto max-w-[920px]">
            {currentStep === "roles" && (
              <section>
                <StepHeading>Start building your profile!</StepHeading>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">First name *</label>
                    <input
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      className={inputClassName()}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Last name *</label>
                    <input
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      className={inputClassName()}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={inputClassName()}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Location</label>
                    <input
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className={inputClassName()}
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">Links</span>
                    <span className="text-sm text-white/60">e.g., LinkedIn, personal website</span>
                  </div>

                  {formData.links.map((link, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Label</label>
                        <input
                          value={link.label}
                          onChange={(e) => updateArrayItem<LinkItem>("links", index, "label", e.target.value)}
                          className={inputClassName()}
                          placeholder="Label"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">URL</label>
                        <input
                          value={link.url}
                          onChange={(e) => updateArrayItem<LinkItem>("links", index, "url", e.target.value)}
                          className={inputClassName()}
                          placeholder="https://..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArrayItem("links", index)}
                        disabled={formData.links.length === 1}
                        className="mb-[2px] flex h-11 w-11 items-center justify-center rounded border border-white/15 disabled:opacity-40"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addArrayItem("links")}
                    className="inline-flex items-center gap-2 text-sm text-white/85 hover:text-[#FCFF56]"
                  >
                    <Plus className="h-4 w-4" />
                    Add new link
                  </button>
                </div>
              </section>
            )}

            {currentStep === "education" && (
              <section>
                <StepHeading>Tell us your education history.</StepHeading>
                <div className="space-y-8">
                  {formData.educations.map((education, index) => (
                    <div key={index}>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-lg font-semibold">
                          Education {index + 1} <span className="text-sm text-white/55">most recent record</span>
                        </div>
                        {formData.educations.length > 1 ? (
                          <button type="button" onClick={() => removeArrayItem("educations", index)}>
                            <Trash2 className="h-5 w-5 text-white/70" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm">Institution</label>
                          <input
                            value={education.institution}
                            onChange={(e) =>
                              updateArrayItem<EducationItem>("educations", index, "institution", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Institution name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Degree</label>
                          <input
                            value={education.degree}
                            onChange={(e) =>
                              updateArrayItem<EducationItem>("educations", index, "degree", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Degree type"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Start date</label>
                          <input
                            value={education.startDate}
                            onChange={(e) =>
                              updateArrayItem<EducationItem>("educations", index, "startDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">End date</label>
                          <input
                            value={education.endDate}
                            onChange={(e) =>
                              updateArrayItem<EducationItem>("educations", index, "endDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-sm">Field of study</label>
                          <input
                            value={education.fieldOfStudy}
                            onChange={(e) =>
                              updateArrayItem<EducationItem>("educations", index, "fieldOfStudy", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Field of study"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem("educations")}
                  className="mt-5 inline-flex items-center gap-2 text-sm text-white/85 hover:text-[#FCFF56]"
                >
                  <Plus className="h-4 w-4" />
                  Add new education
                </button>
              </section>
            )}

            {currentStep === "experience" && (
              <section>
                <StepHeading>Share with us your work experience.</StepHeading>
                <div className="space-y-8">
                  {formData.experiences.map((experience, index) => (
                    <div key={index}>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-lg font-semibold">
                          Work experience {index + 1} <span className="text-sm text-white/55">most recent record</span>
                        </div>
                        {formData.experiences.length > 1 ? (
                          <button type="button" onClick={() => removeArrayItem("experiences", index)}>
                            <Trash2 className="h-5 w-5 text-white/70" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm">Job title</label>
                          <input
                            value={experience.jobTitle}
                            onChange={(e) =>
                              updateArrayItem<ExperienceItem>("experiences", index, "jobTitle", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Job title"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Employer</label>
                          <input
                            value={experience.employer}
                            onChange={(e) =>
                              updateArrayItem<ExperienceItem>("experiences", index, "employer", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Start date</label>
                          <input
                            value={experience.startDate}
                            onChange={(e) =>
                              updateArrayItem<ExperienceItem>("experiences", index, "startDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">End date</label>
                          <input
                            value={experience.endDate}
                            onChange={(e) =>
                              updateArrayItem<ExperienceItem>("experiences", index, "endDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-sm">Location</label>
                          <input
                            value={experience.location}
                            onChange={(e) =>
                              updateArrayItem<ExperienceItem>("experiences", index, "location", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Location"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem("experiences")}
                  className="mt-5 inline-flex items-center gap-2 text-sm text-white/85 hover:text-[#FCFF56]"
                >
                  <Plus className="h-4 w-4" />
                  Add new experience
                </button>
              </section>
            )}

            {currentStep === "project" && (
              <section>
                <StepHeading>Share with us your project experience.</StepHeading>
                <div className="space-y-8">
                  {formData.projects.map((project, index) => (
                    <div key={index}>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-lg font-semibold">
                          Project experience {index + 1} <span className="text-sm text-white/55">most recent record</span>
                        </div>
                        {formData.projects.length > 1 ? (
                          <button type="button" onClick={() => removeArrayItem("projects", index)}>
                            <Trash2 className="h-5 w-5 text-white/70" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm">Project name</label>
                          <input
                            value={project.projectName}
                            onChange={(e) =>
                              updateArrayItem<ProjectItem>("projects", index, "projectName", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Project name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Employer</label>
                          <input
                            value={project.employer}
                            onChange={(e) =>
                              updateArrayItem<ProjectItem>("projects", index, "employer", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Employer name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">Start date</label>
                          <input
                            value={project.startDate}
                            onChange={(e) =>
                              updateArrayItem<ProjectItem>("projects", index, "startDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm">End date</label>
                          <input
                            value={project.endDate}
                            onChange={(e) =>
                              updateArrayItem<ProjectItem>("projects", index, "endDate", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-2 block text-sm">Location</label>
                          <input
                            value={project.location}
                            onChange={(e) =>
                              updateArrayItem<ProjectItem>("projects", index, "location", e.target.value)
                            }
                            className={inputClassName()}
                            placeholder="Location"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem("projects")}
                  className="mt-5 inline-flex items-center gap-2 text-sm text-white/85 hover:text-[#FCFF56]"
                >
                  <Plus className="h-4 w-4" />
                  Add new project
                </button>
              </section>
            )}

            {currentStep === "skills" && (
              <section>
                <StepHeading>Let us know more about the skills you have.</StepHeading>

                <div className="relative mx-auto mb-8 max-w-[520px]">
                  <Search className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={searchSkill}
                    onChange={(e) => setSearchSkill(e.target.value)}
                    className="h-14 w-full rounded-full bg-[#F0EEE9] px-6 pr-14 text-lg text-zinc-800 outline-none"
                    placeholder="Search by skill"
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => updateField("skills", toggleInArray(formData.skills, skill))}
                      className={chipClass(formData.skills.includes(skill))}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <div className="mt-10">
                  <div className="mb-3 text-2xl font-semibold">Skills selected</div>
                  <div className="flex flex-wrap gap-3">
                    {formData.skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => updateField("skills", formData.skills.filter((item) => item !== skill))}
                        className="rounded-full bg-[#FCFF56] px-5 py-2.5 text-sm text-zinc-900"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {currentStep === "jobFunctions" && (
              <section>
                <StepHeading>What kinds of roles are you interested in?</StepHeading>

                <div className="relative mx-auto mb-10 max-w-[560px]">
                  <Search className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    className="h-14 w-full rounded-full bg-[#F0EEE9] px-6 pr-14 text-lg text-zinc-800 outline-none"
                    placeholder="Search by job title"
                  />
                </div>

                <div className="max-h-[420px] overflow-y-auto pr-2">
                  {filteredRoleGroups.map((group) => (
                    <div key={group.group} className="mb-8">
                      <div className="mb-3 text-2xl font-semibold">{group.group}</div>
                      <div className="flex flex-wrap gap-3">
                        {group.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => updateField("roles", toggleInArray(formData.roles, item))}
                            className={chipClass(formData.roles.includes(item))}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {currentStep === "industries" && (
              <section>
                <StepHeading>What Industries are you interested in?</StepHeading>
                <div className="flex flex-wrap justify-center gap-3">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => updateField("industries", toggleInArray(formData.industries, industry))}
                      className={chipClass(formData.industries.includes(industry))}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {currentStep === "employmentType" && (
              <section>
                <StepHeading>What employment type are you looking for?</StepHeading>
                <div className="mx-auto max-w-[520px] space-y-4">
                  {employmentTypes.map((item) => {
                    const selected = formData.employmentTypes.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => updateField("employmentTypes", toggleInArray(formData.employmentTypes, item))}
                        className={cardSelectClass(selected)}
                      >
                        <div className={`h-5 w-5 border ${selected ? "border-[#FCFF56] bg-[#FCFF56]" : "border-white/30"}`} />
                        <span className="text-2xl">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {currentStep === "experienceLevel" && (
              <section>
                <StepHeading>What experience level are you targeting?</StepHeading>
                <div className="mx-auto max-w-[520px] space-y-4">
                  {experienceLevels.map((item) => {
                    const selected = formData.experienceLevels.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          updateField("experienceLevels", toggleInArray(formData.experienceLevels, item))
                        }
                        className={cardSelectClass(selected)}
                      >
                        <div className={`h-5 w-5 border ${selected ? "border-[#FCFF56] bg-[#FCFF56]" : "border-white/30"}`} />
                        <span className="text-2xl">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {currentStep === "jobMode" && (
              <section>
                <StepHeading>What job mode do you prefer</StepHeading>
                <div className="mx-auto max-w-[520px] space-y-4">
                  {jobModes.map((item) => {
                    const selected = formData.jobModes.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => updateField("jobModes", toggleInArray(formData.jobModes, item))}
                        className={cardSelectClass(selected)}
                      >
                        <div className={`h-5 w-5 border ${selected ? "border-[#FCFF56] bg-[#FCFF56]" : "border-white/30"}`} />
                        <span className="text-2xl">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {currentStep === "salary" && (
              <section>
                <StepHeading>What is your minimum expected salary?</StepHeading>
                <div className="mx-auto max-w-[460px] text-center">
                  <div className="mb-8 text-8xl font-bold">{formData.minimumSalary}k</div>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    step={10}
                    value={formData.minimumSalary}
                    onChange={(e) => updateField("minimumSalary", Number(e.target.value))}
                    className="w-full accent-[#E6F20E]"
                  />
                  <div className="mt-2 flex justify-between text-sm text-white/80">
                    <span>0</span>
                    <span>300k</span>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-14 border-t border-white/10 pt-6">
              {stepError ? <div className="mb-4 text-center text-sm text-red-300">{stepError}</div> : null}
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canProceed || isSubmitting}
                  className="min-w-[300px] rounded-md bg-[#FCFF56] px-8 py-4 text-lg font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLastStep
                    ? isSubmitting
                      ? "Saving..."
                      : "Save"
                    : currentStep === "skills"
                      ? "Proceed to Preference"
                      : "Save and continue"}
                </button>
                {isSkippableStep ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                    disabled={isSubmitting}
                    className="text-sm text-white/70 transition hover:text-white disabled:opacity-40"
                  >
                    Skip for now
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
