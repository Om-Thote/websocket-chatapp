import { useEffect, useRef, useState } from 'react'
import './App.css'

interface ChatMessage {
  message: string;
  username: string;
  timestamp: string;
  userId: string;
  isOwn?: boolean;
}

interface MessageData {
  type: string;
  payload: any;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    //@ts-ignore
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      // Don't try to reconnect if we've exceeded max attempts
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        setConnectionStatus('disconnected');
        return;
      }

      try {
        setConnectionStatus('connecting');
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnectionStatus('connected');
          reconnectAttempts = 0; // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data: MessageData = JSON.parse(event.data);

            switch (data.type) {
              case 'chat':
                const newMessage: ChatMessage = {
                  message: data.payload.message,
                  username: data.payload.username,
                  timestamp: data.payload.timestamp,
                  userId: data.payload.userId,
                  isOwn: data.payload.userId === userId
                };
                setMessages(prev => [...prev, newMessage]);
                break;

              case 'userList':
                setUsers(data.payload.users || []);
                break;

              case 'joinConfirm':
                setUserId(data.payload.userId);
                setIsJoined(true);
                setMessages([]); // Clear messages when joining new room
                break;

              case 'error':
                console.error('Server error:', data.payload.message);
                alert(`Error: ${data.payload.message}`);
                break;

              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          setConnectionStatus('disconnected');
          setIsJoined(false);

          // Only attempt to reconnect if it wasn't a normal closure
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');

        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, []); // Remove userId from dependency array to prevent reconnections

  const joinRoom = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && currentRoom.trim() && username.trim()) {
      wsRef.current.send(JSON.stringify({
        type: "join",
        payload: {
          roomId: currentRoom.trim(),
          username: username.trim()
        }
      }));
    }
  };

  const sendMessage = () => {
    if (!inputRef.current) return;

    const message = inputRef.current.value.trim();
    if (message && wsRef.current?.readyState === WebSocket.OPEN && isJoined) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        payload: {
          message: message
        }
      }));
      inputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isJoined) {
        sendMessage();
      } else {
        joinRoom();
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className='h-screen bg-gray-900 text-white flex'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-800 p-4 border-r border-gray-700'>
        <h2 className='text-xl font-bold mb-4'>Chat Rooms</h2>

        {/* Connection Status */}
        <div className='mb-4'>
          <div className={`text-sm px-2 py-1 rounded ${connectionStatus === 'connected' ? 'bg-green-600' :
            connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
              connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Server Offline'}
          </div>
          {connectionStatus === 'disconnected' && (
            <div className='text-xs text-red-400 mt-1'>
              Make sure the backend server is running on port 8080
            </div>
          )}
        </div>

        {/* Join Room Form */}
        {!isJoined && (
          <div className='mb-4'>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-2 mb-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
            <input
              type="text"
              placeholder="Room ID"
              value={currentRoom}
              onChange={(e) => setCurrentRoom(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-2 mb-2 bg-gray-700 rounded border border-gray-600 text-white"
            />
            <button
              onClick={joinRoom}
              disabled={!username.trim() || !currentRoom.trim() || connectionStatus !== 'connected'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Room Info */}
        {isJoined && (
          <div className='mb-4'>
            <h3 className='font-semibold'>Room: {currentRoom}</h3>
            <p className='text-sm text-gray-400'>Users online: {users.length}</p>
            <div className='mt-2'>
              {users.map((user, index) => (
                <div key={index} className='text-sm text-green-400'>👤 {user}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Messages */}
        <div className='flex-1 p-4 overflow-y-auto'>
          {!isJoined ? (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <p>Please join a room to start chatting</p>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.isOwn ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.isOwn
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
                  }`}>
                  {!msg.isOwn && (
                    <div className='text-xs text-gray-300 mb-1'>{msg.username}</div>
                  )}
                  <div>{msg.message}</div>
                  <div className='text-xs text-gray-300 mt-1'>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {isJoined && (
          <div className='p-4 bg-gray-800 border-t border-gray-700'>
            <div className='flex gap-2'>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                onKeyPress={handleKeyPress}
                className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                disabled={connectionStatus !== 'connected'}
              />
              <button
                onClick={sendMessage}
                disabled={connectionStatus !== 'connected'}
                className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium'
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
