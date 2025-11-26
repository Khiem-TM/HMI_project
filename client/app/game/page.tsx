"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
  Trophy,
  Shuffle,
  Award,
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

export default function GamePage() {
  const [mode, setMode] = useState<GameMode>("guess");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [pairs, setPairs] = useState<{ wordId: string; matched: boolean }[]>(
    []
  );
  const [targets, setTargets] = useState<
    { id: string; image: string; wordId?: string }[]
  >([]);
  const [timedRunning, setTimedRunning] = useState(false);
  const [timedLeft, setTimedLeft] = useState(60);
  const timedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Game session
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionStartTime = useRef<Date | null>(null);
  const [gameExercises, setGameExercises] = useState<string[]>([]);
  const [gameAnswers, setGameAnswers] = useState<any[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const { toast } = useToast();

  const colors = useMemo(
    () => ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"],
    []
  );

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startCountdown = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadExercise = async (withDifficulty?: string) => {
    setLoading(true);
    setError("");
    setSelectedAnswer(null);
    setShowResult(false);
    try {
      const resp = await apiService.exercises.getRandom();
      const data = resp.data?.data || resp.data;
      if (!data || !data.word || !data.options || !data.correctAnswer) {
        setError("Không tìm thấy bài tập. Vui lòng thử lại.");
        return;
      }
      if (data.options && data.options.length > 0) {
        data.options = shuffleArray([...data.options]);
      }
      setExercise(data);
      startCountdown(20);
    } catch (err: any) {
      if (err.isNetworkError || !err.response) {
        setError(
          "Không thể kết nối tới server. Vui lòng kiểm tra server đang chạy."
        );
      } else if (err.response?.status === 404) {
        setError("Không tìm thấy bài tập.");
      } else if (err.response?.status >= 500) {
        setError("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setError(
          err.response?.data?.message || err.message || "Đã xảy ra lỗi."
        );
      }
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
    setShowResult(true);

    // Track answer
    if (exercise._id) {
      setGameExercises((prev) => [...prev, exercise._id]);
      setGameAnswers((prev) => [
        ...prev,
        {
          exerciseId: exercise._id,
          userAnswer: selectedAnswer,
          isCorrect: correct,
          timeSpent: 20 - timeLeft,
        },
      ]);
    }

    if (correct) {
      setScore((s) => s + 10 + timeLeft);
      setStreak((st) => st + 1);
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setWrongCount((w) => w + 1);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Save game
  const saveGameSession = async () => {
    try {
      if (!sessionStarted || gameExercises.length === 0) return;

      const timeSpent = sessionStartTime.current
        ? Math.floor(
            (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
          )
        : 0;

      const response = await apiService.games.saveSession({
        gameMode: mode,
        difficulty,
        score,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        totalQuestions: correctCount + wrongCount,
        timeSpent,
        exercises: gameExercises,
        answers: gameAnswers,
      });

      if (response.data.success) {
        if (response.data.unlockedAchievements?.length > 0) {
          setUnlockedAchievements(response.data.unlockedAchievements);
          response.data.unlockedAchievements.forEach((achievement: any) => {
            toast({
              title: "🎉 Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
            });
          });
        }
      }
    } catch (error: any) {
      console.error("Error saving game session:", error);
    }
  };

  const resetGameSession = () => {
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setGameExercises([]);
    setGameAnswers([]);
    setSessionStarted(false);
    sessionStartTime.current = null;
    setUnlockedAchievements([]);
  };

  const nextQuestion = async () => {
    if (gameExercises.length >= 5) {
      await saveGameSession();
      resetGameSession();
    }
    loadExercise(difficulty);
  };

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
        }))
      );
    } catch (err: any) {
      setError("Không thể tải dữ liệu từ điển.");
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    wordId: string
  ) => {
    e.dataTransfer.setData("text/plain", wordId);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    const wordId = e.dataTransfer.getData("text/plain");
    const ok = wordId === targetId;
    setPairs((prev) =>
      prev.map((p) => (p.wordId === targetId ? { ...p, matched: ok } : p))
    );
    if (ok) setScore((s) => s + 5);
  };

  const allMatched = useMemo(
    () => pairs.length > 0 && pairs.every((p) => p.matched),
    [pairs]
  );

  const startTimed = () => {
    resetGameSession();
    setSessionStarted(true);
    sessionStartTime.current = new Date();
    setTimedRunning(true);
    setTimedLeft(60);
    if (timedTimerRef.current) clearInterval(timedTimerRef.current);
    timedTimerRef.current = setInterval(() => {
      setTimedLeft((t) => {
        if (t <= 1) {
          clearInterval(timedTimerRef.current as NodeJS.Timeout);
          setTimedRunning(false);
          saveGameSession().then(() => {
            resetGameSession();
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    nextQuestion();
  };

  const answerTimed = async (id: string) => {
    setSelectedAnswer(id);
    if (!exercise) return;
    const correct = id === exercise.correctAnswer;

    if (exercise._id) {
      setGameExercises((prev) => [...prev, exercise._id]);
      setGameAnswers((prev) => [
        ...prev,
        {
          exerciseId: exercise._id,
          userAnswer: id,
          isCorrect: correct,
          timeSpent: 0,
        },
      ]);
    }

    if (correct) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setWrongCount((w) => w + 1);
    }
    loadExercise(difficulty);
  };

  useEffect(() => {
    if (mode === "guess") {
      resetGameSession();
      setSessionStarted(true);
      sessionStartTime.current = new Date();
      loadExercise(difficulty);
    }
    if (mode === "speed-match") {
      resetGameSession();
      loadSpeedMatchData();
    }
    if (mode === "timed") {
      resetGameSession();
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      if (sessionStarted && gameExercises.length > 0) {
        saveGameSession();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Game Hub</h1>
          <p className="text-muted-foreground">
            Luyện tập: đoán ký hiệu, ghép nhanh, thử thách thời gian
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Điểm số: {score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Lượt Streak: {streak}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Button
          variant={mode === "guess" ? "default" : "outline"}
          onClick={() => setMode("guess")}
        >
          Guess The Sign
        </Button>
        <Button
          variant={mode === "speed-match" ? "default" : "outline"}
          onClick={() => setMode("speed-match")}
        >
          Speed Match
        </Button>
        <Button
          variant={mode === "timed" ? "default" : "outline"}
          onClick={() => setMode("timed")}
        >
          Timed Challenge
        </Button>
      </div>

      {/* Unlocked Achievements Display */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">
              Achievements Unlocked!
            </h3>
          </div>
          <div className="space-y-2">
            {unlockedAchievements.map((achievement, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">{achievement.name}</span>
                <span className="text-muted-foreground">
                  - {achievement.description}
                </span>
                {achievement.points > 0 && (
                  <span className="text-green-600">
                    +{achievement.points} points
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "guess" && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span>Đếm ngược: {timeLeft}s</span>
            </div>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Độ khó" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadExercise(difficulty)}>
              Câu hỏi mới
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Đang tải câu hỏi...</p>
            </div>
          )}
          {!loading && !error && exercise && (
            <>
              <Card className="mb-8">
                <CardContent className="p-8">
                  <div className="mb-2 text-center">
                    <h2 className="text-2xl font-bold mb-1">
                      Câu hỏi
                    </h2>
                    <p className="text-muted-foreground">
                      Thể loại: {exercise.category} • Độ khó:{" "}
                      {exercise.difficulty}
                    </p>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative mb-6">
                    <img
                      src={exercise.thumbnail || "/placeholder.svg"}
                      alt={exercise.word}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {exercise.options.map((option, idx) => (
                      <Button
                        key={option}
                        variant="outline"
                        className={`h-16 text-lg font-semibold ${
                          selectedAnswer === option
                            ? colors[idx % colors.length] +
                              " text-white hover:opacity-90"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showResult}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-4 justify-center">
                    {!showResult ? (
                      <Button
                        onClick={confirmAnswer}
                        disabled={!selectedAnswer}
                        className="bg-green-600 hover:bg-green-700 text-white px-8"
                      >
                        Kiểm tra
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        className="bg-secondary hover:bg-secondary/90 px-8"
                      >
                        Câu hỏi khác
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              {showResult && (
                <Card
                  className={`${
                    selectedAnswer === exercise.correctAnswer
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      {selectedAnswer === exercise.correctAnswer ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <p className="text-lg font-semibold text-green-600">
                            Đúng! Đáp án: {exercise.correctAnswer}
                          </p>
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <p className="text-lg font-semibold text-red-600">
                            Sai! Đáp án đúng: {exercise.correctAnswer}
                          </p>
                          <XCircle className="h-6 w-6 text-red-600" />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {mode === "speed-match" && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={loadSpeedMatchData}>
              Làm mới dữ liệu
            </Button>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span>Hoàn thành để nhận điểm</span>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          )}
          {!loading && words.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Từ</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {words.map((w) => (
                      <Button
                        key={w._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, w._id)}
                        variant="outline"
                        className="h-12"
                      >
                        {w.word}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Ảnh</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {targets.map((t) => (
                      <div
                        key={t.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDrop(e, t.id)}
                        className={`rounded-lg overflow-hidden border ${
                          pairs.find((p) => p.wordId === t.id)?.matched
                            ? "border-green-500"
                            : "border-muted"
                        }`}
                      >
                        <img
                          src={t.image}
                          alt="thumb"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {allMatched && (
            <div className="mt-6 text-center">
              <p className="text-green-600 font-semibold">
                Hoàn thành! +{words.length * 2} điểm
              </p>
              <Button
                className="mt-3"
                onClick={async () => {
                  // Save session before resetting
                  if (sessionStarted) {
                    await saveGameSession();
                    resetGameSession();
                  }
                  loadSpeedMatchData();
                }}
              >
                Chơi lại
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === "timed" && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span>{timedRunning ? `Còn ${timedLeft}s` : "Nhấn bắt đầu"}</span>
            </div>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Độ khó" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={startTimed}>
              {timedRunning ? "Đang chạy" : "Bắt đầu"}
            </Button>
          </div>
          {timedRunning && exercise && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 text-center">
                  <h2 className="text-2xl font-bold mb-1">
                    {exercise.wordMeaning}
                  </h2>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative mb-6">
                  <img
                    src={exercise.thumbnail || "/placeholder.svg"}
                    alt={exercise.word}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {exercise.options.map((opt) => (
                    <Button
                      key={opt}
                      variant="outline"
                      onClick={() => answerTimed(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {!timedRunning && (
            <div className="text-center text-muted-foreground">
              Nhấn Bắt đầu để vào thử thách 60s
            </div>
          )}
        </div>
      )}
    </div>
  );
}
