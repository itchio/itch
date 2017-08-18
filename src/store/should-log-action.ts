export default function shouldLogAction(action: any): boolean {
  return (
    !action.MONITOR_ACTION &&
    !/^WINDOW_/.test(action.type) &&
    !/_DB_/.test(action.type) &&
    !/LOCALE_/.test(action.type) &&
    !/_DATAPOINT$/.test(action.type) &&
    action.type !== "TASK_PROGRESS"
  );
}
