import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Session } from "@shared/schema";

interface UpcomingSessionsProps {
  sessions: Session[];
  isLoading: boolean;
}

export default function UpcomingSessions({ sessions, isLoading }: UpcomingSessionsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Upcoming Sessions</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-3" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no upcoming sessions, show empty state
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Upcoming Sessions</h2>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <i className="ri-calendar-line text-gray-500 text-xl"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No Upcoming Sessions</h3>
          <p className="text-gray-500">
            You don't have any scheduled sessions. Schedule a session with a client.
          </p>
        </div>
      </div>
    );
  }

  // Generate colors for initials circles
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-green-100 text-green-700",
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Upcoming Sessions</h2>
      </div>
      <div className="p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.slice(0, 3).map((session, index) => {
              const colorClass = colors[index % colors.length];
              const sessionDate = new Date(session.date);
              
              return (
                <tr key={session.id}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center text-sm`}>
                        {`C${session.clientId}`}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Client #{session.clientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {format(sessionDate, "MMM d, yyyy")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {format(sessionDate, "h:mm a")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === "confirmed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                    <button className="text-primary hover:text-primary-800">Details</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
