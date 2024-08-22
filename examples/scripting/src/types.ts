import * as core from '@diffusionstudio/core';

export type Settings = Partial<core.CompositionSettings> | undefined;
export type MainFn = (composition: core.Composition) => Promise<void>;
