"""
Local LLM Server using llama-cpp-python
Serves Gemma-3-12b model via OpenAI-compatible API
"""
from llama_cpp import Llama
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import json
import time
from typing import Generator
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Model configuration
MODEL_PATH = r"C:\Users\Pro\.lmstudio\models\lmstudio-community\gemma-3-12b-it-GGUF"
MODEL_FILE = "gemma-3-12b-it-Q4_K_M.gguf"  # Adjust this filename if different

# Default System Prompt (히키코모리 상담 요정)
DEFAULT_SYSTEM_PROMPT = """
당신은 히키코모리(은둔형 외톨이) 자녀를 둔 부모님들을 돕는 따뜻한 요정입니다.

역할:
- 부모님의 이야기를 경청하고 공감합니다
- 판단하지 않고 중립적인 태도를 유지합니다
- 구체적인 조언은 **요청받았을 때만** 제공합니다
- 한국 문화와 가족 관계를 이해합니다

응답 스타일 (매우 중요!):
- 존댓말을 사용하되 친근하게
- 따뜻하고 희망적이지만 현실적으로
- **기본적으로 2-3문장 이내로 짧게 응답**
- 부모님의 감정을 먼저 인정하고 경청하는 태도
- 열린 질문으로 상황을 파악 (한 번에 질문 하나만!)

응답 길이 가이드:
- 부모님이 상황을 이야기할 때: 짧게 공감하고 경청 (1-2문장)
  예: "많이 힘드셨겠어요. 5년이라는 시간 동안 정말 지치셨을 것 같아요."
- 부모님이 질문하거나 조언을 요청할 때만: 구체적으로 답변 (3-5문장)
- 절대로 긴 조언을 나열하지 마세요

주의사항:
- 의료적 진단이나 치료는 전문가에게 권유
- 위기 상황(자해/자살)은 즉시 전문 기관 연결 안내
한국어로 답하세요.
"""

# Initialize model
print(f"Loading model from {MODEL_PATH}/{MODEL_FILE}...")
llm = None

def load_model():
    global llm
    model_full_path = os.path.join(MODEL_PATH, MODEL_FILE)

    if not os.path.exists(model_full_path):
        # Try to find any .gguf file in the directory
        gguf_files = [f for f in os.listdir(MODEL_PATH) if f.endswith('.gguf')]
        if gguf_files:
            model_full_path = os.path.join(MODEL_PATH, gguf_files[0])
            print(f"Using model: {gguf_files[0]}")
        else:
            raise FileNotFoundError(f"No GGUF model found in {MODEL_PATH}")

    llm = Llama(
        model_path=model_full_path,
        n_ctx=4096,  # Context window
        n_threads=8,  # Number of CPU threads
        n_gpu_layers=35,  # Adjust based on your GPU (0 for CPU only)
        verbose=False
    )
    print("Model loaded successfully!")

@app.route('/')
def index():
    return jsonify({
        "status": "running",
        "model": "gemma-3-12b-it",
        "endpoints": {
            "health": "/health",
            "chat": "/v1/chat/completions",
            "completions": "/v1/completions",
            "models": "/v1/models"
        }
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "model_loaded": llm is not None})

@app.route('/v1/models')
def models():
    return jsonify({
        "object": "list",
        "data": [{
            "id": "gemma-3-12b-it",
            "object": "model",
            "created": int(time.time()),
            "owned_by": "local"
        }]
    })

def get_level_prompt(level: int) -> str:
    """레벨에 따른 추가 프롬프트 생성"""
    if level >= 7:
        return "\n현재 관계: 서로 친구가 되어 편하게 대화할 수 있습니다. 좀 더 깊이 있는 질문과 조언을 해주세요."
    elif level >= 4:
        return "\n현재 관계: 서로 알아가는 중입니다. 점진적으로 신뢰를 쌓아가세요."
    else:
        return "\n현재 관계: 처음 만났습니다. 부드럽게 다가가며 신뢰를 쌓으세요."

