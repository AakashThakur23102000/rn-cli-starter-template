import { scale } from "react-native-size-matters";

export const fontSize = {
    extra_extra_large: scale(35),
    extra_large: scale(25),
    large: scale(18),
    regular: scale(14),
    small: scale(12),
    extra_small: scale(9.5),
    extra_extra_small: scale(8)
} as const;
