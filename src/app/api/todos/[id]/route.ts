import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteTodo, updateTodo } from "@/lib/todos";

const updateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(120, "Title is too long")
      .optional(),
    completed: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      typeof payload.title === "string" || payload.completed !== undefined,
    {
      message: "Provide at least one field to update.",
      path: ["title"],
    }
  );

const parseId = (rawId: string) => {
  const value = Number(rawId);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
  }

  try {
    const payload = updateSchema.parse(await request.json());
    const updated = await updateTodo(todoId, payload);

    if (!updated) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Unable to update todo right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
  }

  try {
    const removed = await deleteTodo(todoId);
    if (!removed) {
      return NextResponse.json({ error: "Todo not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to delete todo right now." },
      { status: 500 }
    );
  }
}

