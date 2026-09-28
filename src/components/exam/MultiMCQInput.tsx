import { useEffect, useState } from "react";
import MdPreview from "@/components/ui/md-preview";

interface MultiMCQInputProps {
  choices: string[];
  selectedAnswers: string[]; // Received as JSON array of answers
  onAnswerChange: (answers: string[]) => void;
}

export function MultiMCQInput({ choices, selectedAnswers, onAnswerChange }: MultiMCQInputProps) {
  const [checkedList, setCheckedList] = useState<string[]>([]);

  // Synchronize internal state with changes from props (navigation)
  useEffect(() => {
    setCheckedList(selectedAnswers || []);
  }, [selectedAnswers]);

  const handleToggle = (choice: string) => {
    let updated;
    if (checkedList.includes(choice)) {
      updated = checkedList.filter((item) => item !== choice);
    } else {
      updated = [...checkedList, choice];
    }
    setCheckedList(updated);
    onAnswerChange(updated);
  };

  return (
    <div className="space-y-3 mt-4">
      {choices.map((choice, index) => {
        const optionId = `multi-opt-${index}`;
        const isChecked = checkedList.includes(choice);
        return (
          <label
            key={index}
            htmlFor={optionId}
            className={`flex items-center gap-3 p-3.5 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all ${
              isChecked 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-border"
            }`}
          >
            <input
              id={optionId}
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggle(choice)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
            />
            <MdPreview value={choice} minimal className="text-sm font-medium text-foreground" />
          </label>
        );
      })}
    </div>
  );
}
