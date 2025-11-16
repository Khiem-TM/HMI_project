#!/usr/bin/env python3
"""
Sign Recognition Service
Recognizes sign language gestures from MediaPipe hand landmarks by comparing
with known signs in the database (dictionary).
"""

import sys
import json
import math
import numpy as np

try:
    import sign_language_translator as slt
    from sign_language_translator.models.video_embedding.mediapipe_landmarks_model import MediaPipeLandmarksModel
except ImportError:
    # Fallback if library not available
    pass


def normalize_landmarks(landmarks):
    """
    Normalize landmarks to make them scale-invariant and position-invariant.
    
    Args:
        landmarks: Array of landmarks [[x, y, z], ...] for one hand
        
    Returns:
        Normalized landmarks array
    """
    if not landmarks or len(landmarks) == 0:
        return []
    
    # Convert to numpy array
    lm_array = np.array(landmarks)
    
    # Center around wrist (first landmark)
    if len(lm_array) > 0:
        wrist = lm_array[0]
        centered = lm_array - wrist
        
        # Normalize by scale (distance from wrist to middle finger tip)
        if len(lm_array) > 12:  # Has middle finger tip (landmark 12)
            scale = np.linalg.norm(centered[12])
            if scale > 0:
                normalized = centered / scale
            else:
                normalized = centered
        else:
            # Fallback: normalize by max distance
            max_dist = np.max(np.linalg.norm(centered, axis=1))
            if max_dist > 0:
                normalized = centered / max_dist
            else:
                normalized = centered
        
        return normalized.tolist()
    
    return landmarks


def calculate_landmark_distance(lm1, lm2):
    """
    Calculate Euclidean distance between two landmark arrays.
    
    Args:
        lm1, lm2: Arrays of landmarks
        
    Returns:
        Average distance
    """
    if not lm1 or not lm2 or len(lm1) != len(lm2):
        return float('inf')
    
    distances = []
    for i in range(min(len(lm1), len(lm2))):
        if len(lm1[i]) >= 3 and len(lm2[i]) >= 3:
            dist = math.sqrt(
                (lm1[i][0] - lm2[i][0])**2 +
                (lm1[i][1] - lm2[i][1])**2 +
                (lm1[i][2] - lm2[i][2])**2
            )
            distances.append(dist)
    
    return np.mean(distances) if distances else float('inf')


def recognize_sign_from_landmarks(landmarks, known_signs):
    """
    Recognize sign from landmarks by comparing with known signs.
    
    Args:
        landmarks: Array of hand landmarks [[x, y, z], ...]
        known_signs: Dictionary mapping words to their landmark patterns
        
    Returns:
        Tuple of (recognized_word, confidence)
    """
    if not landmarks or len(landmarks) == 0:
        return None, 0.0
    
    # Normalize input landmarks
    normalized_input = normalize_landmarks(landmarks)
    
    best_match = None
    best_distance = float('inf')
    best_confidence = 0.0
    
    # Compare with each known sign
    for word, sign_pattern in known_signs.items():
        if not sign_pattern or not isinstance(sign_pattern, (list, dict)):
            continue
        
        # Handle different pattern formats
        if isinstance(sign_pattern, dict):
            # Assume pattern has 'landmarks' key or is the landmarks itself
            pattern_landmarks = sign_pattern.get('landmarks', sign_pattern)
        else:
            pattern_landmarks = sign_pattern
        
        if not pattern_landmarks or not isinstance(pattern_landmarks, list):
            continue
        
        # Normalize pattern landmarks
        normalized_pattern = normalize_landmarks(pattern_landmarks)
        
        # Calculate distance
        distance = calculate_landmark_distance(normalized_input, normalized_pattern)
        
        # Convert distance to confidence (inverse relationship)
        confidence = 1.0 / (1.0 + distance * 10)
        
        if distance < best_distance:
            best_distance = distance
            best_match = word
            best_confidence = confidence
    
    return best_match, best_confidence


def recognize_sign_sequence(landmark_sequence, known_signs, threshold=0.3):
    """
    Recognize a sequence of signs from landmark frames.
    
    Args:
        landmark_sequence: Array of landmark arrays (frames)
        known_signs: Dictionary of known signs
        threshold: Confidence threshold for recognition
        
    Returns:
        Array of recognized words with confidences
    """
    if not landmark_sequence or len(landmark_sequence) == 0:
        return []
    
    recognized_sequence = []
    seen_words = set()
    
    # Process each frame
    for frame_landmarks in landmark_sequence:
        if not frame_landmarks:
            continue
        
        # For each hand in frame
        for hand_landmarks in frame_landmarks:
            word, confidence = recognize_sign_from_landmarks(hand_landmarks, known_signs)
            
            if word and confidence >= threshold:
                # Avoid duplicates in sequence (simple deduplication)
                if word not in seen_words or len(recognized_sequence) == 0:
                    recognized_sequence.append({
                        "word": word,
                        "confidence": confidence
                    })
                    seen_words.add(word)
    
    return recognized_sequence


