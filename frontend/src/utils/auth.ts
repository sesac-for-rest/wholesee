// AnonymousID 관리
const ANONYMOUS_ID_KEY = 'saedam_anonymous_id';

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);

  if (!id) {
    // UUID v4 생성 (간단한 버전)
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }

  return id;
}

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem('saedam_onboarding_done') === 'true';
}

export function setOnboardingDone(): void {
  localStorage.setItem('saedam_onboarding_done', 'true');
}

export function clearAuth(): void {
  localStorage.removeItem(ANONYMOUS_ID_KEY);
  localStorage.removeItem('saedam_onboarding_done');
}
