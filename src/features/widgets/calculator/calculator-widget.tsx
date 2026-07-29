import { Calculator as CalculatorIcon } from "lucide-react";
import { useState } from "react";
import type { WidgetDefinition } from "../types";
import {
  calculateEquals,
  INITIAL_STATE,
  inputDecimal,
  inputDigit,
  inputOperator,
  toggleSign,
  type Operator,
} from "./calculator-logic";

const keyClass = "flex h-10 items-center justify-center rounded-[10px] text-sm font-medium";
const digitKeyClass = `${keyClass} bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10`;
const operatorKeyClass = `${keyClass} bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300`;

function CalculatorContent() {
  const [state, setState] = useState(INITIAL_STATE);

  return (
    <div className="mt-2">
      <p className="truncate text-right text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {state.display}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => setState(INITIAL_STATE)}
          aria-label="Clear"
          className={digitKeyClass}
        >
          C
        </button>
        <button
          type="button"
          onClick={() => setState(toggleSign(state))}
          aria-label="Toggle sign"
          className={digitKeyClass}
        >
          ±
        </button>
        <button
          type="button"
          onClick={() => setState(inputOperator(state, "÷"))}
          aria-label="Divide"
          className={`${operatorKeyClass} col-span-2`}
        >
          ÷
        </button>

        {[7, 8, 9, "×", 4, 5, 6, "-", 1, 2, 3, "+"].map((key) => {
          if (typeof key === "number") {
            const digit = String(key);
            return (
              <button
                key={digit}
                type="button"
                onClick={() => setState(inputDigit(state, digit))}
                className={digitKeyClass}
              >
                {digit}
              </button>
            );
          }
          const operator = key as Operator;
          return (
            <button
              key={operator}
              type="button"
              onClick={() => setState(inputOperator(state, operator))}
              aria-label={operator}
              className={operatorKeyClass}
            >
              {operator}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setState(inputDigit(state, "0"))}
          className={`${digitKeyClass} col-span-2`}
        >
          0
        </button>
        <button
          type="button"
          onClick={() => setState(inputDecimal(state))}
          aria-label="Decimal point"
          className={digitKeyClass}
        >
          .
        </button>
        <button
          type="button"
          onClick={() => setState(calculateEquals(state))}
          aria-label="Equals"
          className={operatorKeyClass}
        >
          =
        </button>
      </div>
    </div>
  );
}

export const calculatorWidget: WidgetDefinition = {
  id: "calculator",
  title: "Calculator",
  icon: CalculatorIcon,
  defaultWide: true,
  component: CalculatorContent,
};
