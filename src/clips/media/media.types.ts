import { SilenceDetectionOptions } from "../../sources";

export type SilenceRemoveOptions = {
  /**
   * Adds padding in milliseconds after each detected non-silent segment.
   * This helps prevent cutting off audio too abruptly.
   * @default 500
   */
	padding?: number;
} & SilenceDetectionOptions;
