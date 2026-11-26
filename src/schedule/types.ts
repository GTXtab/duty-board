export type IsoDate = `${number}-${number}-${number}`;

/** `suggested` is produced by the planner and never read from a sheet. */
export type Mark = 'away' | 'assigned' | 'done' | 'suggested';

export interface RosterRow {
  readonly date: IsoDate;
  /** Aligned by index with `Roster.members`. */
  readonly marks: readonly (Mark | null)[];
}

export interface Roster {
  readonly members: readonly string[];
  readonly rows: readonly RosterRow[];
}

export interface Schedule {
  readonly daily: Roster;
  readonly cleaning: Roster | null;
}

export type ParseResult =
  | { readonly ok: true; readonly schedule: Schedule }
  | { readonly ok: false; readonly errors: readonly string[] };
