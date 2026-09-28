import { useState } from 'react'
import { X } from 'lucide-react'

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0')

  const handlePress = (val: string) => {
    if (display === '0' && !['.', '+', '-', '*', '/'].includes(val)) {
      setDisplay(val)
    } else {
      setDisplay(display + val)
    }
  }

  const handleClear = () => setDisplay('0')
  const handleBackspace = () => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }
  const handleCalculate = () => {
    try {
      // Basic eval for demonstration purposes
      // eslint-disable-next-line no-eval
      setDisplay(String(eval(display)))
    } catch (e) {
      setDisplay('Error')
    }
  }

  return (
    <div className="fixed top-20 right-20 z-50 bg-card border border-border shadow-2xl rounded-md w-[320px] overflow-hidden flex flex-col font-sans select-none animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="bg-blue-600 text-white px-3 py-2 flex items-center justify-between text-sm font-semibold cursor-move">
        <span>Scientific Calculator</span>
        <button onClick={onClose} className="hover:text-red-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Display */}
      <div className="p-3 bg-background border-b border-border">
        <div className="bg-card border border-border rounded p-2 text-right font-mono text-xl overflow-hidden whitespace-nowrap h-10 shadow-inner">
          {display}
        </div>
        
        {/* Memory Row */}
        <div className="flex gap-1 mt-2 text-xs">
          {['MC', 'MR', 'MS', 'M+', 'M-'].map((btn) => (
            <button key={btn} className="flex-1 border bg-muted hover:bg-accent py-1 rounded">
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-2 grid grid-cols-5 gap-1 text-xs">
        {/* Scientific Functions */}
        <button className="border bg-muted hover:bg-accent py-2 rounded">sin</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">cos</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">tan</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">log</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">ln</button>

        <button className="border bg-muted hover:bg-accent py-2 rounded">sin⁻¹</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">cos⁻¹</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">tan⁻¹</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">10ˣ</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">eˣ</button>

        <button className="border bg-muted hover:bg-accent py-2 rounded">x²</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">x³</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">xʸ</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">√x</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">³√x</button>

        <button className="border bg-muted hover:bg-accent py-2 rounded">1/x</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">!</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">Exp</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">π</button>
        <button className="border bg-muted hover:bg-accent py-2 rounded">e</button>

        {/* Numbers & Operations */}
        <button onClick={() => handlePress('7')} className="border bg-card hover:bg-accent py-2 rounded font-bold">7</button>
        <button onClick={() => handlePress('8')} className="border bg-card hover:bg-accent py-2 rounded font-bold">8</button>
        <button onClick={() => handlePress('9')} className="border bg-card hover:bg-accent py-2 rounded font-bold">9</button>
        <button onClick={() => handleBackspace()} className="border bg-red-100 hover:bg-red-200 py-2 rounded text-red-700">⌫</button>
        <button onClick={() => handleClear()} className="border bg-red-100 hover:bg-red-200 py-2 rounded text-red-700">C</button>

        <button onClick={() => handlePress('4')} className="border bg-card hover:bg-accent py-2 rounded font-bold">4</button>
        <button onClick={() => handlePress('5')} className="border bg-card hover:bg-accent py-2 rounded font-bold">5</button>
        <button onClick={() => handlePress('6')} className="border bg-card hover:bg-accent py-2 rounded font-bold">6</button>
        <button onClick={() => handlePress('*')} className="border bg-accent hover:bg-accent/70 py-2 rounded">×</button>
        <button onClick={() => handlePress('/')} className="border bg-accent hover:bg-accent/70 py-2 rounded">÷</button>

        <button onClick={() => handlePress('1')} className="border bg-card hover:bg-accent py-2 rounded font-bold">1</button>
        <button onClick={() => handlePress('2')} className="border bg-card hover:bg-accent py-2 rounded font-bold">2</button>
        <button onClick={() => handlePress('3')} className="border bg-card hover:bg-accent py-2 rounded font-bold">3</button>
        <button onClick={() => handlePress('+')} className="border bg-accent hover:bg-accent/70 py-2 rounded">+</button>
        <button onClick={() => handlePress('-')} className="border bg-accent hover:bg-accent/70 py-2 rounded">-</button>

        <button className="border bg-card hover:bg-accent py-2 rounded font-bold">±</button>
        <button onClick={() => handlePress('0')} className="border bg-card hover:bg-accent py-2 rounded font-bold">0</button>
        <button onClick={() => handlePress('.')} className="border bg-card hover:bg-accent py-2 rounded font-bold">.</button>
        <button onClick={() => handleCalculate()} className="border bg-blue-600 hover:bg-blue-700 text-white py-2 rounded col-span-2 font-bold">=</button>
      </div>
    </div>
  )
}
