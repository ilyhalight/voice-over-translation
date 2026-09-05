import { type JSX, mergeProps } from "solid-js";

import "./ProgressIcon.scss";
import { clampNumber } from "../../utils/number";

export type ProgressIconProps = {
  progress?: number;
};

export function ProgressIcon(props: ProgressIconProps): JSX.Element {
  const finalProps = mergeProps(
    { progress: 0 } as Partial<ProgressIconProps>,
    props,
  );

  const progress = () => clampNumber(finalProps.progress, 0, 100);

  return (
    <svg width="1em" height="100%" viewBox="0 0 24 24" fill="currentColor">
      <circle
        class="vot-progress-icon vot-progress-icon_base"
        cx="12"
        cy="12"
        r="9"
      />
      <circle
        class="vot-progress-icon vot-progress-icon_progress"
        cx="12"
        cy="12"
        r="9"
        pathLength="100"
        stroke-dasharray="100"
        stroke-dashoffset={100 - progress()}
      />
    </svg>
  );
}