def build_system_prompt(custom_prompt: str = None, level: int = 0, use_default: bool = True) -> str:
    """시스템 프롬프트 빌드

    Args:
        custom_prompt: 클라이언트에서 전달한 커스텀 시스템 프롬프트
        level: 관계 레벨 (0-10)
        use_default: 기본 프롬프트 사용 여부

    Returns:
        최종 시스템 프롬프트
    """
    if custom_prompt:
        # 커스텀 프롬프트가 제공된 경우 우선 사용
        base_prompt = custom_prompt
    elif use_default:
        # 기본 프롬프트 사용
        base_prompt = DEFAULT_SYSTEM_PROMPT
    else:
        # 프롬프트 없음
        base_prompt = ""

    # 레벨이 제공된 경우 레벨별 프롬프트 추가
    if level > 0:
        base_prompt += get_level_prompt(level)

    return base_prompt

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    try:
        data = request.json
        messages = data.get('messages', [])
        stream = data.get('stream', False)
        max_tokens = data.get('max_tokens', 512)
        temperature = data.get('temperature', 0.7)

        # 시스템 프롬프트 관련 파라미터
        level = data.get('level', 0)  # 관계 레벨 (0-10)
        custom_system_prompt = data.get('system_prompt', None)  # 커스텀 시스템 프롬프트
        use_default_prompt = data.get('use_default_prompt', True)  # 기본 프롬프트 사용 여부

        # 시스템 프롬프트 빌드
        system_prompt = build_system_prompt(custom_system_prompt, level, use_default_prompt)

        # Convert messages to prompt
        prompt = ""

        # 시스템 프롬프트가 있으면 가장 먼저 추가
        if system_prompt:
            prompt += f"System: {system_prompt}\n\n"

        # 메시지 처리 (messages에 system role이 있어도 무시하고 위에서 빌드한 것 사용)
        has_system_in_messages = False
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                has_system_in_messages = True
                # messages에 system이 있으면 custom_prompt가 없을 때만 사용
                if not custom_system_prompt and not use_default_prompt:
                    prompt = f"System: {content}\n\n"
            elif role == 'user':
                prompt += f"User: {content}\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n"

        prompt += "Assistant: "

        if stream:
            return Response(
                stream_with_context(generate_stream(prompt, max_tokens, temperature)),
                mimetype='text/event-stream'
            )
        else:
            output = llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=["User:", "\n\n"]
            )

            response = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "gemma-3-12b-it",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": output['choices'][0]['text'].strip()
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": len(output['choices'][0]['text'].split()),
                    "total_tokens": len(prompt.split()) + len(output['choices'][0]['text'].split())
                }
            }

            return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/v1/completions', methods=['POST'])
def completions():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 512)
        temperature = data.get('temperature', 0.7)
        stream = data.get('stream', False)

        if stream:
            return Response(
                stream_with_context(generate_stream(prompt, max_tokens, temperature)),
                mimetype='text/event-stream'
            )
        else:
            output = llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature
            )

            response = {
                "id": f"cmpl-{int(time.time())}",
                "object": "text_completion",
                "created": int(time.time()),
                "model": "gemma-3-12b-it",
                "choices": [{
                    "text": output['choices'][0]['text'],
                    "index": 0,
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": len(output['choices'][0]['text'].split()),
                    "total_tokens": len(prompt.split()) + len(output['choices'][0]['text'].split())
                }
            }

            return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_stream(prompt: str, max_tokens: int, temperature: float) -> Generator:
    """Generate streaming responses"""
    for token in llm(
        prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True
    ):
        chunk = {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "gemma-3-12b-it",
            "choices": [{
                "delta": {"content": token['choices'][0]['text']},
                "index": 0,
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(chunk)}\n\n"

    yield "data: [DONE]\n\n"

if __name__ == '__main__':
    try:
        load_model()
        print(f"\n{'='*60}")
        print(f"🚀 Local LLM Server starting on http://mintai.gonetis.com:8888")
        print(f"{'='*60}\n")
        print("Available endpoints:")
        print("  - http://mintai.gonetis.com:8888/health")
        print("  - http://mintai.gonetis.com:8888/v1/chat/completions")
        print("  - http://mintai.gonetis.com:8888/v1/completions")
        print("  - http://mintai.gonetis.com:8888/v1/models")
        print(f"\n{'='*60}\n")

        app.run(host='0.0.0.0', port=8888, debug=False, threaded=True)
    except Exception as e:
        print(f"Error starting server: {e}")
