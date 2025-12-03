import { NextResponse } from "next/server";
import { z } from "zod";
import { createTodo, listTodos } from "@/lib/todos";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(120, "Title is too long"),
});

export async function GET() {
  try {
    const todos = await listTodos();
    return NextResponse.json({ data: todos });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load todos right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const todo = await createTodo(payload.title);

    return NextResponse.json({ data: todo }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Unable to create todo right now." },
      { status: 500 }
    );
  }
}

