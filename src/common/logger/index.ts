import memory from "memory-streams";

const levelNumbers = {
  silent: 100,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
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
  write(entry: LogEntry);
}

export class Logger {
  private name: string;
  public sink: LogSink;

  constructor(sink: LogSink, name?: string) {
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
    const l = new Logger(this.sink, name);
    return l;
  }

  private log(level: number, msg: string) {
    this.write({ time: Date.now(), level, msg, name: this.name });
  }

  write(entry: LogEntry) {
    this.sink.write(entry);
  }
}

export const devNull = {
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
      stream.write(JSON.stringify(entry));
      stream.write("\n");
    },
  };
};

export class RecordingLogger extends Logger {
  public memlog: memory.WritableStream;
  closed = false;

  constructor(parent: Logger, name?: string) {
    super(parent.sink, name); // boo! down with constructors
    this.memlog = new memory.WritableStream();
    this.sink = multiSink(parent.sink, streamSink(this.memlog));
  }

  /**
   * Returns all log messages as a string
   */
  getLog(): string {
    return this.memlog.toString();
  }

  destroy() {
    this.sink = devNull;
    this.memlog.destroy();
  }
}

export const recordingLogger = (
  parent: Logger,
  name?: string
): RecordingLogger => {
  return new RecordingLogger(parent, name);
};
