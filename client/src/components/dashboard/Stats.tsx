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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Total Clients</span>
          <span className="text-primary bg-primary-50 p-2 rounded-full">
            <i className="ri-user-line"></i>
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2">{totalClients}</p>
        <p className="text-xs text-green-500 mt-1">
          <i className="ri-arrow-up-line"></i> {Math.max(0, totalClients - 10)} new this month
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Pending Reviews</span>
          <span className="text-orange-500 bg-orange-50 p-2 rounded-full">
            <i className="ri-time-line"></i>
          </span>
        </div>
        <p className="text-2xl font-semibold mt-2">{pendingReviews}</p>
        <p className="text-xs text-orange-500 mt-1">
          {pendingReviews > 0 ? "Requires attention" : "All caught up"}
        </p>
      </div>
    </div>
  );
}
