"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Todo } from "@/types/todo";

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    return {
      total: todos.length,
      active: todos.length - completed,
      completed,
    };
  }, [todos]);

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/todos", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load todos.");
      }

      setTodos(payload.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title before creating a task.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create todo.");
      }

      setTodos((prev) => [payload.data, ...prev]);
      setTitle("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create todo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (todoId: number, completed: boolean) => {
    setActiveId(todoId);
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update todo.");
      }

      setTodos((prev) =>
        prev.map((todo) => (todo.id === todoId ? payload.data : todo))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update todo.");
    } finally {
      setActiveId(null);
    }
  };

  const handleDelete = async (todoId: number) => {
    setActiveId(todoId);
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete todo.");
      }

      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete todo.");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
            Modern Tasks
          </p>
          <div className="flex flex-col gap-4 text-white">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Build focus with a minimal,{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                real-time
              </span>{" "}
              todo board.
            </h1>
            <p className="text-lg text-white/70">
              Add tasks, mark them complete, and keep your goals in sync across
              the stack thanks to a typed REST API powered by PostgreSQL.
            </p>
          </div>
        </header>

        <StatsPanel stats={stats} isLoading={isLoading} />

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur transition">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-emerald-500/5 backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <label className="grow">
              <span className="sr-only">Task title</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:border-emerald-400 focus:bg-slate-900/60"
                placeholder="Ship onboarding emails, plan sprint retro…"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-6 text-base font-semibold text-slate-950 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Adding…" : "Add Task"}
            </button>
          </form>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur">
          <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/50">
            <span>Your Tasks</span>
            <span>{stats.total} total</span>
          </div>
          {isLoading ? (
            <LoadingState />
          ) : todos.length === 0 ? (
            <EmptyState />
          ) : (
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onDelete={handleDelete}
              busyId={activeId}
            />
          )}
        </section>
      </div>
    </div>
  );
}

type StatsPanelProps = {
  stats: { total: number; active: number; completed: number };
  isLoading: boolean;
};

const StatsPanel = ({ stats, isLoading }: StatsPanelProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    {["Total", "In Progress", "Completed"].map((label, index) => {
      const value =
        index === 0
          ? stats.total
          : index === 1
            ? stats.active
            : stats.completed;

      return (
        <article
          key={label}
          className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] p-4 text-white shadow-lg shadow-slate-900/30"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {isLoading ? "—" : value}
          </p>
          <div className="mt-4 h-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all"
              style={{
                width: `${
                  stats.total === 0
                    ? 0
                    : Math.round((value / stats.total) * 100)
                }%`,
              }}
            />
          </div>
        </article>
      );
    })}
  </div>
);

type TodoListProps = {
  todos: Todo[];
  busyId: number | null;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
};

const TodoList = ({ todos, busyId, onToggle, onDelete }: TodoListProps) => (
  <ul className="space-y-3">
    {todos.map((todo) => (
      <TodoItem
        key={todo.id}
        todo={todo}
        disabled={busyId === todo.id}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    ))}
  </ul>
);

type TodoItemProps = {
  todo: Todo;
  disabled: boolean;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
};

const TodoItem = ({ todo, disabled, onToggle, onDelete }: TodoItemProps) => (
  <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white shadow-sm shadow-black/30">
    <button
      type="button"
      disabled={disabled}
      aria-label={
        todo.completed ? "Mark todo as incomplete" : "Mark todo as complete"
      }
      onClick={() => onToggle(todo.id, !todo.completed)}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
        todo.completed
          ? "border-emerald-200/60 bg-emerald-400/20 text-emerald-200"
          : "border-white/15 bg-white/5 text-white/60"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`h-3 w-3 rounded-full ${
          todo.completed ? "bg-emerald-300" : "bg-white/40"
        }`}
      />
    </button>
    <div className="flex flex-1 flex-col gap-1">
      <p
        className={`text-base font-medium ${
          todo.completed ? "text-white/60 line-through" : "text-white"
        }`}
      >
        {todo.title}
      </p>
      <span className="text-xs uppercase tracking-[0.3em] text-white/40">
        Added {formatTimestamp(todo.createdAt)}
      </span>
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(todo.id, !todo.completed)}
        className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/50 disabled:opacity-60"
      >
        {todo.completed ? "Undo" : "Done"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDelete(todo.id)}
        className="rounded-full border border-red-400/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:border-red-300 hover:text-red-100 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  </li>
);

const LoadingState = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="h-20 animate-pulse rounded-2xl bg-white/5"
      />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/50">
    <p className="text-base">
      Your board is clear. Add the first task to get moving!
    </p>
  </div>
);
