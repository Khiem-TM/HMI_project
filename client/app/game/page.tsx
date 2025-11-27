"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Timer,
    Trophy,
    Shuffle,
    Award,
    ImageOff,
} from "lucide-react";
import { apiService } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Interface
interface Exercise {
    _id: string;
    word: string;
    wordMeaning: string;
    videoUrl: string;
    thumbnail: string;
    options: string[];
    correctAnswer: string;
    category: string;
    difficulty: string;
}

interface DictionaryWord {
    _id: string;
    word: string;
    meaning?: string;
    thumbnail?: string;
    videoUrl?: string;
    category?: string;
}

type GameMode = "guess" | "speed-match" | "timed";

// --- HÀM XỬ LÝ URL ẢNH ---
const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = API_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

export default function GamePage() {
    const [mode, setMode] = useState<GameMode>("guess");

    // UI State
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number>(20);
    const [difficulty, setDifficulty] = useState<string>("beginner");
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Speed Match Data
    const [words, setWords] = useState<DictionaryWord[]>([]);
    const [pairs, setPairs] = useState<{ wordId: string; matched: boolean }[]>([]);
    const [targets, setTargets] = useState<{ id: string; image: string; wordId?: string }[]>([]);

    // Timed Mode State
    const [timedRunning, setTimedRunning] = useState(false);
    const [timedLeft, setTimedLeft] = useState(60);

    // DATA REFS
    const gameDataRef = useRef<{
        exercises: string[];
        answers: any[];
        correctCount: number;
        wrongCount: number;
        startTime: Date | null;
    }>({
        exercises: [],
        answers: [],
        correctCount: 0,
        wrongCount: 0,
        startTime: null
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const timedTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
    const { toast } = useToast();

    const TOTAL_QUESTIONS_PER_ROUND = 5;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);

    // Audio Refs
    const correctAudio = useRef<HTMLAudioElement | null>(null);
    const wrongAudio = useRef<HTMLAudioElement | null>(null);

    const colors = useMemo(
        () => ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"],
        []
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            correctAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
            wrongAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3");
        }
    }, []);

    const playSound = (isCorrect: boolean) => {
        if (isCorrect) correctAudio.current?.play().catch(() => {});
        else wrongAudio.current?.play().catch(() => {});
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // --- SESSION LOGIC ---
    const initSession = () => {
        setScore(0);
        setStreak(0);
        setUnlockedAchievements([]);
        setCurrentQuestionIndex(1);

        gameDataRef.current = {
            exercises: [],
            answers: [],
            correctCount: 0,
            wrongCount: 0,
            startTime: new Date()
        };
    };

    const updateGameData = (exerciseId: string, answer: string, isCorrect: boolean, timeSpent: number = 0) => {
        gameDataRef.current.exercises.push(exerciseId);
        gameDataRef.current.answers.push({
            exerciseId,
            userAnswer: answer,
            isCorrect,
            timeSpent
        });
        if (isCorrect) gameDataRef.current.correctCount++;
        else gameDataRef.current.wrongCount++;

        if (isCorrect) {
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const saveGameSession = async () => {
        try {
            const data = gameDataRef.current;
            if (data.exercises.length === 0 && mode !== 'speed-match') return;
            if (mode === 'speed-match' && score === 0) return;

            const timeSpent = data.startTime
                ? Math.floor((new Date().getTime() - data.startTime.getTime()) / 1000)
                : 0;

            const response = await apiService.games.saveSession({
                gameMode: mode,
                difficulty,
                score,
                correctAnswers: data.correctCount,
                wrongAnswers: data.wrongCount,
                totalQuestions: data.correctCount + data.wrongCount,
                timeSpent,
                exercises: data.exercises,
                answers: data.answers,
            });

            if (response.data.success) {
                if (response.data.unlockedAchievements?.length > 0) {
                    setUnlockedAchievements(response.data.unlockedAchievements);
                } else {
                    toast({
                        title: "Kết quả đã được lưu!",
                        description: `Score: ${score}`,
                    });
                }
            }
        } catch (error: any) {
            console.error("Error saving game session:", error);
        }
    };

    // --- HELPERS ---
    const startCountdown = (seconds: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(seconds);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current as NodeJS.Timeout);
                    return 0; // Trả về 0 để useEffect bắt được
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Xử lý Hết giờ
    useEffect(() => {
        if (timeLeft === 0 && mode === 'guess' && !showResult && exercise && !loading) {
            setShowResult(true);
            playSound(false);
            if (exercise._id) {
                updateGameData(exercise._id, "TIMEOUT", false, 20);
            }
        }
    }, [timeLeft, mode, showResult, exercise, loading]);

    const loadExercise = async () => {
        // 1. Dừng timer cũ và Reset thời gian NGAY LẬP TỨC để tránh lỗi logic
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(20);

        setLoading(true);
        setError("");
        setSelectedAnswer(null);
        setShowResult(false);

        try {
            const resp = await apiService.exercises.getRandom();
            const data = resp.data?.data || resp.data;
            if (!data) {
                setError("Không tìm thấy bài tập.");
                return;
            }
            if (data.options?.length > 0) {
                data.options = shuffleArray([...data.options]);
            }
            setExercise(data);

            if (mode === 'guess') startCountdown(20);

        } catch (err) {
            setError("Lỗi kết nối server.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (id: string) => {
        setSelectedAnswer(id);
    };

    const confirmAnswer = async () => {
        if (!exercise || !selectedAnswer) return;
        const correct = selectedAnswer === exercise.correctAnswer;

        playSound(correct);
        setShowResult(true);

        if (timerRef.current) clearInterval(timerRef.current);

        if (exercise._id) {
            updateGameData(exercise._id, selectedAnswer, correct, 20 - timeLeft);
        }
    };

    const nextQuestion = async () => {
        if (gameDataRef.current.exercises.length >= TOTAL_QUESTIONS_PER_ROUND) {
            await saveGameSession();
            initSession();
            loadExercise();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            loadExercise();
        }
    };

    // --- SPEED MATCH LOGIC ---
    const loadSpeedMatchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiService.dictionary.getCategories();
            const cats: string[] = res.data || [];
            const pick = cats[0] || "common";
            const wordsRes = await apiService.dictionary.getWordsByCategory(pick);

            const list: DictionaryWord[] = wordsRes.data || [];
            const items = shuffleArray(list.filter((w) => w.thumbnail).slice(0, 6));

            setWords(items);
            setPairs(items.map((w) => ({ wordId: w._id, matched: false })));
            setTargets(
                items.map((w) => ({
                    id: w._id,
                    image: w.thumbnail || "/placeholder.svg",
                    wordId: w._id
                }))
            );
        } catch (err) {
            setError("Không thể tải dữ liệu Speed Match.");
        } finally {
            setLoading(false);
        }
    };

    const onDragStart = (e: React.DragEvent<HTMLButtonElement>, wordId: string) => {
        e.dataTransfer.setData("text/plain", wordId);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        const wordId = e.dataTransfer.getData("text/plain");
        const isCorrect = wordId === targetId;

        if (isCorrect) {
            setPairs((prev) =>
                prev.map((p) => (p.wordId === targetId ? { ...p, matched: true } : p))
            );
            setScore(s => s + 5);
            playSound(true);
            gameDataRef.current.correctCount++;
        } else {
            playSound(false);
        }
    };

    const allMatched = useMemo(
        () => pairs.length > 0 && pairs.every((p) => p.matched),
        [pairs]
    );

    // --- TIMED MODE ---
    const startTimed = () => {
        initSession();
        setTimedRunning(true);
        setTimedLeft(60);

        if (timedTimerRef.current) clearInterval(timedTimerRef.current);

        loadExercise();

        timedTimerRef.current = setInterval(() => {
            setTimedLeft((t) => {
                if (t <= 1) {
                    clearInterval(timedTimerRef.current as NodeJS.Timeout);
                    setTimedRunning(false);
                    saveGameSession();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    const answerTimed = async (id: string) => {
        if (!exercise || !timedRunning) return;
        const correct = id === exercise.correctAnswer;

        playSound(correct);
        if (exercise._id) {
            updateGameData(exercise._id, id, correct, 0);
        }
        loadExercise();
    };

    useEffect(() => {
        if (mode === "guess") {
            initSession();
            loadExercise();
        } else if (mode === "speed-match") {
            initSession();
            loadSpeedMatchData();
        } else if (mode === "timed") {
            setScore(0);
            setStreak(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (timedTimerRef.current) clearInterval(timedTimerRef.current);
        };
    }, [mode]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">Game Hub</h1>
                    <p className="text-muted-foreground">Luyện tập & Thử thách</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold">{score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shuffle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">{streak}</span>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex gap-3">
                <Button variant={mode === "guess" ? "default" : "outline"} onClick={() => setMode("guess")}>Guess The Sign</Button>
                <Button variant={mode === "speed-match" ? "default" : "outline"} onClick={() => setMode("speed-match")}>Speed Match</Button>
                <Button variant={mode === "timed" ? "default" : "outline"} onClick={() => setMode("timed")}>Timed Challenge</Button>
            </div>

            {/* Achievement Popup */}
            {unlockedAchievements.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-800">New Achievements Unlocked!</h3>
                    </div>
                    <div className="space-y-2">
                        {unlockedAchievements.map((achievement, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium">{achievement.name}</span>
                                <span className="text-muted-foreground">- {achievement.description}</span>
                                {achievement.points > 0 && <span className="text-green-600">+{achievement.points} pts</span>}
                            </div>
                        ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setUnlockedAchievements([])} className="mt-2 text-yellow-800">Close</Button>
                </div>
            )}

            {/* GUESS MODE */}
            {mode === "guess" && (
                <div className="border-t pt-6">
                    <div className="mb-4 flex justify-between text-sm text-muted-foreground">
                        <span>Câu hỏi {currentQuestionIndex} / {TOTAL_QUESTIONS_PER_ROUND}</span>
                        <Timer className="h-4 w-4 inline mr-1"/> {timeLeft}s
                    </div>
                    <Progress value={(currentQuestionIndex / TOTAL_QUESTIONS_PER_ROUND) * 100} className="h-2 mb-6" />

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                    ) : exercise ? (
                        <Card>
                            <CardContent className="p-8">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-6 flex items-center justify-center">
                                    {exercise.videoUrl ? (
                                        (exercise.videoUrl.includes("youtube.com") || exercise.videoUrl.includes("youtu.be")) ? (
                                            <iframe
                                                src={exercise.videoUrl}
                                                className="w-full h-full"
                                                title="Video minh họa"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video
                                                src={exercise.videoUrl}
                                                className="w-full h-full object-contain"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                controls
                                            />
                                        )
                                    ) : getImageUrl(exercise.thumbnail) ? (
                                        <img
                                            src={getImageUrl(exercise.thumbnail)!}
                                            className="w-full h-full object-cover"
                                            alt="Quiz"
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                                            <p>No Image</p>
                                        </div>
                                    )}
                                </div>

                                {/* ĐÃ XÓA TEXT WORD MEANING Ở ĐÂY */}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {exercise.options.map((option, idx) => {
                                        const isSelected = selectedAnswer === option;
                                        const isCorrect = option === exercise.correctAnswer;
                                        let buttonClass = "h-16 text-lg font-semibold transition-all border-2 ";

                                        if (showResult) {
                                            if (isCorrect) {
                                                buttonClass += "!bg-green-600 !text-white !border-green-600 hover:!bg-green-700";
                                            } else if (isSelected && !isCorrect) {
                                                buttonClass += "!bg-red-600 !text-white !border-red-600 hover:!bg-red-700";
                                            } else {
                                                buttonClass += "opacity-40 border-muted bg-transparent text-muted-foreground";
                                            }
                                        } else {
                                            if (isSelected) {
                                                buttonClass += "!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700 ring-2 ring-blue-200 ring-offset-2";
                                            } else {
                                                buttonClass += "hover:bg-accent hover:text-accent-foreground border-input bg-background";
                                            }
                                        }

                                        return (
                                            <Button
                                                key={option}
                                                variant="outline"
                                                className={buttonClass}
                                                onClick={() => !showResult && handleAnswerSelect(option)}
                                                disabled={showResult}
                                            >
                                                {option}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-center">
                                    {!showResult ? (
                                        <Button onClick={confirmAnswer} disabled={!selectedAnswer} className="px-8">Kiểm tra</Button>
                                    ) : (
                                        <Button onClick={nextQuestion} className="px-8">
                                            {currentQuestionIndex >= TOTAL_QUESTIONS_PER_ROUND ? "Kết thúc" : "Tiếp theo"}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-red-500">{error}</div>
                    )}
                </div>
            )}

            {/* SPEED MATCH MODE */}
            {mode === "speed-match" && (
                <div className="border-t pt-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" onClick={loadSpeedMatchData}>Làm mới</Button>
                        <span className="text-muted-foreground">Kéo từ vào hình ảnh tương ứng</span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                    ) : words.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Từ vựng</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {words.map((w) => (
                                            <Button
                                                key={w._id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, w._id)}
                                                variant="outline"
                                                className={`h-12 ${pairs.find(p => p.wordId === w._id)?.matched ? "opacity-50 bg-green-50" : ""}`}
                                            >
                                                {w.word}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Hình ảnh</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {targets.map((t) => (
                                            <div
                                                key={t.id}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => onDrop(e, t.id)}
                                                className={`rounded-lg overflow-hidden border h-32 flex items-center justify-center bg-muted relative ${
                                                    pairs.find(p => p.wordId === t.id)?.matched ? "border-green-500 ring-2 ring-green-100" : ""
                                                }`}
                                            >
                                                {getImageUrl(t.image) ? (
                                                    <img src={getImageUrl(t.image)!} className="w-full h-full object-cover" alt="thumb" />
                                                ) : (
                                                    <span className="text-xs">No Image</span>
                                                )}

                                                {pairs.find(p => p.wordId === t.id)?.matched && (
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="text-green-600 h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-8">{error || "Không có dữ liệu"}</div>
                    )}

                    {allMatched && (
                        <div className="mt-8 text-center animate-in zoom-in">
                            <h3 className="text-2xl font-bold text-green-600 mb-4">Hoàn thành xuất sắc!</h3>
                            <Button size="lg" onClick={() => {
                                saveGameSession();
                                loadSpeedMatchData();
                            }}>Lưu điểm & Chơi lại</Button>
                        </div>
                    )}
                </div>
            )}

            {/* TIMED MODE */}
            {mode === "timed" && (
                <div className="border-t pt-6">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="font-bold text-2xl text-red-600">{timedRunning ? `${timedLeft}s` : "60s"}</span>
                        <Button onClick={startTimed} disabled={timedRunning}>{timedRunning ? "Đang chạy..." : "Bắt đầu"}</Button>
                    </div>

                    {timedRunning && exercise ? (
                        <Card>
                            <CardContent className="p-6">
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative mb-6 flex items-center justify-center max-h-[300px]">
                                    {getImageUrl(exercise.thumbnail) ? (
                                        <img src={getImageUrl(exercise.thumbnail)!} className="w-full h-full object-contain" alt="Quiz" />
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ImageOff className="h-10 w-10 mx-auto mb-2 opacity-50"/>
                                            <p>No Image</p>
                                        </div>
                                    )}
                                </div>

                                {/* ĐÃ XÓA TEXT WORD MEANING Ở ĐÂY */}

                                <div className="grid grid-cols-2 gap-4">
                                    {exercise.options.map((opt) => (
                                        <Button key={opt} variant="outline" className="h-14 text-lg" onClick={() => answerTimed(opt)}>
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-12 bg-muted rounded-lg">
                            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                            <h3 className="text-xl font-bold">Thử thách tốc độ</h3>
                            <p className="text-muted-foreground">Trả lời càng nhiều càng tốt trong 60 giây!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}