"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, History, Trash2, Search, ArrowRightLeft, BookOpen, LogIn, ImageOff } from "lucide-react";
import { format } from "date-fns";

// Interface cho Lịch sử
interface TranslationHistory {
    _id: string;
    inputText: string;
    outputSign: string;
    direction: string;
    createdAt: string;
}

// Hàm xử lý URL ảnh/video
const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = API_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [history, setHistory] = useState<TranslationHistory[]>([]);
    const [loading, setLoading] = useState(false);

    // State cho Modal chi tiết từ vựng
    const [selectedWord, setSelectedWord] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch lịch sử
    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await apiService.translations.getUserTranslations();
            const data = res.data.data || (Array.isArray(res.data) ? res.data : []) || [];
            setHistory(data);
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchHistory();
        }
    }, [user, authLoading]);

    // Xóa lịch sử
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Bạn chắc chắn muốn xóa dòng này?")) return;
        try {
            await apiService.translations.delete(id);
            setHistory(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error("Lỗi xóa:", error);
        }
    };

    // MỞ MODAL CHI TIẾT
    const handleItemClick = async (text: string) => {
        setModalLoading(true);
        try {
            const res = await apiService.dictionary.searchWords({ word: text });
            const words = res.data?.words || [];

            if (words.length > 0) {
                setSelectedWord(words[0]);
            } else {
                alert(`Không tìm thấy thông tin chi tiết cho "${text}" trong từ điển.`);
            }
        } catch (error) {
            console.error("Lỗi tra cứu chi tiết:", error);
        } finally {
            setModalLoading(false);
        }
    };

    const getIcon = (direction: string) => {
        if (direction === 'dictionary-lookup') return <BookOpen className="w-5 h-5 text-purple-500" />;
        if (direction === 'text-to-sign') return <Search className="w-5 h-5 text-blue-500" />;
        return <ArrowRightLeft className="w-5 h-5 text-green-500" />;
    };

    const getTypeText = (direction: string) => {
        if (direction === 'dictionary-lookup') return 'Tra từ điển';
        if (direction === 'text-to-sign') return 'Dịch văn bản';
        return 'Dịch ký hiệu';
    };

    if (authLoading) {
        return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background py-20 px-4 transition-colors duration-300">
                <div className="max-w-md mx-auto text-center space-y-6">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto border border-border">
                        <History className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Bạn chưa đăng nhập</h2>
                    <p className="text-muted-foreground">
                        Vui lòng đăng nhập để xem và quản lý lịch sử tra cứu của bạn.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signin">
                            <Button className="gap-2">
                                <LogIn className="w-4 h-4" /> Đăng nhập
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button variant="outline">Đăng ký</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-4xl">


                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-card border border-border rounded-full shadow-sm">
                        <History className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Lịch Sử Hoạt Động</h1>
                        <p className="text-muted-foreground">Xem lại các từ đã tra và câu đã dịch</p>
                    </div>
                </div>


                <Card className="border-border shadow-lg bg-card">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        ) : history.length > 0 ? (
                            <div className="divide-y divide-border">
                                {history.map((item) => (
                                    <div
                                        key={item._id}
                                        className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group cursor-pointer"
                                        onClick={() => handleItemClick(item.inputText)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 p-2 rounded-lg bg-muted border border-border shadow-sm">
                                                {getIcon(item.direction)}
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-foreground text-lg capitalize">{item.inputText}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                    <span>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                                    <span>•</span>
                                                    <span className="font-medium">{getTypeText(item.direction)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {modalLoading && selectedWord?.word === item.inputText && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={(e) => handleDelete(e, item._id)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <History className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground">Chưa có lịch sử</h3>
                                <p className="text-muted-foreground">Hãy thử tra từ điển hoặc dịch câu nhé!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!selectedWord} onOpenChange={(open: boolean) => !open && setSelectedWord(null)}>
                    <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold capitalize text-primary text-center">
                                {selectedWord?.word}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-xl overflow-hidden border bg-black aspect-video shadow-inner flex items-center justify-center">
                                {selectedWord?.videoUrl ? (
                                    (selectedWord.videoUrl.includes("youtube.com") || selectedWord.videoUrl.includes("youtu.be")) ? (
                                        <iframe
                                            src={selectedWord.videoUrl.replace("/shorts/", "/embed/").replace("watch?v=", "embed/")}
                                            className="w-full h-full"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <video src={getImageUrl(selectedWord.videoUrl)!} controls className="w-full h-full" autoPlay />
                                    )
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center">
                                        <ImageOff className="w-10 h-10 mb-2"/>
                                        <span>Không có video</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2">
                                <div>
                                    <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Định nghĩa:</span>
                                    <p className="text-lg font-medium text-foreground">{selectedWord?.meaning}</p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <div>
                                        <span className="font-semibold text-xs text-muted-foreground uppercase">Phân loại:</span>
                                        <p className="text-sm capitalize text-foreground">{selectedWord?.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-xs text-muted-foreground uppercase">Độ khó:</span>
                                        <p className="text-sm capitalize text-foreground">{selectedWord?.difficulty}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}