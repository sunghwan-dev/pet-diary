import client from './client';
import { PetRequest, PetResponse } from '../types';

export const petApi = {
  getUserPets: async (userId: number): Promise<PetResponse[]> => {
    const response = await client.get<PetResponse[]>('/api/pets', {
      params: { userId },
    });
    return response.data;
  },

  getPetDetail: async (petId: number): Promise<PetResponse> => {
    const response = await client.get<PetResponse>(`/api/pets/${petId}`);
    return response.data;
  },

  registerPet: async (userId: number, data: PetRequest): Promise<number> => {
    const response = await client.post<number>('/api/pets', data, {
      params: { userId },
    });
    return response.data;
  },

  deletePet: async (petId: number): Promise<void> => {
    await client.delete(`/api/pets/${petId}`);
  },

  updatePet: async (petId: number, data: PetRequest): Promise<void> => {
    await client.put(`/api/pets/${petId}`, data);
  },
};
