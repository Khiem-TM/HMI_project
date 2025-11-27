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
    {
        word: "water",
        wordMeaning: "Nước",
        category: "objects",
        difficulty: "beginner",
        videoUrl: generateVideoUrl("water"),
        thumbnail: "/images/water.jpg", // Bạn tự thay ảnh nếu có
        options: ["food", "water", "dringk", "eat"],
        correctAnswer: "water"
    },
    {
        word: "food",
        wordMeaning: "Thức ăn",
        videoUrl: generateVideoUrl("food"),
        thumbnail: "/person-signing-food.jpg",
        options: ["food", "water", "milk", "bread"],
        correctAnswer: "food",
        category: "objects",
        difficulty: "beginner"
    },
    {
        word: "love",
        wordMeaning: "Yêu / Tình yêu",
        videoUrl: generateVideoUrl("love"),
        thumbnail: "/images/love.jpg",
        options: ["love", "like", "happy", "friend"],
        correctAnswer: "love",
        category: "emotions",
        difficulty: "beginner"
    },
    {
        word: "happy",
        wordMeaning: "Hạnh phúc / Vui vẻ",
        videoUrl: generateVideoUrl("happy"),
        thumbnail: "/images/happy.jpg",
        options: ["sad", "angry", "happy", "tired"],
        correctAnswer: "happy",
        category: "emotions",
        difficulty: "beginner"
    },
    {
        word: "school",
        wordMeaning: "Trường học",
        videoUrl: generateVideoUrl("school"),
        thumbnail: "/images/school.jpg",
        options: ["home", "school", "store", "work"],
        correctAnswer: "school",
        category: "places",
        difficulty: "beginner"
    },
    {
        word: "home",
        wordMeaning: "Nhà",
        videoUrl: generateVideoUrl("home"),
        thumbnail: "/images/home.jpg",
        options: ["school", "park", "home", "hospital"],
        correctAnswer: "home",
        category: "places",
        difficulty: "beginner"
    },
    {
        word: "help",
        wordMeaning: "Giúp đỡ",
        videoUrl: generateVideoUrl("help"),
        thumbnail: "/images/help.jpg",
        options: ["stop", "help", "wait", "go"],
        correctAnswer: "help",
        category: "actions",
        difficulty: "beginner"
    },
    {
        word: "please",
        wordMeaning: "Làm ơn / Vui lòng",
        videoUrl: generateVideoUrl("please"),
        thumbnail: "/images/please.jpg",
        options: ["sorry", "thank you", "please", "hello"],
        correctAnswer: "please",
        category: "greetings",
        difficulty: "beginner"
    }
    // ...  COPY PASTE THÊM NHIỀU TỪ KHÁC VÀO ĐÂY ...
];