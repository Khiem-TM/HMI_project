#!/usr/bin/env python3
"""
Translation Service for Sign Language Translator
This script wraps the sign-language-translator library to provide
text-to-sign translation functionality for the Node.js backend.
"""

import sys
import json
import os
import tempfile
from pathlib import Path

try:
    import sign_language_translator as slt
except ImportError:
    print(json.dumps({
        "error": "sign_language_translator library not installed",
        "message": "Please install: pip install sign-language-translator"
    }), file=sys.stderr)
    sys.exit(1)


def translate_text_to_sign(text: str, text_language: str = "english", sign_language: str = "pk-sl", output_format: str = "video"):
    """
    Translate text to sign language
    
    Args:
        text: Input text to translate
        text_language: Source language (english, urdu, hindi)
        sign_language: Target sign language (pk-sl for Pakistan Sign Language)
        output_format: Output format (video or landmarks)
    
    Returns:
        Dictionary with translation result
    """
    try:
        # Initialize the translation model
        model = slt.models.ConcatenativeSynthesis(
            text_language=text_language,
            sign_language=sign_language,
            sign_format=output_format
        )
        
        # Translate text to sign
        sign = model.translate(text)
        
        # Create temporary directory for output files
        temp_dir = Path(tempfile.gettempdir()) / "signlearn_translations"
        temp_dir.mkdir(exist_ok=True)
        
        result = {
            "success": True,
            "input_text": text,
            "text_language": text_language,
            "sign_language": sign_language,
            "output_format": output_format
        }
        
        if output_format == "video":
            # Save video to temp file
            import hashlib
            text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            video_filename = f"translation_{text_hash}.mp4"
            video_path = temp_dir / video_filename
            
            # Save video - sign object from ConcatenativeSynthesis should be a Video or Sign wrapper
            try:
                # Try to save using the save method
                if hasattr(sign, 'save'):
                    sign.save(str(video_path), overwrite=True)
                    result["video_path"] = str(video_path)
                    result["video_url"] = f"/api/translations/video/{video_filename}"
                elif hasattr(sign, 'frames') or hasattr(sign, 'iter_frames'):
                    # If it's a Video object, try to write frames
                    import cv2
                    frames = list(sign.iter_frames()) if hasattr(sign, 'iter_frames') else sign.frames
                    if frames and len(frames) > 0:
                        # Get frame dimensions
                        height, width = frames[0].shape[:2]
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                        out = cv2.VideoWriter(str(video_path), fourcc, 30.0, (width, height))
                        for frame in frames:
                            # Convert RGB to BGR for OpenCV
                            if len(frame.shape) == 3 and frame.shape[2] == 3:
                                frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                                out.write(frame_bgr)
                            else:
                                out.write(frame)
                        out.release()
                        result["video_path"] = str(video_path)
                        result["video_url"] = f"/api/translations/video/{video_filename}"
                    else:
                        result["video_path"] = None
                        result["message"] = "Video translation successful but no frames available"
                else:
                    # Just indicate success even if we can't save
                    result["video_path"] = None
                    result["message"] = "Video translation successful. Check sign object type."
            except Exception as save_error:
                result["video_path"] = None
                result["save_error"] = str(save_error)
                result["message"] = "Translation completed but video save failed"
        else:
            # For landmarks format, save as JSON
            landmarks_filename = f"translation_{hash(text) % 1000000}.json"
            landmarks_path = temp_dir / landmarks_filename
            
            if hasattr(sign, 'save'):
                sign.save(str(landmarks_path))
                result["landmarks_path"] = str(landmarks_path)
            else:
                result["landmarks_path"] = None
                result["message"] = "Landmarks translation successful"
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


def main():
    """Main entry point for the script"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Missing arguments",
            "usage": "python translationService.py <json_input>"
        }), file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        text = input_data.get("text", "")
        text_language = input_data.get("text_language", "english")
        sign_language = input_data.get("sign_language", "pk-sl")
        output_format = input_data.get("output_format", "video")
        
        if not text:
            print(json.dumps({
                "success": False,
                "error": "Text is required"
            }))
            sys.exit(1)
        
        # Perform translation
        result = translate_text_to_sign(text, text_language, sign_language, output_format)
        
        # Output result as JSON
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

