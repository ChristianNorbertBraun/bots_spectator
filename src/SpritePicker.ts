export type SpritePicker = (c: string, x: number, y: number) => number[];

const bombChars = "987654321";
const playerChars = "ABCDEFGHIJKLMNOP";
const orientationChars = "^><v";
const letterChars = "abcdefghijklmnopqrstuuwxyz";
const monsterChars = "e";
const obsticleChars = "#X~";
const portalChars = "o&";

const chain = (pickers: SpritePicker[]): SpritePicker => {
    return (c:string, x: number, y: number): number[] => {
        for (const picker of pickers) {
            const result = picker(c, x, y);
            if (result.length != 0) {
                return result;
            }
        }

        return [];
    }
}

const pickBombSprite: SpritePicker = (c, x, y) => {
    const index = bombChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [8 + index];
};

const pickFlatlandSprite: SpritePicker = (c, x, y) => {
    const monsterOrPlayerIndex = (orientationChars + monsterChars).indexOf(c)
    if (c === '.' || monsterOrPlayerIndex !== -1) {
        return [(x + y) % 2];
    }
    return [];
};

const pickObsticleSprite: SpritePicker = (c, x, y) => {
    const index = obsticleChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [2 + index];
};

const pickPowerUpSprite: SpritePicker = (c, x, y) => {
    if (c === '+') {
        return [113];
    }
    return [];
};

export const pickMonsterSprite: SpritePicker = (c, x, y) => {
    const flatlandSprite = pickFlatlandSprite(c, x, y)
    if (c === 'e' && flatlandSprite !== undefined) {
        return flatlandSprite.concat(112);
    }
    return [];
}

const pickLetterSprite: SpritePicker = (c, x, y) => {
    const index = letterChars.indexOf(c);
    if(index === -1) {
        return [];
    }
    return [17 + index];
}

const pickPortalSprite: SpritePicker = (c, x, y) => {
    if (portalChars.indexOf(c) === -1) {
        return [];
    }
    return [6];
}

const pickGemSprite: SpritePicker = (c, x, y) => {
    if (c === '@') {
        return [5];
    }
    return [];
};

const pickSnakeTailSprite: SpritePicker = (c, x, y) => {
    if (c === '*') {
        return [7];
    }
    return [];
};

export const defaultSpritePicker: SpritePicker = chain([pickFlatlandSprite, pickObsticleSprite, pickPortalSprite, pickGemSprite, pickSnakeTailSprite]);
export const wordSpritePicker: SpritePicker = chain([pickLetterSprite, defaultSpritePicker]);
export const hordeSpritePicker: SpritePicker = chain([pickPowerUpSprite, pickMonsterSprite, defaultSpritePicker]);
export const bombSpritePicker: SpritePicker = chain([pickBombSprite, pickPowerUpSprite, defaultSpritePicker]);

export const pickPlayerSpriteStart: SpritePicker = (c, x, y) => {
    const index = playerChars.indexOf(c);
    if (index === -1) {
        return [];
    }
    return [48 + index * 4];
};
