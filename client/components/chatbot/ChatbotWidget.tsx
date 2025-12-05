'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        id: '1',
        type: 'bot',
        content:
          'Xin chào! Tôi là trợ lý y tế chuyên về khiếm thính ở trẻ em. Tôi có thể giúp bạn:\n\n• 🎂 Dấu hiệu nhận biết khiếm thính theo độ tuổi\n• 🏥 Phương pháp điều trị và can thiệp\n• 💊 Thiết bị trợ thính và cấy ốc tai\n• 📋 Theo dõi sức khỏe thính giác\n• 👨‍👩‍👧 Hỗ trợ gia đình\n\nHãy đặt câu hỏi của bạn!',
        timestamp: new Date(),
      },
    ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      // Xác định base URL của backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.answer || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

      toast({
        title: 'Lỗi',
        description: `Không thể gửi tin nhắn. ${errorMessage}`,
        variant: 'destructive',
      });

      // Thêm tin nhắn lỗi vào chat
      const errorMessage2: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: `❌ Lỗi: ${errorMessage}\n\nVui lòng kiểm tra:\n• Backend server đã chạy chưa?\n• API URL có đúng không?`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage2]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Nội dung đã được sao chép vào bộ nhớ tạm.',
    });
  };

  return (
    <>
      {/* Nút mở chatbot */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 z-40"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Cửa sổ chatbot - TO HƠN */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[600px] max-w-[95vw] h-[600px] max-h-[80vh] shadow-2xl flex flex-col z-50 bg-white overflow-hidden rounded-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <span className="font-semibold block text-lg">Trợ Lý Y Tế</span>
                <span className="text-sm opacity-90">Khiếm thính trẻ em</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-5 py-3 rounded-lg text-sm leading-relaxed ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.type === 'bot' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="text-gray-500 hover:text-gray-700 p-1 transition"
                        title="Sao chép"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-5 py-3 rounded-lg rounded-bl-none border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Hỏi tôi..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};