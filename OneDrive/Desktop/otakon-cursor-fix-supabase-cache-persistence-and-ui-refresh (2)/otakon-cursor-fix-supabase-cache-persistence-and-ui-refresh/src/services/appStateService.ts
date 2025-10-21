import { StorageService } from './storageService';
import { AppState } from '../types';
import { STORAGE_KEYS } from '../constants';

export class AppStateService {
  static getAppState(): AppState {
    const defaultState: AppState = {
      view: 'landing',
      onboardingStatus: 'login',
      activeSubView: 'chat',
      isConnectionModalOpen: false,
      isHandsFreeModalOpen: false,
      isSettingsModalOpen: false,
      isCreditModalOpen: false,
      isOtakuDiaryModalOpen: false,
      isWishlistModalOpen: false,
      activeModal: null,
      isHandsFreeMode: false,
      showUpgradeScreen: false,
      showDailyCheckin: false,
      currentAchievement: null,
      loadingMessages: [],
      isCooldownActive: false,
      isFirstTime: true,
      contextMenu: null,
      feedbackModalState: null,
      confirmationModal: null,
      trialEligibility: null,
    };

    return StorageService.get(STORAGE_KEYS.APP_STATE, defaultState);
  }

  static setAppState(state: AppState): void {
    StorageService.set(STORAGE_KEYS.APP_STATE, state);
  }

  static updateAppState(updates: Partial<AppState>): void {
    const currentState = this.getAppState();
    const newState = { ...currentState, ...updates };
    this.setAppState(newState);
  }

  static resetAppState(): void {
    const defaultState = this.getAppState();
    this.setAppState(defaultState);
  }
}
