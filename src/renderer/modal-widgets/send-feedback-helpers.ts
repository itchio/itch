export interface BuildReportTextParams {
  message: string;
  system: unknown;
  includeSystemInfo: boolean;
  log?: string;
  errorStack?: string;
}

export function buildReportText(params: BuildReportTextParams): string {
  const { system, includeSystemInfo, message, log, errorStack } = params;

  const sections = [
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "> Message",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "",
    message,
    "",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "> System Information",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "",
    includeSystemInfo ? JSON.stringify(system, null, 2) : "(redacted)",
    "",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "> Log",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "",
    log || "(no log output available)",
  ];

  if (errorStack) {
    sections.push(
      "",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "> Error Stack Trace",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "",
      errorStack
    );
  }

  return sections.join("\n");
}

export interface DaleResponse {
  success?: boolean;
  id?: string | number;
  error?: string;
}

export function isDaleResponse(data: unknown): data is DaleResponse {
  return typeof data === "object" && data !== null;
}
