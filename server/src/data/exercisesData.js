//Tạo sẵn vidUrl
const generateVideoUrl = (word) => {
    return `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video?text=${encodeURIComponent(word)}&spoken=en&signed=ase`;
};

// Danh sách từ vựng (add thêm từ vào đây)
export const exercisesData = [
    {
        word: "hello",
        wordMeaning: "Xin chào",
        category: "greetings",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("hello"),
        thumbnail: "/images/hello.jpg", // Bạn tự thay ảnh nếu có
        options: ["hello", "goodbye", "thank you", "please"],
        correctAnswer: "hello"
    },
    {
        word: "thank you",
        wordMeaning: "Cảm ơn",
        category: "greetings",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("thank you"),
        thumbnail: "/images/thankyou.jpg",
        options: ["sorry", "thank you", "welcome", "please"],
        correctAnswer: "thank you"
    },
    {
        word: "goodbye",
        wordMeaning: "Tạm biệt",
        category: "greetings",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("goodbye"),
        thumbnail: "/images/goodbye.jpg",
        options: ["hello", "good morning", "goodbye", "night"],
        correctAnswer: "goodbye"
    },
    {
        word: "family",
        wordMeaning: "Gia đình",
        category: "people",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("family"),
        thumbnail: "/images/family.jpg",
        options: ["friend", "family", "neighbor", "colleague"],
        correctAnswer: "family"
    },
    {
        word: "friend",
        wordMeaning: "Bạn bè",
        category: "people",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("friend"),
        thumbnail: "/images/friend.jpg",
        options: ["enemy", "friend", "sister", "brother"],
        correctAnswer: "friend"
    },
    // ...  COPY PASTE THÊM NHIỀU TỪ KHÁC VÀO ĐÂY ...
];