export type Operator = "+" | "-" | "×" | "÷";

export interface CalculatorState {
  display: string;
  storedValue: number | null;
  operator: Operator | null;
  /** True right after an operator or "=" was pressed: the next digit starts a fresh number. */
  awaitingFreshDigit: boolean;
}

export const INITIAL_STATE: CalculatorState = {
  display: "0",
  storedValue: null,
  operator: null,
  awaitingFreshDigit: false,
};

const MAX_DIGITS = 12;

function applyOperator(a: number, b: number, operator: Operator): number {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Error";
  if (!Number.isFinite(value)) return "Error";
  return String(Math.round(value * 1e10) / 1e10);
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.awaitingFreshDigit) {
    return { ...state, display: digit, awaitingFreshDigit: false };
  }
  if (state.display === "0") {
    return { ...state, display: digit };
  }
  if (state.display.replace("-", "").length >= MAX_DIGITS) {
    return state;
  }
  return { ...state, display: state.display + digit };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.awaitingFreshDigit) {
    return { ...state, display: "0.", awaitingFreshDigit: false };
  }
  if (state.display.includes(".")) return state;
  return { ...state, display: state.display + "." };
}

export function inputOperator(state: CalculatorState, operator: Operator): CalculatorState {
  const current = Number(state.display);

  if (state.operator !== null && !state.awaitingFreshDigit) {
    const result = applyOperator(state.storedValue ?? 0, current, state.operator);
    return {
      display: formatResult(result),
      storedValue: result,
      operator,
      awaitingFreshDigit: true,
    };
  }

  return { ...state, storedValue: current, operator, awaitingFreshDigit: true };
}

export function calculateEquals(state: CalculatorState): CalculatorState {
  if (state.operator === null || state.storedValue === null) return state;
  const current = Number(state.display);
  const result = applyOperator(state.storedValue, current, state.operator);
  return {
    display: formatResult(result),
    storedValue: null,
    operator: null,
    awaitingFreshDigit: true,
  };
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.display === "0") return state;
  return {
    ...state,
    display: state.display.startsWith("-") ? state.display.slice(1) : `-${state.display}`,
  };
}
