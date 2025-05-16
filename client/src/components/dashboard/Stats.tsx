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
        <div>
          <p className="text-gray-500 text-xs font-medium">Total Clients</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{totalClients}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-3 transition-all hover:shadow-md">
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
      <div className="bg-white rounded-lg shadow-sm p-3 transition-all hover:shadow-md">
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
  );
}
