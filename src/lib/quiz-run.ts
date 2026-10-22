/**
 * One pass through a quiz, as pure functions: the order of questions (a
 * wrongly answered one comes back once at the end), each question's state
 * on the progress bar and in the totals, and whether an answer reads as
 * code (shown in the mono font). The quiz screen only renders this.
 */

/** A question's latest result. */
export type QuestionStatus = "pending" | "correct" | "wrong";

export interface QuizTurn {
  /** Index into the quiz's questions. */
  question: number;
  /** The second try at a question answered wrongly. */
  repeat: boolean;
}

export interface QuizRunState {
  turns: QuizTurn[];
  /** The turn being answered; `turns.length` once the quiz is over. */
  position: number;
  /** Per question. */
  status: QuestionStatus[];
  /** Per question: the option chosen last (null: not answered). */
  chosen: (number | null)[];
  /** Per question: right on the first try (null: not answered yet). */
  firstTry: (boolean | null)[];
}

/** A run over all the questions, or only `only` (repeating the mistakes; the rest count as right). */
export function createQuizRun(count: number, only?: number[]): QuizRunState {
  const questions = only ?? Array.from({ length: count }, (_, index) => index);
  const inRun = (index: number) => questions.includes(index);
  return {
    turns: questions.map((question) => ({ question, repeat: false })),
    position: 0,
    status: Array.from({ length: count }, (_, index) => (inRun(index) ? "pending" : "correct")),
    chosen: Array.from({ length: count }, () => null),
    firstTry: Array.from({ length: count }, (_, index) => (inRun(index) ? null : true)),
  };
}

export function currentTurn(run: QuizRunState): QuizTurn | null {
  return run.turns[run.position] ?? null;
}

export function isQuizOver(run: QuizRunState): boolean {
  return run.position >= run.turns.length;
}

/** Records the answer to the current turn; a wrong one comes back at the end — once. */
export function answerTurn(run: QuizRunState, chosen: number, correctIndex: number): QuizRunState {
  const turn = currentTurn(run);
  if (!turn) return run;
  const correct = chosen === correctIndex;
  const status = [...run.status];
  status[turn.question] = correct ? "correct" : "wrong";
  const answers = [...run.chosen];
  answers[turn.question] = chosen;
  const firstTry = [...run.firstTry];
  if (firstTry[turn.question] === null) firstTry[turn.question] = correct;
  const comesBack = !correct && !run.turns.some((item) => item.question === turn.question && item.repeat);
  const turns = comesBack ? [...run.turns, { question: turn.question, repeat: true }] : run.turns;
  return { turns, position: run.position, status, chosen: answers, firstTry };
}

/** Whether the current (just answered) question was put back at the end. */
export function willComeBack(run: QuizRunState): boolean {
  const turn = currentTurn(run);
  if (!turn || turn.repeat) return false;
  return run.turns.some((item, index) => index > run.position && item.question === turn.question && item.repeat);
}

export function nextTurn(run: QuizRunState): QuizRunState {
  return { ...run, position: Math.min(run.position + 1, run.turns.length) };
}

/** Whether the current turn is the last one (after it's been answered). */
export function isLastTurn(run: QuizRunState): boolean {
  return run.position + 1 >= run.turns.length;
}

export interface QuizTotals {
  /** Right now (a repeat answered correctly counts). */
  correct: number;
  /** Wrong and not put right yet. */
  toRepeat: number;
  /** Right on the first try — what the statistics record. */
  firstTry: number;
  total: number;
}

export function quizTotals(run: QuizRunState): QuizTotals {
  return {
    correct: run.status.filter((status) => status === "correct").length,
    toRepeat: run.status.filter((status) => status === "wrong").length,
    firstTry: run.firstTry.filter((result) => result === true).length,
    total: run.status.length,
  };
}

/** The questions still to repeat, for „გაიმეორე შეცდომები“. */
export function questionsToRepeat(run: QuizRunState): number[] {
  return run.status.flatMap((status, question) => (status === "wrong" ? [question] : []));
}

export type SegmentState = "correct" | "wrong" | "current" | "pending";

/**
 * One segment per question — repeats don't add any. The current question
 * shows as current until it's checked, then its result.
 */
export function progressSegments(run: QuizRunState, { checked = false }: { checked?: boolean } = {}): SegmentState[] {
  const current = currentTurn(run)?.question;
  return run.status.map((status, question) => (question === current && !checked ? "current" : status));
}

const CLI_START =
  /^(?:sudo|git|npm|npx|yarn|pnpm|pip3?|python3?|node|cd|ls|mkdir|rm|cp|mv|cat|echo|curl|wget|chmod|chown|ssh|docker|kubectl|brew|apt(?:-get)?|touch|grep|export|java|javac|gcc|make|SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\b/;

/**
 * An answer shown in the mono font: a command or a piece of code — backticks,
 * `>`, `|`, `--`, a path-like `/` (not „და/ან“), a call like `f(x)`, or a
 * line that starts like a CLI command.
 */
export function looksLikeCode(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (/[`|>]|--/.test(value)) return true;
  if (/(?:^|[\s.~])\/[\w.-]|[\w.-]\/[\w.-]*[a-zA-Z_.]/.test(value) && /[a-zA-Z]/.test(value)) return true;
  if (/^[A-Za-z_$][\w$.]*\([^)]*\);?$/.test(value)) return true;
  return CLI_START.test(value);
}
