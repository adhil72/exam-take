import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumericalInputProps {
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
}

export function NumericalInput({ selectedAnswer, onAnswerChange }: NumericalInputProps) {
  const [val, setVal] = useState("");

  useEffect(() => {
    setVal(selectedAnswer || "");
  }, [selectedAnswer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    // Allow digits, decimals, and negative signs only
    if (text === "" || /^-?\d*\.?\d*$/.test(text)) {
      setVal(text);
      onAnswerChange(text);
    }
  };

  return (
    <div className="space-y-2 mt-4 max-w-xs">
      <Label htmlFor="num-ans" className="text-muted-foreground font-medium">
        Your Answer (Numerical Value)
      </Label>
      <Input
        id="num-ans"
        type="text"
        placeholder="Enter numerical answer..."
        value={val}
        onChange={handleChange}
        className="font-mono text-base border-border focus-visible:ring-primary"
      />
    </div>
  );
}
