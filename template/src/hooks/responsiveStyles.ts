import { StyleSheet, useWindowDimensions } from "react-native";
import type { ViewStyle, TextStyle, ImageStyle } from "react-native";


const RANGES = [
    { name: "tinyPhone", min: 0, max: 320 }, // small phone (Android example)
    { name: "smallPhone", min: 320, max: 360 }, // common compact widths
    { name: "phone", min: 360, max: 600 }, // phones up to tablet threshold
    { name: "tablet", min: 600, max: 840 }, // Material medium
    { name: "bigScreen", min: 840, max: 99999 }, // Material expanded+
] as const;

type BucketName = (typeof RANGES)[number]["name"];
type Orientation = "portrait" | "landscape";

type RNStyle = ViewStyle & TextStyle & ImageStyle;
type RNLooseStyle = { [K in keyof RNStyle]?: RNStyle[K] | string };

type StyleMap = Record<string, RNLooseStyle>;

type PartialBase<Base> = { [K in keyof Base]?: Partial<Base[K]> };

type DeviceOverrides<Base extends StyleMap> = Partial<Record<BucketName, PartialBase<Base>>>;

type LandscapeFixes<Base extends StyleMap> =
    { all?: PartialBase<Base> } & Partial<Record<BucketName, PartialBase<Base>>>;

export type ResponsiveConfig<Base extends StyleMap> = {
    baseStyles: Base;
    deviceOverrides?: DeviceOverrides<Base>;
    landscapeFixes?: LandscapeFixes<Base>;
    createSheet?: (styles: Base) => any;
};

function pickBucket(shortest: number): BucketName {
    for (const r of RANGES) {
        if (shortest >= r.min && shortest < r.max) return r.name;
    }

    return RANGES.at(-1)!.name;
}

function pickOrientation(width: number, height: number): Orientation {
    return height >= width ? "portrait" : "landscape";
}

function mergeBaseWithOverride(base: any, override?: any) {
    if (!override) return base;

    const out: any = { ...base };
    for (const key of Object.keys(override)) {
        out[key] = { ...(base[key] ?? undefined), ...(override[key] ?? undefined) };
    }
    return out;
}

/**
 * ✅ Main hook
 * You call it inside a component and directly use returned styles.
 */
export function useResponsiveStyles<Base extends StyleMap>(config: ResponsiveConfig<Base>): Base {
    const { width, height } = useWindowDimensions();
    const shortest = Math.min(width, height);

    const bucket = pickBucket(shortest);
    const orientation = pickOrientation(width, height);

    const deviceOverrides = config.deviceOverrides ?? {};
    const landscapeFixes = config.landscapeFixes;

    let merged = mergeBaseWithOverride(config.baseStyles, deviceOverrides[bucket]);

    if (orientation === "landscape" && landscapeFixes) {
        merged = mergeBaseWithOverride(merged, landscapeFixes.all);
        merged = mergeBaseWithOverride(merged, landscapeFixes[bucket]);
    }

    const createSheet = config.createSheet ?? StyleSheet.create;
    return createSheet(merged) as Base;
}

/** optional helpers */
export function useBucket(): BucketName {
    const { width, height } = useWindowDimensions();
    return pickBucket(Math.min(width, height));
}

export function useOrientation(): Orientation {
    const { width, height } = useWindowDimensions();
    return pickOrientation(width, height);
}
