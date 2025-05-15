import { DataEntry } from "@shared/schema";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface MoodChartProps {
  dataEntries: DataEntry[];
  isLoading: boolean;
}

export default function MoodChart({ dataEntries, isLoading }: MoodChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="h-64 flex items-end justify-between space-x-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <Skeleton className={`w-full rounded-t-lg chart-bar h-${Math.floor(Math.random() * 48) + 16}`} />
              <Skeleton className="mt-2 h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  // Generate last 7 days for chart
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return {
      date,
      day: format(date, "E"),
      entries: dataEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getDate() === date.getDate() &&
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      })
    };
  });

  // Calculate anxiety level by day
  const dayData = days.map(day => {
    if (day.entries.length === 0) {
      return { ...day, anxietyLevel: 0 };
    }
    
    // Calculate average anxiety level for the day
    const totalAnxiety = day.entries.reduce((sum, entry) => sum + (entry.anxietyLevel || 0), 0);
    return {
      ...day,
      anxietyLevel: Math.round(totalAnxiety / day.entries.length)
    };
  });

  // Map anxiety level to chart bar height and color
  const getBarStyle = (anxietyLevel: number) => {
    if (anxietyLevel === 0) return { height: "12px", bgClass: "bg-gray-200" };
    if (anxietyLevel === 1) return { height: "32px", bgClass: "bg-blue-200" };
    if (anxietyLevel === 2) return { height: "48px", bgClass: "bg-blue-200" };
    if (anxietyLevel === 3) return { height: "40px", bgClass: "bg-blue-300" };
    if (anxietyLevel === 4) return { height: "56px", bgClass: "bg-blue-300" };
    return { height: "64px", bgClass: "bg-blue-400" };
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-medium mb-4">Mood Trends</h2>
      <div className="h-64 flex items-end justify-between space-x-2">
        {dayData.map((day, index) => {
          const { height, bgClass } = getBarStyle(day.anxietyLevel);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full ${bgClass} rounded-t-lg chart-bar`} 
                style={{ height }}
              ></div>
              <span className="text-xs mt-2">{day.day}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-6 text-sm">
        <div>
          <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-1"></span> Low Anxiety
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-blue-300 rounded-full mr-1"></span> Moderate
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1"></span> High Anxiety
        </div>
      </div>
    </div>
  );
}
