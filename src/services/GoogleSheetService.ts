import { ConcreteData, SheetType } from "../types";
import { offlineService, PendingRequest } from "./OfflineService";

export class GoogleSheetService {
  private scriptUrl: string;

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
  }

  async fetchOptions(retries = 2): Promise<any> {
    const url = this.scriptUrl.trim();
    if (!url || !url.startsWith('http')) return { projets: [], responsables: [], livreurs: [] };
    
    try {
      const separator = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${separator}action=getOptions&t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        redirect: "follow"
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching options (retries left: ${retries}):`, error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchOptions(retries - 1);
      }
      
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError')) {
        throw new Error("فشل الاتصال بالسكريبت (Failed to fetch). تأكد من:\n1. الرابط ينتهي بـ /exec\n2. السكريبت منشور كـ Web App.\n3. صلاحية الوصول هي Anyone.\n4. متصل بالإنترنت.");
      }
      return { projets: [], responsables: [], livreurs: [] };
    }
  }

  async fetchData(sheetName: SheetType): Promise<ConcreteData[]> {
    const url = this.scriptUrl.trim();
    if (!url || !url.startsWith('http')) {
      return await offlineService.getCachedData(sheetName) || [];
    }
    
    try {
      const separator = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${separator}action=read&sheetName=${sheetName}&t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("البيانات المستلمة ليست بتنسيق صحيح (Array)");
      }
      
      // Cache data for offline use
      await offlineService.cacheData(sheetName, data);
      return data as ConcreteData[];
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Fallback to cached data
      const cached = await offlineService.getCachedData(sheetName);
      if (cached) return cached;

      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError')) {
        throw new Error("فشل تحميل البيانات (Failed to fetch). يرجى التأكد من إعدادات نشر السكريبت (Web App -> Anyone) وصحة الرابط.");
      }
      throw error;
    }
  }

  async addData(sheetName: SheetType, item: Record<string, any>): Promise<boolean> {
    if (!this.scriptUrl) return false;
    
    if (!navigator.onLine) {
      await offlineService.addRequest({ action: 'create', sheetName, data: item });
      return true; // Assume success for offline
    }

    try {
      const response = await fetch(this.scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({ action: "create", sheetName, data: item }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error adding data, queueing for later:", error);
      await offlineService.addRequest({ action: 'create', sheetName, data: item });
      return true;
    }
  }

  async updateData(sheetName: SheetType, id: string, item: Record<string, any>): Promise<boolean> {
    if (!this.scriptUrl) return false;

    if (!navigator.onLine) {
      await offlineService.addRequest({ action: 'update', sheetName, recordId: id, data: item });
      return true;
    }

    try {
      const response = await fetch(this.scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({ action: "update", sheetName, id, data: item }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating data, queueing for later:", error);
      await offlineService.addRequest({ action: 'update', sheetName, recordId: id, data: item });
      return true;
    }
  }

  async deleteData(sheetName: SheetType, id: string): Promise<boolean> {
    if (!this.scriptUrl) return false;

    if (!navigator.onLine) {
      await offlineService.addRequest({ action: 'delete', sheetName, recordId: id });
      return true;
    }

    try {
      const response = await fetch(this.scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({ action: "delete", sheetName, id }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting data, queueing for later:", error);
      await offlineService.addRequest({ action: 'delete', sheetName, recordId: id });
      return true;
    }
  }

  async syncQueue(): Promise<{ success: number, failed: number }> {
    const queue = await offlineService.getPendingRequests();
    let success = 0;
    let failed = 0;

    for (const request of queue) {
      try {
        let ok = false;
        if (request.action === 'create') {
          ok = await this.addDataDirect(request.sheetName as SheetType, request.data);
        } else if (request.action === 'update') {
          ok = await this.updateDataDirect(request.sheetName as SheetType, request.recordId!, request.data);
        } else if (request.action === 'delete') {
          ok = await this.deleteDataDirect(request.sheetName as SheetType, request.recordId!);
        }

        if (ok) {
          await offlineService.removeRequest(request.id!);
          success++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }
    return { success, failed };
  }

  private async addDataDirect(sheetName: SheetType, item: Record<string, any>): Promise<boolean> {
    const response = await fetch(this.scriptUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "create", sheetName, data: item }),
    });
    return response.ok;
  }

  private async updateDataDirect(sheetName: SheetType, id: string, item: Record<string, any>): Promise<boolean> {
    const response = await fetch(this.scriptUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "update", sheetName, id, data: item }),
    });
    return response.ok;
  }

  private async deleteDataDirect(sheetName: SheetType, id: string): Promise<boolean> {
    const response = await fetch(this.scriptUrl, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "delete", sheetName, id }),
    });
    return response.ok;
  }

  async uploadImage(base64: string, fileName: string): Promise<string> {
    if (!this.scriptUrl) throw new Error("رابط السكريبت غير مضبوط");
    
    try {
      const response = await fetch(this.scriptUrl, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ action: "uploadImage", base64, fileName }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.success && typeof result.result === 'string' && result.result.startsWith('http')) {
        return result.result;
      } else {
        throw new Error(result.error || "فشل رفع الصورة على السيرفر");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
}