def match_with_dictionary_words(landmarks, dictionary_words):
    """
    Match landmarks with words from dictionary database.
    Uses feature-based matching and word hints.
    
    Args:
        landmarks: Hand landmarks array
        dictionary_words: List of words from database
        
    Returns:
        Best matching word with confidence
    """
    if not landmarks or len(landmarks) == 0:
        return None, 0.0
    
    # Extract features from input landmarks
    input_features = extract_gesture_features(landmarks)
    normalized_input = normalize_landmarks(landmarks)
    
    # If no dictionary words, use basic detection
    if not dictionary_words or len(dictionary_words) == 0:
        word = detect_basic_gesture(landmarks)
        return word, 0.5
    
    # Match with dictionary words using feature similarity
    best_match = None
    best_score = 0.0
    best_confidence = 0.0
    
    for dict_word in dictionary_words:
        word_name = dict_word.get("word", "").lower()
        category = dict_word.get("category", "").lower()
        
        # Calculate similarity score based on features
        score = calculate_word_similarity(
            input_features, normalized_input, word_name, category
        )
        
        if score > best_score:
            best_score = score
            best_match = dict_word.get("word", word_name)
            best_confidence = min(0.95, score)
    
    # If no good match found, use basic detection
    if best_score < 0.3:
        word = detect_basic_gesture(landmarks)
        return word, 0.5
    
    return best_match, best_confidence


def calculate_word_similarity(input_features, normalized_landmarks, word_name, category):
    """
    Calculate similarity score between input and dictionary word.
    Uses multiple heuristics:
    1. Feature matching
    2. Word name hints
    3. Category hints
    4. Gesture patterns
    
    Returns:
        Similarity score (0.0 - 1.0)
    """
    score = 0.0
    
    # Feature-based matching (40% weight)
    feature_score = match_features_by_word(input_features, word_name)
    score += feature_score * 0.4
    
    # Category-based matching (20% weight)
    category_score = match_by_category(input_features, category)
    score += category_score * 0.2
    
    # Gesture pattern matching (30% weight)
    pattern_score = match_gesture_pattern(normalized_landmarks, word_name)
    score += pattern_score * 0.3
    
    # Word name hints (10% weight)
    name_score = match_by_word_name(word_name)
    score += name_score * 0.1
    
    return min(1.0, score)


def match_features_by_word(features, word_name):
    """Match features based on word name hints"""
    word_lower = word_name.lower()
    
    # Common patterns for specific words
    if "hello" in word_lower or "hi" in word_lower:
        if features.get("thumb_up") and not features.get("fingers_open", 0) > 2:
            return 0.8
        return 0.3
    
    if "open" in word_lower or "yes" in word_lower:
        if features.get("fingers_open", 0) >= 4:
            return 0.8
        return 0.3
    
    if "good" in word_lower or "ok" in word_lower:
        if features.get("thumb_up"):
            return 0.7
        return 0.2
    
    if "no" in word_lower or "stop" in word_lower:
        if features.get("fingers_open", 0) == 0:
            return 0.6
        return 0.2
    
    # Default: moderate score if features are present
    if any(features.values()):
        return 0.4
    
    return 0.1


def match_by_category(features, category):
    """Match features based on category"""
    cat_lower = category.lower()
    
    if "greeting" in cat_lower:
        if features.get("thumb_up"):
            return 0.6
    elif "number" in cat_lower:
        fingers_count = features.get("fingers_open", 0)
        if 0 < fingers_count <= 5:
            return 0.5 + (fingers_count / 10)
    elif "object" in cat_lower:
        if features.get("fingers_open", 0) >= 3:
            return 0.5
    
    return 0.2


def match_gesture_pattern(normalized_landmarks, word_name):
    """Match based on gesture patterns in landmarks"""
    if not normalized_landmarks or len(normalized_landmarks) < 21:
        return 0.2
    
    word_lower = word_name.lower()
    lm = np.array(normalized_landmarks)
    
    # Pattern for "hello" - hand raised, thumb up
    if "hello" in word_lower or "hi" in word_lower:
        # Check if hand is raised (wrist higher than fingers)
        if len(lm) > 0:
            wrist_y = lm[0][1]
            avg_finger_y = np.mean([lm[i][1] for i in [4, 8, 12, 16, 20] if i < len(lm)])
            if wrist_y < avg_finger_y:  # Wrist above fingers
                return 0.7
        return 0.3
    
    # Pattern for numbers - specific finger positions
    if any(num in word_lower for num in ["one", "two", "three", "four", "five"]):
        fingers_up = sum([
            1 for i in [4, 8, 12, 16, 20]
            if i < len(lm) and lm[i][1] < lm[max(0, i-2)][1]
        ])
        
        number_map = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5
        }
        
        for num_word, num_val in number_map.items():
            if num_word in word_lower and fingers_up == num_val:
                return 0.8
        
        return 0.3
    
    # Default pattern matching
    return 0.3


