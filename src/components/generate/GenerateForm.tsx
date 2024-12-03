import { Textarea } from "@/components/ui/textarea";

interface GenerateFormProps {
  formData: {
    cv: string;
    jd: string;
  };
  setFormData: (data: { cv: string; jd: string }) => void;
  useSameResume: boolean;
}

export const GenerateForm = ({ formData, setFormData, useSameResume }: GenerateFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Resume</label>
        <Textarea
          name="cv"
          placeholder="Paste your resume here"
          value={formData.cv}
          onChange={(e) => setFormData({ ...formData, cv: e.target.value })}
          className="min-h-[150px] resize-none"
          disabled={useSameResume}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Job Description</label>
        <Textarea
          name="jd"
          placeholder="Paste the job description here"
          value={formData.jd}
          onChange={(e) => setFormData({ ...formData, jd: e.target.value })}
          className="min-h-[150px] resize-none"
        />
      </div>
    </div>
  );
};