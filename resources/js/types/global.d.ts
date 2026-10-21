/// <reference types="google.maps" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    google?: typeof google;
    __gmapCb?: () => void;
}
