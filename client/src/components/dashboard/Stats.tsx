import { Skeleton } from "@/components/ui/skeleton";

interface StatsProps {
  totalClients: number;
  pendingReviews: number;
  isLoading: boolean;
}

export default function Stats({
  totalClients,
  pendingReviews,
  isLoading
}: StatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div>
                <Skeleton className="h-3 w-24 mb-2" />
                <div className="flex items-baseline">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-16 ml-2" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-3 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-primary bg-primary-50 p-2 rounded-full flex-shrink-0">
            <i className="ri-user-line"></i>
          </span>
          <div>
            <p className="text-gray-500 text-xs font-medium">Total Clients</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{totalClients}</p>
              <p className="text-xs text-green-500 ml-2 flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>{Math.max(2, Math.floor(totalClients * 0.2))}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-orange-500 bg-orange-50 p-2 rounded-full flex-shrink-0">
            <i className="ri-time-line"></i>
          </span>
          <div>
            <p className="text-gray-500 text-xs font-medium">Pending Reviews</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">{pendingReviews}</p>
              <p className="text-xs text-orange-500 ml-2">
                {pendingReviews > 0 ? "Attention needed" : "All caught up"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-blue-500 bg-blue-50 p-2 rounded-full flex-shrink-0">
            <i className="ri-folder-chart-line"></i>
          </span>
          <div>
            <p className="text-gray-500 text-xs font-medium">Active Sessions</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold">0</p>
              <p className="text-xs text-blue-500 ml-2">
                Today
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
