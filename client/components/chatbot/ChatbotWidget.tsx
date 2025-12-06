'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from "@/lib/api";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content:
          'Xin chào! Tôi là trợ lý y tế chuyên về khiếm thính ở trẻ em. Tôi có thể giúp bạn:\n\n• 🎂 Dấu hiệu nhận biết khiếm thính theo độ tuổi\n• 🏥 Phương pháp điều trị và can thiệp\n• 💊 Thiết bị trợ thính và cấy ốc tai\n• 📋 Theo dõi sức khỏe thính giác\n• 👨‍👩‍👧 Hỗ trợ gia đình\n\nHãy đặt câu hỏi của bạn!',
      timestamp: new Date(),
    },
  ]);
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
      const response = await apiService.chatbot.ask(messageText);
      const data = response.data;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.answer || data.reply || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';

      toast({
        title: 'Lỗi',
        description: `Không thể gửi tin nhắn. ${errorMessage}`,
        variant: 'destructive',
      });

      const errorMessageBot: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: `❌ Lỗi: ${errorMessage}\n\nVui lòng kiểm tra kết nối Server.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessageBot]);
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
        {!isOpen && (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 z-40"
                size="icon"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
        )}

        {isOpen && (
            <Card className="fixed bottom-6 right-6 w-[600px] max-w-[95vw] h-[600px] max-h-[80vh] shadow-2xl flex flex-col z-50 bg-white overflow-hidden rounded-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
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

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                          className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              message.type === 'user'
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.type === 'bot' && (
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100/20">
                              <button
                                  onClick={() => copyToClipboard(message.content)}
                                  className="p-1 transition rounded hover:bg-gray-100 text-gray-400"
                                  title="Sao chép"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                        )}
                      </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 px-5 py-4 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm">
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4 bg-white flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Hỏi tôi về khiếm thính..."
                    className="flex-1 focus-visible:ring-blue-600"
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </Card>
        )}
      </>
  );
};