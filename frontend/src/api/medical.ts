import client from "./client";
import { MedicalLogRequest, MedicationRequest } from "../types";

export const medicalApi = {
  recordMedicalLog: async (petId: number, data: MedicalLogRequest): Promise<number> => {
    const response = await client.post<number>("/api/medical/logs", data, {
      params: { petId },
    });
    return response.data;
  },

  recordMedication: async (petId: number, data: MedicationRequest): Promise<number> => {
    const response = await client.post<number>("/api/medical/medications", data, {
      params: { petId },
    });
    return response.data;
  },

  deleteMedicalLog: async (logId: number): Promise<void> => {
    await client.delete(`/api/medical/logs/${logId}`);
  },

  deleteMedication: async (medicationId: number): Promise<void> => {
    await client.delete(`/api/medical/medications/${medicationId}`);
  },

  getPetMedicalRecords: async (petId: number): Promise<any[]> => {
    const response = await client.get<any[]>("/api/medical/records", {
      params: { petId },
    });
    return response.data;
  },

  updateMedicalRecord: async (recordId: number, recordType: string, data: MedicalLogRequest): Promise<void> => {
    await client.put(`/api/medical/records/${recordId}`, data, {
      params: { recordType },
    });
  },
};