def match_by_word_name(word_name):
    """Simple word name matching hints"""
    word_lower = word_name.lower()
    
    # Common sign language words that match basic gestures
    basic_signs = ["hello", "hi", "good", "ok", "yes", "no", "open", "close"]
    
    if any(sign in word_lower for sign in basic_signs):
        return 0.5
    
    return 0.2


def extract_gesture_features(landmarks):
    """
    Extract key features from landmarks for gesture recognition.
    
    Args:
        landmarks: Hand landmarks array
        
    Returns:
        Dictionary of extracted features
    """
    if not landmarks or len(landmarks) < 21:
        return {}
    
    lm = np.array(landmarks)
    
    features = {
        "thumb_up": lm[4][1] < lm[3][1] if len(lm) > 4 else False,
        "index_up": lm[8][1] < lm[6][1] if len(lm) > 8 else False,
        "fingers_open": sum([
            lm[i][1] < lm[i-2][1] if len(lm) > i else False
            for i in [4, 8, 12, 16, 20]
        ]),
        "palm_open": lm[9][2] > lm[0][2] if len(lm) > 9 else False,
    }
    
    return features


def detect_basic_gesture(landmarks):
    """
    Detect basic gestures using simple heuristics.
    Fallback when ML model is not available.
    
    Args:
        landmarks: Hand landmarks array
        
    Returns:
        Detected word (or None)
    """
    if not landmarks or len(landmarks) < 21:
        return None
    
    features = extract_gesture_features(landmarks)
    
    # Basic gesture detection
    if features.get("thumb_up") and not features.get("fingers_open", 0) > 2:
        return "hello"
    elif features.get("fingers_open", 0) >= 4:
        return "open"
    elif features.get("thumb_up"):
        return "good"
    else:
        return "hello"  # Default fallback


def main():
    """Main entry point for sign recognition"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments",
            "usage": "python signRecognitionService.py <json_input>"
        }), file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        landmarks = input_data.get("landmarks", [])
        sign_language = input_data.get("sign_language", "pk-sl")
        recognition_mode = input_data.get("mode", "single")  # "single" or "sequence"
        dictionary_words = input_data.get("dictionary_words", [])
        
        if not landmarks:
            print(json.dumps({
                "success": False,
                "error": "Landmarks are required"
            }))
            sys.exit(1)
        
        result = {
            "success": True,
            "sign_language": sign_language,
            "mode": recognition_mode,
            "dictionary_count": len(dictionary_words)
        }
        
        if recognition_mode == "sequence":
            # Recognize sequence of signs
            # Convert dictionary to known_signs format
            known_signs = {
                word.get("word", ""): word for word in dictionary_words
            }
            recognized_sequence = recognize_sign_sequence(landmarks, known_signs)
            
            if recognized_sequence:
                words = [item["word"] for item in recognized_sequence]
                avg_confidence = np.mean([item["confidence"] for item in recognized_sequence])
                
                result["recognized_text"] = " ".join(words)
                result["recognized_sequence"] = recognized_sequence
                result["confidence"] = float(avg_confidence)
            else:
                result["recognized_text"] = "unknown"
                result["confidence"] = 0.0
        else:
            # Single sign recognition
            # Use dictionary matching
            if isinstance(landmarks[0], list) and isinstance(landmarks[0][0], (list, np.ndarray)):
                # Multiple hands
                all_words = []
                all_confidences = []
                
                for hand_landmarks in landmarks:
                    word, confidence = match_with_dictionary_words(hand_landmarks, dictionary_words)
                    if word and confidence > 0.3:  # Threshold for valid recognition
                        all_words.append(word)
                        all_confidences.append(confidence)
                
                if all_words:
                    result["recognized_text"] = " ".join(all_words)
                    result["confidence"] = float(np.mean(all_confidences))
                else:
                    # Fallback to basic detection
                    word = detect_basic_gesture(landmarks[0] if landmarks else [])
                    result["recognized_text"] = word if word else "unknown"
                    result["confidence"] = 0.5
            else:
                # Single hand - use dictionary matching
                word, confidence = match_with_dictionary_words(landmarks, dictionary_words)
                if word and confidence > 0.3:
                    result["recognized_text"] = word
                    result["confidence"] = float(confidence)
                else:
                    # Fallback to basic detection
                    word = detect_basic_gesture(landmarks)
                    result["recognized_text"] = word if word else "unknown"
                    result["confidence"] = 0.5
        
        # Output result
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

