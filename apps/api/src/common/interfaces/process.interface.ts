/** Mismas interfaces que jc-core (`common/interfaces`). */
export interface ProcessInterfaceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CheckRulesAndProcessInterfaceResult<T> {
  isValid: boolean;
  constraints: ProcessInterfaceResult<T>[];
  data?: T;
}

export interface BasicBluePrintInterface<TInput, TOutput = TInput> {
  execute(data: TInput): Promise<CheckRulesAndProcessInterfaceResult<TOutput>>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
