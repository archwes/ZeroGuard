import postgres, { type ParameterOrJSON } from 'postgres';

import { config } from '../config.js';

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

const sql = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function query<T = unknown>(
  text: string,
  params: Array<unknown> = []
): Promise<QueryResult<T>> {
  const rows = (await sql.unsafe(
    text,
    params as Array<ParameterOrJSON<never>>
  )) as T[];
  return {
    rows,
    rowCount: rows.length,
  };
}

async function execute(
  text: string,
  params: Array<unknown> = []
): Promise<{ rowCount: number }> {
  const rows = (await sql.unsafe(
    text,
    params as Array<ParameterOrJSON<never>>
  )) as unknown[];
  return { rowCount: rows.length };
}

export const db = {
  query,
  execute,
  sql,
};
