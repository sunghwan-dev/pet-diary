import client from './client';

export const fileApi = {
  uploadFile: async (uri: string): Promise<{ fileName: string; url: string }> => {
    const formData = new FormData();
    
    // URI에서 파일명 추출
    const fileName = uri.split('/').pop() || 'image.jpg';
    
    // 파일 확장자 추출 (간단하게)
    const match = /\.(\w+)$/.exec(fileName);
    const type = match ? `image/${match[1]}` : `image/jpg`;

    // React Native의 FormData 형식에 맞게 추가
    formData.append('file', {
      uri,
      name: fileName,
      type,
    } as any);

    const response = await client.post<{ fileName: string; url: string }>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};
