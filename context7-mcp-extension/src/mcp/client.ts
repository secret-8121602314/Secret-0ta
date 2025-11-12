import { EventEmitter } from 'events';
import axios from 'axios';

export class MCPClient {
    private baseUrl: string;
    private eventEmitter: EventEmitter;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.eventEmitter = new EventEmitter();
    }

    public async sendRequest(endpoint: string, data: any): Promise<any> {
        try {
            const response = await axios.post(`${this.baseUrl}/${endpoint}`, data);
            return response.data;
        } catch (error) {
            this.eventEmitter.emit('error', error);
            throw error;
        }
    }

    public on(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: string, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }
}