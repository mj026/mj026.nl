export type TPartialConfig = {
  template: string;
  context: object;
};

export interface IPartialRenderer {
  config: TPartialConfig;

  render(): string;
}

export abstract class AbstractPartialRenderer implements IPartialRenderer {
  config: TPartialConfig;

  constructor(config: TPartialConfig) {
    this.config = config;
  }

  abstract render(): string;
}

// We need a abstract construct signature here as abstract classes can't be initiated.
// See https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-construct-signatures
type AbstractPartialRendererConstructor = new (
  config: TPartialConfig,
) => AbstractPartialRenderer;

export type TRenderEngines = Record<string, AbstractPartialRendererConstructor>;
