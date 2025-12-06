"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Crown, Loader2, Star, Shield, Gem } from "lucide-react"; // Thêm icon Shield, Gem
import { motion } from "framer-motion";

interface LeaderboardEntry {
    _id: string;
    totalScore: number;
    level: number;
    rank: number;
    rankTitle?: string; // bronze, silver, gold...
    userId: {
        _id: string;
        name: string;
        avatar?: string;
        email: string;
    };
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setCurrentUserId(user._id || user.id);
                } catch (e) {}
            }
        }

        const fetchData = async () => {
            try {
                const res = await apiService.leaderboard.getLeaderboard({ limit: 20 });
                if (res.data.success) {
                    setLeaderboard(res.data.leaderboard);
                }
            } catch (error) {
                console.error("Lỗi tải bảng xếp hạng:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Icon cho Thứ hạng
    const getPositionIcon = (index: number, score: number) => {
        const rank = index + 1;

        // Nếu 0 điểm -> Không xếp hạng
        if (score === 0) {
            return <span className="font-bold text-muted-foreground/30 text-lg">-</span>;
        }

        if (index === 0) {
            return (
                <div className="flex flex-col items-center justify-center -space-y-1">
                    <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-bounce" />
                    <span className="font-black text-2xl text-yellow-500 drop-shadow-sm">1</span>
                </div>
            );
        }

        if (index === 1) {
            return (
                <div className="flex flex-col items-center justify-center -space-y-1">
                    <Medal className="w-5 h-5 text-gray-400 fill-gray-300" />
                    <span className="font-black text-xl text-gray-500">2</span>
                </div>
            );
        }

        if (index === 2) {
            return (
                <div className="flex flex-col items-center justify-center -space-y-1">
                    <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />
                    <span className="font-black text-xl text-amber-700">3</span>
                </div>
            );
        }


        return (
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-sm">
                <span className="font-bold text-slate-600 text-sm">{rank}</span>
            </div>
        );
    };

    // Icon cho Rank Title (Bronze, Silver, Gold...)
    const getRankBadge = (rankTitle?: string) => {
        switch (rankTitle?.toLowerCase()) {
            case "diamond":
                return (
                    <div className="flex items-center gap-1 text-cyan-500 font-bold text-xs uppercase bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                        <Gem className="w-3 h-3 fill-current" /> Diamond
                    </div>
                );
            case "platinum":
                return (
                    <div className="flex items-center gap-1 text-indigo-500 font-bold text-xs uppercase bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <Shield className="w-3 h-3 fill-current" /> Platinum
                    </div>
                );
            case "gold":
                return (
                    <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs uppercase bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                        <Trophy className="w-3 h-3 fill-current" /> Gold
                    </div>
                );
            case "silver":
                return (
                    <div className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <Medal className="w-3 h-3 fill-current" /> Silver
                    </div>
                );
            default: // Bronze
                return (
                    <div className="flex items-center gap-1 text-amber-700 font-bold text-xs uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Medal className="w-3 h-3" /> Bronze
                    </div>
                );
        }
    };

    const getAvatarUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith("http")) return url;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const baseUrl = API_URL.replace("/api", "");
        return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background/60 to-background py-16 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center justify-center p-5 bg-card rounded-3xl shadow-xl border border-border mb-5">
                        <Trophy className="w-14 h-14 text-yellow-500 fill-yellow-500/20" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Bảng Xếp Hạng</h1>
                    <p className="text-muted-foreground text-lg mt-2 max-w-xl mx-auto">Vinh danh những nhà vô địch học tập xuất sắc nhất.</p>
                </motion.div>

                <Card className="border-border shadow-2xl bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b border-border px-4 py-4 md:px-6">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider items-center">
                            <div className="col-span-2 flex justify-center items-center">Hạng</div>
                            <div className="col-span-6 flex items-center pl-2">Thành viên</div>
                            <div className="col-span-2 flex justify-center items-center">Cấp độ</div>
                            <div className="col-span-2 flex justify-end items-center pr-2">Điểm</div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center py-24 gap-4"><Loader2 className="w-10 h-10 animate-spin text-primary" /><p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p></div>
                        ) : leaderboard.length > 0 ? (
                            <div className="divide-y divide-border">
                                {leaderboard.map((entry, index) => {
                                    const isMe = entry.userId?._id === currentUserId;
                                    const isTop3 = index < 3 && entry.totalScore > 0;

                                    return (
                                        <motion.div key={entry._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}
                                                    className={`grid grid-cols-12 gap-4 p-4 md:px-6 transition-all duration-200 ${isMe ? "bg-primary/10 border-l-4 border-primary shadow-inner" : "hover:bg-muted/40 border-l-4 border-transparent"}`}
                                        >
                                            <div className="col-span-2 flex justify-center items-center">
                                                {getPositionIcon(index, entry.totalScore)}
                                            </div>

                                            <div className="col-span-6 flex items-center gap-3 pl-2 overflow-hidden">
                                                <div className="relative flex-shrink-0">
                                                    <Avatar className={`w-10 h-10 md:w-12 md:h-12 border-2 rounded-xl ${isTop3 ? 'border-yellow-500/60' : 'border-border'} shadow-md`}>
                                                        <AvatarImage src={getAvatarUrl(entry.userId?.avatar)} alt={entry.userId?.name} />
                                                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">{(entry.userId?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    {isTop3 && <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-0.5 border-2 border-background shadow-sm"><Star className="w-3 h-3 fill-current" /></div>}
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <span className={`font-bold text-sm md:text-base truncate ${isMe ? "text-primary" : "text-foreground"}`}>{entry.userId?.name || "Người dùng ẩn danh"} {isMe && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground align-middle">Bạn</span>}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">

                                                        {getRankBadge(entry.rankTitle)}
                          </span>
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex justify-center items-center">
                                                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">LV. {entry.level}</span>
                                            </div>

                                            <div className="col-span-2 flex justify-end items-center pr-2">
                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-base md:text-lg text-primary block leading-none">{entry.totalScore.toLocaleString()}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">pts</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-24 flex flex-col items-center"><div className="bg-muted p-4 rounded-full mb-4"><Trophy className="w-12 h-12 text-muted-foreground/50" /></div><h3 className="text-lg font-medium text-foreground">Bảng xếp hạng đang trống</h3></div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}