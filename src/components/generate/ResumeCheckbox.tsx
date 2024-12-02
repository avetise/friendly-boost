import { Checkbox } from "@/components/ui/checkbox";

interface ResumeCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const ResumeCheckbox = ({ checked, onCheckedChange }: ResumeCheckboxProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="useSameResume"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <label htmlFor="useSameResume">Use Same Resume</label>
    </div>
  );
};