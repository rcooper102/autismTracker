import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onAddClient: () => void;
  onGenerateReports: () => void;
}

export default function ActionButtons({ onAddClient, onGenerateReports }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Button 
        onClick={onAddClient}
        className="bg-primary text-white rounded-lg p-4 flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors h-auto"
      >
        <i className="ri-user-add-line mr-2 text-xl"></i>
        <span>Add New Client</span>
      </Button>
      <Button 
        onClick={onGenerateReports}
        variant="outline"
        className="bg-white text-primary border border-primary rounded-lg p-4 flex items-center justify-center hover:bg-primary-50 transition-colors h-auto"
      >
        <i className="ri-file-chart-line mr-2 text-xl"></i>
        <span>Generate Reports</span>
      </Button>
    </div>
  );
}
