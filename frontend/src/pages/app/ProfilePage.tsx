import React from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  FileText,
  HelpCircle,
  MenuSquare,
  Pencil,
  User,
} from "lucide-react";

type EducationItem = {
  degree: string;
  major: string;
  school: string;
  period: string;
};

type ExperienceItem = {
  title: string;
  company: string;
  location: string;
  period: string;
};

type ProjectItem = {
  name: string;
  company: string;
  location: string;
  period: string;
};

const educationData: EducationItem[] = [
  {
    degree: "Bachelor",
    major: "Information Systems",
    school: "ABC University",
    period: "Sep 2021 - Jun 2025",
  },
];

const professionalExperienceData: ExperienceItem[] = [
  {
    title: "Executive Assistant II",
    company: "ABC Company",
    location: "Hong Kong",
    period: "Aug 2025 - Present",
  },
  {
    title: "Executive Assistant III",
    company: "ABC Company",
    location: "Hong Kong",
    period: "Sep 2024 - Jul 2025",
  },
];

const projectExperienceData: ProjectItem[] = [
  {
    name: "Web Revamp Project",
    company: "ABC Company",
    location: "Hong Kong",
    period: "Sep 2024 - Jan 2025",
  },
];

const skills = ["Adobe AfterEffect", "JIRA"];

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl bg-[#666661] px-6 py-5 text-white shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-[24px] font-semibold leading-none tracking-[-0.02em]">
          {title}
        </h2>
        <button className="rounded-md p-1 text-white/90 transition hover:bg-white/10 hover:text-[#f0ef4d]">
          <Pencil size={22} />
        </button>
      </div>
      {children}
    </div>
  );
};

const Tag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex rounded-md bg-[#d9d9d4] px-3 py-1 text-[13px] font-medium text-[#666661]">
      {children}
    </span>
  );
};

const YellowSkillTag = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex rounded-full bg-[#f0ef4d] px-5 py-2 text-[14px] font-medium text-[#666661]">
      {children}
    </span>
  );
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen text-white">
      {/* Main Content */}
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-[#666661] p-5">
            <div className="flex flex-col items-center pt-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-[#f0ef4d] text-3xl font-bold text-[#1f1f1d]">
                CW
              </div>
              <h1 className="text-[20px] font-semibold">Chris Wong</h1>
            </div>

            <div className="my-8 border-t border-white/25" />

            <div className="space-y-3">
              <button className="flex w-full items-center gap-3 rounded-md bg-[#4f4f4c] px-4 py-4 text-left text-[15px] font-medium text-white">
                <User size={20} />
                <span>Profile</span>
              </button>

              <button className="flex w-full items-center gap-3 rounded-md px-4 py-4 text-left text-[15px] font-medium text-white transition hover:bg-white/10">
                <Bookmark size={20} />
                <span>Saved jobs</span>
              </button>
            </div>
          </aside>

          {/* Right Content */}
          <section className="space-y-6">
            {/* Personal detail */}
            <SectionCard title="Personal detail">
              <div className="grid gap-y-4">
                <div className="grid grid-cols-[120px_1fr] items-start gap-4 text-[15px]">
                  <span className="text-white/95">Phone</span>
                  <span className="text-white/95">+852 1234 5678</span>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-start gap-4 text-[15px]">
                  <span className="text-white/95">Location</span>
                  <span className="text-white/95">Hong Kong</span>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-start gap-4 text-[15px]">
                  <span className="text-white/95">Link(s)</span>
                  <div className="flex flex-col gap-2">
                    <a
                      href="#"
                      className="w-fit text-[#f0ef4d] underline underline-offset-2 hover:opacity-90"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="#"
                      className="w-fit text-[#f0ef4d] underline underline-offset-2 hover:opacity-90"
                    >
                      Personal website
                    </a>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Education */}
            <SectionCard title="Education">
              <div className="space-y-5">
                {educationData.map((item, index) => (
                  <div key={index}>
                    <p className="text-[15px] font-medium text-white">
                      {item.degree} in Business Administration (Information Systems) ·{" "}
                      {item.school}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>{item.degree}</Tag>
                      <Tag>{item.major}</Tag>
                      <Tag>{item.period}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Professional experience */}
            <SectionCard title="Professional experience">
              <div className="space-y-5">
                {professionalExperienceData.map((item, index) => (
                  <div key={index}>
                    <p className="text-[15px] font-medium text-white">
                      {item.title} · {item.company}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>{item.location}</Tag>
                      <Tag>{item.period}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Project experience */}
            <SectionCard title="Project experience">
              <div className="space-y-5">
                {projectExperienceData.map((item, index) => (
                  <div key={index}>
                    <p className="text-[15px] font-medium text-white">
                      {item.name} · {item.company}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>{item.location}</Tag>
                      <Tag>{item.period}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skills">
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <YellowSkillTag key={skill}>{skill}</YellowSkillTag>
                ))}
              </div>
            </SectionCard>

            <div className="border-t border-white/20" />
          </section>
        </div>
      </main>
    </div>
  );
}