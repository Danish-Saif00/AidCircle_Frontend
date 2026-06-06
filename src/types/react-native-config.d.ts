declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    API_VERSION_PATH?: string;
    REQUEST_TIMEOUT_MS?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}