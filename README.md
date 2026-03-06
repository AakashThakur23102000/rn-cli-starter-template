# rn-cli-starter-template

Copy the Redux + Persist + Theme + Reusable Components setup into any new RN project:

```
npx degit AakashThakur23102000/rn-cli-starter-template/template . --force && npm i @reduxjs/toolkit react-redux redux-persist @react-native-async-storage/async-storage react-native-safe-area-context react-native-size-matters @tanstack/react-query && npm i -D @types/react-redux reactotron-react-native && adb reverse tcp:9090 tcp:9090
```

**For react-native-async-storage to work add in android/build.gradle**
```
allprojects {
    repositories {
        maven {
            url = uri(project(":react-native-async-storage_async-storage").file("local_repo"))
        }
    }
}
```


**What this does**
- **Copies template files** into your current project using `degit` (no git history; `--force` overwrites existing files if needed).
- **Installs runtime packages** for Redux, persistence, UI, sizing, and SVGs.
- **Installs dev packages** for typings, SVG import transformer, and Reactotron.
- **Sets up Android port reverse** so Reactotron (port **9090**) can connect to your device/emulator.


# Packages overview
### Runtime
- **@reduxjs/toolkit** – Batteries-included Redux (`configureStore`, `createSlice`, `createAsyncThunk`).
- **react-redux** – React bindings for Redux (`Provider`, hooks).
- **redux-persist** – Persists the Redux store to storage (state survives restarts).
- **@react-native-async-storage/async-storage** – Storage engine used by `redux-persist` in RN.
- **react-native-safe-area-context** – Handles notches/status bars; provides insets & `SafeAreaView`.
- **react-native-size-matters** – Scaled sizes (`ScaledSheet`, `ms`, `vs`) for responsive layouts.
- **@tanstack/react-query** -  For Api handling.

### Dev
- **@types/react-redux** – TypeScript types for `react-redux`.
- **reactotron-react-native** – Desktop debugger for RN (logs, network, performance, state via plugins). Uses port **9090**; `adb reverse` enables Android devices to reach your host during dev.


# For Api handling Tanstack Query is also added but we need to add provider 
- Provide the client to your App
```
  import { QueryClientProvider } from '@tanstack/react-query';
  import GlobalQueryClient from '../utils/globalQueryClient';
  const queryClient = GlobalQueryClient(navigation);
  return(
          <QueryClientProvider client={queryClient}>
            <App/>
          </QueryClientProvider>
  )
```
#### 🧠 Notes
- `useNavigation()` only works **after** the `NavigationContainer` is mounted.  
  Hence, the `QueryClientProvider` is wrapped **inside** a child component.

Refer - https://tanstack.com/query/latest/docs/framework/react/quick-start

