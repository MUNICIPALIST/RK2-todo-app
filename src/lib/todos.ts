import type { Todo } from "@/types/todo";
import pool, { ensureDatabase } from "./db";

const mapTodoRow = (row: {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date | string;
}): Todo => {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at
      : new Date(row.created_at ?? "");

  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: createdAt.toISOString(),
  };
};

export const listTodos = async (): Promise<Todo[]> => {
  await ensureDatabase();
  const { rows } = await pool.query(`
    SELECT id, title, completed, created_at
    FROM todos
    ORDER BY created_at DESC;
  `);

  return rows.map(mapTodoRow);
};

export const createTodo = async (title: string): Promise<Todo> => {
  await ensureDatabase();
  const { rows } = await pool.query(
    `
      INSERT INTO todos (title)
      VALUES ($1)
      RETURNING id, title, completed, created_at;
    `,
    [title.trim()]
  );

  return mapTodoRow(rows[0]);
};

export const updateTodo = async (
  id: number,
  data: Partial<Pick<Todo, "title" | "completed">>
): Promise<Todo | null> => {
  await ensureDatabase();

  const fields: string[] = [];
  const values: Array<string | boolean> = [];

  if (typeof data.title === "string") {
    fields.push(`title = $${fields.length + 1}`);
    values.push(data.title.trim());
  }

  if (typeof data.completed === "boolean") {
    fields.push(`completed = $${fields.length + 1}`);
    values.push(data.completed);
  }

  if (!fields.length) {
    return null;
  }

  const { rows } = await pool.query(
    `
      UPDATE todos
      SET ${fields.join(", ")}
      WHERE id = $${fields.length + 1}
      RETURNING id, title, completed, created_at;
    `,
    [...values, id]
  );

  if (!rows.length) {
    return null;
  }

  return mapTodoRow(rows[0]);
};

export const deleteTodo = async (id: number): Promise<boolean> => {
  await ensureDatabase();
  const { rowCount } = await pool.query(`DELETE FROM todos WHERE id = $1;`, [
    id,
  ]);

  return Boolean(rowCount);
};

