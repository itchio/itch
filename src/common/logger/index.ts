export const levelNumbers = {
  silent: 100,
  fatal: 50,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as { [key: string]: number };

export const levels = {
  default: "USERLVL",
  60: "FATAL",
  50: "ERROR",
  40: "WARN",
  30: "INFO",
  20: "DEBUG",
  10: "TRACE",
} as { [key: number]: string; default: string };

export interface LogEntry {
  time: number;
  level: number;
  msg: string;
  name?: string;
}

export interface LogSink {
  write(entry: LogEntry): void;
}

export class BaseLogger<S extends LogSink> {
  private name?: string;
  public sink: S;

  constructor(sink: S, name?: string) {
    this.name = name;
    this.sink = sink;
  }

  debug(msg: string) {
    this.log(levelNumbers.debug, msg);
  }

  info(msg: string) {
    this.log(levelNumbers.info, msg);
  }

  warn(msg: string) {
    this.log(levelNumbers.warn, msg);
  }

  error(msg: string) {
    this.log(levelNumbers.error, msg);
  }

  log(level: number, msg: string) {
    this.write({ time: Date.now(), level, msg, name: this.name });
  }

  child(filename: string): Logger {
    let tokens = filename.split(/[\/\\]/);
    tokens = tokens.slice(1);
    tokens[0] = tokens[0].substring(0, 1);
    for (let i = 1; i < tokens.length - 1; i++) {
      tokens[i] = tokens[i].substring(0, 4);
    }
    let name = tokens.join("/");
    name = name.replace(/\.[^.]+$/, "");
    return this.childWithName(name);
  }

  childWithName(name: string): Logger {
    return new Logger(this.sink, name);
  }

  write(entry: LogEntry) {
    this.sink.write(entry);
  }
}

export class Logger extends BaseLogger<LogSink> {
  constructor(sink: LogSink, name?: string) {
    super(sink, name);
  }
}

export const devNull: LogSink = {
  write: (entry: LogEntry) => {
    /* muffin */
  },
};

export function multiSink(...sinks: LogSink[]) {
  return {
    write(entry: LogEntry) {
      for (const sink of sinks) {
        sink.write(entry);
      }
    },
  };
}

export const streamSink = (stream: NodeJS.WritableStream): LogSink => {
  return {
    write(entry: LogEntry) {
      try {
        stream.write(JSON.stringify(entry));
        stream.write("\n");
      } catch (e) {
        console.warn(`Could not write log entry: ${e.stack}`);
      }
    },
  };
};

export class RecordingLogger extends Logger {
  private stringSink: StringSink;

  constructor(parent: Logger, name?: string) {
    let stringSink = new StringSink();
    let sink = multiSink(parent.sink, stringSink);

    super(sink, name);
    this.stringSink = stringSink;
  }

  /**
   * Returns all log messages as a string
   */
  getLog(): string {
    return this.stringSink.toString();
  }
}

export class MemoryLogger extends BaseLogger<StringSink> {
  constructor(name?: string) {
    super(new StringSink(), name);
  }

  /**
   * Returns all log messages as a string
   */
  getLog(): string {
    return this.sink.toString();
  }
}

class StringSink implements LogSink {
  private buffer = "";

  write(entry: LogEntry) {
    this.buffer += `${JSON.stringify(entry)}\n`;
  }

  toString(): string {
    return this.buffer;
  }
}

export const recordingLogger = (
  parent: Logger,
  name?: string
): RecordingLogger => {
  return new RecordingLogger(parent, name);
};
