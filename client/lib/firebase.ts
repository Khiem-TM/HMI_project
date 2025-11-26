import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB_5Z4kn91omeAAzaOeuFigWjY39NdTgPA",
    authDomain: "fir-1f314.firebaseapp.com",
    projectId: "fir-1f314",
    storageBucket: "fir-1f314.firebasestorage.app",
    messagingSenderId: "210792533008",
    appId: "1:210792533008:web:ec570e3035236538494e95",
    measurementId: "G-D5EC93KF1Y"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Cấu hình để luôn hiện bảng chọn tài khoản
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export const signInWithGooglePopup = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user; // Trả về object chứa email, uid, photoURL...
    } catch (error) {
        console.error("Lỗi Firebase Popup:", error);
        throw error;
    }
};