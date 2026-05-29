import axiosClient from "./axiosClient";

export const uploadApi = {
  uploadImagen: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await axiosClient.post<{ url: string }>("/upload/imagen", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return res.data.url;
  },
};
