import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";

interface DescriptiveInputProps {
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
}

export function DescriptiveInput({ selectedAnswer, onAnswerChange }: DescriptiveInputProps) {
  const [text, setText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setText(selectedAnswer || "");
  }, [selectedAnswer]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Debounce the parent update (WebSocket send) by 800ms
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onAnswerChange(val);
    }, 800); // 800ms
  };

  // Clean up timer on unmount or question change
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-2 mt-4">
      <Label htmlFor="desc-ans" className="text-muted-foreground font-medium">
        Your Answer (Descriptive Response)
      </Label>
      <textarea
        id="desc-ans"
        rows={6}
        placeholder="Type your detailed answer here..."
        value={text}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-card shadow-sm"
      />
      <div className="text-right text-xs text-muted-foreground italic">
        Draft auto-saves as you type
      </div>
    </div>
  );
}
