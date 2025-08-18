import type { ConfigurationType } from '../configurations.js';

declare global {
  namespace Express {
    interface Request {
      config: ConfigurationType;
    }
  }
}

export {};
