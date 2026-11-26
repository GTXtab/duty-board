/** The subset of Google Identity Services this app calls. */
interface GoogleTokenResponse {
  readonly access_token?: string;
  readonly scope?: string;
  readonly expires_in?: number | string;
  readonly error?: string;
}

interface GoogleTokenClient {
  requestAccessToken(): void;
}

interface Window {
  google?: {
    readonly accounts: {
      readonly oauth2: {
        initTokenClient(config: {
          readonly client_id: string;
          readonly scope: string;
          readonly callback: (response: GoogleTokenResponse) => void;
          readonly error_callback: () => void;
        }): GoogleTokenClient;
        revoke(token: string): void;
      };
    };
  };
}
