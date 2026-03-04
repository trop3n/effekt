export type ParamType = 'slider' | 'toggle' | 'curve';

export interface ParamDefinition {
  name: string;
  label: string;
  type: ParamType;
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean;
}

export interface PassDescriptor {
  /** Uniform overrides for this specific pass (e.g., blur direction) */
  uniforms?: Record<string, number | number[]>;
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: string;
  params: ParamDefinition[];
  fragSource: string;
  /** Number of passes (default 1). For multi-pass effects like blur, return >1 */
  getPasses(values: Record<string, number | boolean>): PassDescriptor[];
}

export interface EffectNodeState {
  id: string;
  definitionId: string;
  isOn: boolean;
  values: Record<string, number | boolean>;
}
