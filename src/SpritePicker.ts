export type SpritePicker = (c: string, x: number, y: number) => number | undefined;

const bombChars = "987654321";
const playerChars = "ABCDEFGHIJKLMNOP";
const orientationChars = "^><v";
const letterChars = "abcdefghijklmnopqrstuuwxyz";
const monsterChars = "e";
const obsticleChars = "#X~";
const portalChars = "o&";

const chain = (ps: SpritePicker[]): SpritePicker => (c, x, y) =>
    ps.reduce<number | undefined>((prev, current) => prev || current(c, x, y), undefined);

const pickBombSprite: SpritePicker = (c, x, y) => {
    const index = bombChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 8 + index;
};

const pickFlatlandSprite: SpritePicker = (c, x, y) => {
    const monsterOrPlayerIndex = (orientationChars + monsterChars).indexOf(c)
    if (c === '.' || monsterOrPlayerIndex !== -1) {
        return (x + y) % 2;
    }
    return undefined;
};

const pickObsticleSprite: SpritePicker = (c, x, y) => {
    const index = obsticleChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 2 + index; 
};

export const pickPlayerSpriteStart: SpritePicker = (c, x, y) => {
    const index = playerChars.indexOf(c);
    if (index === -1) {
        return undefined;
    }
    return 48 + index * 4;
};

const pickPowerUpSprite: SpritePicker = (c, x, y) => {
    if (c === '+') {
        return 113;
    }
    return undefined;
};

export const pickMonsterSprite: SpritePicker = (c, x, y) => {
    if (c === 'e') {
        return 112;
    }
    return undefined;
}

const pickLetterSprite: SpritePicker = (c, x, y) => {
    const index = letterChars.indexOf(c);
    if(index === -1) {
        return undefined;
    }
    return 17 + index;
}

const pickPortalSprite: SpritePicker = (c, x, y) => {
    if (portalChars.indexOf(c) === -1) {
        return undefined;
    }
    return 6;
}

const pickGemSprite: SpritePicker = c => c === '@' ? 5 : undefined;

const pickSnakeTailSprite: SpritePicker = (c, x, y) => {
    if (c === '*') {
        return 7;
    }
    return undefined;
};

export const defaultWorldSpritePicker: SpritePicker = chain([
    pickFlatlandSprite,
    pickObsticleSprite,
    pickPortalSprite,
    pickGemSprite,
    pickSnakeTailSprite]);

export const hordeWorldSpritePicker: SpritePicker = (c, x, y) => {
    return pickPowerUpSprite(c, x, y) || defaultWorldSpritePicker(c, x, y);
}

export const bombWorldSpritePicker: SpritePicker = (c, x, y) => {
    return pickBombSprite(c, x, y) || pickPowerUpSprite(c, x, y) || defaultWorldSpritePicker(c, x, y);
}
