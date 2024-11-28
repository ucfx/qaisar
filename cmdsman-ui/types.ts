export interface Command {
  directory: string;
  command: string;
  group: string;
  deleted: boolean;
}

export interface CommandInfo {
  status: 'stopped' | 'running' | 'complete' | 'incomplete' | null;
  iter: number | null;
  total: number | null;
  started: number | null;
  eta: number | null;
  pid: number | null;
  results?: number;
}

export interface CommandWithStatus extends Command {
  info: CommandInfo;
}


export interface TableCommand extends Command {
  id: string;
  info: CommandInfo;
  selected: boolean;
}

export interface ErrorConstructor {
  captureStackTrace?(targetObject: Object, constructorOpt?: Function): void;
}