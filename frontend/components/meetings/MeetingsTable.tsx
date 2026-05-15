"use client";

import { motion } from "framer-motion";

interface Meeting {
  id: number;
  title: string;
  organizer_id: number;
  status: string;
  meeting_date: string;
  location: string;
}

export function MeetingsTable({ meetings }: { meetings: Meeting[] }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line-subtle/50 bg-gradient-to-b from-surface-container/20 to-transparent p-16 text-center">
        <div className="h-20 w-20 flex items-center justify-center rounded-full bg-surface-container-high mb-6 shadow-inner">
          <span className="material-symbols-outlined text-muted text-[48px]">event_busy</span>
        </div>
        <h3 className="text-headline-md text-primary drop-shadow-md">No meetings scheduled</h3>
        <p className="mt-2 text-body-lg text-muted max-w-md">Get your community together. Create your first meeting to start generating AI insights.</p>
        <button onClick={() => window.dispatchEvent(new Event('open-new-meeting'))} className="btn-primary mt-8">Schedule a meeting</button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line-subtle/40 bg-surface-container-low/60 shadow-glass backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-line-subtle/40 text-label-md text-muted uppercase tracking-wider">
            <th className="px-8 py-5 font-bold">Title</th>
            <th className="px-8 py-5 font-bold">Date</th>
            <th className="px-8 py-5 font-bold">Status</th>
            <th className="px-8 py-5 font-bold">Location</th>
            <th className="px-8 py-5 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle/20">
          {meetings.map((meeting, i) => (
            <motion.tr
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group transition-all duration-300 hover:bg-surface-container-high/40 hover:shadow-inner"
            >
              <td className="px-8 py-6">
                <p className="text-body-lg font-bold text-primary group-hover:text-lime transition-colors">{meeting.title}</p>
              </td>
              <td className="px-8 py-6 text-body-md text-muted font-medium">{meeting.meeting_date}</td>
              <td className="px-8 py-6">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-caps font-bold tracking-widest ${
                  meeting.status === 'LIVE' ? 'bg-lime/20 text-lime shadow-[0_0_10px_rgba(198,255,77,0.2)]' :
                  meeting.status === 'PUBLISHED' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-surface-container-highest text-muted'
                }`}>
                  {meeting.status}
                </span>
              </td>
              <td className="px-8 py-6 text-body-md text-muted">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] opacity-70">location_on</span>
                  {meeting.location}
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button className="rounded-full p-2 text-muted transition-all hover:bg-lime/10 hover:text-lime hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button className="rounded-full p-2 text-muted transition-all hover:bg-surface-container-highest hover:text-primary hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
