import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onAddClient: () => void;
  onGenerateReports: () => void;
}

export default function ActionButtons({ onAddClient, onGenerateReports }: ActionButtonsProps) {
  return (
    // Empty div - buttons removed
    <div className="mb-6"></div>
  );
}
