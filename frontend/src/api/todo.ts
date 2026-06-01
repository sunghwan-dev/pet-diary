import client from "./client";
import { TodoRequest, TodoResponse } from "../types";

export const todoApi = {
  getTodo: async (todoId: number): Promise<TodoResponse> => {
    const response = await client.get<TodoResponse>(`/api/todos/${todoId}`);
    return response.data;
  },

  getPetTodos: async (petId: number): Promise<TodoResponse[]> => {
    const response = await client.get<TodoResponse[]>("/api/todos", {
      params: { petId },
    });
    return response.data;
  },

  createTodo: async (petId: number, data: TodoRequest): Promise<number> => {
    const response = await client.post<number>("/api/todos", data, {
      params: { petId },
    });
    return response.data;
  },

  updateTodo: async (todoId: number, data: TodoRequest): Promise<void> => {
    await client.put(`/api/todos/${todoId}`, data);
  },

  toggleTodo: async (todoId: number): Promise<void> => {
    await client.patch(`/api/todos/${todoId}/toggle`);
  },

  deleteTodo: async (todoId: number): Promise<void> => {
    await client.delete(`/api/todos/${todoId}`);
  },
};
