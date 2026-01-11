declare namespace google {
    namespace accounts {
        namespace id {
            function initialize(config: IdConfiguration): void;
            function prompt(callback?: (notification: PromptMomentNotification) => void): void;
            function requestCode(config: CodeClientConfig): void;
            function renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
            function disableAutoSelect(): void;
            function storeCredential(credential: any, callback?: () => void): void;
            function cancel(): void;
            function revoke(hint: string, callback: (response: any) => void): void;
        }
    }
}

interface IdConfiguration {
    client_id: string;
    callback?: (response: CredentialResponse) => void;
    native_callback?: (response: CredentialResponse) => void;
    log_level?: 'debug' | 'info' | 'warn' | 'error';
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
    cancel_on_tap_outside?: boolean;
    prompt_parent_id?: string;
    nonce?: string;
    context?: 'signin' | 'signup' | 'use';
    itp_support?: boolean;
    login_uri?: string;
}

interface CredentialResponse {
    credential: string;
    select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session';
}

interface PromptMomentNotification {
    isDisplayMoment(): boolean;
    isDisplayed(): boolean;
    isNotDisplayed(): boolean;
    getNotDisplayedReason(): 'browser_not_supported' | 'not_authorized' | 'unregistered_origin' | 'unknown_reason';
    isSkippedMoment(): boolean;
    getSkippedReason(): 'auto_selection' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
    isDismissedMoment(): boolean;
    getDismissedReason(): 'credential_returned' | 'cancel_on_tap_outside' | 'tap_outside';
    getMomentType(): 'display' | 'skipped' | 'dismissed';
}

interface CodeClientConfig {
    client_id: string;
    scope: string;
    callback: (response: CodeResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    redirect_uri?: string;
    state?: string;
    error_callback?: (error: any) => void;
    hint?: string;
    hosted_domain?: string;
    select_account?: boolean;
}

interface CodeResponse {
    code: string;
    scope: string;
    state?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
}

interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string;
    locale?: string;
}
