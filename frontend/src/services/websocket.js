import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * WebSocket service for real-time dashboard updates
 */
class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                resolve();
                return;
            }

            const socket = new SockJS('/ws');
            this.stompClient = Stomp.over(socket);

            // Disable console logs from STOMP
            this.stompClient.debug = () => {};

            this.stompClient.connect({},
                () => {
                    this.connected = true;
                    console.log('WebSocket connected');
                    resolve();
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    this.connected = false;
                    reject(error);
                }
            );
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.stompClient) {
            // Unsubscribe from all topics
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions.clear();

            this.stompClient.disconnect();
            this.connected = false;
            console.log('WebSocket disconnected');
        }
    }

    /**
     * Subscribe to dashboard updates for a specific lecturer
     * @param {number} lecturerId - ID of the lecturer
     * @param {function} callback - Callback function for handling messages
     */
    subscribeToDashboardUpdates(lecturerId, callback) {
        return this.subscribe(`/topic/dashboard/${lecturerId}`, callback);
    }

    /**
     * Subscribe to a WebSocket topic
     * @param {string} topic - Topic to subscribe to
     * @param {function} callback - Callback function for handling messages
     */
    subscribe(topic, callback) {
        if (!this.connected) {
            console.error('Cannot subscribe: WebSocket not connected');
            return Promise.reject('WebSocket not connected');
        }

        return new Promise((resolve) => {
            if (this.subscriptions.has(topic)) {
                this.subscriptions.get(topic).unsubscribe();
            }

            const subscription = this.stompClient.subscribe(topic, (message) => {
                const data = JSON.parse(message.body);
                callback(data);
            });

            this.subscriptions.set(topic, subscription);
            resolve(subscription);
        });
    }

    /**
     * Register a handler for specific message types
     * @param {string} type - Message type (e.g., "TEST_SUBMISSION")
     * @param {function} handler - Handler function
     */
    registerHandler(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    /**
     * Process an incoming message and route to appropriate handler
     * @param {object} message - Message object
     */
    processMessage(message) {
        if (message && message.type && this.messageHandlers.has(message.type)) {
            this.messageHandlers.get(message.type)(message);
        }
    }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;