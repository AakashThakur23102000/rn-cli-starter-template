const FONT_FAMILIES = {
    WixMadeforText: 'WixMadeforText',
};
const FONT_WEIGHT_SUFFIX = {
    '100': 'Thin',
    '200': 'ExtraLight',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black',
    "normal": 'Regular',
    "bold": 'Bold',
};

type FontFamily = keyof typeof FONT_FAMILIES;
type FontWeight = keyof typeof FONT_WEIGHT_SUFFIX;

type FontFamilyMap = {
    [K in FontFamily]: {
        [W in FontWeight]: string;
    };
};

const buildFontFamilyMap = <T extends Record<string, string>>(families: T): FontFamilyMap => {
    return Object.fromEntries(
        Object.entries(families).map(([familyName, familyValue]) => [
            familyName,
            Object.fromEntries(
                Object.entries(FONT_WEIGHT_SUFFIX).map(([weight, suffix]) => [
                    weight,
                    `${familyValue}-${suffix}`,
                ]),
            ),
        ]),
    ) as FontFamilyMap;
};

export const fontFamily = buildFontFamilyMap(FONT_FAMILIES);
