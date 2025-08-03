import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    room: string;
    id: string;
    username?: string;
}

interface Message {
    type: "join" | "chat" | "leave" | "userList";
    payload: {
        roomId?: string;
        message?: string;
        username?: string;
        users?: string[];
        timestamp?: string;
    };
}

let allSockets: User[] = [];

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function getUsersInRoom(roomId: string): User[] {
    return allSockets.filter(user => user.room === roomId);
}

function broadcastUserList(roomId: string): void {
    const usersInRoom = getUsersInRoom(roomId);
    const usernames = usersInRoom.map(user => user.username || user.id);
    
    usersInRoom.forEach(user => {
        if (user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(JSON.stringify({
                type: "userList",
                payload: { users: usernames }
            }));
        }
    });
}

function cleanupSocket(socket: WebSocket): void {
    const userIndex = allSockets.findIndex(user => user.socket === socket);
    if (userIndex !== -1) {
        const user = allSockets[userIndex];
        if (user) {
            const roomId = user.room;
            
            allSockets.splice(userIndex, 1);
            
            if (roomId) {
                broadcastUserList(roomId);
            }
            
            console.log(`User ${user.username || user.id} left room ${roomId}`);
        }
    }
}

wss.on("connection", (socket) => {
    const userId = generateId();
    console.log(`New connection: ${userId}`);

    socket.on("message", (message) => {
        try {
            const parsedMessage: Message = JSON.parse(message.toString());
            
            switch (parsedMessage.type) {
                case "join":
                    const { roomId, username } = parsedMessage.payload;
                    if (!roomId) {
                        socket.send(JSON.stringify({
                            type: "error",
                            payload: { message: "Room ID is required" }
                        }));
                        return;
                    }

                    const existingUserIndex = allSockets.findIndex(user => user.socket === socket);
                    if (existingUserIndex !== -1) {
                        const existingUser = allSockets[existingUserIndex];
                        if (existingUser) {
                            const oldRoom = existingUser.room;
                            allSockets.splice(existingUserIndex, 1);
                            if (oldRoom) broadcastUserList(oldRoom);
                        }
                    }

                    allSockets.push({
                        socket,
                        room: roomId,
                        id: userId,
                        username: username || `User_${userId}`
                    });

                    console.log(`User ${username || userId} joined room ${roomId}`);
                 
                    socket.send(JSON.stringify({
                        type: "joinConfirm",
                        payload: { roomId, userId }
                    }));

                    broadcastUserList(roomId);
                    break;

                case "chat":
                    const currentUser = allSockets.find(user => user.socket === socket);
                    if (!currentUser) {
                        socket.send(JSON.stringify({
                            type: "error",
                            payload: { message: "User not found. Please join a room first." }
                        }));
                        return;
                    }

                    const { message: chatMessage } = parsedMessage.payload;
                    if (!chatMessage || chatMessage.trim() === "") {
                        return; 
                    }

                    const messageWithMetadata = {
                        type: "chat",
                        payload: {
                            message: chatMessage.trim(),
                            username: currentUser.username || currentUser.id,
                            timestamp: new Date().toISOString(),
                            userId: currentUser.id
                        }
                    };

                    const usersInRoom = getUsersInRoom(currentUser.room);
                    usersInRoom.forEach(user => {
                        if (user.socket.readyState === WebSocket.OPEN) {
                            user.socket.send(JSON.stringify(messageWithMetadata));
                        }
                    });

                    console.log(`Message in room ${currentUser.room}: ${chatMessage}`);
                    break;

                default:
                    socket.send(JSON.stringify({
                        type: "error",
                        payload: { message: "Unknown message type" }
                    }));
            }
        } catch (error) {
            console.error("Error parsing message:", error);
            socket.send(JSON.stringify({
                type: "error",
                payload: { message: "Invalid message format" }
            }));
        }
    });

    socket.on("close", () => {
        cleanupSocket(socket);
        console.log(`Connection closed: ${userId}`);
    });

    socket.on("error", (error) => {
        console.error(`Socket error for user ${userId}:`, error);
        cleanupSocket(socket);
    });
});

console.log("WebSocket server running on port 8080");

setInterval(() => {
    allSockets = allSockets.filter(user => {
        if (user.socket.readyState !== WebSocket.OPEN) {
            console.log(`Cleaning up dead connection: ${user.id}`);
            return false;
        }
        return true;
    });
}, 30000); 