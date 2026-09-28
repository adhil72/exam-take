import MdPreview from "@/components/ui/md-preview";

interface MCQInputProps {
  choices: string[];
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
}

export function MCQInput({ choices, selectedAnswer, onAnswerChange }: MCQInputProps) {
  return (
    <div className="space-y-3 mt-4">
      {choices.map((choice, index) => {
        const optionId = `opt-${index}`;
        return (
          <label
            key={index}
            htmlFor={optionId}
            className={`flex items-center gap-3 p-3.5 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all ${
              selectedAnswer === choice 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-border"
            }`}
          >
            <input
              id={optionId}
              type="radio"
              name="mcq-choice"
              checked={selectedAnswer === choice}
              onChange={() => onAnswerChange(choice)}
              className="w-4 h-4 text-primary border-border focus:ring-primary cursor-pointer"
            />
            <MdPreview value={choice} minimal className="text-sm font-medium text-foreground" />
          </label>
        );
      })}
    </div>
  );
}
