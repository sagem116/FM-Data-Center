export const IMPORT_COMPLETED_EVENT = 'fm-data-center:import-completed'

export function notifyImportCompleted(): void {
  window.dispatchEvent(new CustomEvent(IMPORT_COMPLETED_EVENT))
}
