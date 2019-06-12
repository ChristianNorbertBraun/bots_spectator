export interface PickerResult {
    spriteIndex: number;
    tint?: Float32Array;
}

export type SpritePicker = (c: string, x: number, y: number) => PickerResult[];

const monsterTint = new Float32Array([0, 2.0, 0, 1]);

const bombChars = "987654321";
const playerChars = "ABCDEFGHIJKLMNOP";
const letterChars = "abcdefghijklmnopqrstuuwxyz";
const monsterChars = "e";
const obsticleChars = "#X~";
const boomObsticleChars = "Y";
const portalChars = "o&";

const chain = (pickers: SpritePicker[]): SpritePicker => {
    return (c: string, x: number, y: number): PickerResult[] => {
        for (const picker of pickers) {
            const result = picker(c, x, y);
            if (result.length !== 0) {
                return result;
            }
        }
        return [];
    }
};

const pickBombSprite: SpritePicker = (c, x, y) => {
    const index = bombChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [{spriteIndex: 8 + index}];
};

const pickFlatlandSprite: SpritePicker = (c, x, y) => {
    const monsterOrPlayerIndex = (playerChars + monsterChars).indexOf(c)
    if (c === '.' || monsterOrPlayerIndex !== -1) {
        return [{spriteIndex: (x + y) % 2}];
    }
    return [];
};

const pickObsticleSprite: SpritePicker = (c, x, y) => {
    const index = obsticleChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [{spriteIndex: 2 + index}];
};

const pickBoomObsticleSprite: SpritePicker = (c, x, y) => {
    const index = boomObsticleChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [{spriteIndex: 2 + index}];
};

const pickPowerUpSprite: SpritePicker = (c, x, y) => {
    if (c === '+') {
        return [{spriteIndex: 113}];
    }
    return [];
};

export const pickMonsterSprite: SpritePicker = (c, x, y) => {
    if (c === 'e') {
        return pickFlatlandSprite(c, x, y).concat({
            spriteIndex: 112,
            tint: monsterTint,
        });
    }
    return [];
}

const pickLetterSprite: SpritePicker = (c, x, y) => {
    const index = letterChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [{spriteIndex: 17 + index}];
}

const pickPortalSprite: SpritePicker = (c, x, y) => {
    if (portalChars.indexOf(c) === -1) {
        return [];
    }
    return [{spriteIndex: 6}];
}

const pickGemSprite: SpritePicker = (c, x, y) => {
    if (c === '@') {
        return [{spriteIndex: 5}];
    }
    return [];
};

const pickSnakeTailSprite: SpritePicker = (c, x, y) => {
    if (c === '*') {
        return [{spriteIndex: 7}];
    }
    return [];
};

export const defaultSpritePicker: SpritePicker = chain([pickFlatlandSprite, pickObsticleSprite, pickPortalSprite, pickGemSprite, pickSnakeTailSprite]);
export const wordSpritePicker: SpritePicker = chain([pickLetterSprite, defaultSpritePicker]);
export const hordeSpritePicker: SpritePicker = chain([pickPowerUpSprite, pickMonsterSprite, defaultSpritePicker]);
export const bombSpritePicker: SpritePicker = chain([pickBombSprite, pickBoomObsticleSprite, pickPowerUpSprite, defaultSpritePicker]);

export const pickPlayerSpriteStart: SpritePicker = (c, x, y) => {
    const index = playerChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [{spriteIndex: 48 + index * 4}];
};
