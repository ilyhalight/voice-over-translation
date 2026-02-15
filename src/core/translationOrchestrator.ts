import debug from "../utils/debug";

export type TranslationState =
  | { status: "idle" }
  | { status: "pending"; reason: "auto" }
  | { status: "deferred"; reason: "muted" }
  | { status: "error"; message: unknown };

export interface TranslationOrchestratorDeps {
  isFirstPlay(): boolean;
  setFirstPlay(next: boolean): void;
  isAutoTranslateEnabled(): boolean;
  getVideoId(): string | undefined;
  scheduleAutoTranslate(): Promise<void>;
  /** Returns true if on mobile YouTube and video is currently muted */
  isMobileYouTubeMuted?(): boolean;
  /** Sets up a one-time watcher to trigger callback when video is unmuted */
  setMuteWatcher?(callback: () => void): void;
}

export class TranslationOrchestrator {
  private state: TranslationState = { status: "idle" };
  private readonly deps: TranslationOrchestratorDeps;

  constructor(deps: TranslationOrchestratorDeps) {
    this.deps = deps;
  }

  get currentState(): TranslationState {
    return this.state;
  }

  private setState(next: TranslationState) {
    this.state = next;
    debug.log("[TranslationOrchestrator] state", next);
  }

  reset() {
    this.setState({ status: "idle" });
  }

  async runAutoTranslationIfEligible() {
    if (this.state.status !== "idle") {
      return;
    }

    if (
      !(
        this.deps.isFirstPlay() &&
        this.deps.isAutoTranslateEnabled() &&
        this.deps.getVideoId()
      )
    ) {
      return;
    }

    // Defer auto-translate on mobile YouTube until user unmutes
    if (this.deps.isMobileYouTubeMuted?.()) {
      debug.log(
        "[TranslationOrchestrator] Mobile YouTube video is muted, deferring auto-translate",
      );
      this.setState({ status: "deferred", reason: "muted" });
      this.deps.setMuteWatcher?.(() => {
        debug.log(
          "[TranslationOrchestrator] Video unmuted, running deferred auto-translate",
        );
        this.setState({ status: "idle" });
        void this.runAutoTranslationIfEligible();
      });
      return;
    }

    this.setState({ status: "pending", reason: "auto" });

    try {
      this.deps.setFirstPlay(false);
      await this.deps.scheduleAutoTranslate();
      this.reset();
    } catch (err) {
      this.setState({ status: "error", message: err });
      throw err;
    }
  }
}
