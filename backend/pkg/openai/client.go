package openai

import (
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

var Client *openai.Client

// Init OpenAI 클라이언트 초기화
func Init() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		panic("OPENAI_API_KEY is not set")
	}

	Client = openai.NewClient(apiKey)
}

// ChatRequest 채팅 요청
type ChatRequest struct {
	UserMessage string
	Level       int
	History     []openai.ChatCompletionMessage
}

// ChatResponse 채팅 응답
type ChatResponse struct {
	Message            string
	IsDeep             bool
	EmotionalIntensity int
	AffectionGained    int
}

// GetFairyResponse 요정 응답 생성
func GetFairyResponse(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-4"
	}

	systemPrompt := buildSystemPrompt(req.Level)

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: systemPrompt,
		},
	}

	// 이전 대화 추가 (최근 10개만)
	historyLimit := 10
	if len(req.History) > historyLimit {
		messages = append(messages, req.History[len(req.History)-historyLimit:]...)
	} else {
		messages = append(messages, req.History...)
	}

	// 현재 사용자 메시지
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.UserMessage,
	})

	resp, err := Client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model:    model,
			Messages: messages,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("ChatCompletion error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	fairyMessage := resp.Choices[0].Message.Content

	// TODO: 대화 깊이 분석 (간단한 휴리스틱으로 시작)
	isDeep := analyzeDepth(req.UserMessage, fairyMessage)
	emotionalIntensity := analyzeEmotionalIntensity(req.UserMessage)
	affectionGained := calculateAffection(isDeep, emotionalIntensity)

	return &ChatResponse{
		Message:            fairyMessage,
		IsDeep:             isDeep,
		EmotionalIntensity: emotionalIntensity,
		AffectionGained:    affectionGained,
	}, nil
}

// buildSystemPrompt 레벨에 따른 시스템 프롬프트
func buildSystemPrompt(level int) string {
	basePrompt := `당신은 히키코모리(은둔형 외톨이) 자녀를 둔 부모님들을 돕는 따뜻한 요정입니다.

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
`

	// 교감도에 따른 추가 프롬프트
	if level >= 7 {
		basePrompt += "\n현재 관계: 서로 친구가 되어 편하게 대화할 수 있습니다. 좀 더 깊이 있는 질문과 조언을 해주세요."
	} else if level >= 4 {
		basePrompt += "\n현재 관계: 서로 알아가는 중입니다. 점진적으로 신뢰를 쌓아가세요."
	} else {
		basePrompt += "\n현재 관계: 처음 만났습니다. 부드럽게 다가가며 신뢰를 쌓으세요."
	}

	return basePrompt
}

// analyzeDepth 대화 깊이 분석 (간단한 휴리스틱)
func analyzeDepth(userMessage, fairyMessage string) bool {
	// TODO: 더 정교한 분석 필요
	// 일단 메시지 길이로 판단
	return len(userMessage) > 50
}

// analyzeEmotionalIntensity 감정 강도 분석
func analyzeEmotionalIntensity(message string) int {
	// TODO: 실제 감정 분석 API 또는 모델 사용
	// 일단 기본값
	return 50
}

// calculateAffection 호감도 계산
func calculateAffection(isDeep bool, emotionalIntensity int) int {
	if isDeep {
		return 15 // DEEP_CONVERSATION
	}
	return 5 // DAILY_CONVERSATION
}
