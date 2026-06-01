import client from "./client";
import { ExpenseRequest } from "../types";

export const expenseApi = {
  recordExpense: async (petId: number, data: ExpenseRequest): Promise<number> => {
    const response = await client.post<number>("/api/expenses", data, {
      params: { petId },
    });
    return response.data;
  },

  deleteExpense: async (expenseId: number): Promise<void> => {
    await client.delete(`/api/expenses/${expenseId}`);
  },

  getPetExpenses: async (petId: number): Promise<any[]> => {
    const response = await client.get<any[]>("/api/expenses/pet", {
      params: { petId },
    });
    return response.data;
  },

  updateExpense: async (expenseId: number, data: ExpenseRequest): Promise<void> => {
    await client.put(`/api/expenses/${expenseId}`, data);
  },
};
