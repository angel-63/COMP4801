import { Link } from 'react-router-dom'

type JobCardProps = {
  id: string
  title: string
  company: string
  location: string
  type: string
  matchScore: number
}

export default function JobCard({
  id,
  title,
  company,
  location,
  type,
  matchScore,
}: JobCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-gray-600">{company}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
          {matchScore}% match
        </span>
      </div>

      <div className="mb-4 flex gap-2 text-sm text-gray-500">
        <span>{location}</span>
        <span>•</span>
        <span>{type}</span>
      </div>

      <Link
        to={`/jobs/${id}`}
        className="inline-block rounded-xl bg-black px-4 py-2 text-white"
      >
        View Job
      </Link>
    </div>
  )
}