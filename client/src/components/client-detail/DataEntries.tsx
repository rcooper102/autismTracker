import { DataEntry } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface DataEntriesProps {
  dataEntries: DataEntry[];
  isLoading: boolean;
}

export default function DataEntries({ dataEntries, isLoading }: DataEntriesProps) {
  const [timeFilter, setTimeFilter] = useState("7");

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="overflow-x-auto">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter entries based on selected time period
  const filterEntries = () => {
    const now = new Date();
    const days = parseInt(timeFilter);
    
    if (timeFilter === "all") return dataEntries;
    
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return dataEntries.filter(entry => new Date(entry.createdAt) >= cutoff);
  };

  const filteredEntries = filterEntries();

  // Map mood to display text and color
  const getMoodDisplay = (mood: string) => {
    switch (mood) {
      case "great":
        return { text: "Great", bgClass: "bg-green-100 text-green-800" };
      case "good":
        return { text: "Good", bgClass: "bg-green-100 text-green-800" };
      case "okay":
        return { text: "Neutral", bgClass: "bg-yellow-100 text-yellow-800" };
      case "not-good":
        return { text: "Not Good", bgClass: "bg-orange-100 text-orange-800" };
      case "bad":
        return { text: "Poor", bgClass: "bg-red-100 text-red-800" };
      default:
        return { text: mood, bgClass: "bg-gray-100 text-gray-800" };
    }
  };

  // Empty state if no entries
  if (filteredEntries.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Data Entries</h2>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <i className="ri-file-list-line text-gray-500 text-xl"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No Data Entries</h3>
          <p className="text-gray-500">
            No data has been logged during this time period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Recent Data Entries</h2>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anxiety Level</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleep Quality</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => {
              const { text: moodText, bgClass: moodBgClass } = getMoodDisplay(entry.mood);
              const entryDate = new Date(entry.createdAt);
              const anxietyLevel = entry.anxietyLevel || 0;
              const sleepQuality = entry.sleepQuality || 0;
              
              // Get descriptive text for anxiety level
              const getAnxietyText = (level: number) => {
                if (level <= 1) return "Low";
                if (level <= 3) return "Moderate";
                return "High";
              };
              
              return (
                <tr key={entry.id}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {format(entryDate, "MMM d, yyyy")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${moodBgClass}`}>
                      {moodText}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-300 rounded-full" 
                          style={{ width: `${(anxietyLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs">{getAnxietyText(anxietyLevel)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i 
                          key={i}
                          className={`${i < sleepQuality ? "ri-star-fill text-yellow-400" : "ri-star-line text-gray-300"}`}
                        ></i>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {entry.notes || "No notes provided"}
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
