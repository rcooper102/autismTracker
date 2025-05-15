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
      <div className="grid grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-10 w-20 mt-3" />
            <Skeleton className="h-4 w-36 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-5 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Total Clients</span>
          <span className="text-primary bg-primary-50 p-2 rounded-full">
            <i className="ri-user-line"></i>
          </span>
        </div>
        <p className="text-3xl font-semibold mt-3">{totalClients}</p>
        <p className="text-xs text-green-500 mt-1 flex items-center">
          <i className="ri-arrow-up-line mr-1"></i> {Math.max(0, totalClients - 10)} new this month
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-5 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm font-medium">Pending Reviews</span>
          <span className="text-orange-500 bg-orange-50 p-2 rounded-full">
            <i className="ri-time-line"></i>
          </span>
        </div>
        <p className="text-3xl font-semibold mt-3">{pendingReviews}</p>
        <p className="text-xs text-orange-500 mt-1 flex items-center">
          {pendingReviews > 0 ? "Requires attention" : "All caught up"}
        </p>
      </div>
    </div>
  );
}
